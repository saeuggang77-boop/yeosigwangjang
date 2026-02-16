import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAd() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.userType !== "AD") return null;
  return session;
}

// 본인 업체인지 확인
async function verifyOwner(businessId: string, userId: string) {
  const biz = await prisma.business.findFirst({
    where: { id: businessId, ownerId: userId },
  });
  return biz;
}

// GET /api/ad/events — 내 이벤트 목록
export async function GET(req: NextRequest) {
  const session = await requireAd();
  if (!session) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get("businessId");

    // 내 업체들 가져오기
    const businesses = await prisma.business.findMany({
      where: { ownerId: session.user.id },
      select: { id: true, name: true },
    });
    const bizIds = businesses.map((b) => b.id);

    const where: Record<string, unknown> = { businessId: { in: bizIds } };
    if (businessId) {
      where.businessId = businessId;
    }

    const events = await prisma.bizEvent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        business: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      events: events.map((e) => ({
        id: e.id,
        title: e.title,
        description: e.description,
        image: e.image,
        startDate: e.startDate,
        endDate: e.endDate,
        isActive: e.isActive,
        isExpired: e.endDate < new Date(),
        createdAt: e.createdAt,
        business: e.business,
      })),
      businesses,
    });
  } catch (error) {
    console.error("이벤트 목록 오류:", error);
    return NextResponse.json({ error: "조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}

// POST /api/ad/events — 이벤트 생성
export async function POST(req: NextRequest) {
  const session = await requireAd();
  if (!session) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  try {
    const { businessId, title, description, image, startDate, endDate } =
      await req.json();

    if (!businessId || !title || !description || !startDate || !endDate) {
      return NextResponse.json({ error: "필수 항목을 입력해주세요." }, { status: 400 });
    }

    const biz = await verifyOwner(businessId, session.user.id);
    if (!biz) {
      return NextResponse.json({ error: "업체를 찾을 수 없습니다." }, { status: 404 });
    }

    const event = await prisma.bizEvent.create({
      data: {
        title,
        description,
        image: image || null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        businessId,
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error("이벤트 생성 오류:", error);
    return NextResponse.json({ error: "생성 중 오류가 발생했습니다." }, { status: 500 });
  }
}

// PATCH /api/ad/events — 이벤트 수정 / 숨기기
export async function PATCH(req: NextRequest) {
  const session = await requireAd();
  if (!session) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  try {
    const { eventId, action, title, description, image, startDate, endDate } =
      await req.json();

    if (!eventId) {
      return NextResponse.json({ error: "이벤트 ID가 필요합니다." }, { status: 400 });
    }

    // 이벤트 소유권 확인
    const event = await prisma.bizEvent.findUnique({
      where: { id: eventId },
      include: { business: { select: { ownerId: true } } },
    });

    if (!event || event.business.ownerId !== session.user.id) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    if (action === "toggle") {
      await prisma.bizEvent.update({
        where: { id: eventId },
        data: { isActive: !event.isActive },
      });
      return NextResponse.json({
        message: event.isActive ? "이벤트가 숨김 처리되었습니다." : "이벤트가 활성화되었습니다.",
      });
    }

    if (action === "delete") {
      await prisma.bizEvent.delete({ where: { id: eventId } });
      return NextResponse.json({ message: "이벤트가 삭제되었습니다." });
    }

    // 수정
    const updated = await prisma.bizEvent.update({
      where: { id: eventId },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(image !== undefined && { image: image || null }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("이벤트 수정 오류:", error);
    return NextResponse.json({ error: "처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}
