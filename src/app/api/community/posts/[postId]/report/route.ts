import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/community/posts/[postId]/report — 게시글 신고
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params;
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    const { reason, detail } = await req.json();

    if (!reason) {
      return NextResponse.json({ error: "신고 사유를 선택해주세요." }, { status: 400 });
    }

    // 중복 신고 체크
    const existing = await prisma.report.findFirst({
      where: { reporterId: session.user.id, postId },
    });

    if (existing) {
      return NextResponse.json({ error: "이미 신고한 게시글입니다." }, { status: 409 });
    }

    await prisma.report.create({
      data: {
        reason,
        detail: detail || null,
        reporterId: session.user.id,
        postId,
      },
    });

    return NextResponse.json({ message: "신고가 접수되었습니다." }, { status: 201 });
  } catch (error) {
    console.error("신고 오류:", error);
    return NextResponse.json({ error: "신고 중 오류가 발생했습니다." }, { status: 500 });
  }
}
