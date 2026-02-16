import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ==========================================
// GET /api/market/[id] — 중고장터 상세
// ==========================================
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const item = await prisma.marketItem.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, nickname: true, profileImage: true },
        },
      },
    });

    if (!item || !item.isActive) {
      return NextResponse.json(
        { error: "게시글을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 조회수 증가
    await prisma.marketItem.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    return NextResponse.json({
      ...item,
      viewCount: item.viewCount + 1,
    });
  } catch (error) {
    console.error("장터 상세 조회 오류:", error);
    return NextResponse.json(
      { error: "조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// ==========================================
// PATCH /api/market/[id] — 수정 + 판매완료 토글
// ==========================================
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.userType !== "USER") {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const { id } = await params;

    const item = await prisma.marketItem.findUnique({
      where: { id },
      select: { authorId: true, isActive: true },
    });

    if (!item || !item.isActive) {
      return NextResponse.json(
        { error: "게시글을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (item.authorId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "본인의 글만 수정할 수 있습니다." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const data: Record<string, unknown> = {};

    if (body.title !== undefined) data.title = body.title;
    if (body.description !== undefined) data.description = body.description;
    if (body.price !== undefined) data.price = body.price;
    if (body.category !== undefined) data.category = body.category;
    if (body.images !== undefined) data.images = body.images;
    if (body.isSoldOut !== undefined) data.isSoldOut = body.isSoldOut;

    const updated = await prisma.marketItem.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("장터 글 수정 오류:", error);
    return NextResponse.json(
      { error: "수정 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// ==========================================
// DELETE /api/market/[id] — 삭제
// ==========================================
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.userType !== "USER") {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const { id } = await params;

    const item = await prisma.marketItem.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!item) {
      return NextResponse.json(
        { error: "게시글을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (item.authorId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "본인의 글만 삭제할 수 있습니다." },
        { status: 403 }
      );
    }

    await prisma.marketItem.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ message: "삭제되었습니다." });
  } catch (error) {
    console.error("장터 글 삭제 오류:", error);
    return NextResponse.json(
      { error: "삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
