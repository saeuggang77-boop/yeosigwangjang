import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/jobs/[id]/bookmark — 스크랩 토글
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: jobId } = await params;
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  // USER, BIZ만 스크랩 가능
  if (session.user.userType !== "USER" && session.user.userType !== "BIZ") {
    return NextResponse.json({ error: "스크랩 권한이 없습니다." }, { status: 403 });
  }

  try {
    const existing = await prisma.bookmark.findUnique({
      where: { userId_jobId: { userId: session.user.id, jobId } },
    });

    if (existing) {
      await prisma.$transaction([
        prisma.bookmark.delete({ where: { id: existing.id } }),
        prisma.job.update({
          where: { id: jobId },
          data: { scrapCount: { decrement: 1 } },
        }),
      ]);

      const job = await prisma.job.findUnique({
        where: { id: jobId },
        select: { scrapCount: true },
      });

      return NextResponse.json({
        bookmarked: false,
        scrapCount: Math.max(0, job?.scrapCount ?? 0),
      });
    }

    await prisma.$transaction([
      prisma.bookmark.create({
        data: { userId: session.user.id, jobId },
      }),
      prisma.job.update({
        where: { id: jobId },
        data: { scrapCount: { increment: 1 } },
      }),
    ]);

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { scrapCount: true },
    });

    return NextResponse.json({
      bookmarked: true,
      scrapCount: job?.scrapCount ?? 1,
    });
  } catch (error) {
    console.error("스크랩 오류:", error);
    return NextResponse.json(
      { error: "처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
