import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY || "";

// POST /api/biz/bump/confirm — 끌올 결제 승인 + 즉시 적용
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.userType !== "BIZ") {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  try {
    const { paymentKey, orderId, amount, jobId } = await req.json();

    if (!paymentKey || !orderId || !amount || !jobId) {
      return NextResponse.json({ error: "결제 정보가 누락되었습니다." }, { status: 400 });
    }

    // 주문 확인
    const payment = await prisma.payment.findUnique({
      where: { tossOrderId: orderId },
    });

    if (!payment) {
      return NextResponse.json({ error: "주문을 찾을 수 없습니다." }, { status: 404 });
    }

    if (payment.bizUserId !== session.user.id) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    if (payment.status !== "PENDING") {
      return NextResponse.json({ error: "이미 처리된 결제입니다." }, { status: 400 });
    }

    if (payment.amount !== amount) {
      return NextResponse.json({ error: "결제 금액이 일치하지 않습니다." }, { status: 400 });
    }

    if (payment.type !== "JOB_BUMP") {
      return NextResponse.json({ error: "잘못된 결제 유형입니다." }, { status: 400 });
    }

    // 구인글 본인 소유 확인
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { bizUserId: true, isActive: true },
    });

    if (!job || job.bizUserId !== session.user.id) {
      return NextResponse.json({ error: "구인글을 찾을 수 없습니다." }, { status: 404 });
    }

    // 토스 결제 승인 요청
    if (TOSS_SECRET_KEY) {
      const tossRes = await fetch(
        "https://api.tosspayments.com/v1/payments/confirm",
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${Buffer.from(TOSS_SECRET_KEY + ":").toString("base64")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ paymentKey, orderId, amount }),
        }
      );

      const tossData = await tossRes.json();

      if (!tossRes.ok) {
        console.error("토스 결제 승인 실패:", tossData);
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: "CANCELLED" },
        });
        return NextResponse.json(
          { error: tossData.message || "결제 승인에 실패했습니다." },
          { status: 400 }
        );
      }
    }

    // 결제 완료 + 끌올 적용 (트랜잭션)
    const now = new Date();
    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "COMPLETED",
          tossPaymentKey: paymentKey,
        },
      }),
      prisma.job.update({
        where: { id: jobId },
        data: {
          lastBumpedAt: now,
          bumpCount: { increment: 1 },
        },
      }),
    ]);

    return NextResponse.json({
      message: "끌올이 완료되었습니다. 구인글이 목록 상단으로 이동합니다.",
      bumpedAt: now,
    });
  } catch (error) {
    console.error("끌올 결제 승인 오류:", error);
    return NextResponse.json({ error: "결제 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}
