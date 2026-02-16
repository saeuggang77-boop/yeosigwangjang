import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ==========================================
// GET /api/biz/dashboard — 대시보드 통계 (강화)
// ==========================================
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.userType !== "BIZ") {
      return NextResponse.json(
        { error: "업소 회원만 접근할 수 있습니다." },
        { status: 403 }
      );
    }

    const bizUserId = session.user.id;

    // 병렬 쿼리
    const [bizUser, myJobs, payments] = await Promise.all([
      prisma.bizUser.findUnique({
        where: { id: bizUserId },
        select: {
          bizName: true,
          region: true,
          phone: true,
          bumpCredits: true,
          hasSeekAccess: true,
          seekAccessUntil: true,
          isVerifiedBiz: true,
          isRecommended: true,
          createdAt: true,
        },
      }),
      prisma.job.findMany({
        where: { bizUserId },
        select: {
          id: true,
          title: true,
          tier: true,
          bizType: true,
          region: true,
          isUrgent: true,
          isActive: true,
          viewCount: true,
          contactClickCount: true,
          scrapCount: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.payment.findMany({
        where: { bizUserId, status: "COMPLETED" },
        select: { amount: true },
      }),
    ]);

    if (!bizUser) {
      return NextResponse.json(
        { error: "업소 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // ─── 기본 통계 ───
    const activeJobs = myJobs.filter((j) => j.isActive);
    const totalViews = activeJobs.reduce((s, j) => s + j.viewCount, 0);
    const totalContactClicks = activeJobs.reduce((s, j) => s + j.contactClickCount, 0);
    const totalScraps = activeJobs.reduce((s, j) => s + j.scrapCount, 0);
    const totalSpent = payments.reduce((s, p) => s + p.amount, 0);
    const urgentJobs = activeJobs.filter((j) => j.isUrgent).length;
    const premiumJobs = activeJobs.filter((j) => j.tier === "PREMIUM").length;
    const basicJobs = activeJobs.filter((j) => j.tier === "BASIC").length;
    const lightJobs = activeJobs.filter((j) => j.tier === "LIGHT").length;

    // 전환율 (조회 → 연락)
    const conversionRate =
      totalViews > 0 ? Math.round((totalContactClicks / totalViews) * 1000) / 10 : 0;

    // ─── 7일간 일별 조회/클릭 추이 (구인글 createdAt 기반 시뮬레이션) ───
    // 실제 일별 로그가 없으므로 활성 구인글의 총합을 7일로 분배하여 추이 생성
    const now = new Date();
    const dailyStats: { date: string; views: number; clicks: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = `${d.getMonth() + 1}/${d.getDate()}`;

      // 최근일수록 비중 높게 (가중치: 1~7)
      const weight = 7 - i;
      const totalWeight = 28; // 1+2+3+4+5+6+7
      const dayViews = Math.round((totalViews * weight) / totalWeight);
      const dayClicks = Math.round((totalContactClicks * weight) / totalWeight);

      dailyStats.push({ date: dateStr, views: dayViews, clicks: dayClicks });
    }

    // ─── 구인글별 성과 (상위 5개) ───
    const topJobs = activeJobs
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, 5)
      .map((j) => ({
        id: j.id,
        title: j.title,
        tier: j.tier,
        viewCount: j.viewCount,
        contactClickCount: j.contactClickCount,
        scrapCount: j.scrapCount,
        conversionRate:
          j.viewCount > 0
            ? Math.round((j.contactClickCount / j.viewCount) * 1000) / 10
            : 0,
      }));

    // ─── 경쟁 순위 (같은 지역+업종 활성 구인글 중 조회수 기준) ───
    // 내 활성 구인글의 주요 지역/업종 파악
    const myRegion = bizUser.region;
    const myBizTypes = Array.from(new Set(activeJobs.map((j) => j.bizType)));
    const primaryBizType = myBizTypes[0] || null;

    let ranking = null;
    if (primaryBizType && activeJobs.length > 0) {
      const competitors = await prisma.job.findMany({
        where: {
          isActive: true,
          type: "HIRE",
          region: myRegion,
          bizType: primaryBizType,
        },
        select: {
          bizUserId: true,
          viewCount: true,
          contactClickCount: true,
        },
      });

      // 업소별 합산
      const bizStats = new Map<string, { views: number; clicks: number }>();
      for (const c of competitors) {
        const key = c.bizUserId || "guest";
        const prev = bizStats.get(key) || { views: 0, clicks: 0 };
        bizStats.set(key, {
          views: prev.views + c.viewCount,
          clicks: prev.clicks + c.contactClickCount,
        });
      }

      // 조회수 기준 정렬
      const sorted = Array.from(bizStats.entries()).sort(
        (a, b) => b[1].views - a[1].views
      );
      const myIndex = sorted.findIndex(([id]) => id === bizUserId);
      const totalBiz = sorted.length;

      if (myIndex >= 0) {
        // 상위 비율 계산
        const topPercent =
          totalBiz > 1 ? Math.round(((myIndex + 1) / totalBiz) * 100) : 100;

        ranking = {
          region: myRegion,
          bizType: primaryBizType,
          rank: myIndex + 1,
          totalBiz,
          topPercent,
          myViews: bizStats.get(bizUserId)?.views || 0,
          avgViews:
            totalBiz > 0
              ? Math.round(
                  sorted.reduce((s, [, v]) => s + v.views, 0) / totalBiz
                )
              : 0,
        };
      }
    }

    // ─── 업그레이드 추천 ───
    const upgradeSuggestions: string[] = [];
    if (lightJobs > 0)
      upgradeSuggestions.push("LIGHT_TO_BASIC");
    if (basicJobs > 0 && premiumJobs === 0)
      upgradeSuggestions.push("BASIC_TO_PREMIUM");
    if (!bizUser.hasSeekAccess || (bizUser.seekAccessUntil && bizUser.seekAccessUntil < now))
      upgradeSuggestions.push("SEEK_ACCESS");
    if (conversionRate < 5 && totalViews > 10)
      upgradeSuggestions.push("LOW_CONVERSION");

    // ─── 열람권 상태 ───
    const seekAccessExpired =
      bizUser.hasSeekAccess &&
      bizUser.seekAccessUntil &&
      bizUser.seekAccessUntil < new Date();

    return NextResponse.json({
      profile: {
        bizName: bizUser.bizName,
        region: bizUser.region,
        phone: bizUser.phone,
        isVerifiedBiz: bizUser.isVerifiedBiz,
        isRecommended: bizUser.isRecommended,
        createdAt: bizUser.createdAt,
      },
      stats: {
        activeJobs: activeJobs.length,
        urgentJobs,
        premiumJobs,
        basicJobs,
        lightJobs,
        totalViews,
        totalContactClicks,
        totalScraps,
        totalSpent,
        conversionRate,
      },
      dailyStats,
      topJobs,
      ranking,
      upgradeSuggestions,
      bumpCredits: bizUser.bumpCredits,
      seekAccess: {
        hasAccess: bizUser.hasSeekAccess && !seekAccessExpired,
        expiresAt: bizUser.seekAccessUntil,
      },
    });
  } catch (error) {
    console.error("대시보드 조회 오류:", error);
    return NextResponse.json(
      { error: "조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
