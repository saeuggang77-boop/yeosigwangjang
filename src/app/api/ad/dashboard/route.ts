import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.userType !== "AD") {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  try {
    const adUser = await prisma.adUser.findUnique({
      where: { id: session.user.id },
      include: {
        businesses: {
          select: {
            id: true,
            name: true,
            slug: true,
            category: true,
            isApproved: true,
            isPremium: true,
            viewCount: true,
            phoneClickCount: true,
            kakaoClickCount: true,
            ads: {
              where: { isActive: true, endDate: { gte: new Date() } },
              select: { id: true, type: true, startDate: true, endDate: true },
            },
            events: {
              where: { isActive: true, endDate: { gte: new Date() } },
              select: { id: true },
            },
          },
        },
        payments: {
          where: { status: "COMPLETED" },
          select: { amount: true },
        },
      },
    });

    if (!adUser) {
      return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 });
    }

    const totalSpent = adUser.payments.reduce((sum, p) => sum + p.amount, 0);
    const totalViews = adUser.businesses.reduce((sum, b) => sum + b.viewCount, 0);
    const totalPhoneClicks = adUser.businesses.reduce((sum, b) => sum + b.phoneClickCount, 0);
    const totalKakaoClicks = adUser.businesses.reduce((sum, b) => sum + b.kakaoClickCount, 0);
    const activeAds = adUser.businesses.reduce((sum, b) => sum + b.ads.length, 0);
    const activeEvents = adUser.businesses.reduce((sum, b) => sum + b.events.length, 0);

    return NextResponse.json({
      profile: {
        email: adUser.email,
        representName: adUser.representName,
        bizRegNumber: adUser.bizRegNumber,
        bizCategory: adUser.bizCategory,
        phone: adUser.phone,
        isApproved: adUser.isApproved,
        createdAt: adUser.createdAt,
      },
      stats: {
        totalBusinesses: adUser.businesses.length,
        activeAds,
        activeEvents,
        totalViews,
        totalPhoneClicks,
        totalKakaoClicks,
        totalClicks: totalPhoneClicks + totalKakaoClicks,
        totalSpent,
      },
      businesses: adUser.businesses.map((b) => ({
        id: b.id,
        name: b.name,
        slug: b.slug,
        category: b.category,
        isApproved: b.isApproved,
        isPremium: b.isPremium,
        viewCount: b.viewCount,
        phoneClickCount: b.phoneClickCount,
        kakaoClickCount: b.kakaoClickCount,
        activeAds: b.ads.length,
        activeEvents: b.events.length,
        ads: b.ads,
      })),
    });
  } catch (error) {
    console.error("광고 대시보드 오류:", error);
    return NextResponse.json({ error: "조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}
