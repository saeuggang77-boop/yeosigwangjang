import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/community/comments/[commentId] — 댓글 좋아요 토글
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  const { commentId } = await params;
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    const existing = await prisma.like.findUnique({
      where: { userId_commentId: { userId: session.user.id, commentId } },
    });

    if (existing) {
      await prisma.like.delete({ where: { id: existing.id } });
      return NextResponse.json({ liked: false });
    }

    await prisma.like.create({
      data: { userId: session.user.id, commentId },
    });

    return NextResponse.json({ liked: true });
  } catch (error) {
    console.error("댓글 좋아요 오류:", error);
    return NextResponse.json({ error: "처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}

// DELETE /api/community/comments/[commentId] — 댓글 삭제
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  const { commentId } = await params;
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { authorId: true },
    });

    if (!comment) {
      return NextResponse.json({ error: "댓글을 찾을 수 없습니다." }, { status: 404 });
    }

    if (comment.authorId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "삭제 권한이 없습니다." }, { status: 403 });
    }

    await prisma.comment.delete({ where: { id: commentId } });

    return NextResponse.json({ message: "삭제되었습니다." });
  } catch (error) {
    console.error("댓글 삭제 오류:", error);
    return NextResponse.json({ error: "삭제 중 오류가 발생했습니다." }, { status: 500 });
  }
}
