import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyPostPopular } from "@/lib/notifications";

const POPULAR_LIKE_THRESHOLD = 5;
const POPULAR_VIEW_THRESHOLD = 100;

// GET /api/community/posts/[postId] — 게시글 상세
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params;
  const session = await getServerSession(authOptions);

  try {
    const post = await prisma.post.update({
      where: { id: postId },
      data: { viewCount: { increment: 1 } },
      select: {
        id: true,
        title: true,
        content: true,
        images: true,
        isAnonymous: true,
        isPinned: true,
        isPopular: true,
        viewCount: true,
        createdAt: true,
        updatedAt: true,
        authorId: true,
        author: { select: { id: true, nickname: true, profileImage: true } },
        board: { select: { slug: true, name: true } },
        _count: { select: { comments: true, likes: true, bookmarks: true } },
      },
    });

    if (!post) {
      return NextResponse.json({ error: "게시글을 찾을 수 없습니다." }, { status: 404 });
    }

    // 인기글 자동 선정
    if (!post.isPopular) {
      const likeCount = post._count.likes;
      if (likeCount >= POPULAR_LIKE_THRESHOLD || post.viewCount >= POPULAR_VIEW_THRESHOLD) {
        await prisma.post.update({
          where: { id: postId },
          data: { isPopular: true },
        });
        post.isPopular = true;
        // 작성자에게 인기글 알림
        notifyPostPopular(post.authorId, post.title, postId, post.board.slug);
      }
    }

    // 본인 좋아요/북마크 상태
    let isLiked = false;
    let isBookmarked = false;
    if (session?.user?.id) {
      const [like, bookmark] = await Promise.all([
        prisma.like.findUnique({
          where: { userId_postId: { userId: session.user.id, postId } },
        }),
        prisma.bookmark.findUnique({
          where: { userId_postId: { userId: session.user.id, postId } },
        }),
      ]);
      isLiked = !!like;
      isBookmarked = !!bookmark;
    }

    return NextResponse.json({
      ...post,
      author: post.isAnonymous
        ? { id: null, nickname: "익명", profileImage: null }
        : post.author,
      isOwner: session?.user?.id === post.authorId,
      isLiked,
      isBookmarked,
    });
  } catch (error) {
    console.error("게시글 상세 오류:", error);
    return NextResponse.json({ error: "조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}

// PATCH /api/community/posts/[postId] — 수정
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params;
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });

    if (!post) {
      return NextResponse.json({ error: "게시글을 찾을 수 없습니다." }, { status: 404 });
    }

    const isAdmin = session.user.role === "ADMIN";
    if (post.authorId !== session.user.id && !isAdmin) {
      return NextResponse.json({ error: "수정 권한이 없습니다." }, { status: 403 });
    }

    const body = await req.json();

    // 관리자: 고정/인기 설정
    if (isAdmin && body.action) {
      if (body.action === "pin") {
        await prisma.post.update({ where: { id: postId }, data: { isPinned: !post } });
      }
      if (body.action === "togglePin") {
        const current = await prisma.post.findUnique({ where: { id: postId }, select: { isPinned: true } });
        await prisma.post.update({ where: { id: postId }, data: { isPinned: !current?.isPinned } });
        return NextResponse.json({ message: "고정 상태가 변경되었습니다." });
      }
    }

    const { title, content, images } = body;
    const updated = await prisma.post.update({
      where: { id: postId },
      data: {
        ...(title && { title: title.trim() }),
        ...(content && { content: content.trim() }),
        ...(images !== undefined && { images }),
      },
      select: { id: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("게시글 수정 오류:", error);
    return NextResponse.json({ error: "수정 중 오류가 발생했습니다." }, { status: 500 });
  }
}

// DELETE /api/community/posts/[postId] — 삭제
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params;
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });

    if (!post) {
      return NextResponse.json({ error: "게시글을 찾을 수 없습니다." }, { status: 404 });
    }

    if (post.authorId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "삭제 권한이 없습니다." }, { status: 403 });
    }

    await prisma.post.delete({ where: { id: postId } });

    return NextResponse.json({ message: "삭제되었습니다." });
  } catch (error) {
    console.error("게시글 삭제 오류:", error);
    return NextResponse.json({ error: "삭제 중 오류가 발생했습니다." }, { status: 500 });
  }
}
