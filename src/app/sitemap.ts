import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const BASE_URL = process.env.NEXTAUTH_URL || "https://yeosi.kr";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // ─── 정적 페이지 ───
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE_URL}/jobs`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${BASE_URL}/community`, changeFrequency: "daily", priority: 0.7 },
    { url: `${BASE_URL}/directory`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/guide`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/jobs/salary-guide`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/terms`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/refund-policy`, changeFrequency: "yearly", priority: 0.3 },
  ];

  // ─── 활성 구인글 ───
  let jobPages: MetadataRoute.Sitemap = [];
  try {
    const jobs = await prisma.job.findMany({
      where: { isActive: true },
      select: { id: true, updatedAt: true, tier: true },
      orderBy: { updatedAt: "desc" },
      take: 5000,
    });

    jobPages = jobs.map((job) => ({
      url: `${BASE_URL}/jobs/${job.id}`,
      lastModified: job.updatedAt,
      changeFrequency: "daily" as const,
      priority: job.tier === "PREMIUM" ? 0.8 : job.tier === "BASIC" ? 0.7 : 0.5,
    }));
  } catch {
    // DB 연결 실패 시 스킵
  }

  // ─── 업체 디렉토리 ───
  let bizPages: MetadataRoute.Sitemap = [];
  try {
    const businesses = await prisma.business.findMany({
      where: { isApproved: true },
      select: { slug: true, category: true, updatedAt: true, isPremium: true },
      orderBy: { updatedAt: "desc" },
      take: 2000,
    });

    const categoryKeyMap: Record<string, string> = {
      HAIR_MAKEUP: "hair-makeup",
      SURGERY_SKIN: "surgery-skin",
      FASHION: "fashion",
      NAIL_BEAUTY: "nail-beauty",
      TAX_LAW: "tax-law",
      FITNESS: "fitness",
      REALESTATE: "realestate",
      ETC: "etc",
    };

    bizPages = businesses.map((biz) => ({
      url: `${BASE_URL}/directory/${categoryKeyMap[biz.category] || "etc"}/${biz.slug}`,
      lastModified: biz.updatedAt,
      changeFrequency: "weekly" as const,
      priority: biz.isPremium ? 0.7 : 0.5,
    }));
  } catch {
    // DB 연결 실패 시 스킵
  }

  return [...staticPages, ...jobPages, ...bizPages];
}
