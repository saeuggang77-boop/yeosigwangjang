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
// GET /api/admin/cafe-posts — 카페 인기글 목록
// ==========================================
export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 30;

    const [posts, total] = await Promise.all([
      prisma.cafePost.findMany({
        orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.cafePost.count(),
    ]);

    return NextResponse.json({
      posts,
      pagination: { page, totalPages: Math.ceil(total / limit), total },
    });
  } catch (error) {
    console.error("카페 인기글 조회 오류:", error);
    return NextResponse.json({ error: "조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}

// ==========================================
// POST /api/admin/cafe-posts — 카페 인기글 등록
// ==========================================
export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  try {
    const { title, url, category, isPinned } = await req.json();

    if (!title?.trim() || !url?.trim()) {
      return NextResponse.json(
        { error: "제목과 URL은 필수입니다." },
        { status: 400 }
      );
    }

    const post = await prisma.cafePost.create({
      data: {
        title: title.trim(),
        url: url.trim(),
        category: category || "인기글",
        isPinned: isPinned || false,
      },
    });

    return NextResponse.json(post);
  } catch (error) {
    console.error("카페 인기글 등록 오류:", error);
    return NextResponse.json({ error: "등록 중 오류가 발생했습니다." }, { status: 500 });
  }
}

// ==========================================
// PATCH /api/admin/cafe-posts — 수정/삭제
// ==========================================
export async function PATCH(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  try {
    const { postId, action, title, url, category, isPinned } = await req.json();

    if (action === "delete") {
      await prisma.cafePost.delete({ where: { id: postId } });
      return NextResponse.json({ message: "삭제되었습니다." });
    }

    if (action === "toggle_active") {
      const post = await prisma.cafePost.findUnique({ where: { id: postId } });
      if (!post) {
        return NextResponse.json({ error: "글을 찾을 수 없습니다." }, { status: 404 });
      }
      await prisma.cafePost.update({
        where: { id: postId },
        data: { isActive: !post.isActive },
      });
      return NextResponse.json({ message: "상태가 변경되었습니다." });
    }

    // 수정
    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title.trim();
    if (url !== undefined) updateData.url = url.trim();
    if (category !== undefined) updateData.category = category;
    if (isPinned !== undefined) updateData.isPinned = isPinned;

    const updated = await prisma.cafePost.update({
      where: { id: postId },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("카페 인기글 처리 오류:", error);
    return NextResponse.json({ error: "처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}
