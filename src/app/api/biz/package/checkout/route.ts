import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { JOB_PRICES } from "@/lib/pricing";
import { filterJobForm } from "@/lib/filter";
import type { PaymentType } from "@prisma/client";

// 패키지/단품 타입별 가격 & PaymentType 매핑
const TIER_CONFIG: Record<
  string,
  { price: number; paymentType: PaymentType; label: string; jobTier: string }
> = {
  BASIC: {
    price: JOB_PRICES.BASIC,
    paymentType: "JOB_BASIC",
    label: "기본 구인글",
    jobTier: "BASIC",
  },
  PREMIUM: {
    price: JOB_PRICES.PREMIUM,
    paymentType: "JOB_PREMIUM",
    label: "프리미엄 구인글",
    jobTier: "PREMIUM",
  },
  PKG_BASIC: {
    price: JOB_PRICES.PKG_BASIC,
    paymentType: "JOB_PKG_BASIC",
    label: "기본패키지 (구인글+열람권)",
    jobTier: "BASIC",
  },
  PKG_PREMIUM: {
    price: JOB_PRICES.PKG_PREMIUM,
    paymentType: "JOB_PKG_PREMIUM",
    label: "프리미엄패키지 (구인글+열람권+긴급)",
    jobTier: "PREMIUM",
  },
};

// POST /api/biz/package/checkout — 구인글 결제 주문 생성
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.userType !== "BIZ") {
    return NextResponse.json(
      { error: "업소 회원만 이용할 수 있습니다." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { packageType, jobData, isUrgent } = body;

    // 패키지 타입 확인
    const config = TIER_CONFIG[packageType];
    if (!config) {
      return NextResponse.json(
        { error: "잘못된 상품 유형입니다." },
        { status: 400 }
      );
    }

    // 구인글 필수 필드 검증
    const {
      title,
      bizName,
      region,
      bizType,
      salary,
      workHours,
      description,
      contact,
      agreeNoFraud,
      agreeNoDiscrimination,
    } = jobData || {};

    if (!title || !bizName || !region || !bizType || !description || !contact) {
      return NextResponse.json(
        { error: "구인글 필수 항목을 모두 입력해주세요." },
        { status: 400 }
      );
    }

    if (!agreeNoFraud || !agreeNoDiscrimination) {
      return NextResponse.json(
        { error: "필수 동의 항목을 체크해주세요." },
        { status: 400 }
      );
    }

    // 차별 필터링
    const filterResult = filterJobForm({
      title,
      description,
      requirements: jobData.requirements,
      salary,
    });
    if (!filterResult.isClean) {
      const categories = Array.from(
        new Set(filterResult.violations.map((v: { category: string }) => v.category))
      );
      return NextResponse.json(
        {
          error: `차별적·허위 표현이 포함되어 있습니다: ${categories.join(", ")}`,
          violations: filterResult.violations,
        },
        { status: 422 }
      );
    }

    // 가격 계산 (단품 + 긴급 추가 옵션)
    let amount = config.price;
    const addUrgent =
      isUrgent && !["PKG_PREMIUM"].includes(packageType) && packageType !== "FREE";
    if (addUrgent) {
      amount += JOB_PRICES.URGENT;
    }

    const orderId = `JOB_${session.user.id.slice(-8)}_${Date.now()}`;
    const description_text = addUrgent
      ? `${config.label} + 긴급`
      : config.label;

    // Payment 레코드 생성 (PENDING)
    const payment = await prisma.payment.create({
      data: {
        type: config.paymentType,
        amount,
        status: "PENDING",
        tossOrderId: orderId,
        description: description_text,
        bizUserId: session.user.id,
      },
    });

    return NextResponse.json({
      paymentId: payment.id,
      orderId,
      amount,
      orderName: description_text,
      customerKey: session.user.id,
      packageType,
      isUrgent: addUrgent || packageType === "PKG_PREMIUM",
    });
  } catch (error) {
    console.error("구인글 결제 준비 오류:", error);
    return NextResponse.json(
      { error: "결제 준비 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
