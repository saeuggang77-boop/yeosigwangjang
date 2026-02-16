import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Vercel Cron: 매일 04:00 KST (19:00 UTC) 실행
// vercel.json → { "crons": [{ "path": "/api/cron/expire-jobs", "schedule": "0 19 * * *" }] }

export async function GET(request: NextRequest) {
  // Vercel Cron 인증 (CRON_SECRET 환경변수)
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();

    // 1) expiresAt이 지난 활성 구인글 → 비활성화 (30일 만료)
    const expired = await prisma.job.updateMany({
      where: {
        isActive: true,
        expiresAt: { not: null, lte: now },
      },
      data: { isActive: false },
    });

    // 2) urgentUntil이 지난 긴급 구인글 → 긴급 해제 (7일 만료)
    const urgentExpired = await prisma.job.updateMany({
      where: {
        isUrgent: true,
        urgentUntil: { not: null, lte: now },
      },
      data: { isUrgent: false, urgentUntil: null },
    });

    // 3) 자동 끌올 — BASIC: 14일마다, PREMIUM: 7일마다
    const basicCutoff = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const premiumCutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const autoBumpBasic = await prisma.job.updateMany({
      where: {
        isActive: true,
        tier: "BASIC",
        type: "HIRE",
        OR: [
          { lastBumpedAt: null, createdAt: { lte: basicCutoff } },
          { lastBumpedAt: { lte: basicCutoff } },
        ],
      },
      data: { lastBumpedAt: now },
    });

    const autoBumpPremium = await prisma.job.updateMany({
      where: {
        isActive: true,
        tier: "PREMIUM",
        type: "HIRE",
        OR: [
          { lastBumpedAt: null, createdAt: { lte: premiumCutoff } },
          { lastBumpedAt: { lte: premiumCutoff } },
        ],
      },
      data: { lastBumpedAt: now },
    });

    return NextResponse.json({
      ok: true,
      expired: expired.count,
      urgentExpired: urgentExpired.count,
      autoBumped: {
        basic: autoBumpBasic.count,
        premium: autoBumpPremium.count,
      },
      executedAt: now.toISOString(),
    });
  } catch (error) {
    console.error("구인글 만료 처리 오류:", error);
    return NextResponse.json(
      { error: "만료 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
