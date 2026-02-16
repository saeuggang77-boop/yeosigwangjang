import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ==========================================
// GET /api/biz/dashboard — 대시보드 요약 통계
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
    const [bizUser, jobs, payments] = await Promise.all([
      prisma.bizUser.findUnique({
        where: { id: bizUserId },
        select: {
          bizName: true,
          region: true,
          phone: true,
          hasSeekAccess: true,
          seekAccessUntil: true,
          isVerifiedBiz: true,
          createdAt: true,
        },
      }),
      prisma.job.findMany({
        where: { bizUserId, isActive: true },
        select: {
          id: true,
          tier: true,
          isUrgent: true,
          viewCount: true,
          contactClickCount: true,
          createdAt: true,
        },
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

    // 통계 계산
    const totalViews = jobs.reduce((sum, j) => sum + j.viewCount, 0);
    const totalContactClicks = jobs.reduce((sum, j) => sum + j.contactClickCount, 0);
    const totalSpent = payments.reduce((sum, p) => sum + p.amount, 0);

    const activeJobs = jobs.length;
    const urgentJobs = jobs.filter((j) => j.isUrgent).length;
    const premiumJobs = jobs.filter((j) => j.tier === "PREMIUM").length;

    // 열람권 만료 여부
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
        createdAt: bizUser.createdAt,
      },
      stats: {
        activeJobs,
        urgentJobs,
        premiumJobs,
        totalViews,
        totalContactClicks,
        totalSpent,
      },
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
