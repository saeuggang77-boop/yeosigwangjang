import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

const AD_TYPE_VALUES = ["BASIC", "PREMIUM", "MAIN_BANNER", "JOB_PAGE_BANNER", "POPUP"];

// GET /api/admin/ads — 광고 목록
export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "all";
  const status = searchParams.get("status") || "all"; // all | active | expired | inactive
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 30;

  try {
    const now = new Date();
    const where: Record<string, unknown> = {};

    if (type !== "all" && AD_TYPE_VALUES.includes(type)) {
      where.type = type;
    }

    if (status === "active") {
      where.isActive = true;
      where.endDate = { gte: now };
    } else if (status === "expired") {
      where.endDate = { lt: now };
    } else if (status === "inactive") {
      where.isActive = false;
    }

    const [ads, total] = await Promise.all([
      prisma.ad.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          business: {
            select: { id: true, name: true, slug: true, category: true },
          },
          payment: {
            select: { amount: true, months: true, status: true },
          },
        },
      }),
      prisma.ad.count({ where }),
    ]);

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
        createdAt: ad.createdAt,
        business: ad.business,
        payment: ad.payment,
      })),
      pagination: { page, totalPages: Math.ceil(total / limit), total },
    });
  } catch (error) {
    console.error("관리자 광고 목록 오류:", error);
    return NextResponse.json(
      { error: "조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// POST /api/admin/ads — 광고 직접 등록
export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  try {
    const { type, bannerImage, bannerLink, businessId, startDate, endDate } =
      await req.json();

    if (!type || !AD_TYPE_VALUES.includes(type)) {
      return NextResponse.json(
        { error: "올바른 광고 타입을 선택해주세요." },
        { status: 400 }
      );
    }

    if (!businessId) {
      return NextResponse.json(
        { error: "업체를 선택해주세요." },
        { status: 400 }
      );
    }

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "시작일과 종료일을 입력해주세요." },
        { status: 400 }
      );
    }

    // 업체 존재 확인
    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });
    if (!business) {
      return NextResponse.json(
        { error: "업체를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const ad = await prisma.ad.create({
      data: {
        type,
        bannerImage: bannerImage || null,
        bannerLink: bannerLink || null,
        businessId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive: true,
      },
    });

    return NextResponse.json(ad, { status: 201 });
  } catch (error) {
    console.error("광고 등록 오류:", error);
    return NextResponse.json(
      { error: "등록 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/ads — 광고 수정/액션
export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { adId, action } = body;

    if (!adId) {
      return NextResponse.json(
        { error: "광고 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const ad = await prisma.ad.findUnique({ where: { id: adId } });
    if (!ad) {
      return NextResponse.json(
        { error: "광고를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (action === "activate") {
      await prisma.ad.update({
        where: { id: adId },
        data: { isActive: true },
      });
      return NextResponse.json({ message: "활성화되었습니다." });
    }

    if (action === "deactivate") {
      await prisma.ad.update({
        where: { id: adId },
        data: { isActive: false },
      });
      return NextResponse.json({ message: "비활성화되었습니다." });
    }

    if (action === "delete") {
      await prisma.ad.delete({ where: { id: adId } });
      return NextResponse.json({ message: "삭제되었습니다." });
    }

    // 직접 필드 수정 (기간 연장, 이미지/링크 변경 등)
    const updateData: Record<string, unknown> = {};
    if (body.bannerImage !== undefined) updateData.bannerImage = body.bannerImage;
    if (body.bannerLink !== undefined) updateData.bannerLink = body.bannerLink;
    if (body.startDate) updateData.startDate = new Date(body.startDate);
    if (body.endDate) updateData.endDate = new Date(body.endDate);
    if (body.type && AD_TYPE_VALUES.includes(body.type)) updateData.type = body.type;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "변경할 항목이 없습니다." },
        { status: 400 }
      );
    }

    await prisma.ad.update({ where: { id: adId }, data: updateData });
    return NextResponse.json({ message: "수정되었습니다." });
  } catch (error) {
    console.error("광고 수정 오류:", error);
    return NextResponse.json(
      { error: "처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
