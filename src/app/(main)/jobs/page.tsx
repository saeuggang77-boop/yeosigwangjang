"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  JobCardUrgent,
  JobCardPremium,
  JobCardBasic,
  JobCardFree,
} from "@/components/job/JobCard";
import type { JobCardData } from "@/components/job/JobCard";
import SeekCard from "@/components/job/SeekCard";
import type { SeekCardData } from "@/components/job/SeekCard";
import { REGIONS, BIZ_TYPES } from "@/lib/constants";
import JobPageBanner from "@/components/ad/JobPageBanner";

export default function JobsPage() {
  return (
    <Suspense>
      <JobsContent />
    </Suspense>
  );
}

interface ApiJob {
  id: string;
  type: string;
  tier: string;
  title: string;
  bizName: string | null;
  region: string;
  subRegion: string | null;
  bizType: string;
  salary: string | null;
  workHours: string | null;
  images: string[];
  isUrgent: boolean;
  urgentUntil: string | null;
  viewCount: number;
  lastBumpedAt: string | null;
  createdAt: string;
  desiredRegions: string[];
  desiredBizTypes: string[];
  experience: string | null;
  bizUser?: {
    isVerifiedBiz: boolean;
    isRecommended: boolean;
  } | null;
}

function JobsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const tab = searchParams.get("tab") || "hire";
  const region = searchParams.get("region") || "";
  const bizType = searchParams.get("bizType") || "";
  const sort = searchParams.get("sort") || "latest";
  const page = parseInt(searchParams.get("page") || "1");

  const [jobs, setJobs] = useState<ApiJob[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // 구직글 열람 가능 여부
  const canViewSeek =
    session?.user.userType === "ADMIN" ||
    session?.user.userType === "AD" ||
    (session?.user.userType === "BIZ" && session.user.hasSeekAccess);

  const fetchJobs = useCallback(async () => {
    setIsLoading(true);
    const params = new URLSearchParams({
      tab,
      page: page.toString(),
      sort,
    });
    if (region) params.set("region", region);
    if (bizType) params.set("bizType", bizType);

    try {
      const res = await fetch(`/api/jobs?${params}`);
      const data = await res.json();
      setJobs(data.jobs || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch {
      setJobs([]);
    } finally {
      setIsLoading(false);
    }
  }, [tab, region, bizType, sort, page]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    if (key !== "page") params.set("page", "1");
    router.push(`/jobs?${params}`);
  };

  // 구인글 → JobCardData로 변환
  const toCardData = (j: ApiJob): JobCardData => ({
    id: j.id,
    title: j.title,
    bizName: j.bizName || "",
    region: j.region,
    subRegion: j.subRegion || undefined,
    bizType: j.bizType,
    salary: j.salary || undefined,
    workHours: j.workHours || undefined,
    tier: j.tier as "FREE" | "BASIC" | "PREMIUM",
    isUrgent: j.isUrgent,
    images: j.images,
    isVerifiedBiz: j.bizUser?.isVerifiedBiz,
    isRecommended: j.bizUser?.isRecommended,
  });

  // 그룹 분리 (구인탭만)
  const urgentJobs = jobs.filter((j) => j.isUrgent);
  const premiumJobs = jobs.filter((j) => !j.isUrgent && j.tier === "PREMIUM");
  const basicJobs = jobs.filter((j) => !j.isUrgent && j.tier === "BASIC");
  const freeJobs = jobs.filter((j) => !j.isUrgent && j.tier === "FREE");

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">구인구직</h1>
        <div className="flex gap-2">
          {tab === "seek" ? (
            <>
              {session?.user.userType === "BIZ" && !canViewSeek && (
                <Link href="/seek-access" className="btn-outline text-sm py-2 px-3">
                  열람권 구매
                </Link>
              )}
              <Link href="/jobs/write/seek" className="btn-secondary text-sm">
                구직글 작성
              </Link>
            </>
          ) : (
            <Link href="/jobs/write" className="btn-secondary text-sm">
              구인글 등록
            </Link>
          )}
        </div>
      </div>

      {/* 구인 페이지 배너 */}
      <JobPageBanner />

      {/* 탭 */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => updateParam("tab", "hire")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === "hire"
              ? "bg-primary text-white"
              : "bg-dark-card text-gray-400 hover:text-white"
          }`}
        >
          구인
        </button>
        <button
          onClick={() => updateParam("tab", "seek")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === "seek"
              ? "bg-primary text-white"
              : "bg-dark-card text-gray-400 hover:text-white"
          }`}
        >
          구직
        </button>
      </div>

      {/* 필터 */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={region}
          onChange={(e) => updateParam("region", e.target.value)}
          className="input-field w-auto text-sm py-2"
        >
          <option value="">전체 지역</option>
          {REGIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        <select
          value={bizType}
          onChange={(e) => updateParam("bizType", e.target.value)}
          className="input-field w-auto text-sm py-2"
        >
          <option value="">전체 업종</option>
          {BIZ_TYPES.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>

        <select
          value={sort}
          onChange={(e) => updateParam("sort", e.target.value)}
          className="input-field w-auto text-sm py-2"
        >
          <option value="latest">최신순</option>
          <option value="views">조회순</option>
        </select>

        {tab === "hire" && (
          <Link
            href="/jobs/salary-guide"
            className="text-xs text-gray-500 hover:text-primary-light transition-colors flex items-center gap-1 ml-auto"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            급여 가이드
          </Link>
        )}
      </div>

      {/* 로딩 */}
      {isLoading ? (
        <div className="text-center py-20 text-gray-500">불러오는 중...</div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 mb-4">등록된 글이 없습니다.</p>
          {tab === "seek" ? (
            <Link href="/jobs/write/seek" className="btn-primary text-sm">
              첫 번째 구직글 등록하기
            </Link>
          ) : (
            <Link href="/jobs/write" className="btn-primary text-sm">
              첫 번째 구인글 등록하기
            </Link>
          )}
        </div>
      ) : tab === "hire" ? (
        /* ─── 구인 탭: 등급별 그룹 ─── */
        <div className="space-y-8">
          {urgentJobs.length > 0 && (
            <section>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-urgent animate-pulse" />
                긴급 구인
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {urgentJobs.map((j) => (
                  <JobCardUrgent key={j.id} job={toCardData(j)} />
                ))}
              </div>
            </section>
          )}

          {premiumJobs.length > 0 && (
            <section>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="text-premium-gold">&#9733;</span>
                프리미엄 구인
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {premiumJobs.map((j) => (
                  <JobCardPremium key={j.id} job={toCardData(j)} />
                ))}
              </div>
            </section>
          )}

          {basicJobs.length > 0 && (
            <section>
              <h2 className="text-lg font-bold mb-4">기본 구인</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {basicJobs.map((j) => (
                  <JobCardBasic key={j.id} job={toCardData(j)} />
                ))}
              </div>
            </section>
          )}

          {freeJobs.length > 0 && (
            <section>
              <h2 className="text-lg font-bold mb-4 text-gray-500">무료 구인</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {freeJobs.map((j) => (
                  <JobCardFree key={j.id} job={toCardData(j)} />
                ))}
              </div>
            </section>
          )}
        </div>
      ) : (
        /* ─── 구직 탭 ─── */
        <div className="space-y-4">
          {/* 열람권 안내 배너 */}
          {session?.user.userType === "BIZ" && !canViewSeek && (
            <div className="bg-dark-card border border-accent/30 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-300">
                  연락처를 확인하려면 열람권이 필요합니다
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  열람권 구매 시 모든 구직글의 연락처를 확인할 수 있습니다.
                </p>
              </div>
              <Link href="/seek-access" className="btn-primary text-sm py-2 px-4 shrink-0">
                열람권 구매
              </Link>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map((j) => (
              <SeekCard
                key={j.id}
                job={{
                  id: j.id,
                  title: j.title,
                  desiredRegions: j.desiredRegions || [],
                  desiredBizTypes: j.desiredBizTypes || [],
                  experience: j.experience,
                  contact: "", // 목록에서는 연락처 미노출
                  createdAt: j.createdAt,
                } as SeekCardData}
                canView={!!canViewSeek}
              />
            ))}
          </div>
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-10">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => updateParam("page", p.toString())}
              className={`w-9 h-9 rounded-lg text-sm ${
                p === page
                  ? "bg-primary text-white"
                  : "bg-dark-card text-gray-400 hover:text-white"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
