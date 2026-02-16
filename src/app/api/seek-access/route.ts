import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SEEK_ACCESS_PRICE } from "@/lib/pricing";

// ==========================================
// GET /api/seek-access — 열람권 상태 확인
// ==========================================
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ hasAccess: false });
    }

    // 업소회원: hasSeekAccess + seekAccessUntil
    if (session.user.userType === "BIZ") {
      const bizUser = await prisma.bizUser.findUnique({
        where: { id: session.user.id },
        select: { hasSeekAccess: true, seekAccessUntil: true },
      });

      if (!bizUser) return NextResponse.json({ hasAccess: false });

      const isExpired =
        bizUser.seekAccessUntil && bizUser.seekAccessUntil < new Date();

      // 만료 시 자동 비활성화
      if (bizUser.hasSeekAccess && isExpired) {
        await prisma.bizUser.update({
          where: { id: session.user.id },
          data: { hasSeekAccess: false },
        });
        return NextResponse.json({ hasAccess: false, expired: true });
      }

      return NextResponse.json({
        hasAccess: bizUser.hasSeekAccess,
        expiresAt: bizUser.seekAccessUntil,
      });
    }

    // 광고업체: 자동 포함
    if (session.user.userType === "AD") {
      return NextResponse.json({ hasAccess: true, reason: "ad_user" });
    }

    // 관리자
    if (session.user.userType === "ADMIN") {
      return NextResponse.json({ hasAccess: true, reason: "admin" });
    }

    return NextResponse.json({ hasAccess: false });
  } catch (error) {
    console.error("열람권 상태 확인 오류:", error);
    return NextResponse.json(
      { error: "확인 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// ==========================================
// POST /api/seek-access — 열람권 구매 (결제 연동 전 임시)
// ==========================================
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.userType !== "BIZ") {
      return NextResponse.json(
        { error: "업소 회원만 열람권을 구매할 수 있습니다." },
        { status: 403 }
      );
    }

    const { months = 1, paymentMethod, depositorName } = await req.json();

    if (![1, 2, 3].includes(months)) {
      return NextResponse.json(
        { error: "1~3개월만 선택 가능합니다." },
        { status: 400 }
      );
    }

    const isBankTransfer = paymentMethod === "BANK_TRANSFER";

    if (isBankTransfer && !depositorName?.trim()) {
      return NextResponse.json(
        { error: "입금자명을 입력해주세요." },
        { status: 400 }
      );
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + months * 30 * 24 * 60 * 60 * 1000);

    // 기존 열람권이 남아있으면 그 위에 추가
    const bizUser = await prisma.bizUser.findUnique({
      where: { id: session.user.id },
      select: { seekAccessUntil: true, hasSeekAccess: true },
    });

    let finalExpiresAt = expiresAt;
    if (bizUser?.hasSeekAccess && bizUser.seekAccessUntil && bizUser.seekAccessUntil > now) {
      finalExpiresAt = new Date(
        bizUser.seekAccessUntil.getTime() + months * 30 * 24 * 60 * 60 * 1000
      );
    }

    // 결제 레코드 생성
    const payment = await prisma.payment.create({
      data: {
        type: "SEEK_ACCESS",
        amount: SEEK_ACCESS_PRICE * months,
        months,
        status: isBankTransfer ? "PENDING" : "COMPLETED",
        description: `구직글 열람권 ${months}개월`,
        bizUserId: session.user.id,
        paymentMethod: isBankTransfer ? "BANK_TRANSFER" : "TOSS",
        depositorName: isBankTransfer ? depositorName.trim() : null,
      },
    });

    // 무통장 입금: 열람권 미부여 (관리자 확인 후 부여)
    if (isBankTransfer) {
      return NextResponse.json({
        paymentId: payment.id,
        amount: payment.amount,
        paymentMethod: "BANK_TRANSFER",
        message: "무통장 입금 신청이 완료되었습니다. 입금 확인 후 열람권이 활성화됩니다.",
      });
    }

    // 토스 결제: 열람권 즉시 활성화
    await prisma.bizUser.update({
      where: { id: session.user.id },
      data: {
        hasSeekAccess: true,
        seekAccessUntil: finalExpiresAt,
      },
    });

    return NextResponse.json({
      paymentId: payment.id,
      expiresAt: finalExpiresAt,
      amount: payment.amount,
    });
  } catch (error) {
    console.error("열람권 구매 오류:", error);
    return NextResponse.json(
      { error: "구매 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
