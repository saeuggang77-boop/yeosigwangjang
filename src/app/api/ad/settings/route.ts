import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

async function requireAd() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.userType !== "AD") return null;
  return session;
}

// GET /api/ad/settings — 프로필 조회
export async function GET() {
  const session = await requireAd();
  if (!session) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  try {
    const adUser = await prisma.adUser.findUnique({
      where: { id: session.user.id },
      select: {
        email: true,
        representName: true,
        bizRegNumber: true,
        bizCategory: true,
        phone: true,
        isApproved: true,
        createdAt: true,
      },
    });

    if (!adUser) {
      return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 });
    }

    return NextResponse.json(adUser);
  } catch (error) {
    console.error("설정 조회 오류:", error);
    return NextResponse.json({ error: "조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}

// PATCH /api/ad/settings — 프로필 수정 / 비밀번호 변경
export async function PATCH(req: NextRequest) {
  const session = await requireAd();
  if (!session) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  try {
    const body = await req.json();

    // 비밀번호 변경
    if (body.currentPassword && body.newPassword) {
      if (body.newPassword.length < 8) {
        return NextResponse.json(
          { error: "새 비밀번호는 8자 이상이어야 합니다." },
          { status: 400 }
        );
      }

      const adUser = await prisma.adUser.findUnique({
        where: { id: session.user.id },
        select: { password: true },
      });

      if (!adUser) {
        return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 });
      }

      const isValid = await bcrypt.compare(body.currentPassword, adUser.password);
      if (!isValid) {
        return NextResponse.json({ error: "현재 비밀번호가 올바르지 않습니다." }, { status: 400 });
      }

      const hashed = await bcrypt.hash(body.newPassword, 12);
      await prisma.adUser.update({
        where: { id: session.user.id },
        data: { password: hashed },
      });

      return NextResponse.json({ message: "비밀번호가 변경되었습니다." });
    }

    // 프로필 수정
    const { representName, phone } = body;

    if (!representName || !phone) {
      return NextResponse.json({ error: "필수 항목을 입력해주세요." }, { status: 400 });
    }

    const updated = await prisma.adUser.update({
      where: { id: session.user.id },
      data: { representName, phone },
      select: {
        email: true,
        representName: true,
        bizRegNumber: true,
        bizCategory: true,
        phone: true,
        isApproved: true,
        createdAt: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("설정 수정 오류:", error);
    return NextResponse.json({ error: "저장 중 오류가 발생했습니다." }, { status: 500 });
  }
}
