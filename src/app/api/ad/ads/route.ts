import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/ad/ads — 내 광고 목록
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.userType !== "AD") {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "all"; // all | active | expired

    // 내 업체들의 광고 가져오기
    const businesses = await prisma.business.findMany({
      where: { ownerId: session.user.id },
      select: { id: true },
    });
    const bizIds = businesses.map((b) => b.id);

    const now = new Date();
    const where: Record<string, unknown> = { businessId: { in: bizIds } };

    if (status === "active") {
      where.isActive = true;
      where.endDate = { gte: now };
    } else if (status === "expired") {
      where.OR = [{ isActive: false }, { endDate: { lt: now } }];
    }

    const ads = await prisma.ad.findMany({
      where,
      orderBy: { startDate: "desc" },
      include: {
        business: { select: { id: true, name: true, category: true } },
        payment: { select: { amount: true, months: true, status: true } },
      },
    });

    return NextResponse.json({
      ads: ads.map((ad) => ({
        id: ad.id,
        type: ad.type,
        bannerImage: ad.bannerImage,
        bannerLink: ad.bannerLink,
        startDate: ad.startDate,
        endDate: ad.endDate,
        isActive: ad.isActive,
        isExpired: ad.endDate < now,
        business: ad.business,
        payment: ad.payment,
      })),
    });
  } catch (error) {
    console.error("광고 목록 오류:", error);
    return NextResponse.json({ error: "조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}
