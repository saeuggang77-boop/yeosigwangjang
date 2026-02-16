import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ==========================================
// GET /api/biz/jobs — 내 구인글 목록
// ==========================================
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.userType !== "BIZ") {
      return NextResponse.json(
        { error: "업소 회원만 접근할 수 있습니다." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "active"; // active | expired | all
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 20;

    const now = new Date();

    const where: Record<string, unknown> = {
      bizUserId: session.user.id,
    };

    if (status === "active") {
      where.isActive = true;
    } else if (status === "expired") {
      where.isActive = false;
    }
    // "all" → no isActive filter

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          type: true,
          tier: true,
          title: true,
          region: true,
          bizType: true,
          isUrgent: true,
          urgentUntil: true,
          expiresAt: true,
          isActive: true,
          viewCount: true,
          contactClickCount: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.job.count({ where }),
    ]);

    // 만료 상태 표시 추가
    const enriched = jobs.map((j) => ({
      ...j,
      isExpired: j.expiresAt ? j.expiresAt < now : false,
      isUrgentActive: j.isUrgent && j.urgentUntil ? j.urgentUntil > now : false,
    }));

    return NextResponse.json({
      jobs: enriched,
      pagination: {
        page,
        totalPages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    console.error("내 구인글 조회 오류:", error);
    return NextResponse.json(
      { error: "조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
