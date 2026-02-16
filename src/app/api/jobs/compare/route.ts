import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/jobs/compare?ids=id1,id2,id3 — 구인글 비교 데이터
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const idsParam = searchParams.get("ids") || "";
    const ids = idsParam
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (ids.length < 2 || ids.length > 3) {
      return NextResponse.json(
        { error: "2~3개의 구인글을 선택해주세요." },
        { status: 400 }
      );
    }

    const jobs = await prisma.job.findMany({
      where: { id: { in: ids }, isActive: true },
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
        requirements: true,
        benefits: true,
        description: true,
        contactType: true,
        isUrgent: true,
        viewCount: true,
        scrapCount: true,
        createdAt: true,
      },
    });

    if (jobs.length < 2) {
      return NextResponse.json(
        { error: "비교 가능한 구인글이 부족합니다." },
        { status: 400 }
      );
    }

    // ids 순서대로 정렬
    const ordered = ids
      .map((id) => jobs.find((j) => j.id === id))
      .filter(Boolean);

    return NextResponse.json({ jobs: ordered });
  } catch (error) {
    console.error("비교 데이터 오류:", error);
    return NextResponse.json(
      { error: "조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
