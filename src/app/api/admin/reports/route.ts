import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyReportResolved } from "@/lib/notifications";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (
    !session ||
    (session.user.userType !== "ADMIN" && session.user.role !== "ADMIN")
  ) {
    return null;
  }
  return session;
}

// ==========================================
// GET /api/admin/reports — 신고 목록
// ==========================================
export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "PENDING";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 30;

    const where: Record<string, unknown> = {};
    if (status !== "all") where.status = status;

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          reporter: { select: { nickname: true, email: true } },
          post: { select: { id: true, title: true } },
          job: { select: { id: true, title: true, type: true } },
        },
      }),
      prisma.report.count({ where }),
    ]);

    return NextResponse.json({
      reports,
      pagination: { page, totalPages: Math.ceil(total / limit), total },
    });
  } catch (error) {
    console.error("신고 목록 오류:", error);
    return NextResponse.json({ error: "조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}

// ==========================================
// PATCH /api/admin/reports — 신고 처리
// ==========================================
export async function PATCH(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  try {
    const { reportId, action, rewardPoint } = await req.json();
    // action: "resolve" | "dismiss"

    if (action === "resolve") {
      const report = await prisma.report.update({
        where: { id: reportId },
        data: {
          status: "RESOLVED",
          rewardPoint: rewardPoint || 0,
        },
        include: { job: true, post: true },
      });

      // 신고 대상 비활성화
      if (report.jobId) {
        await prisma.job.update({
          where: { id: report.jobId },
          data: { isActive: false },
        });
      }

      // 신고자에게 처리 결과 알림
      notifyReportResolved(report.reporterId, "RESOLVED");

      return NextResponse.json({ message: "신고가 처리되었습니다." });
    }

    if (action === "dismiss") {
      const report = await prisma.report.update({
        where: { id: reportId },
        data: { status: "DISMISSED" },
      });

      // 신고자에게 기각 알림
      notifyReportResolved(report.reporterId, "DISMISSED");

      return NextResponse.json({ message: "신고가 기각되었습니다." });
    }

    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  } catch (error) {
    console.error("신고 처리 오류:", error);
    return NextResponse.json({ error: "처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}
