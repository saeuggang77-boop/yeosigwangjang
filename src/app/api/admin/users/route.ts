import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (
    !session ||
    (session.user.userType !== "ADMIN" && session.user.role !== "ADMIN")
  ) {
    return null;
  }
  return session;
}

// ==========================================
// GET /api/admin/users — 회원 목록 (승인 관리)
// ==========================================
export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "user"; // user | ad
    const filter = searchParams.get("filter") || "all"; // all | pending
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 30;

    if (type === "ad") {
      // 광고업체 회원
      const where: Record<string, unknown> = {};
      if (filter === "pending") where.isApproved = false;

      const [users, total] = await Promise.all([
        prisma.adUser.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
          select: {
            id: true,
            email: true,
            representName: true,
            bizRegNumber: true,
            phone: true,
            isApproved: true,
            createdAt: true,
          },
        }),
        prisma.adUser.count({ where }),
      ]);

      return NextResponse.json({
        users,
        pagination: { page, totalPages: Math.ceil(total / limit), total },
      });
    }

    // 일반 회원
    const where: Record<string, unknown> = {};
    if (filter === "pending") where.grade = "ASSOCIATE";

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          email: true,
          nickname: true,
          role: true,
          grade: true,
          isVerified: true,
          createdAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      users,
      pagination: { page, totalPages: Math.ceil(total / limit), total },
    });
  } catch (error) {
    console.error("회원 목록 오류:", error);
    return NextResponse.json({ error: "조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}

// ==========================================
// PATCH /api/admin/users — 회원 승인/등급 변경
// ==========================================
export async function PATCH(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  try {
    const { userId, type, action } = await req.json();
    // type: "user" | "ad"
    // action: "approve" | "revoke" | "promote_staff" | "demote"

    if (type === "ad") {
      if (action === "approve") {
        await prisma.adUser.update({
          where: { id: userId },
          data: { isApproved: true },
        });
        return NextResponse.json({ message: "광고업체가 승인되었습니다." });
      }
      if (action === "revoke") {
        await prisma.adUser.update({
          where: { id: userId },
          data: { isApproved: false },
        });
        return NextResponse.json({ message: "승인이 취소되었습니다." });
      }
    }

    // 일반 회원
    if (action === "approve") {
      await prisma.user.update({
        where: { id: userId },
        data: { grade: "REGULAR" },
      });
      return NextResponse.json({ message: "정회원으로 승인되었습니다." });
    }

    if (action === "revoke") {
      await prisma.user.update({
        where: { id: userId },
        data: { grade: "ASSOCIATE" },
      });
      return NextResponse.json({ message: "준회원으로 변경되었습니다." });
    }

    if (action === "promote_staff") {
      await prisma.user.update({
        where: { id: userId },
        data: { role: "STAFF" },
      });
      return NextResponse.json({ message: "스태프로 승격되었습니다." });
    }

    if (action === "demote") {
      await prisma.user.update({
        where: { id: userId },
        data: { role: "MEMBER" },
      });
      return NextResponse.json({ message: "일반 멤버로 변경되었습니다." });
    }

    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  } catch (error) {
    console.error("회원 승인 오류:", error);
    return NextResponse.json({ error: "처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}
