import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { filterJobForm } from "@/lib/filter";

// ==========================================
// GET /api/jobs/[id] — 구인/구직 상세
// ==========================================
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const job = await prisma.job.findUnique({
      where: { id: params.id },
      include: {
        bizUser: {
          select: {
            bizName: true,
            isVerifiedBiz: true,
            isRecommended: true,
          },
        },
      },
    });

    if (!job || !job.isActive) {
      return NextResponse.json(
        { error: "존재하지 않는 글입니다." },
        { status: 404 }
      );
    }

    // 조회수 증가
    await prisma.job.update({
      where: { id: params.id },
      data: { viewCount: { increment: 1 } },
    });

    // 구직글: 열람권 체크
    if (job.type === "SEEK") {
      const session = await getServerSession(authOptions);

      const canView =
        // 본인 글
        (session?.user.id && session.user.id === job.authorUserId) ||
        // 열람권 있는 업소
        (session?.user.userType === "BIZ" && session.user.hasSeekAccess) ||
        // 광고 업체 (자동 포함)
        session?.user.userType === "AD" ||
        // 관리자
        session?.user.userType === "ADMIN";

      if (!canView) {
        // 블러 처리: 연락처 & 상세 내용 숨김
        return NextResponse.json({
          ...job,
          contact: "***",
          description: job.description.slice(0, 50) + "...",
          desiredCondition: null,
          isBlurred: true,
        });
      }
    }

    return NextResponse.json(job);
  } catch (error) {
    console.error("구인글 상세 조회 오류:", error);
    return NextResponse.json(
      { error: "조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// ==========================================
// PUT /api/jobs/[id] — 수정
// ==========================================
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const job = await prisma.job.findUnique({ where: { id: params.id } });

    if (!job) {
      return NextResponse.json(
        { error: "존재하지 않는 글입니다." },
        { status: 404 }
      );
    }

    // 권한 체크
    const isOwner =
      (session?.user.id && session.user.id === job.authorUserId) ||
      (session?.user.id && session.user.id === job.bizUserId) ||
      session?.user.userType === "ADMIN";

    // 비회원: guestToken으로 확인
    const body = await req.json();
    const isGuestOwner = !session && job.guestToken && body.guestToken === job.guestToken;

    if (!isOwner && !isGuestOwner) {
      return NextResponse.json(
        { error: "수정 권한이 없습니다." },
        { status: 403 }
      );
    }

    // 차별 필터링
    if (job.type === "HIRE") {
      const filterResult = filterJobForm({
        title: body.title || job.title,
        description: body.description || job.description,
        requirements: body.requirements || job.requirements || "",
        salary: body.salary || job.salary || "",
      });
      if (!filterResult.isClean) {
        const categories = [
          ...Array.from(new Set(filterResult.violations.map((v) => v.category))),
        ];
        return NextResponse.json(
          {
            error: `차별적·허위 표현이 포함되어 있습니다: ${categories.join(", ")}`,
            violations: filterResult.violations,
          },
          { status: 422 }
        );
      }
    }

    const updated = await prisma.job.update({
      where: { id: params.id },
      data: {
        title: body.title,
        bizName: body.bizName,
        region: body.region,
        subRegion: body.subRegion,
        bizType: body.bizType,
        salary: body.salary,
        workHours: body.workHours,
        requirements: body.requirements,
        benefits: body.benefits,
        description: body.description,
        contact: body.contact,
        contactType: body.contactType,
        images: body.images,
        // 구직글 전용
        desiredRegions: body.desiredRegions,
        desiredBizTypes: body.desiredBizTypes,
        experience: body.experience,
        desiredCondition: body.desiredCondition,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("구인글 수정 오류:", error);
    return NextResponse.json(
      { error: "수정 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// ==========================================
// DELETE /api/jobs/[id] — 삭제 (비활성화)
// ==========================================
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const job = await prisma.job.findUnique({ where: { id: params.id } });

    if (!job) {
      return NextResponse.json(
        { error: "존재하지 않는 글입니다." },
        { status: 404 }
      );
    }

    // 권한 체크
    const isOwner =
      (session?.user.id && session.user.id === job.authorUserId) ||
      (session?.user.id && session.user.id === job.bizUserId) ||
      session?.user.userType === "ADMIN";

    // 비회원: guestToken
    const { searchParams } = new URL(req.url);
    const guestToken = searchParams.get("guestToken");
    const isGuestOwner = !session && job.guestToken && guestToken === job.guestToken;

    if (!isOwner && !isGuestOwner) {
      return NextResponse.json(
        { error: "삭제 권한이 없습니다." },
        { status: 403 }
      );
    }

    await prisma.job.update({
      where: { id: params.id },
      data: { isActive: false },
    });

    return NextResponse.json({ message: "삭제되었습니다." });
  } catch (error) {
    console.error("구인글 삭제 오류:", error);
    return NextResponse.json(
      { error: "삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
