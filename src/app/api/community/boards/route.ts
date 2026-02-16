import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/community/boards — 게시판 목록
export async function GET() {
  try {
    const boards = await prisma.board.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        minGrade: true,
        isPublic: true,
        _count: { select: { posts: true } },
      },
    });

    return NextResponse.json({ boards });
  } catch (error) {
    console.error("게시판 목록 오류:", error);
    return NextResponse.json({ error: "조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}
