import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY || "";

// 패키지 타입별 구인글 tier 매핑
const PACKAGE_TO_TIER: Record<string, string> = {
  JOB_BASIC: "BASIC",
  JOB_PREMIUM: "PREMIUM",
  JOB_PKG_BASIC: "BASIC",
  JOB_PKG_PREMIUM: "PREMIUM",
};

// NOTE: LIGHT tier는 JOB_BASIC PaymentType을 사용하지만,
// checkout에서 jobTier="LIGHT"로 설정하여 confirm에서 해당 tier를 직접 받음

// 패키지 상품인지 확인 (열람권 포함)
const IS_PACKAGE = new Set(["JOB_PKG_BASIC", "JOB_PKG_PREMIUM"]);

// POST /api/biz/package/confirm — 구인글 결제 승인 + Job 생성 + 부가 혜택 적용
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.userType !== "BIZ") {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  try {
    const { paymentKey, orderId, amount, jobData, paymentMethod } = await req.json();

    const isBankTransfer = paymentMethod === "BANK_TRANSFER";

    if ((!isBankTransfer && !paymentKey) || !orderId || !amount || !jobData) {
      return NextResponse.json(
        { error: "결제 정보가 누락되었습니다." },
        { status: 400 }
      );
    }

    // 주문 확인
    const payment = await prisma.payment.findUnique({
      where: { tossOrderId: orderId },
    });

    if (!payment) {
      return NextResponse.json(
        { error: "주문을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (payment.bizUserId !== session.user.id) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    if (payment.status !== "PENDING") {
      return NextResponse.json(
        { error: "이미 처리된 결제입니다." },
        { status: 400 }
      );
    }

    if (payment.amount !== amount) {
      return NextResponse.json(
        { error: "결제 금액이 일치하지 않습니다." },
        { status: 400 }
      );
    }

    // LIGHT tier는 JOB_BASIC PaymentType을 공유하므로 description으로 판별
    const isLightTier = payment.description?.includes("라이트");
    const tier = isLightTier ? "LIGHT" : PACKAGE_TO_TIER[payment.type];
    if (!tier) {
      return NextResponse.json(
        { error: "잘못된 결제 유형입니다." },
        { status: 400 }
      );
    }

    // 무통장 입금이 아닌 경우에만 토스 결제 승인
    if (!isBankTransfer) {
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
    }

    // ─── 결제 완료 + Job 생성 + 부가 혜택 (트랜잭션) ───
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30일

    // 긴급 설정: PKG_PREMIUM은 자동 포함, 단품은 긴급 추가 결제 시
    const isPkgPremium = payment.type === "JOB_PKG_PREMIUM";
    const hasUrgentAddon =
      payment.description?.includes("긴급") && !isPkgPremium;
    const isUrgent = isPkgPremium || hasUrgentAddon;
    const urgentUntil = isUrgent
      ? new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      : null;

    // 트랜잭션 배열 구성
    const transactions = [];

    // 1. Payment 상태 업데이트
    if (isBankTransfer) {
      // 무통장: PENDING 유지 (관리자 확인 후 COMPLETED)
      // tossPaymentKey 없음
    } else {
      // 토스: COMPLETED
      transactions.push(
        prisma.payment.update({
          where: { id: payment.id },
          data: { status: "COMPLETED", tossPaymentKey: paymentKey },
        })
      );
    }

    // 2. Job 생성
    const {
      title,
      bizName,
      region,
      subRegion,
      bizType,
      salary,
      workHours,
      requirements,
      benefits,
      description,
      contact,
      contactType,
      images,
    } = jobData;

    transactions.push(
      prisma.job.create({
        data: {
          type: "HIRE",
          tier: tier as "LIGHT" | "BASIC" | "PREMIUM",
          title: title.trim(),
          bizName: bizName?.trim() || null,
          region,
          subRegion: subRegion || null,
          bizType,
          salary: salary || null,
          workHours: workHours || null,
          requirements: requirements || null,
          benefits: benefits || [],
          description: description.trim(),
          contact,
          contactType: contactType || "KAKAO",
          images: images || [],
          isUrgent: isBankTransfer ? false : isUrgent, // 무통장: 입금 확인 후 적용
          urgentUntil: isBankTransfer ? null : urgentUntil,
          expiresAt: isBankTransfer ? null : expiresAt, // 무통장: 입금 확인 후 설정
          isActive: !isBankTransfer, // 무통장: 입금 확인 전까지 비활성
          bizUserId: session.user.id,
          paymentId: payment.id,
        },
      })
    );

    // 3. 패키지 상품이면 열람권 부여 (1개월) — 무통장은 관리자 확인 후
    if (IS_PACKAGE.has(payment.type) && !isBankTransfer) {
      const bizUser = await prisma.bizUser.findUnique({
        where: { id: session.user.id },
        select: { hasSeekAccess: true, seekAccessUntil: true },
      });

      const oneMonth = 30 * 24 * 60 * 60 * 1000;
      let seekAccessUntil: Date;

      if (
        bizUser?.hasSeekAccess &&
        bizUser.seekAccessUntil &&
        bizUser.seekAccessUntil > now
      ) {
        // 기존 열람권 위에 추가
        seekAccessUntil = new Date(
          bizUser.seekAccessUntil.getTime() + oneMonth
        );
      } else {
        seekAccessUntil = new Date(now.getTime() + oneMonth);
      }

      transactions.push(
        prisma.bizUser.update({
          where: { id: session.user.id },
          data: {
            hasSeekAccess: true,
            seekAccessUntil,
          },
        })
      );
    }

    // 트랜잭션 실행
    const results = await prisma.$transaction(transactions);
    // results[1]은 생성된 Job
    const createdJob = results[1] as { id: string };

    if (isBankTransfer) {
      return NextResponse.json({
        message: "무통장 입금 신청이 완료되었습니다. 입금 확인 후 구인글이 활성화됩니다.",
        jobId: createdJob.id,
        tier,
        isUrgent: false,
        seekAccessGranted: false,
        paymentMethod: "BANK_TRANSFER",
      });
    }

    return NextResponse.json({
      message: "결제가 완료되었습니다. 구인글이 등록되었습니다.",
      jobId: createdJob.id,
      tier,
      isUrgent,
      seekAccessGranted: IS_PACKAGE.has(payment.type),
    });
  } catch (error) {
    console.error("구인글 결제 승인 오류:", error);
    return NextResponse.json(
      { error: "결제 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
