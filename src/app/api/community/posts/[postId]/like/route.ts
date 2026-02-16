import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyPostLike } from "@/lib/notifications";

// POST /api/community/posts/[postId]/like — 좋아요 토글
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params;
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    const existing = await prisma.like.findUnique({
      where: { userId_postId: { userId: session.user.id, postId } },
    });

    if (existing) {
      await prisma.like.delete({ where: { id: existing.id } });
      return NextResponse.json({ liked: false });
    }

    await prisma.like.create({
      data: { userId: session.user.id, postId },
    });

    // 좋아요 마일스톤 알림 (5, 10, 50, 100)
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        authorId: true,
        title: true,
        board: { select: { slug: true } },
        _count: { select: { likes: true } },
      },
    });
    if (post && post.authorId !== session.user.id) {
      notifyPostLike(post.authorId, post._count.likes, post.title, postId, post.board.slug);
    }

    return NextResponse.json({ liked: true });
  } catch (error) {
    console.error("좋아요 오류:", error);
    return NextResponse.json({ error: "처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}
