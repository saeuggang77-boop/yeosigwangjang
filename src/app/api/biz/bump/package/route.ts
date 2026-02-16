import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BUMP_PKG_PRICES, type BumpPkgQuantity } from "@/lib/pricing";

const VALID_QUANTITIES = new Set<number>([5, 10]);

// POST /api/biz/bump/package — 끌올 패키지 구매
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.userType !== "BIZ") {
    return NextResponse.json(
      { error: "업소 회원만 이용할 수 있습니다." },
      { status: 403 }
    );
  }

  try {
    const { quantity } = await req.json();

    if (!VALID_QUANTITIES.has(quantity)) {
      return NextResponse.json(
        { error: "5회 또는 10회 패키지만 선택할 수 있습니다." },
        { status: 400 }
      );
    }

    const amount = BUMP_PKG_PRICES[quantity as BumpPkgQuantity];
    const orderId = `BUMP_PKG_${session.user.id.slice(-8)}_${Date.now()}`;

    // 트랜잭션: Payment 생성 + 크레딧 충전
    const [payment, bizUser] = await prisma.$transaction([
      prisma.payment.create({
        data: {
          type: "JOB_BUMP_PKG",
          amount,
          status: "COMPLETED", // TODO: Toss 결제 연동 시 checkout/confirm 분리
          tossOrderId: orderId,
          description: `끌올 ${quantity}회 패키지`,
          bizUserId: session.user.id,
        },
      }),
      prisma.bizUser.update({
        where: { id: session.user.id },
        data: { bumpCredits: { increment: quantity } },
        select: { bumpCredits: true },
      }),
    ]);

    return NextResponse.json({
      message: `끌올 ${quantity}회 패키지가 충전되었습니다.`,
      credits: bizUser.bumpCredits,
      amount,
      paymentId: payment.id,
    });
  } catch (error) {
    console.error("끌올 패키지 구매 오류:", error);
    return NextResponse.json(
      { error: "구매 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
