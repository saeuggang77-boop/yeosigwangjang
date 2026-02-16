import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { BIZ_CATEGORY_MAP } from "@/lib/constants";

// ==========================================
// GET /api/directory/[category] — 카테고리별 업체 목록
// ==========================================
export async function GET(
  req: NextRequest,
  { params }: { params: { category: string } }
) {
  try {
    const catInfo = BIZ_CATEGORY_MAP[params.category];
    if (!catInfo) {
      return NextResponse.json(
        { error: "존재하지 않는 카테고리입니다." },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(req.url);
    const region = searchParams.get("region") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 20;

    const where: Record<string, unknown> = {
      category: catInfo.enum,
      isApproved: true,
    };
    if (region) where.region = region;

    const [businesses, total] = await Promise.all([
      prisma.business.findMany({
        where,
        orderBy: [
          { isPremium: "desc" },
          { createdAt: "desc" },
        ],
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          slug: true,
          category: true,
          description: true,
          logo: true,
          images: true,
          region: true,
          subRegion: true,
          isPremium: true,
          viewCount: true,
        },
      }),
      prisma.business.count({ where }),
    ]);

    return NextResponse.json({
      category: catInfo,
      businesses,
      pagination: {
        page,
        totalPages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    console.error("업체 목록 조회 오류:", error);
    return NextResponse.json(
      { error: "조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
