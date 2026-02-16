import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/jobs/bookmarks — 내 스크랩 목록
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 20;

    const where = {
      userId: session.user.id,
      jobId: { not: null as string | null },
    };

    const [bookmarks, total] = await Promise.all([
      prisma.bookmark.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          job: {
            select: {
              id: true,
              type: true,
              tier: true,
              title: true,
              bizName: true,
              region: true,
              subRegion: true,
              bizType: true,
              salary: true,
              workHours: true,
              benefits: true,
              requirements: true,
              isUrgent: true,
              urgentUntil: true,
              isActive: true,
              viewCount: true,
              scrapCount: true,
              createdAt: true,
            },
          },
        },
      }),
      prisma.bookmark.count({ where }),
    ]);

    // job이 null인 경우 필터링 (삭제된 구인글)
    const jobs = bookmarks
      .filter((b) => b.job !== null)
      .map((b) => ({
        bookmarkId: b.id,
        bookmarkedAt: b.createdAt,
        ...b.job!,
      }));

    return NextResponse.json({
      jobs,
      pagination: {
        page,
        totalPages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    console.error("스크랩 목록 오류:", error);
    return NextResponse.json(
      { error: "조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
