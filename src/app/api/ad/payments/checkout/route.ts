import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getAdPriceTier,
  calcPrepayPrice,
  AD_EXTRA_PRICES,
  type PrepayMonths,
} from "@/lib/pricing";

const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY || "";

// POST /api/ad/payments/checkout — 결제 주문 생성 (토스 빌링)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.userType !== "AD") {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { businessId, adType, months } = body;
    // adType: "BASIC" | "PREMIUM" | "MAIN_BANNER" | "JOB_PAGE_BANNER" | "POPUP"
    // months: 1 | 2 | 3

    if (!businessId || !adType || !months) {
      return NextResponse.json({ error: "필수 항목이 누락되었습니다." }, { status: 400 });
    }

    if (![1, 2, 3].includes(months)) {
      return NextResponse.json({ error: "결제 기간은 1~3개월만 가능합니다." }, { status: 400 });
    }

    // 업체 확인 (본인 소유 + 승인됨)
    const business = await prisma.business.findFirst({
      where: {
        id: businessId,
        ownerId: session.user.id,
      },
      include: {
        owner: { select: { bizCategory: true, isApproved: true } },
      },
    });

    if (!business) {
      return NextResponse.json({ error: "업체를 찾을 수 없습니다." }, { status: 404 });
    }

    if (!business.owner.isApproved) {
      return NextResponse.json(
        { error: "관리자 승인 후 결제가 가능합니다." },
        { status: 403 }
      );
    }

    // 가격 계산
    let monthlyPrice: number;
    let paymentType: string;
    let description: string;

    if (adType === "BASIC" || adType === "PREMIUM") {
      const priceTier = getAdPriceTier(business.owner.bizCategory);
      monthlyPrice = adType === "BASIC" ? priceTier.basic : priceTier.premium;
      paymentType = adType === "BASIC" ? "AD_BASIC" : "AD_PREMIUM";
      description = `${business.name} ${adType === "BASIC" ? "기본" : "프리미엄"} 광고 ${months}개월`;
    } else if (adType === "MAIN_BANNER") {
      monthlyPrice = AD_EXTRA_PRICES.MAIN_BANNER;
      paymentType = "AD_MAIN_BANNER";
      description = `${business.name} 메인 배너 ${months}개월`;
    } else if (adType === "JOB_PAGE_BANNER") {
      monthlyPrice = AD_EXTRA_PRICES.JOB_PAGE_BANNER;
      paymentType = "AD_JOB_PAGE_BANNER";
      description = `${business.name} 구인 페이지 배너 ${months}개월`;
    } else if (adType === "POPUP") {
      monthlyPrice = AD_EXTRA_PRICES.POPUP;
      paymentType = "AD_POPUP";
      description = `${business.name} 팝업 광고 ${months}개월`;
    } else {
      return NextResponse.json({ error: "잘못된 광고 유형입니다." }, { status: 400 });
    }

    const totalAmount = calcPrepayPrice(monthlyPrice, months as PrepayMonths);
    const orderId = `AD_${session.user.id.slice(-8)}_${Date.now()}`;

    // Payment 레코드 생성 (PENDING)
    const payment = await prisma.payment.create({
      data: {
        type: paymentType as never,
        amount: totalAmount,
        months,
        status: "PENDING",
        tossOrderId: orderId,
        description,
        adUserId: session.user.id,
      },
    });

    // 토스 결제 요청 준비
    const tossPayload = {
      amount: totalAmount,
      orderId,
      orderName: description,
      successUrl: `${process.env.NEXTAUTH_URL}/ad/payments/success`,
      failUrl: `${process.env.NEXTAUTH_URL}/ad/payments/fail`,
    };

    // 토스 API로 결제 준비 요청 (서버 사이드)
    if (TOSS_SECRET_KEY) {
      const tossRes = await fetch(
        "https://api.tosspayments.com/v1/payments",
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${Buffer.from(TOSS_SECRET_KEY + ":").toString("base64")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(tossPayload),
        }
      );

      if (!tossRes.ok) {
        const errData = await tossRes.json();
        console.error("토스 결제 준비 오류:", errData);
        // 토스 연동 실패해도 클라이언트 SDK로 직접 결제 가능하도록 계속 진행
      }
    }

    return NextResponse.json({
      paymentId: payment.id,
      orderId,
      amount: totalAmount,
      monthlyPrice,
      months,
      discount: months > 1 ? (months === 2 ? "10%" : "20%") : null,
      orderName: description,
      // 클라이언트에서 토스 SDK로 결제 진행
      customerKey: session.user.id,
    });
  } catch (error) {
    console.error("결제 주문 생성 오류:", error);
    return NextResponse.json({ error: "결제 준비 중 오류가 발생했습니다." }, { status: 500 });
  }
}
