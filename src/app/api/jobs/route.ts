import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { filterJobForm } from "@/lib/filter";
import crypto from "crypto";

// ==========================================
// GET /api/jobs — 구인/구직 목록
// ==========================================
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tab = searchParams.get("tab") || "hire"; // hire | seek
    const region = searchParams.get("region");
    const bizType = searchParams.get("bizType");
    const sort = searchParams.get("sort") || "latest";
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 20;

    const where: Record<string, unknown> = {
      type: tab === "seek" ? "SEEK" : "HIRE",
      isActive: true,
    };

    if (region) where.region = region;
    if (bizType) where.bizType = bizType;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { bizName: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // 정렬
    let orderBy: Record<string, string>[] = [];
    switch (sort) {
      case "salary":
        orderBy = [{ salary: "desc" }, { createdAt: "desc" }];
        break;
      case "views":
        orderBy = [{ viewCount: "desc" }];
        break;
      default: // latest
        orderBy = [{ createdAt: "desc" }];
    }

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          type: true,
          tier: true,
          title: true,
          bizName: true,
          region: true,
          subRegion: true,
          bizType: true,
          salary: true,
          workHours: true,
          images: true,
          isUrgent: true,
          urgentUntil: true,
          viewCount: true,
          createdAt: true,
          // 구직글 전용
          desiredRegions: true,
          desiredBizTypes: true,
          experience: true,
        },
      }),
      prisma.job.count({ where }),
    ]);

    return NextResponse.json({
      jobs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("구인글 목록 조회 오류:", error);
    return NextResponse.json(
      { error: "목록 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// ==========================================
// POST /api/jobs — 구인글 등록
// ==========================================
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();

    const {
      type, // HIRE | SEEK
      title,
      bizName,
      region,
      subRegion,
      bizType,
      salary,
      workHours,
      requirements,
      benefits,
      description,
      contact,
      contactType,
      images,
      tier, // FREE | BASIC | PREMIUM
      isUrgent,
      // 구직글 전용
      desiredRegions,
      desiredBizTypes,
      experience,
      desiredCondition,
      // 비회원
      guestEmail,
      guestPhone,
      // 법적 동의
      agreeNoFraud,
      agreeNoDiscrimination,
    } = body;

    // ─── 유효성 검사 ───
    if (!title || !region || !bizType || !description || !contact) {
      return NextResponse.json(
        { error: "필수 항목을 모두 입력해주세요." },
        { status: 400 }
      );
    }

    if (type === "HIRE") {
      if (!bizName) {
        return NextResponse.json(
          { error: "업소명을 입력해주세요." },
          { status: 400 }
        );
      }
      // v6: 법적 동의 필수
      if (!agreeNoFraud || !agreeNoDiscrimination) {
        return NextResponse.json(
          { error: "허위광고 금지 및 차별 구인 없음에 동의해주세요." },
          { status: 400 }
        );
      }
    }

    if (type === "SEEK") {
      // 구직글은 정회원만
      if (!session || session.user.userType !== "USER") {
        return NextResponse.json(
          { error: "구직글은 회원만 작성할 수 있습니다." },
          { status: 401 }
        );
      }
      if (session.user.grade !== "REGULAR") {
        return NextResponse.json(
          { error: "구직글은 정회원만 작성할 수 있습니다." },
          { status: 403 }
        );
      }
    }

    // ─── 차별 필터링 (구인글만) ───
    if (type === "HIRE") {
      const filterResult = filterJobForm({
        title,
        description,
        requirements,
        salary,
      });
      if (!filterResult.isClean) {
        const categories = [
          ...Array.from(new Set(filterResult.violations.map((v) => v.category))),
        ];
        return NextResponse.json(
          {
            error: `다음 항목에 차별적·허위 표현이 포함되어 있습니다: ${categories.join(", ")}`,
            violations: filterResult.violations,
          },
          { status: 422 }
        );
      }
    }

    // ─── 작성자 결정 ───
    let authorUserId: string | null = null;
    let bizUserId: string | null = null;
    let guestToken: string | null = null;

    if (session) {
      if (session.user.userType === "USER") {
        authorUserId = session.user.id;
      } else if (session.user.userType === "BIZ") {
        bizUserId = session.user.id;
      }
    } else if (type === "HIRE") {
      // 비회원 구인글
      if (!guestEmail) {
        return NextResponse.json(
          { error: "비회원은 이메일을 입력해주세요." },
          { status: 400 }
        );
      }
      guestToken = crypto.randomBytes(32).toString("hex");
    }

    // ─── 만료일 계산 ───
    const now = new Date();
    const expiresAt = type === "HIRE" ? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) : null;
    const urgentUntil =
      isUrgent && tier !== "FREE"
        ? new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        : null;

    const job = await prisma.job.create({
      data: {
        type: type || "HIRE",
        tier: tier || "FREE",
        title,
        bizName: bizName || null,
        region,
        subRegion: subRegion || null,
        bizType,
        salary: salary || null,
        workHours: workHours || null,
        requirements: requirements || null,
        benefits: benefits || [],
        description,
        contact,
        contactType: contactType || "KAKAO",
        images: images || [],
        isUrgent: isUrgent && tier !== "FREE",
        urgentUntil,
        expiresAt,
        authorUserId,
        bizUserId,
        guestEmail: guestEmail || null,
        guestPhone: guestPhone || null,
        guestToken,
        // 구직글 전용
        desiredRegions: desiredRegions || [],
        desiredBizTypes: desiredBizTypes || [],
        experience: experience || null,
        desiredCondition: desiredCondition || null,
      },
    });

    return NextResponse.json({ id: job.id, guestToken }, { status: 201 });
  } catch (error) {
    console.error("구인글 등록 오류:", error);
    return NextResponse.json(
      { error: "등록 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
