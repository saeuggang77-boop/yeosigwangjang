"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatPriceWithUnit } from "@/lib/pricing";

interface DailyPoint {
  date: string;
  views: number;
  clicks: number;
}

interface TopJob {
  id: string;
  title: string;
  tier: string;
  viewCount: number;
  contactClickCount: number;
  scrapCount: number;
  conversionRate: number;
}

interface Ranking {
  region: string;
  bizType: string;
  rank: number;
  totalBiz: number;
  topPercent: number;
  myViews: number;
  avgViews: number;
}

interface DashboardData {
  profile: {
    bizName: string;
    region: string;
    isVerifiedBiz: boolean;
    isRecommended: boolean;
    createdAt: string;
  };
  stats: {
    activeJobs: number;
    urgentJobs: number;
    premiumJobs: number;
    basicJobs: number;
    freeJobs: number;
    totalViews: number;
    totalContactClicks: number;
    totalScraps: number;
    totalSpent: number;
    conversionRate: number;
  };
  dailyStats: DailyPoint[];
  topJobs: TopJob[];
  ranking: Ranking | null;
  upgradeSuggestions: string[];
  seekAccess: {
    hasAccess: boolean;
    expiresAt: string | null;
  };
}

export default function BizDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/biz/dashboard")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return <div className="text-center py-20 text-gray-500">로딩 중...</div>;
  }

  if (!data) {
    return (
      <div className="text-center py-20 text-gray-500">
        데이터를 불러올 수 없습니다.
      </div>
    );
  }

  const { profile, stats, dailyStats, topJobs, ranking, upgradeSuggestions, seekAccess } = data;

  return (
    <div className="space-y-6">
      {/* ─── 환영 + 뱃지 ─── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 flex-wrap">
            {profile.bizName}
            {profile.isVerifiedBiz && (
              <span className="badge-verified text-xs">인증업소</span>
            )}
            {profile.isRecommended && (
              <span className="badge-recommended text-xs">추천업소</span>
            )}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {profile.region} · 가입일{" "}
            {new Date(profile.createdAt).toLocaleDateString("ko-KR")}
          </p>
        </div>
        <Link href="/jobs/write" className="btn-primary text-xs py-2 px-3 shrink-0">
          새 구인글
        </Link>
      </div>

      {/* ─── 핵심 지표 ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard label="활성 구인글" value={stats.activeJobs} unit="건" />
        <StatCard label="총 조회수" value={stats.totalViews} unit="회" />
        <StatCard label="연락처 클릭" value={stats.totalContactClicks} unit="회" />
        <StatCard label="전환율" value={`${stats.conversionRate}%`} highlight={stats.conversionRate >= 10} />
        <StatCard label="총 스크랩" value={stats.totalScraps} unit="건" />
      </div>

      {/* ─── 업그레이드 배너 ─── */}
      {upgradeSuggestions.length > 0 && (
        <div className="space-y-3">
          {upgradeSuggestions.includes("FREE_TO_BASIC") && (
            <UpgradeBanner
              title="무료 구인글을 기본으로 업그레이드하세요"
              desc="기본 구인글은 사진 3장 + 일반 노출로 조회수가 평균 3배 높습니다."
              cta="기본 구인글 등록"
              href="/jobs/write"
              color="primary"
            />
          )}
          {upgradeSuggestions.includes("BASIC_TO_PREMIUM") && (
            <UpgradeBanner
              title="프리미엄으로 상단 고정 노출"
              desc="프리미엄 구인글은 목록 최상단 + 사진 5장 + 금색 테두리로 눈에 띕니다."
              cta="프리미엄 등록"
              href="/jobs/write"
              color="premium"
            />
          )}
          {upgradeSuggestions.includes("SEEK_ACCESS") && (
            <UpgradeBanner
              title="구직글 열람권으로 인재를 직접 찾으세요"
              desc="구직 희망자의 연락처와 상세 정보를 열람할 수 있습니다."
              cta="열람권 구매"
              href="/seek-access"
              color="accent"
            />
          )}
          {upgradeSuggestions.includes("LOW_CONVERSION") && (
            <div className="bg-dark-card border border-urgent/20 rounded-xl p-4 flex items-start gap-3">
              <span className="text-urgent text-lg shrink-0">!</span>
              <div>
                <p className="text-sm font-medium text-gray-300">전환율이 낮습니다 ({stats.conversionRate}%)</p>
                <p className="text-xs text-gray-500 mt-1">
                  제목과 급여 조건을 개선하거나 긴급/끌올 옵션을 활용해 보세요.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── 7일 추이 그래프 ─── */}
      <div className="card">
        <h2 className="font-bold text-sm text-gray-300 mb-4">최근 7일 추이</h2>
        <div className="flex items-center gap-4 mb-3 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-primary inline-block" />
            조회수
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-secondary inline-block" />
            연락 클릭
          </span>
        </div>
        <MiniBarChart data={dailyStats} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ─── 경쟁 순위 ─── */}
        <div className="card">
          <h2 className="font-bold text-sm text-gray-300 mb-3">경쟁 업소 대비 순위</h2>
          {ranking ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 bg-dark-card px-2 py-1 rounded">
                  {ranking.region} · {ranking.bizType}
                </span>
              </div>

              {/* 순위 표시 */}
              <div className="flex items-end gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">
                    {ranking.rank}<span className="text-base text-gray-400">위</span>
                  </p>
                  <p className="text-xs text-gray-500">{ranking.totalBiz}개 업소 중</p>
                </div>
                <div className="flex-1">
                  {/* 순위 바 */}
                  <div className="h-4 bg-dark-card rounded-full overflow-hidden relative">
                    <div
                      className={`h-full rounded-full ${
                        ranking.topPercent <= 30
                          ? "bg-success"
                          : ranking.topPercent <= 60
                            ? "bg-primary"
                            : "bg-urgent/60"
                      }`}
                      style={{ width: `${Math.max(100 - ranking.topPercent + 5, 10)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    상위 {ranking.topPercent}%
                  </p>
                </div>
              </div>

              {/* 평균 비교 */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-dark-border">
                <div className="text-center">
                  <p className="text-xs text-gray-500">내 조회수</p>
                  <p className="font-bold text-sm">{ranking.myViews.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">업소 평균</p>
                  <p className="font-bold text-sm text-gray-400">{ranking.avgViews.toLocaleString()}</p>
                </div>
              </div>

              {ranking.myViews < ranking.avgViews && (
                <p className="text-xs text-accent">
                  프리미엄 등록 또는 끌올로 노출을 높여보세요
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">활성 구인글이 있으면 순위가 표시됩니다.</p>
          )}
        </div>

        {/* ─── 구인글 등급 분포 ─── */}
        <div className="card">
          <h2 className="font-bold text-sm text-gray-300 mb-3">구인글 현황</h2>
          <div className="space-y-2">
            <TierBar label="프리미엄" count={stats.premiumJobs} total={stats.activeJobs} color="bg-premium-gold" />
            <TierBar label="기본" count={stats.basicJobs} total={stats.activeJobs} color="bg-primary" />
            <TierBar label="무료" count={stats.freeJobs} total={stats.activeJobs} color="bg-gray-600" />
            {stats.urgentJobs > 0 && (
              <TierBar label="긴급" count={stats.urgentJobs} total={stats.activeJobs} color="bg-urgent" />
            )}
          </div>
          <div className="flex gap-2 mt-4">
            <Link href="/biz/jobs" className="btn-outline text-xs py-2 px-3">
              전체 관리
            </Link>
            <Link href="/jobs/write" className="btn-primary text-xs py-2 px-3">
              새 구인글
            </Link>
          </div>
        </div>
      </div>

      {/* ─── 구인글별 성과 TOP 5 ─── */}
      {topJobs.length > 0 && (
        <div className="card">
          <h2 className="font-bold text-sm text-gray-300 mb-3">구인글 성과 TOP {topJobs.length}</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[500px]">
              <thead>
                <tr className="text-xs text-gray-500 border-b border-dark-border">
                  <th className="text-left py-2 font-medium">구인글</th>
                  <th className="text-right py-2 font-medium">조회</th>
                  <th className="text-right py-2 font-medium">클릭</th>
                  <th className="text-right py-2 font-medium">스크랩</th>
                  <th className="text-right py-2 font-medium">전환율</th>
                </tr>
              </thead>
              <tbody>
                {topJobs.map((job, i) => (
                  <tr key={job.id} className="border-b border-dark-border/50">
                    <td className="py-2.5">
                      <Link
                        href={`/jobs/${job.id}`}
                        className="hover:text-primary-light transition-colors flex items-center gap-2"
                      >
                        <span className="text-xs text-gray-600 w-5">{i + 1}</span>
                        <span className="truncate max-w-[200px]">{job.title}</span>
                        {job.tier === "PREMIUM" && (
                          <span className="text-[10px] text-premium-gold bg-premium-gold/10 px-1 rounded">P</span>
                        )}
                      </Link>
                    </td>
                    <td className="text-right py-2.5 text-gray-300">{job.viewCount.toLocaleString()}</td>
                    <td className="text-right py-2.5 text-gray-300">{job.contactClickCount.toLocaleString()}</td>
                    <td className="text-right py-2.5 text-gray-300">{job.scrapCount}</td>
                    <td className="text-right py-2.5">
                      <span className={job.conversionRate >= 10 ? "text-success" : job.conversionRate >= 5 ? "text-primary-light" : "text-gray-500"}>
                        {job.conversionRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── 하단: 열람권 + 결제 ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="font-bold text-sm text-gray-300 mb-3">구직글 열람권</h2>
          {seekAccess.hasAccess ? (
            <>
              <div className="flex items-center gap-2 mb-2">
                <span className="badge-verified">이용중</span>
              </div>
              {seekAccess.expiresAt && (
                <p className="text-xs text-gray-500">
                  만료일: {new Date(seekAccess.expiresAt).toLocaleDateString("ko-KR")}
                </p>
              )}
              <Link href="/seek-access" className="btn-outline text-xs py-2 px-3 mt-3 inline-block">
                기간 연장
              </Link>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-400 mb-3">
                구직자의 연락처를 확인하세요.
              </p>
              <Link href="/seek-access" className="btn-primary text-xs py-2 px-3 inline-block">
                열람권 구매
              </Link>
            </>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-sm text-gray-300">결제 요약</h2>
            <Link href="/biz/payments" className="text-xs text-primary-light">전체보기</Link>
          </div>
          <p className="text-sm text-gray-400">
            누적 결제:{" "}
            <span className="text-secondary font-bold">{formatPriceWithUnit(stats.totalSpent)}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── StatCard ───
function StatCard({
  label,
  value,
  unit,
  highlight,
}: {
  label: string;
  value: number | string;
  unit?: string;
  highlight?: boolean;
}) {
  return (
    <div className="card text-center">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-xl font-bold ${highlight ? "text-success" : ""}`}>
        {typeof value === "number" ? value.toLocaleString() : value}
        {unit && <span className="text-sm text-gray-400 ml-0.5">{unit}</span>}
      </p>
    </div>
  );
}

// ─── MiniBarChart (CSS 기반) ───
function MiniBarChart({ data }: { data: DailyPoint[] }) {
  const maxVal = Math.max(...data.map((d) => Math.max(d.views, d.clicks)), 1);

  return (
    <div className="flex items-end gap-1.5 h-32">
      {data.map((d) => (
        <div key={d.date} className="flex-1 flex flex-col items-center gap-0.5">
          {/* 막대 */}
          <div className="w-full flex gap-0.5 items-end" style={{ height: "100px" }}>
            <div
              className="flex-1 bg-primary rounded-t transition-all"
              style={{ height: `${Math.max((d.views / maxVal) * 100, 2)}%` }}
              title={`조회 ${d.views}`}
            />
            <div
              className="flex-1 bg-secondary rounded-t transition-all"
              style={{ height: `${Math.max((d.clicks / maxVal) * 100, 2)}%` }}
              title={`클릭 ${d.clicks}`}
            />
          </div>
          {/* 날짜 */}
          <span className="text-[10px] text-gray-600">{d.date}</span>
        </div>
      ))}
    </div>
  );
}

// ─── TierBar ───
function TierBar({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-xs text-gray-400 w-16 shrink-0">{label}</span>
      <div className="flex-1 h-5 bg-dark-card rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all`}
          style={{ width: `${Math.max(pct, count > 0 ? 8 : 0)}%` }}
        />
      </div>
      <span className="text-xs text-gray-300 w-12 text-right">{count}건</span>
    </div>
  );
}

// ─── UpgradeBanner ───
function UpgradeBanner({
  title,
  desc,
  cta,
  href,
  color,
}: {
  title: string;
  desc: string;
  cta: string;
  href: string;
  color: "primary" | "premium" | "accent";
}) {
  const borderMap = {
    primary: "border-primary/30 from-primary/5 to-dark-surface",
    premium: "border-premium-border/30 from-premium-border/5 to-dark-surface",
    accent: "border-accent/30 from-accent/5 to-dark-surface",
  };
  const btnMap = {
    primary: "btn-primary",
    premium: "bg-premium-gold text-dark-bg hover:bg-premium-gold/90 font-medium px-4 py-2 rounded-lg transition-colors",
    accent: "btn-accent",
  };

  return (
    <div className={`border rounded-xl p-4 bg-gradient-to-r ${borderMap[color]} flex items-center justify-between gap-4`}>
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-200">{title}</p>
        <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
      </div>
      <Link href={href} className={`${btnMap[color]} text-xs py-2 px-4 shrink-0`}>
        {cta}
      </Link>
    </div>
  );
}
