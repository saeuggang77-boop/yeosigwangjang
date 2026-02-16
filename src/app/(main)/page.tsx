import Link from "next/link";
import {
  JobCardUrgent,
  JobCardPremium,
  JobCardBasic,
  JobCardLight,
} from "@/components/job/JobCard";
import MainBanner from "@/components/ad/MainBanner";
import { prisma } from "@/lib/prisma";

// 업종 카테고리별 아이콘/컬러 매핑
const BIZ_CATEGORY_MAP: Record<string, { icon: string; label: string; color: string }> = {
  SURGERY_SKIN: { icon: "💉", label: "성형/피부", color: "from-rose-500/30 to-pink-600/20" },
  HAIR_MAKEUP: { icon: "✂️", label: "헤어/메이크업", color: "from-amber-500/30 to-orange-600/20" },
  NAIL_BEAUTY: { icon: "💅", label: "네일/뷰티", color: "from-fuchsia-500/30 to-purple-600/20" },
  TAX_LAW: { icon: "📊", label: "세무/법률", color: "from-blue-500/30 to-indigo-600/20" },
  FASHION: { icon: "👗", label: "패션", color: "from-pink-500/30 to-rose-600/20" },
  FITNESS: { icon: "💪", label: "피트니스", color: "from-green-500/30 to-emerald-600/20" },
  REALESTATE: { icon: "🏠", label: "부동산", color: "from-cyan-500/30 to-teal-600/20" },
  ETC: { icon: "✨", label: "기타", color: "from-gray-500/30 to-slate-600/20" },
};

// Job select 공통 필드
const jobSelect = {
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
  lastBumpedAt: true,
  createdAt: true,
  desiredRegions: true,
  desiredBizTypes: true,
  experience: true,
  bizUser: { select: { isVerifiedBiz: true, isRecommended: true } },
} as const;

export default async function HomePage() {
  const [
    urgentJobs,
    premiumJobs,
    basicJobs,
    lightJobs,
    cafePopular,
    cafeRecent,
    seekJobs,
    businesses,
  ] = await Promise.all([
    // 긴급 구인
    prisma.job.findMany({
      where: { type: "HIRE", isActive: true, isUrgent: true },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: jobSelect,
    }),
    // 프리미엄 구인
    prisma.job.findMany({
      where: { type: "HIRE", isActive: true, tier: "PREMIUM", isUrgent: false },
      orderBy: [{ lastBumpedAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
      take: 5,
      select: jobSelect,
    }),
    // 기본 구인
    prisma.job.findMany({
      where: { type: "HIRE", isActive: true, tier: "BASIC" },
      orderBy: [{ lastBumpedAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
      take: 4,
      select: jobSelect,
    }),
    // 라이트 구인
    prisma.job.findMany({
      where: { type: "HIRE", isActive: true, tier: "LIGHT" },
      orderBy: { createdAt: "desc" },
      take: 4,
      select: jobSelect,
    }),
    // 카페 인기글
    prisma.cafePost.findMany({
      where: { isActive: true, category: "인기글" },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      take: 5,
    }),
    // 커뮤니티 최신글
    prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        board: { select: { slug: true } },
      },
    }),
    // 구직글
    prisma.job.findMany({
      where: { type: "SEEK", isActive: true },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: {
        id: true,
        title: true,
        region: true,
        subRegion: true,
        desiredBizTypes: true,
      },
    }),
    // 추천 업체
    prisma.business.findMany({
      where: { isApproved: true },
      orderBy: [{ isPremium: "desc" }, { createdAt: "desc" }],
      take: 4,
      select: {
        id: true,
        name: true,
        slug: true,
        category: true,
        region: true,
        description: true,
      },
    }),
  ]);

  // Job → JobCardData 변환
  const toCardData = (job: typeof urgentJobs[number]) => ({
    id: job.id,
    title: job.title,
    bizName: job.bizName || "",
    region: job.region,
    subRegion: job.subRegion || undefined,
    bizType: job.bizType,
    salary: job.salary || undefined,
    workHours: job.workHours || undefined,
    tier: job.tier as "LIGHT" | "BASIC" | "PREMIUM",
    isUrgent: job.isUrgent,
    images: job.images.length > 0 ? job.images : undefined,
    lastBumpedAt: job.lastBumpedAt?.toISOString() || null,
    createdAt: job.createdAt.toISOString(),
    isVerifiedBiz: job.bizUser?.isVerifiedBiz || false,
    isRecommended: job.bizUser?.isRecommended || false,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-10">

      {/* ── 1. 메인 배너 (광고업체 슬라이더) ── */}
      <MainBanner />

      {/* ── 지역별 바로가기 ── */}
      <section>
        <h2 className="text-lg font-bold mb-3">지역별 구인</h2>
        <div className="flex flex-wrap gap-2 mb-2">
          {["서울","부산","인천","경기"].map((r) => (
            <Link
              key={r}
              href={`/jobs?region=${encodeURIComponent(r)}`}
              className="px-5 py-2.5 rounded-full text-sm font-bold bg-primary/20 text-primary-light border border-primary/30 hover:bg-primary/30 transition-colors"
            >
              {r}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {["경남","대구","경북","광주","전남","전북","대전","충남","충북","강원","제주","울산"].map((r) => (
            <Link
              key={r}
              href={`/jobs?region=${encodeURIComponent(r)}`}
              className="px-3 py-1.5 rounded-full text-xs font-medium bg-dark-card text-gray-500 hover:text-white hover:bg-primary/20 transition-colors"
            >
              {r}
            </Link>
          ))}
        </div>
      </section>

      {/* ── 2. 긴급 구인 ── */}
      {urgentJobs.length > 0 && (
        <section>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-urgent animate-pulse" />
            긴급 구인
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {urgentJobs.map((job) => (
              <JobCardUrgent key={job.id} job={toCardData(job)} />
            ))}
          </div>
        </section>
      )}

      {/* ── 3. 프리미엄 구인 (가로 스크롤) ── */}
      {premiumJobs.length > 0 && (
        <section>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span className="text-premium-gold">&#9733;</span>
            프리미엄 구인
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-3 -mx-4 px-4 snap-x scrollbar-hide">
            {premiumJobs.map((job) => (
              <JobCardPremium key={job.id} job={toCardData(job)} />
            ))}
          </div>
        </section>
      )}

      {/* ── 4. 추천 업체 ── */}
      {businesses.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">추천 업체</h2>
            <Link
              href="/directory"
              className="text-sm text-primary-light hover:underline"
            >
              업체 전체보기 &rarr;
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-3 -mx-4 px-4 snap-x scrollbar-hide">
            {businesses.map((biz) => {
              const meta = BIZ_CATEGORY_MAP[biz.category] || BIZ_CATEGORY_MAP.ETC;
              return (
                <Link
                  key={biz.id}
                  href={`/directory/${biz.category.toLowerCase().replace("_", "-")}/${biz.slug}`}
                  className="min-w-[200px] sm:min-w-[220px] snap-start shrink-0"
                >
                  <div className="card hover:border-secondary/50 transition-all h-full">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${meta.color} flex items-center justify-center shrink-0`}>
                        <span className="text-xl">{meta.icon}</span>
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-sm truncate">{biz.name}</h3>
                        <span className="text-xs text-secondary">{meta.label}</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400">{biz.region || "전국"}</p>
                    {biz.description && (
                      <p className="text-xs text-accent mt-1.5 line-clamp-1">{biz.description}</p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ── 5. 최신 구인 (기본 + 라이트) ── */}
      {(basicJobs.length > 0 || lightJobs.length > 0) && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">최신 구인</h2>
            <Link
              href="/jobs"
              className="text-sm text-primary-light hover:underline"
            >
              구인 전체보기 &rarr;
            </Link>
          </div>

          {basicJobs.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {basicJobs.map((job) => (
                <JobCardBasic key={job.id} job={toCardData(job)} />
              ))}
            </div>
          )}

          {lightJobs.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {lightJobs.map((job) => (
                <JobCardLight key={job.id} job={toCardData(job)} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── 6. 여시광장 (카페 섹션) ── */}
      <section>
        <div className="bg-dark-surface/80 border border-gray-700/60 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-primary-light">
                여시광장
              </h2>
              <p className="text-sm text-gray-400 mt-0.5">
                20,077명의 여시가 함께하고 있어요
              </p>
            </div>
            <div className="flex gap-2">
              <a
                href="https://cafe.naver.com/bamyeosi"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline text-xs py-2 px-4"
              >
                카페 바로가기
              </a>
              <Link
                href="/community"
                className="hidden sm:inline-flex btn-primary text-xs py-2 px-4"
              >
                여시광장 게시판
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-1.5">
                <svg className="w-4 h-4 text-premium-gold" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                카페 인기글
              </h3>
              <ul className="space-y-2">
                {cafePopular.length > 0 ? cafePopular.map((post, i) => (
                  <li key={post.id}>
                    <a
                      href={post.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-gray-400 hover:text-white cursor-pointer truncate flex items-center gap-2"
                    >
                      <span className="text-xs text-gray-600 w-5 text-right shrink-0">
                        {i + 1}
                      </span>
                      {post.title}
                    </a>
                  </li>
                )) : (
                  <li className="text-sm text-gray-600">인기글이 없습니다</li>
                )}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-1.5">
                <svg className="w-4 h-4 text-primary-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                최신글
              </h3>
              <ul className="space-y-2">
                {cafeRecent.length > 0 ? cafeRecent.map((post) => (
                  <li key={post.id}>
                    <Link
                      href={`/community/${post.board.slug}/${post.id}`}
                      className="text-sm text-gray-400 hover:text-white cursor-pointer truncate flex items-center gap-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-success shrink-0" />
                      {post.title}
                    </Link>
                  </li>
                )) : (
                  <li className="text-sm text-gray-600">최신글이 없습니다</li>
                )}
              </ul>
            </div>
          </div>
          <Link
            href="/community"
            className="sm:hidden block text-center text-sm text-primary-light mt-4 hover:underline"
          >
            여시광장 게시판 &rarr;
          </Link>
        </div>
      </section>

      {/* ── 7. 최신 구직 (블러 처리) ── */}
      {seekJobs.length > 0 && (
        <section>
          <h2 className="text-lg font-bold mb-4">최신 구직</h2>
          <div className="relative">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 blur-content">
              {seekJobs.map((s) => (
                <div key={s.id} className="card">
                  <h3 className="font-bold mb-1">{s.title}</h3>
                  <p className="text-sm text-gray-400">
                    {s.region}{s.subRegion && ` · ${s.subRegion}`} · {s.desiredBizTypes[0] || "전체"}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">연락처: ***</p>
                </div>
              ))}
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="font-bold mb-2">
                  열람권 구매하고 여시들 만나보세요
                </p>
                <p className="text-sm text-gray-400 mb-3">
                  ₩50,000/월 · 구직글 무제한 열람
                </p>
                <Link href="/jobs?tab=seek" className="btn-accent text-sm">
                  열람권 구매 &rarr;
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

    </div>
  );
}
