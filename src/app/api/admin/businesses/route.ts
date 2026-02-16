import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/businesses — 업체 목록 (광고 등록 시 선택용)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (
    !session ||
    (session.user.userType !== "ADMIN" && session.user.role !== "ADMIN")
  ) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  try {
    const businesses = await prisma.business.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        category: true,
        isApproved: true,
        owner: { select: { representName: true } },
      },
    });

    return NextResponse.json({ businesses });
  } catch (error) {
    console.error("업체 목록 오류:", error);
    return NextResponse.json(
      { error: "조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
