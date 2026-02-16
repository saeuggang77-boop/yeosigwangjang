import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY || "";

// POST /api/ad/payments/confirm — 토스 결제 승인
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.userType !== "AD") {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  try {
    const { paymentKey, orderId, amount, businessId } = await req.json();

    if (!paymentKey || !orderId || !amount) {
      return NextResponse.json({ error: "결제 정보가 누락되었습니다." }, { status: 400 });
    }

    // 주문 확인
    const payment = await prisma.payment.findUnique({
      where: { tossOrderId: orderId },
    });

    if (!payment) {
      return NextResponse.json({ error: "주문을 찾을 수 없습니다." }, { status: 404 });
    }

    if (payment.adUserId !== session.user.id) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    if (payment.status !== "PENDING") {
      return NextResponse.json({ error: "이미 처리된 결제입니다." }, { status: 400 });
    }

    if (payment.amount !== amount) {
      return NextResponse.json({ error: "결제 금액이 일치하지 않습니다." }, { status: 400 });
    }

    // 토스 결제 승인 요청
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

    // 결제 완료 처리
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "COMPLETED",
        tossPaymentKey: paymentKey,
      },
    });

    // 광고 활성화: Ad 레코드 생성
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + payment.months);

    // payment.type에서 adType 추출
    const adTypeMap: Record<string, string> = {
      AD_BASIC: "BASIC",
      AD_PREMIUM: "PREMIUM",
      AD_MAIN_BANNER: "MAIN_BANNER",
      AD_JOB_PAGE_BANNER: "JOB_PAGE_BANNER",
      AD_POPUP: "POPUP",
    };
    const adType = adTypeMap[payment.type] || "BASIC";

    // 업체 확인
    const business = await prisma.business.findFirst({
      where: { id: businessId, ownerId: session.user.id },
    });

    if (business) {
      await prisma.ad.create({
        data: {
          type: adType as never,
          startDate,
          endDate,
          isActive: true,
          businessId: business.id,
          paymentId: updatedPayment.id,
        },
      });

      // 프리미엄 광고면 업체 isPremium 활성화
      if (adType === "PREMIUM") {
        await prisma.business.update({
          where: { id: business.id },
          data: { isPremium: true },
        });
      }
    }

    return NextResponse.json({
      message: "결제가 완료되었습니다.",
      paymentId: updatedPayment.id,
      adType,
      months: payment.months,
      endDate,
    });
  } catch (error) {
    console.error("결제 승인 오류:", error);
    return NextResponse.json({ error: "결제 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}
