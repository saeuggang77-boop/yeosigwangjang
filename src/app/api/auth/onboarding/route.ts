import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.userType !== "USER") {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { nickname } = await req.json();

    if (!nickname || nickname.trim().length < 2 || nickname.trim().length > 12) {
      return NextResponse.json(
        { error: "닉네임은 2~12자여야 합니다." },
        { status: 400 }
      );
    }

    const trimmed = nickname.trim();

    // 금지 닉네임 패턴
    if (/^여시_/.test(trimmed)) {
      return NextResponse.json(
        { error: "'여시_'로 시작하는 닉네임은 사용할 수 없습니다." },
        { status: 400 }
      );
    }

    // 중복 체크
    const existing = await prisma.user.findUnique({
      where: { nickname: trimmed },
    });
    if (existing && existing.id !== session.user.id) {
      return NextResponse.json(
        { error: "이미 사용 중인 닉네임입니다." },
        { status: 409 }
      );
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { nickname: trimmed },
    });

    return NextResponse.json({ nickname: trimmed });
  } catch (error) {
    console.error("닉네임 설정 오류:", error);
    return NextResponse.json(
      { error: "처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
