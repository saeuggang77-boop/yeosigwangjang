import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/community/posts — 게시글 목록
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const boardSlug = searchParams.get("board");
  const sort = searchParams.get("sort") || "latest"; // latest | popular
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 20;

  try {
    const where: Record<string, unknown> = {};

    if (boardSlug) {
      const board = await prisma.board.findUnique({ where: { slug: boardSlug } });
      if (!board) {
        return NextResponse.json({ error: "게시판을 찾을 수 없습니다." }, { status: 404 });
      }
      where.boardId = board.id;
    }

    const orderBy =
      sort === "popular"
        ? [{ isPinned: "desc" as const }, { isPopular: "desc" as const }, { viewCount: "desc" as const }]
        : [{ isPinned: "desc" as const }, { createdAt: "desc" as const }];

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          isAnonymous: true,
          isPinned: true,
          isPopular: true,
          viewCount: true,
          createdAt: true,
          author: { select: { id: true, nickname: true } },
          board: { select: { slug: true, name: true } },
          _count: { select: { comments: true, likes: true } },
        },
      }),
      prisma.post.count({ where }),
    ]);

    return NextResponse.json({
      posts: posts.map((p) => ({
        ...p,
        author: p.isAnonymous ? { id: null, nickname: "익명" } : p.author,
      })),
      pagination: { page, totalPages: Math.ceil(total / limit), total },
    });
  } catch (error) {
    console.error("게시글 목록 오류:", error);
    return NextResponse.json({ error: "조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}

// POST /api/community/posts — 게시글 작성
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    const { boardSlug, title, content, images, isAnonymous } = await req.json();

    if (!boardSlug || !title?.trim() || !content?.trim()) {
      return NextResponse.json({ error: "제목과 내용을 입력해주세요." }, { status: 400 });
    }

    const board = await prisma.board.findUnique({ where: { slug: boardSlug } });
    if (!board || !board.isActive) {
      return NextResponse.json({ error: "게시판을 찾을 수 없습니다." }, { status: 404 });
    }

    // 공지사항은 ADMIN/STAFF만
    if (board.slug === "announcements") {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      });
      if (!user || (user.role !== "ADMIN" && user.role !== "STAFF")) {
        return NextResponse.json({ error: "공지사항 작성 권한이 없습니다." }, { status: 403 });
      }
    }

    // 정회원 체크 (공개 게시판 제외)
    if (!board.isPublic && board.minGrade === "REGULAR") {
      if (session.user.grade !== "REGULAR" && session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "정회원만 글을 작성할 수 있습니다." }, { status: 403 });
      }
    }

    const post = await prisma.post.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        images: images || [],
        isAnonymous: !!isAnonymous,
        authorId: session.user.id,
        boardId: board.id,
      },
      select: { id: true, boardId: true },
    });

    return NextResponse.json({ postId: post.id, boardSlug }, { status: 201 });
  } catch (error) {
    console.error("게시글 작성 오류:", error);
    return NextResponse.json({ error: "작성 중 오류가 발생했습니다." }, { status: 500 });
  }
}
