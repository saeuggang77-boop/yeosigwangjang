"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

interface ReportItem {
  id: string;
  reason: string;
  detail: string | null;
  status: string;
  rewardPoint: number;
  createdAt: string;
  reporter: { nickname: string; email: string | null };
  post: { id: string; title: string } | null;
  job: { id: string; title: string; type: string } | null;
}

export default function AdminReportsPage() {
  return (
    <Suspense>
      <ReportsContent />
    </Suspense>
  );
}

function ReportsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const status = searchParams.get("status") || "PENDING";
  const page = parseInt(searchParams.get("page") || "1");

  const [reports, setReports] = useState<ReportItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ status, page: page.toString() });
      const res = await fetch(`/api/admin/reports?${params}`);
      const data = await res.json();
      setReports(data.reports || []);
      setTotal(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch {
      setReports([]);
    } finally {
      setIsLoading(false);
    }
  }, [status, page]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    if (key !== "page") params.set("page", "1");
    router.push(`/admin/reports?${params}`);
  };

  const handleAction = async (reportId: string, action: string) => {
    setActionLoading(reportId);
    try {
      const res = await fetch("/api/admin/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, action }),
      });
      if (res.ok) fetchReports();
      else alert((await res.json()).error);
    } catch {
      alert("처리 중 오류가 발생했습니다.");
    } finally {
      setActionLoading(null);
    }
  };

  const statusBadge = (s: string) => {
    switch (s) {
      case "PENDING":
        return (
          <span className="text-xs text-accent bg-accent/10 px-2 py-0.5 rounded">
            대기
          </span>
        );
      case "RESOLVED":
        return (
          <span className="text-xs text-success bg-success/10 px-2 py-0.5 rounded">
            처리됨
          </span>
        );
      case "DISMISSED":
        return (
          <span className="text-xs text-gray-500 bg-gray-700 px-2 py-0.5 rounded">
            기각
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">신고 관리</h1>
        <span className="text-sm text-gray-500">총 {total}건</span>
      </div>

      {/* 상태 필터 */}
      <div className="flex gap-2">
        {[
          { key: "PENDING", label: "대기" },
          { key: "RESOLVED", label: "처리됨" },
          { key: "DISMISSED", label: "기각" },
          { key: "all", label: "전체" },
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

      {/* 목록 */}
      {isLoading ? (
        <div className="text-center py-16 text-gray-500">로딩 중...</div>
      ) : reports.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          {status === "PENDING"
            ? "처리 대기 중인 신고가 없습니다."
            : "신고 내역이 없습니다."}
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <div key={report.id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* 신고 대상 */}
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {statusBadge(report.status)}
                    {report.job && (
                      <Link
                        href={`/jobs/${report.job.id}`}
                        className="text-sm font-medium text-primary-light hover:underline"
                      >
                        [{report.job.type === "HIRE" ? "구인" : "구직"}]{" "}
                        {report.job.title}
                      </Link>
                    )}
                    {report.post && (
                      <span className="text-sm font-medium text-primary-light">
                        [게시글] {report.post.title}
                      </span>
                    )}
                    {!report.job && !report.post && (
                      <span className="text-sm text-gray-400">
                        대상 삭제됨
                      </span>
                    )}
                  </div>

                  {/* 사유 */}
                  <p className="text-sm text-gray-300">
                    사유: {report.reason}
                  </p>
                  {report.detail && (
                    <p className="text-xs text-gray-500 mt-1">
                      {report.detail}
                    </p>
                  )}

                  {/* 메타 */}
                  <p className="text-xs text-gray-600 mt-2">
                    신고자: {report.reporter.nickname} &middot;{" "}
                    {new Date(report.createdAt).toLocaleDateString("ko-KR")}{" "}
                    {new Date(report.createdAt).toLocaleTimeString("ko-KR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                {/* 액션 */}
                {report.status === "PENDING" && (
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => handleAction(report.id, "resolve")}
                      disabled={actionLoading === report.id}
                      className="text-xs text-success hover:text-white px-3 py-1.5 rounded border border-success/30 hover:border-success hover:bg-success/10 transition-colors disabled:opacity-50"
                    >
                      {actionLoading === report.id ? "..." : "처리"}
                    </button>
                    <button
                      onClick={() => handleAction(report.id, "dismiss")}
                      disabled={actionLoading === report.id}
                      className="text-xs text-gray-400 hover:text-white px-3 py-1.5 rounded border border-dark-border hover:border-gray-500 transition-colors disabled:opacity-50"
                    >
                      기각
                    </button>
                  </div>
                )}
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
