import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, bizName, region, phone, bizRegNumber } = body;

    if (!email || !password || !bizName || !region || !phone) {
      return NextResponse.json(
        { error: "필수 항목을 모두 입력해주세요." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "비밀번호는 8자 이상이어야 합니다." },
        { status: 400 }
      );
    }

    const existing = await prisma.bizUser.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "이미 가입된 이메일입니다." },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const bizUser = await prisma.bizUser.create({
      data: {
        email,
        password: hashedPassword,
        bizName,
        region,
        phone,
        bizRegNumber: bizRegNumber || null,
      },
    });

    return NextResponse.json(
      {
        id: bizUser.id,
        email: bizUser.email,
        bizName: bizUser.bizName,
        message: "업소 회원가입이 완료되었습니다.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("업소 회원가입 오류:", error);
    return NextResponse.json(
      { error: "회원가입 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
