import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyNewComment, notifyNewReply } from "@/lib/notifications";

// GET /api/community/posts/[postId]/comments — 댓글 목록
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params;
  const session = await getServerSession(authOptions);

  try {
    const comments = await prisma.comment.findMany({
      where: { postId, parentId: null },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        content: true,
        createdAt: true,
        authorId: true,
        author: { select: { id: true, nickname: true } },
        _count: { select: { likes: true } },
        replies: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            content: true,
            createdAt: true,
            authorId: true,
            author: { select: { id: true, nickname: true } },
            _count: { select: { likes: true } },
          },
        },
      },
    });

    // 본인 좋아요 상태
    let likedCommentIds: Set<string> = new Set();
    if (session?.user?.id) {
      const allCommentIds = comments.flatMap((c) => [c.id, ...c.replies.map((r) => r.id)]);
      const myLikes = await prisma.like.findMany({
        where: { userId: session.user.id, commentId: { in: allCommentIds } },
        select: { commentId: true },
      });
      likedCommentIds = new Set(myLikes.map((l) => l.commentId).filter(Boolean) as string[]);
    }

    const enriched = comments.map((c) => ({
      ...c,
      isOwner: session?.user?.id === c.authorId,
      isLiked: likedCommentIds.has(c.id),
      replies: c.replies.map((r) => ({
        ...r,
        isOwner: session?.user?.id === r.authorId,
        isLiked: likedCommentIds.has(r.id),
      })),
    }));

    return NextResponse.json({ comments: enriched });
  } catch (error) {
    console.error("댓글 목록 오류:", error);
    return NextResponse.json({ error: "조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}

// POST /api/community/posts/[postId]/comments — 댓글/대댓글 작성
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params;
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    const { content, parentId } = await req.json();

    if (!content?.trim()) {
      return NextResponse.json({ error: "댓글 내용을 입력해주세요." }, { status: 400 });
    }

    // 대댓글인 경우 부모 댓글 확인
    if (parentId) {
      const parent = await prisma.comment.findUnique({
        where: { id: parentId },
        select: { postId: true },
      });
      if (!parent || parent.postId !== postId) {
        return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
      }
    }

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        authorId: session.user.id,
        postId,
        parentId: parentId || null,
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        author: { select: { id: true, nickname: true } },
      },
    });

    // 알림 생성 (비동기, 에러 무시)
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true, title: true, board: { select: { slug: true } } },
    });

    if (post) {
      const nickname = session.user.nickname || "회원";
      if (parentId) {
        // 대댓글 → 부모 댓글 작성자에게 알림
        const parentComment = await prisma.comment.findUnique({
          where: { id: parentId },
          select: { authorId: true },
        });
        if (parentComment && parentComment.authorId !== session.user.id) {
          notifyNewReply(parentComment.authorId, nickname, post.title, postId, post.board.slug);
        }
      } else {
        // 댓글 → 게시글 작성자에게 알림
        if (post.authorId !== session.user.id) {
          notifyNewComment(post.authorId, nickname, post.title, postId, post.board.slug);
        }
      }
    }

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("댓글 작성 오류:", error);
    return NextResponse.json({ error: "작성 중 오류가 발생했습니다." }, { status: 500 });
  }
}
