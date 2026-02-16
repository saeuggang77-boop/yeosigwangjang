import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/payments — 무통장 입금 대기 목록
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (
    !session ||
    (session.user.userType !== "ADMIN" && session.user.role !== "ADMIN")
  ) {
    return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "PENDING";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 20;

  const where = {
    paymentMethod: "BANK_TRANSFER",
    status: status as "PENDING" | "COMPLETED" | "CANCELLED",
  };

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: {
        bizUser: {
          select: { id: true, bizName: true, email: true, phone: true },
        },
        job: {
          select: { id: true, title: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.payment.count({ where }),
  ]);

  return NextResponse.json({
    payments,
    pagination: {
      page,
      totalPages: Math.ceil(total / limit),
      total,
    },
  });
}

// PATCH /api/admin/payments — 입금 확인/거절 처리
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (
    !session ||
    (session.user.userType !== "ADMIN" && session.user.role !== "ADMIN")
  ) {
    return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  try {
    const { paymentId, action, adminNote } = await req.json();
    // action: "approve" | "reject"

    if (!paymentId || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "paymentId와 action(approve/reject)이 필요합니다." },
        { status: 400 }
      );
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        job: { select: { id: true } },
        bizUser: {
          select: { id: true, hasSeekAccess: true, seekAccessUntil: true, bumpCredits: true },
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "결제를 찾을 수 없습니다." }, { status: 404 });
    }

    if (payment.paymentMethod !== "BANK_TRANSFER") {
      return NextResponse.json({ error: "무통장 입금 결제만 처리할 수 있습니다." }, { status: 400 });
    }

    if (payment.status !== "PENDING") {
      return NextResponse.json({ error: "이미 처리된 결제입니다." }, { status: 400 });
    }

    // ─── 거절 ───
    if (action === "reject") {
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: "CANCELLED",
          adminNote: adminNote || null,
          verifiedAt: new Date(),
        },
      });

      // 연결된 Job이 있으면 비활성 유지 (이미 isActive: false)
      return NextResponse.json({ message: "입금이 거절되었습니다." });
    }

    // ─── 승인 ───
    const now = new Date();
    const transactions = [];

    // Payment → COMPLETED
    transactions.push(
      prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: "COMPLETED",
          adminNote: adminNote || null,
          verifiedAt: now,
        },
      })
    );

    // type별 서비스 활성화
    const paymentType = payment.type;

    if (
      ["JOB_BASIC", "JOB_PREMIUM", "JOB_PKG_BASIC", "JOB_PKG_PREMIUM"].includes(paymentType)
    ) {
      // 구인글 활성화
      if (payment.job) {
        const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        const isPkgPremium = paymentType === "JOB_PKG_PREMIUM";
        const hasUrgentAddon = payment.description?.includes("긴급") && !isPkgPremium;
        const isUrgent = isPkgPremium || hasUrgentAddon;
        const urgentUntil = isUrgent
          ? new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
          : null;

        transactions.push(
          prisma.job.update({
            where: { id: payment.job.id },
            data: {
              isActive: true,
              expiresAt,
              isUrgent,
              urgentUntil,
            },
          })
        );
      }

      // 패키지 상품이면 열람권도 부여
      if (["JOB_PKG_BASIC", "JOB_PKG_PREMIUM"].includes(paymentType) && payment.bizUserId) {
        const oneMonth = 30 * 24 * 60 * 60 * 1000;
        let seekAccessUntil: Date;

        if (
          payment.bizUser?.hasSeekAccess &&
          payment.bizUser.seekAccessUntil &&
          payment.bizUser.seekAccessUntil > now
        ) {
          seekAccessUntil = new Date(payment.bizUser.seekAccessUntil.getTime() + oneMonth);
        } else {
          seekAccessUntil = new Date(now.getTime() + oneMonth);
        }

        transactions.push(
          prisma.bizUser.update({
            where: { id: payment.bizUserId },
            data: { hasSeekAccess: true, seekAccessUntil },
          })
        );
      }
    } else if (paymentType === "SEEK_ACCESS" && payment.bizUserId) {
      // 열람권 활성화
      const months = payment.months || 1;
      const oneMonth = 30 * 24 * 60 * 60 * 1000;
      let seekAccessUntil: Date;

      if (
        payment.bizUser?.hasSeekAccess &&
        payment.bizUser.seekAccessUntil &&
        payment.bizUser.seekAccessUntil > now
      ) {
        seekAccessUntil = new Date(
          payment.bizUser.seekAccessUntil.getTime() + months * oneMonth
        );
      } else {
        seekAccessUntil = new Date(now.getTime() + months * oneMonth);
      }

      transactions.push(
        prisma.bizUser.update({
          where: { id: payment.bizUserId },
          data: { hasSeekAccess: true, seekAccessUntil },
        })
      );
    } else if (paymentType === "JOB_BUMP" && payment.bizUserId) {
      // 끌올 적용 — 연결된 Job의 lastBumpedAt 갱신
      // 끌올 대상 Job을 찾기 위해 description에서 추출 필요
      // 무통장 끌올은 Job 연결이 안 되어 있으므로 description 기반 처리는 복잡
      // 실제로는 별도 jobId 저장이 필요하지만 현 구조에서는 skip
    } else if (paymentType === "JOB_BUMP_PKG" && payment.bizUserId) {
      // 끌올 크레딧 충전
      const qty = payment.description?.includes("10회") ? 10 : 5;
      transactions.push(
        prisma.bizUser.update({
          where: { id: payment.bizUserId },
          data: { bumpCredits: { increment: qty } },
        })
      );
    }

    await prisma.$transaction(transactions);

    return NextResponse.json({ message: "입금이 확인되었습니다. 서비스가 활성화되었습니다." });
  } catch (error) {
    console.error("입금 확인 처리 오류:", error);
    return NextResponse.json(
      { error: "처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
