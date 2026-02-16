import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/ad/payments — 광고업체 결제 내역
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.userType !== "AD") {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 20;

    const where = { adUserId: session.user.id };

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

    const totalSpent = await prisma.payment.aggregate({
      where: { adUserId: session.user.id, status: "COMPLETED" },
      _sum: { amount: true },
    });

    return NextResponse.json({
      payments,
      totalSpent: totalSpent._sum.amount || 0,
      pagination: {
        page,
        totalPages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    console.error("광고 결제 내역 오류:", error);
    return NextResponse.json({ error: "조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}
