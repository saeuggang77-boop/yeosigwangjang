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
// GET /api/admin/jobs — 전체 구인글 관리
// ==========================================
export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "all"; // all | active | inactive
    const type = searchParams.get("type") || "all"; // all | hire | seek
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 30;

    const where: Record<string, unknown> = {};

    if (status === "active") where.isActive = true;
    else if (status === "inactive") where.isActive = false;

    if (type === "hire") where.type = "HIRE";
    else if (type === "seek") where.type = "SEEK";

    if (search) {
      where.title = { contains: search, mode: "insensitive" };
    }

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          type: true,
          tier: true,
          title: true,
          bizName: true,
          region: true,
          bizType: true,
          isUrgent: true,
          isActive: true,
          viewCount: true,
          createdAt: true,
          bizUser: { select: { bizName: true, email: true } },
          authorUser: { select: { nickname: true } },
        },
      }),
      prisma.job.count({ where }),
    ]);

    return NextResponse.json({
      jobs,
      pagination: { page, totalPages: Math.ceil(total / limit), total },
    });
  } catch (error) {
    console.error("관리자 구인글 조회 오류:", error);
    return NextResponse.json({ error: "조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}

// ==========================================
// PATCH /api/admin/jobs — 구인글 관리 액션
// ==========================================
export async function PATCH(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  try {
    const { jobId, action } = await req.json();
    // action: "activate" | "deactivate" | "delete"

    if (action === "activate") {
      await prisma.job.update({
        where: { id: jobId },
        data: { isActive: true },
      });
      return NextResponse.json({ message: "활성화되었습니다." });
    }

    if (action === "deactivate") {
      await prisma.job.update({
        where: { id: jobId },
        data: { isActive: false },
      });
      return NextResponse.json({ message: "비활성화되었습니다." });
    }

    if (action === "delete") {
      await prisma.job.delete({ where: { id: jobId } });
      return NextResponse.json({ message: "삭제되었습니다." });
    }

    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  } catch (error) {
    console.error("관리자 구인글 처리 오류:", error);
    return NextResponse.json({ error: "처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}
