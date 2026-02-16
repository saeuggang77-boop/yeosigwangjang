import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ==========================================
// GET /api/directory/[category]/[slug] — 업체 상세
// ==========================================
export async function GET(
  _req: NextRequest,
  { params }: { params: { category: string; slug: string } }
) {
  try {
    const business = await prisma.business.findUnique({
      where: { slug: params.slug },
      include: {
        events: {
          where: { isActive: true, endDate: { gte: new Date() } },
          orderBy: { startDate: "asc" },
          take: 5,
        },
      },
    });

    if (!business || !business.isApproved) {
      return NextResponse.json(
        { error: "존재하지 않는 업체입니다." },
        { status: 404 }
      );
    }

    // 조회수 증가
    await prisma.business.update({
      where: { id: business.id },
      data: { viewCount: { increment: 1 } },
    });

    return NextResponse.json(business);
  } catch (error) {
    console.error("업체 상세 조회 오류:", error);
    return NextResponse.json(
      { error: "조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// ==========================================
// POST /api/directory/[category]/[slug] — 연락처 클릭 추적
// ==========================================
export async function POST(
  req: NextRequest,
  { params }: { params: { category: string; slug: string } }
) {
  try {
    const { type } = await req.json(); // "phone" | "kakao"

    const data =
      type === "kakao"
        ? { kakaoClickCount: { increment: 1 } }
        : { phoneClickCount: { increment: 1 } };

    await prisma.business.update({
      where: { slug: params.slug },
      data,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("클릭 추적 오류:", error);
    return NextResponse.json(
      { error: "처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
