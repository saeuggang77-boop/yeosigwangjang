import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ==========================================
// GET /api/biz/payments — 결제 내역
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
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 20;

    const where = { bizUserId: session.user.id };

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          type: true,
          amount: true,
          months: true,
          status: true,
          description: true,
          createdAt: true,
        },
      }),
      prisma.payment.count({ where }),
    ]);

    // 총 결제 금액
    const totalSpent = await prisma.payment.aggregate({
      where: { bizUserId: session.user.id, status: "COMPLETED" },
      _sum: { amount: true },
    });

    return NextResponse.json({
      payments,
      pagination: {
        page,
        totalPages: Math.ceil(total / limit),
        total,
      },
      totalSpent: totalSpent._sum.amount || 0,
    });
  } catch (error) {
    console.error("결제내역 조회 오류:", error);
    return NextResponse.json(
      { error: "조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
