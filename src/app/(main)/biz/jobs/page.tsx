"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

const BUMP_PRICE = 10_000;

interface MyJob {
  id: string;
  type: string;
  tier: string;
  title: string;
  region: string;
  bizType: string;
  isUrgent: boolean;
  isUrgentActive: boolean;
  expiresAt: string | null;
  isExpired: boolean;
  isActive: boolean;
  viewCount: number;
  contactClickCount: number;
  lastBumpedAt: string | null;
  bumpCount: number;
  createdAt: string;
}

export default function BizJobsPage() {
  const [jobs, setJobs] = useState<MyJob[]>([]);
  const [status, setStatus] = useState("active");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [bumpModal, setBumpModal] = useState<MyJob | null>(null);

  const fetchJobs = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ status, page: page.toString() });
      const res = await fetch(`/api/biz/jobs?${params}`);
      const data = await res.json();
      setJobs(data.jobs || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch {
      setJobs([]);
    } finally {
      setIsLoading(false);
    }
  }, [status, page]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleDelete = async (jobId: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    setActionLoading(jobId);
    try {
      const res = await fetch(`/api/jobs/${jobId}`, { method: "DELETE" });
      if (res.ok) {
        setJobs((prev) => prev.filter((j) => j.id !== jobId));
      }
    } catch {
      alert("삭제 중 오류가 발생했습니다.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleBump = async (job: MyJob) => {
    setActionLoading(`bump-${job.id}`);
    try {
      // 1. 결제 주문 생성
      const checkoutRes = await fetch("/api/biz/bump/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: job.id }),
      });

      const checkoutData = await checkoutRes.json();
      if (!checkoutRes.ok) {
        alert(checkoutData.error || "끌올 준비 중 오류가 발생했습니다.");
        return;
      }

      // 2. 토스 결제 SDK가 설정되어 있으면 SDK 호출
      //    현재는 테스트용으로 바로 confirm 호출
      const confirmRes = await fetch("/api/biz/bump/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentKey: `test_${Date.now()}`,
          orderId: checkoutData.orderId,
          amount: checkoutData.amount,
          jobId: job.id,
        }),
      });

      const confirmData = await confirmRes.json();
      if (confirmRes.ok) {
        alert("끌올이 완료되었습니다! 구인글이 목록 상단으로 이동합니다.");
        setBumpModal(null);
        fetchJobs();
      } else {
        alert(confirmData.error || "끌올 처리 중 오류가 발생했습니다.");
      }
    } catch {
      alert("끌올 처리 중 오류가 발생했습니다.");
    } finally {
      setActionLoading(null);
    }
  };

  const tierLabel = (tier: string) => {
    switch (tier) {
      case "PREMIUM":
        return <span className="text-premium-gold">프리미엄</span>;
      case "BASIC":
        return <span className="text-secondary">기본</span>;
      default:
        return <span className="text-gray-500">무료</span>;
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}분 전`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}시간 전`;
    const days = Math.floor(hours / 24);
    return `${days}일 전`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">내 구인글</h1>
        <Link href="/jobs/write" className="btn-primary text-sm py-2 px-4">
          새 구인글 등록
        </Link>
      </div>

      {/* 상태 필터 */}
      <div className="flex gap-2">
        {[
          { key: "active", label: "활성" },
          { key: "expired", label: "종료" },
          { key: "all", label: "전체" },
        ].map((s) => (
          <button
            key={s.key}
            onClick={() => {
              setStatus(s.key);
              setPage(1);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
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
      ) : jobs.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 mb-4">등록된 구인글이 없습니다.</p>
          <Link href="/jobs/write" className="btn-primary text-sm">
            첫 번째 구인글 등록하기
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <div
              key={job.id}
              className={`card ${
                !job.isActive ? "opacity-60" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* 제목 & 배지 */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/jobs/${job.id}`}
                      className="font-bold text-sm hover:text-primary-light transition-colors truncate"
                    >
                      {job.title}
                    </Link>
                    {tierLabel(job.tier)}
                    {job.isUrgentActive && (
                      <span className="text-xs text-urgent font-medium">
                        긴급
                      </span>
                    )}
                    {job.lastBumpedAt && (
                      <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded">
                        끌올 {formatTimeAgo(job.lastBumpedAt)}
                      </span>
                    )}
                    {!job.isActive && (
                      <span className="text-xs text-gray-500 bg-dark-border px-2 py-0.5 rounded">
                        종료
                      </span>
                    )}
                    {job.isExpired && job.isActive && (
                      <span className="text-xs text-accent bg-accent/10 px-2 py-0.5 rounded">
                        만료
                      </span>
                    )}
                  </div>

                  {/* 메타 정보 */}
                  <p className="text-xs text-gray-500 mt-1">
                    {job.region} &middot; {job.bizType} &middot;{" "}
                    {new Date(job.createdAt).toLocaleDateString("ko-KR")}
                    {job.bumpCount > 0 && (
                      <> &middot; 끌올 {job.bumpCount}회</>
                    )}
                  </p>

                  {/* 통계 */}
                  <div className="flex gap-4 mt-2 text-xs text-gray-400">
                    <span>조회 {job.viewCount.toLocaleString()}</span>
                    <span>연락처 클릭 {job.contactClickCount.toLocaleString()}</span>
                    {job.expiresAt && (
                      <span>
                        만료일{" "}
                        {new Date(job.expiresAt).toLocaleDateString("ko-KR")}
                      </span>
                    )}
                  </div>
                </div>

                {/* 액션 버튼 */}
                <div className="flex gap-2 shrink-0">
                  {job.isActive && job.tier !== "FREE" && (
                    <button
                      onClick={() => setBumpModal(job)}
                      disabled={actionLoading === `bump-${job.id}`}
                      className="text-xs text-primary hover:text-white px-2 py-1 rounded border border-primary/30 hover:border-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
                    >
                      {actionLoading === `bump-${job.id}` ? "..." : "끌올"}
                    </button>
                  )}
                  {job.isActive && (
                    <Link
                      href={`/jobs/${job.id}`}
                      className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded border border-dark-border hover:border-gray-500 transition-colors"
                    >
                      보기
                    </Link>
                  )}
                  {job.isActive && (
                    <button
                      onClick={() => handleDelete(job.id)}
                      disabled={actionLoading === job.id}
                      className="text-xs text-urgent hover:text-white px-2 py-1 rounded border border-urgent/30 hover:border-urgent hover:bg-urgent/10 transition-colors disabled:opacity-50"
                    >
                      {actionLoading === job.id ? "..." : "삭제"}
                    </button>
                  )}
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

      {/* 끌올 확인 모달 */}
      {bumpModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="card max-w-sm w-full">
            <h3 className="text-lg font-bold mb-2">구인글 끌올</h3>
            <p className="text-sm text-gray-400 mb-4">
              &quot;{bumpModal.title}&quot; 구인글을 목록 상단으로 올리시겠습니까?
            </p>
            <div className="bg-dark-bg rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">끌올 비용</span>
                <span className="text-lg font-bold text-primary">
                  ₩{BUMP_PRICE.toLocaleString()}
                </span>
              </div>
              {bumpModal.bumpCount > 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  이전 끌올: {bumpModal.bumpCount}회
                  {bumpModal.lastBumpedAt && (
                    <> (마지막: {formatTimeAgo(bumpModal.lastBumpedAt)})</>
                  )}
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setBumpModal(null)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-dark-border text-gray-300 hover:bg-dark-card transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => handleBump(bumpModal)}
                disabled={actionLoading === `bump-${bumpModal.id}`}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {actionLoading === `bump-${bumpModal.id}` ? "처리 중..." : "결제하고 끌올"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
