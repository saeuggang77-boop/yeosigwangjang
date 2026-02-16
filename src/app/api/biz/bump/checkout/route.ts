import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { JOB_PRICES } from "@/lib/pricing";

// POST /api/biz/bump/checkout — 끌올 결제 주문 생성 (크레딧 우선)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.userType !== "BIZ") {
    return NextResponse.json({ error: "업소 회원만 이용할 수 있습니다." }, { status: 403 });
  }

  try {
    const { jobId, paymentMethod, depositorName } = await req.json();

    if (!jobId) {
      return NextResponse.json({ error: "구인글 ID가 필요합니다." }, { status: 400 });
    }

    // 구인글 확인 (본인 소유 + 활성 + BASIC/PREMIUM만)
    const [job, bizUser] = await Promise.all([
      prisma.job.findUnique({
        where: { id: jobId },
        select: {
          id: true,
          title: true,
          tier: true,
          isActive: true,
          bizUserId: true,
        },
      }),
      prisma.bizUser.findUnique({
        where: { id: session.user.id },
        select: { bumpCredits: true },
      }),
    ]);

    if (!job) {
      return NextResponse.json({ error: "구인글을 찾을 수 없습니다." }, { status: 404 });
    }

    if (job.bizUserId !== session.user.id) {
      return NextResponse.json({ error: "본인의 구인글만 끌올할 수 있습니다." }, { status: 403 });
    }

    if (!job.isActive) {
      return NextResponse.json({ error: "비활성 구인글은 끌올할 수 없습니다." }, { status: 400 });
    }

    if (job.tier === "LIGHT") {
      return NextResponse.json(
        { error: "라이트 구인글은 끌올 기능을 이용할 수 없습니다. 기본 또는 프리미엄 등급으로 업그레이드해주세요." },
        { status: 400 }
      );
    }

    const credits = bizUser?.bumpCredits ?? 0;

    // 크레딧이 있으면 크레딧 차감 모드
    if (credits > 0) {
      const orderId = `BUMP_CR_${session.user.id.slice(-8)}_${Date.now()}`;

      const payment = await prisma.payment.create({
        data: {
          type: "JOB_BUMP",
          amount: 0,
          status: "PENDING",
          tossOrderId: orderId,
          description: `구인글 끌올 (크레딧) - ${job.title}`,
          bizUserId: session.user.id,
        },
      });

      return NextResponse.json({
        paymentId: payment.id,
        orderId,
        amount: 0,
        orderName: `구인글 끌올 (크레딧) - ${job.title}`,
        customerKey: session.user.id,
        jobId: job.id,
        useCredit: true,
        remainingCredits: credits,
      });
    }

    // 크레딧 없으면 결제
    const isBankTransfer = paymentMethod === "BANK_TRANSFER";

    if (isBankTransfer && !depositorName?.trim()) {
      return NextResponse.json(
        { error: "입금자명을 입력해주세요." },
        { status: 400 }
      );
    }

    const amount = JOB_PRICES.BUMP;
    const orderId = `BUMP_${session.user.id.slice(-8)}_${Date.now()}`;
    const description = `구인글 끌올 - ${job.title}`;

    const payment = await prisma.payment.create({
      data: {
        type: "JOB_BUMP",
        amount,
        status: "PENDING",
        tossOrderId: orderId,
        description,
        bizUserId: session.user.id,
        paymentMethod: isBankTransfer ? "BANK_TRANSFER" : "TOSS",
        depositorName: isBankTransfer ? depositorName.trim() : null,
      },
    });

    if (isBankTransfer) {
      return NextResponse.json({
        paymentId: payment.id,
        orderId,
        amount,
        orderName: description,
        jobId: job.id,
        useCredit: false,
        remainingCredits: 0,
        paymentMethod: "BANK_TRANSFER",
      });
    }

    return NextResponse.json({
      paymentId: payment.id,
      orderId,
      amount,
      orderName: description,
      customerKey: session.user.id,
      jobId: job.id,
      useCredit: false,
      remainingCredits: 0,
      paymentMethod: "TOSS",
    });
  } catch (error) {
    console.error("끌올 결제 준비 오류:", error);
    return NextResponse.json({ error: "결제 준비 중 오류가 발생했습니다." }, { status: 500 });
  }
}
