import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendEmail, passwordResetEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "이메일을 입력해주세요." },
        { status: 400 }
      );
    }

    // 업소회원 또는 광고업체에서 이메일 검색
    const bizUser = await prisma.bizUser.findUnique({ where: { email } });
    const adUser = !bizUser
      ? await prisma.adUser.findUnique({ where: { email } })
      : null;

    // 보안: 가입 여부와 무관하게 동일한 응답
    if (!bizUser && !adUser) {
      return NextResponse.json({
        message: "해당 이메일로 비밀번호 재설정 링크를 발송했습니다.",
      });
    }

    const userType = bizUser ? "BIZ" : "AD";

    // 기존 토큰 삭제
    await prisma.passwordResetToken.deleteMany({ where: { email } });

    // 새 토큰 생성 (1시간 유효)
    const token = crypto.randomBytes(32).toString("hex");
    await prisma.passwordResetToken.create({
      data: {
        email,
        token,
        userType,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`;
    const emailContent = passwordResetEmail(resetUrl);

    await sendEmail({
      to: email,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    return NextResponse.json({
      message: "해당 이메일로 비밀번호 재설정 링크를 발송했습니다.",
    });
  } catch (error) {
    console.error("비밀번호 찾기 오류:", error);
    return NextResponse.json(
      { error: "처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
