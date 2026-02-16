"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

interface AdminJob {
  id: string;
  type: string;
  tier: string;
  title: string;
  bizName: string | null;
  region: string;
  bizType: string;
  isUrgent: boolean;
  isActive: boolean;
  viewCount: number;
  createdAt: string;
  bizUser: { bizName: string; email: string } | null;
  authorUser: { nickname: string } | null;
}

export default function AdminJobsPage() {
  return (
    <Suspense>
      <JobsContent />
    </Suspense>
  );
}

function JobsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const status = searchParams.get("status") || "all";
  const type = searchParams.get("type") || "all";
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1");

  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState(search);

  const fetchJobs = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        status,
        type,
        page: page.toString(),
      });
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/jobs?${params}`);
      const data = await res.json();
      setJobs(data.jobs || []);
      setTotal(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch {
      setJobs([]);
    } finally {
      setIsLoading(false);
    }
  }, [status, type, search, page]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    if (key !== "page") params.set("page", "1");
    router.push(`/admin/jobs?${params}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParam("search", searchInput);
  };

  const handleAction = async (jobId: string, action: string) => {
    if (action === "delete" && !confirm("정말 삭제하시겠습니까? 복구할 수 없습니다.")) {
      return;
    }
    setActionLoading(jobId);
    try {
      const res = await fetch("/api/admin/jobs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, action }),
      });
      if (res.ok) fetchJobs();
      else alert((await res.json()).error);
    } catch {
      alert("처리 중 오류가 발생했습니다.");
    } finally {
      setActionLoading(null);
    }
  };

  const tierBadge = (tier: string) => {
    switch (tier) {
      case "PREMIUM":
        return <span className="text-xs text-premium-gold">프리미엄</span>;
      case "BASIC":
        return <span className="text-xs text-secondary">기본</span>;
      default:
        return <span className="text-xs text-gray-500">무료</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">구인글 관리</h1>
        <span className="text-sm text-gray-500">총 {total}건</span>
      </div>

      {/* 필터 */}
      <div className="flex flex-wrap gap-3">
        <div className="flex gap-2">
          {[
            { key: "all", label: "전체" },
            { key: "active", label: "활성" },
            { key: "inactive", label: "비활성" },
          ].map((s) => (
            <button
              key={s.key}
              onClick={() => updateParam("status", s.key)}
              className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                status === s.key
                  ? "bg-primary text-white"
                  : "bg-dark-card text-gray-400 hover:text-white"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          {[
            { key: "all", label: "전체 유형" },
            { key: "hire", label: "구인" },
            { key: "seek", label: "구직" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => updateParam("type", t.key)}
              className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                type === t.key
                  ? "bg-accent/20 text-accent"
                  : "bg-dark-card text-gray-500 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* 검색 */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="제목 검색..."
          className="input-field flex-1 py-2 text-sm"
        />
        <button type="submit" className="btn-outline py-2 px-4 text-sm">
          검색
        </button>
      </form>

      {/* 목록 */}
      {isLoading ? (
        <div className="text-center py-16 text-gray-500">로딩 중...</div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          검색 결과가 없습니다.
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <div
              key={job.id}
              className={`card ${!job.isActive ? "opacity-60" : ""}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded ${
                        job.type === "HIRE"
                          ? "bg-primary/10 text-primary-light"
                          : "bg-secondary/10 text-secondary"
                      }`}
                    >
                      {job.type === "HIRE" ? "구인" : "구직"}
                    </span>
                    <Link
                      href={`/jobs/${job.id}`}
                      className="font-bold text-sm hover:text-primary-light transition-colors truncate"
                    >
                      {job.title}
                    </Link>
                    {tierBadge(job.tier)}
                    {job.isUrgent && (
                      <span className="text-xs text-urgent">긴급</span>
                    )}
                    {!job.isActive && (
                      <span className="text-xs text-gray-500 bg-dark-border px-2 py-0.5 rounded">
                        비활성
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {job.bizUser?.bizName || job.bizName || job.authorUser?.nickname || "비회원"}{" "}
                    &middot; {job.region} &middot; {job.bizType} &middot;
                    조회 {job.viewCount} &middot;{" "}
                    {new Date(job.createdAt).toLocaleDateString("ko-KR")}
                  </p>
                </div>

                <div className="flex gap-1.5 shrink-0">
                  {job.isActive ? (
                    <button
                      onClick={() => handleAction(job.id, "deactivate")}
                      disabled={actionLoading === job.id}
                      className="text-xs text-accent hover:text-white px-2 py-1 rounded border border-accent/30 hover:border-accent transition-colors disabled:opacity-50"
                    >
                      비활성
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAction(job.id, "activate")}
                      disabled={actionLoading === job.id}
                      className="text-xs text-success hover:text-white px-2 py-1 rounded border border-success/30 hover:border-success transition-colors disabled:opacity-50"
                    >
                      활성화
                    </button>
                  )}
                  <button
                    onClick={() => handleAction(job.id, "delete")}
                    disabled={actionLoading === job.id}
                    className="text-xs text-urgent hover:text-white px-2 py-1 rounded border border-urgent/30 hover:border-urgent hover:bg-urgent/10 transition-colors disabled:opacity-50"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
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
