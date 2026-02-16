import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/notifications — 알림 목록 + 읽지 않은 수
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.userType !== "USER") {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 20;
  const countOnly = searchParams.get("countOnly") === "1";

  try {
    // 읽지 않은 알림 수 (항상 반환)
    const unreadCount = await prisma.notification.count({
      where: { userId: session.user.id, isRead: false },
    });

    if (countOnly) {
      return NextResponse.json({ unreadCount });
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          type: true,
          message: true,
          link: true,
          isRead: true,
          createdAt: true,
        },
      }),
      prisma.notification.count({ where: { userId: session.user.id } }),
    ]);

    return NextResponse.json({
      notifications,
      unreadCount,
      pagination: { page, totalPages: Math.ceil(total / limit), total },
    });
  } catch (error) {
    console.error("알림 목록 오류:", error);
    return NextResponse.json(
      { error: "조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// PATCH /api/notifications — 읽음 처리
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.userType !== "USER") {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  try {
    const { notificationId, readAll } = await req.json();

    if (readAll) {
      await prisma.notification.updateMany({
        where: { userId: session.user.id, isRead: false },
        data: { isRead: true },
      });
      return NextResponse.json({ message: "모두 읽음 처리되었습니다." });
    }

    if (!notificationId) {
      return NextResponse.json(
        { error: "알림 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== session.user.id) {
      return NextResponse.json(
        { error: "알림을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    return NextResponse.json({ message: "읽음 처리되었습니다." });
  } catch (error) {
    console.error("알림 읽음 처리 오류:", error);
    return NextResponse.json(
      { error: "처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// DELETE /api/notifications — 알림 삭제
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.userType !== "USER") {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  try {
    const { notificationId, deleteAll } = await req.json();

    if (deleteAll) {
      await prisma.notification.deleteMany({
        where: { userId: session.user.id },
      });
      return NextResponse.json({ message: "모든 알림이 삭제되었습니다." });
    }

    if (!notificationId) {
      return NextResponse.json(
        { error: "알림 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== session.user.id) {
      return NextResponse.json(
        { error: "알림을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    await prisma.notification.delete({ where: { id: notificationId } });
    return NextResponse.json({ message: "삭제되었습니다." });
  } catch (error) {
    console.error("알림 삭제 오류:", error);
    return NextResponse.json(
      { error: "삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
