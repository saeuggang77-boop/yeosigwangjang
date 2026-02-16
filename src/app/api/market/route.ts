import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ==========================================
// GET /api/market — 중고장터 목록
// ==========================================
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const sort = searchParams.get("sort") || "latest";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 20;

    const where: Record<string, unknown> = { isActive: true };

    if (category && category !== "ALL") {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // 정렬
    let orderBy: Record<string, string>;
    switch (sort) {
      case "price_asc":
        orderBy = { price: "asc" };
        break;
      case "price_desc":
        orderBy = { price: "desc" };
        break;
      default:
        orderBy = { createdAt: "desc" };
    }

    const [items, total] = await Promise.all([
      prisma.marketItem.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          price: true,
          category: true,
          images: true,
          isSoldOut: true,
          viewCount: true,
          createdAt: true,
          author: {
            select: { nickname: true },
          },
        },
      }),
      prisma.marketItem.count({ where }),
    ]);

    return NextResponse.json({
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("장터 목록 조회 오류:", error);
    return NextResponse.json(
      { error: "조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// ==========================================
// POST /api/market — 중고장터 글 작성
// ==========================================
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.userType !== "USER") {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    if (session.user.grade !== "REGULAR" && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "정회원만 글을 작성할 수 있습니다." },
        { status: 403 }
      );
    }

    const { title, description, price, category, images } = await req.json();

    if (!title || !description || price === undefined || !category) {
      return NextResponse.json(
        { error: "필수 항목을 모두 입력해주세요." },
        { status: 400 }
      );
    }

    if (typeof price !== "number" || price < 0) {
      return NextResponse.json(
        { error: "올바른 가격을 입력해주세요." },
        { status: 400 }
      );
    }

    const validCategories = ["CLOTHING", "BAG", "SHOES", "ACCESSORY", "ETC"];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: "올바른 카테고리를 선택해주세요." },
        { status: 400 }
      );
    }

    if (images && images.length > 5) {
      return NextResponse.json(
        { error: "이미지는 최대 5장까지 등록할 수 있습니다." },
        { status: 400 }
      );
    }

    const item = await prisma.marketItem.create({
      data: {
        title,
        description,
        price,
        category,
        images: images || [],
        authorId: session.user.id,
      },
    });

    return NextResponse.json({ id: item.id }, { status: 201 });
  } catch (error) {
    console.error("장터 글 작성 오류:", error);
    return NextResponse.json(
      { error: "작성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
