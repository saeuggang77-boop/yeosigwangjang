import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Vercel Cron: 매일 05:00 KST (20:00 UTC) 실행
// vercel.json → { "path": "/api/cron/ad-renewal", "schedule": "0 20 * * *" }

// 재시도 최대 횟수 (3일간 매일 1회 → 최대 3회)
const MAX_RETRY = 3;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // ─── 1) 만료 7일 전 알림 ───
    // endDate가 7일 이내이고 아직 활성인 광고
    const expiringAds = await prisma.ad.findMany({
      where: {
        isActive: true,
        endDate: { gt: now, lte: in7Days },
      },
      include: {
        business: {
          select: {
            name: true,
            owner: { select: { id: true, email: true } },
          },
        },
      },
    });

    const emailsSent: string[] = [];
    for (const ad of expiringAds) {
      const adUser = ad.business.owner;
      if (!adUser) continue;

      const daysLeft = Math.ceil(
        (ad.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      // 정확히 7일, 3일, 1일 전에만 알림 (매일 실행되므로 중복 방지)
      if (![7, 3, 1].includes(daysLeft)) continue;

      await sendExpiryEmail(
        adUser.email,
        ad.business.name,
        ad.type,
        daysLeft,
        ad.id
      );
      emailsSent.push(`${adUser.email}(D-${daysLeft})`);
    }

    // ─── 2) 만료된 광고 자동 갱신 시도 ───
    const expiredAds = await prisma.ad.findMany({
      where: {
        isActive: true,
        endDate: { lte: now },
      },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            owner: { select: { id: true, email: true } },
          },
        },
        payment: { select: { amount: true, type: true } },
      },
    });

    let renewed = 0;
    let retrying = 0;
    let deactivated = 0;

    for (const ad of expiredAds) {
      const adUser = ad.business.owner;
      if (!adUser || !ad.payment) {
        // 결제 정보 없으면 즉시 비활성화
        await prisma.ad.update({
          where: { id: ad.id },
          data: { isActive: false },
        });
        deactivated++;
        continue;
      }

      // 만료 후 경과일 계산
      const daysSinceExpiry = Math.floor(
        (now.getTime() - ad.endDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceExpiry >= MAX_RETRY) {
        // 3일 재시도 초과 → 비활성화 + 이메일 알림
        await prisma.ad.update({
          where: { id: ad.id },
          data: { isActive: false },
        });
        await sendDeactivationEmail(
          adUser.email,
          ad.business.name,
          ad.type,
          ad.id
        );
        deactivated++;
        continue;
      }

      // 자동 갱신 시도 (결제 처리)
      const success = await attemptRenewal(ad, adUser.id);
      if (success) {
        renewed++;
        await sendRenewalSuccessEmail(
          adUser.email,
          ad.business.name,
          ad.type
        );
      } else {
        retrying++;
        await sendRenewalFailEmail(
          adUser.email,
          ad.business.name,
          ad.type,
          MAX_RETRY - daysSinceExpiry - 1,
          ad.id
        );
      }
    }

    return NextResponse.json({
      ok: true,
      emailsSent: emailsSent.length,
      renewed,
      retrying,
      deactivated,
      executedAt: now.toISOString(),
    });
  } catch (error) {
    console.error("광고 갱신 크론 오류:", error);
    return NextResponse.json(
      { error: "광고 갱신 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// ─── 자동 갱신 시도 ───

async function attemptRenewal(
  ad: {
    id: string;
    type: string;
    endDate: Date;
    payment: { amount: number; type: string } | null;
    business: { id: string };
  },
  adUserId: string
): Promise<boolean> {
  if (!ad.payment) return false;

  try {
    // 30일 연장
    const newEndDate = new Date(
      ad.endDate.getTime() + 30 * 24 * 60 * 60 * 1000
    );

    // TODO: 실제 PG 자동결제(빌링키) 연동 시 여기서 결제 API 호출
    // 현재는 Payment 레코드 생성 + 광고 연장으로 처리
    // 빌링키가 없으면 갱신 실패 반환
    const hasBillingKey = false; // 빌링키 연동 전까지 false

    if (!hasBillingKey) {
      return false;
    }

    await prisma.$transaction([
      prisma.payment.create({
        data: {
          type: ad.payment.type as "AD_BASIC" | "AD_PREMIUM" | "AD_MAIN_BANNER" | "AD_JOB_PAGE_BANNER" | "AD_POPUP",
          amount: ad.payment.amount,
          status: "COMPLETED",
          description: `[자동갱신] ${ad.type} 광고`,
          adUserId,
        },
      }),
      prisma.ad.update({
        where: { id: ad.id },
        data: { endDate: newEndDate },
      }),
    ]);

    return true;
  } catch (error) {
    console.error(`광고 ${ad.id} 자동갱신 실패:`, error);
    return false;
  }
}

// ─── 이메일 발송 헬퍼 ───

async function sendExpiryEmail(
  email: string,
  bizName: string,
  adType: string,
  daysLeft: number,
  adId: string
) {
  console.log(
    `[광고만료알림] ${email} | ${bizName} ${adType} 광고 D-${daysLeft} | adId=${adId}`
  );
  // TODO: 실제 이메일 발송 (nodemailer, SES, Resend 등)
  // await sendEmail({
  //   to: email,
  //   subject: `[여시광장] ${bizName} 광고가 ${daysLeft}일 후 만료됩니다`,
  //   html: `<p>${bizName}의 ${adType} 광고가 ${daysLeft}일 후 만료됩니다.</p>
  //          <p><a href="${process.env.NEXTAUTH_URL}/ad/payments">갱신하기</a></p>`,
  // });
}

async function sendRenewalSuccessEmail(
  email: string,
  bizName: string,
  adType: string
) {
  console.log(`[자동갱신성공] ${email} | ${bizName} ${adType} 광고`);
}

async function sendRenewalFailEmail(
  email: string,
  bizName: string,
  adType: string,
  retriesLeft: number,
  adId: string
) {
  console.log(
    `[자동갱신실패] ${email} | ${bizName} ${adType} 광고 | 남은 재시도: ${retriesLeft}회 | adId=${adId}`
  );
}

async function sendDeactivationEmail(
  email: string,
  bizName: string,
  adType: string,
  adId: string
) {
  console.log(
    `[광고비활성화] ${email} | ${bizName} ${adType} 광고가 만료되어 비활성화됨 | adId=${adId}`
  );
}
