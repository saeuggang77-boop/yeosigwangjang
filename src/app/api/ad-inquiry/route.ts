import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createNotifications } from "@/lib/notifications";

// POST /api/ad-inquiry — 광고/입점 문의 접수
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bizName, category, name, phone, email, message } = body;

    if (!bizName || !category || !name || !phone || !message) {
      return NextResponse.json(
        { error: "필수 항목을 모두 입력해주세요." },
        { status: 400 }
      );
    }

    // 관리자(ADMIN) 유저에게 알림
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });

    const inquiryText = `[광고문의] ${bizName} (${category})\n담당자: ${name}\n연락처: ${phone}${email ? `\n이메일: ${email}` : ""}\n내용: ${message}`;

    await createNotifications(
      admins.map((a) => a.id),
      "AD_INQUIRY",
      inquiryText,
      "/admin"
    );

    return NextResponse.json(
      { message: "문의가 접수되었습니다. 빠른 시일 내에 연락드리겠습니다." },
      { status: 201 }
    );
  } catch (error) {
    console.error("광고 문의 오류:", error);
    return NextResponse.json(
      { error: "문의 접수 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
