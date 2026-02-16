import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { BIZ_CATEGORIES } from "@/lib/constants";

// ==========================================
// GET /api/directory — 카테고리별 업체 수
// ==========================================
export async function GET() {
  try {
    const counts = await prisma.business.groupBy({
      by: ["category"],
      where: { isApproved: true },
      _count: true,
    });

    const countMap = Object.fromEntries(
      counts.map((c) => [c.category, c._count])
    );

    const categories = BIZ_CATEGORIES.map((cat) => ({
      ...cat,
      count: countMap[cat.enum] || 0,
    }));

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("디렉토리 카테고리 조회 오류:", error);
    return NextResponse.json(
      { error: "조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
