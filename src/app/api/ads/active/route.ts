import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/ads/active?type=MAIN_BANNER|JOB_PAGE_BANNER|POPUP
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  if (!type || !["MAIN_BANNER", "JOB_PAGE_BANNER", "POPUP"].includes(type)) {
    return NextResponse.json(
      { error: "type 파라미터가 필요합니다. (MAIN_BANNER|JOB_PAGE_BANNER|POPUP)" },
      { status: 400 }
    );
  }

  try {
    const now = new Date();

    const ads = await prisma.ad.findMany({
      where: {
        type: type as "MAIN_BANNER" | "JOB_PAGE_BANNER" | "POPUP",
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        type: true,
        bannerImage: true,
        bannerLink: true,
        business: {
          select: { name: true, slug: true },
        },
      },
    });

    return NextResponse.json({ ads });
  } catch (error) {
    console.error("활성 광고 조회 오류:", error);
    return NextResponse.json(
      { error: "조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
