import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// ==========================================
// GET /api/biz/settings — 내 정보 조회
// ==========================================
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.userType !== "BIZ") {
      return NextResponse.json(
        { error: "업소 회원만 접근할 수 있습니다." },
        { status: 403 }
      );
    }

    const bizUser = await prisma.bizUser.findUnique({
      where: { id: session.user.id },
      select: {
        email: true,
        bizName: true,
        region: true,
        phone: true,
        bizRegNumber: true,
        isVerifiedBiz: true,
        createdAt: true,
      },
    });

    if (!bizUser) {
      return NextResponse.json(
        { error: "업소 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json(bizUser);
  } catch (error) {
    console.error("설정 조회 오류:", error);
    return NextResponse.json(
      { error: "조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// ==========================================
// PATCH /api/biz/settings — 정보 수정
// ==========================================
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.userType !== "BIZ") {
      return NextResponse.json(
        { error: "업소 회원만 접근할 수 있습니다." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { bizName, region, phone, bizRegNumber, currentPassword, newPassword } = body;

    const bizUser = await prisma.bizUser.findUnique({
      where: { id: session.user.id },
    });

    if (!bizUser) {
      return NextResponse.json(
        { error: "업소 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 비밀번호 변경 요청
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "현재 비밀번호를 입력해주세요." },
          { status: 400 }
        );
      }

      const isValid = await bcrypt.compare(currentPassword, bizUser.password);
      if (!isValid) {
        return NextResponse.json(
          { error: "현재 비밀번호가 일치하지 않습니다." },
          { status: 400 }
        );
      }

      if (newPassword.length < 8) {
        return NextResponse.json(
          { error: "새 비밀번호는 8자 이상이어야 합니다." },
          { status: 400 }
        );
      }

      const hashed = await bcrypt.hash(newPassword, 12);
      await prisma.bizUser.update({
        where: { id: session.user.id },
        data: { password: hashed },
      });

      return NextResponse.json({ message: "비밀번호가 변경되었습니다." });
    }

    // 프로필 수정
    const updateData: Record<string, string> = {};
    if (bizName && bizName.trim()) updateData.bizName = bizName.trim();
    if (region && region.trim()) updateData.region = region.trim();
    if (phone && phone.trim()) updateData.phone = phone.trim();
    if (bizRegNumber !== undefined) updateData.bizRegNumber = bizRegNumber?.trim() || "";

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "변경할 항목이 없습니다." },
        { status: 400 }
      );
    }

    const updated = await prisma.bizUser.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        email: true,
        bizName: true,
        region: true,
        phone: true,
        bizRegNumber: true,
        isVerifiedBiz: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("설정 수정 오류:", error);
    return NextResponse.json(
      { error: "수정 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
