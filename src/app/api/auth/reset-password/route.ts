import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: "토큰과 새 비밀번호를 입력해주세요." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "비밀번호는 8자 이상이어야 합니다." },
        { status: 400 }
      );
    }

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      return NextResponse.json(
        { error: "유효하지 않은 토큰입니다." },
        { status: 400 }
      );
    }

    if (resetToken.expiresAt < new Date()) {
      await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });
      return NextResponse.json(
        { error: "토큰이 만료되었습니다. 다시 요청해주세요." },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    if (resetToken.userType === "BIZ") {
      await prisma.bizUser.update({
        where: { email: resetToken.email },
        data: { password: hashedPassword },
      });
    } else {
      await prisma.adUser.update({
        where: { email: resetToken.email },
        data: { password: hashedPassword },
      });
    }

    // 사용된 토큰 삭제
    await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });

    return NextResponse.json({
      message: "비밀번호가 변경되었습니다. 로그인해주세요.",
    });
  } catch (error) {
    console.error("비밀번호 재설정 오류:", error);
    return NextResponse.json(
      { error: "처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
