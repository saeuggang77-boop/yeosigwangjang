"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface ScrapJob {
  id: string;
  tier: string;
  title: string;
  bizName: string | null;
  region: string;
  subRegion: string | null;
  bizType: string;
  salary: string | null;
  workHours: string | null;
  benefits: string[];
  isUrgent: boolean;
  isActive: boolean;
  viewCount: number;
  scrapCount: number;
  createdAt: string;
  bookmarkedAt: string;
}

export default function ScrapsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<ScrapJob[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const fetchScraps = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/jobs/bookmarks?page=${page}`);
      const data = await res.json();
      setJobs(data.jobs || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch {
      setJobs([]);
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchScraps();
  }, [fetchScraps]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (next.size >= 3) return prev; // 최대 3개
        next.add(id);
      }
      return next;
    });
  };

  const handleRemoveScrap = async (jobId: string) => {
    try {
      await fetch(`/api/jobs/${jobId}/bookmark`, { method: "POST" });
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(jobId);
        return next;
      });
    } catch {
      // ignore
    }
  };

  const goCompare = () => {
    const ids = Array.from(selected).join(",");
    router.push(`/scraps/compare?ids=${ids}`);
  };

  const tierBadge = (tier: string) => {
    if (tier === "PREMIUM")
      return <span className="text-xs text-premium-gold font-medium">프리미엄</span>;
    if (tier === "BASIC")
      return <span className="text-xs text-secondary font-medium">기본</span>;
    return <span className="text-xs text-gray-500">라이트</span>;
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">스크랩한 구인글</h1>
        {selected.size >= 2 && (
          <button
            onClick={goCompare}
            className="btn-primary text-sm py-2 px-4"
          >
            선택한 {selected.size}개 비교하기
          </button>
        )}
      </div>

      {/* 비교 선택 안내 */}
      {jobs.length > 0 && (
        <p className="text-xs text-gray-500">
          비교할 구인글을 2~3개 선택하세요. ({selected.size}/3 선택됨)
        </p>
      )}

      {/* 목록 */}
      {isLoading ? (
        <div className="text-center py-16 text-gray-500">로딩 중...</div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16">
          <svg
            className="w-12 h-12 text-gray-600 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
            />
          </svg>
          <p className="text-gray-400 mb-4">스크랩한 구인글이 없습니다.</p>
          <Link href="/jobs" className="btn-primary text-sm">
            구인글 둘러보기
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => {
            const isSelected = selected.has(job.id);
            return (
              <div
                key={job.id}
                className={`card cursor-pointer transition-all ${
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "hover:border-gray-500"
                } ${!job.isActive ? "opacity-50" : ""}`}
              >
                <div className="flex items-start gap-3">
                  {/* 체크박스 */}
                  <button
                    onClick={() => toggleSelect(job.id)}
                    disabled={!job.isActive}
                    className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? "bg-primary border-primary text-white"
                        : "border-dark-border hover:border-gray-500"
                    } disabled:opacity-30`}
                  >
                    {isSelected && (
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>

                  {/* 내용 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/jobs/${job.id}`}
                        className="font-bold text-sm hover:text-primary-light transition-colors"
                      >
                        {job.title}
                      </Link>
                      {tierBadge(job.tier)}
                      {job.isUrgent && (
                        <span className="text-xs text-urgent font-medium">긴급</span>
                      )}
                      {!job.isActive && (
                        <span className="text-xs text-gray-500 bg-dark-border px-2 py-0.5 rounded">
                          마감
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-gray-500 mt-1">
                      {job.bizName && `${job.bizName} · `}
                      {job.region}
                      {job.subRegion && ` ${job.subRegion}`} · {job.bizType}
                    </p>

                    <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                      {job.salary && <span>{job.salary}</span>}
                      {job.workHours && <span>{job.workHours}</span>}
                    </div>

                    {job.benefits.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {job.benefits.slice(0, 4).map((b, i) => (
                          <span
                            key={i}
                            className="px-1.5 py-0.5 bg-dark-card rounded text-[10px] text-gray-400"
                          >
                            {b}
                          </span>
                        ))}
                        {job.benefits.length > 4 && (
                          <span className="text-[10px] text-gray-500">
                            +{job.benefits.length - 4}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 스크랩 해제 */}
                  <button
                    onClick={() => handleRemoveScrap(job.id)}
                    className="text-gray-500 hover:text-urgent transition-colors shrink-0"
                    title="스크랩 해제"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 하단 비교 바 (모바일 고정) */}
      {selected.size >= 2 && (
        <div className="fixed bottom-0 left-0 right-0 bg-dark-surface border-t border-dark-border p-4 sm:hidden z-40">
          <button
            onClick={goCompare}
            className="btn-primary w-full py-3 text-sm"
          >
            선택한 {selected.size}개 비교하기
          </button>
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
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
