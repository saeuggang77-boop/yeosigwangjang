"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

interface PaymentItem {
  id: string;
  type: string;
  amount: number;
  status: string;
  description: string | null;
  depositorName: string | null;
  adminNote: string | null;
  verifiedAt: string | null;
  createdAt: string;
  bizUser: {
    id: string;
    bizName: string;
    email: string;
    phone: string;
  } | null;
  job: {
    id: string;
    title: string;
  } | null;
}

const TYPE_LABELS: Record<string, string> = {
  JOB_BASIC: "구인글 (기본/라이트)",
  JOB_PREMIUM: "구인글 (프리미엄)",
  JOB_PKG_BASIC: "기본패키지",
  JOB_PKG_PREMIUM: "프리미엄패키지",
  SEEK_ACCESS: "열람권",
  JOB_BUMP: "끌올",
  JOB_BUMP_PKG: "끌올 패키지",
  JOB_URGENT: "긴급 구인",
};

const STATUS_TABS = [
  { key: "PENDING", label: "대기중" },
  { key: "COMPLETED", label: "승인" },
  { key: "CANCELLED", label: "거절" },
];

export default function AdminPaymentsPage() {
  const [status, setStatus] = useState("PENDING");
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState<Record<string, string>>({});

  const fetchPayments = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/admin/payments?status=${status}&page=${page}`
      );
      const data = await res.json();
      setPayments(data.payments || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch {
      setPayments([]);
    } finally {
      setIsLoading(false);
    }
  }, [status, page]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleAction = async (paymentId: string, action: "approve" | "reject") => {
    if (action === "reject" && !confirm("정말 거절하시겠습니까?")) return;

    setActionLoading(paymentId);
    try {
      const res = await fetch("/api/admin/payments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId,
          action,
          adminNote: noteInput[paymentId] || "",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error);
        return;
      }

      alert(data.message);
      fetchPayments();
    } catch {
      alert("처리 중 오류가 발생했습니다.");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">입금 확인</h1>

      {/* 상태 탭 */}
      <div className="flex gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setStatus(tab.key);
              setPage(1);
            }}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              status === tab.key
                ? "bg-primary text-white"
                : "bg-dark-card text-gray-400 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 목록 */}
      {isLoading ? (
        <div className="text-center py-20 text-gray-500">로딩 중...</div>
      ) : payments.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          {status === "PENDING"
            ? "입금 대기 중인 건이 없습니다."
            : "해당 상태의 결제가 없습니다."}
        </div>
      ) : (
        <div className="space-y-4">
          {payments.map((p) => (
            <div key={p.id} className="card space-y-3">
              {/* 상단 헤더 */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-xs bg-primary/20 text-primary-light px-2 py-0.5 rounded mr-2">
                    {TYPE_LABELS[p.type] || p.type}
                  </span>
                  <span className="text-sm font-medium text-gray-200">
                    {p.description}
                  </span>
                </div>
                <span className="text-lg font-bold text-secondary shrink-0">
                  {p.amount.toLocaleString()}원
                </span>
              </div>

              {/* 정보 */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                <div>
                  <span className="text-gray-500 text-xs">입금자명</span>
                  <p className="text-gray-200 font-medium">
                    {p.depositorName || "-"}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 text-xs">업소명</span>
                  <p className="text-gray-200">
                    {p.bizUser?.bizName || "-"}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 text-xs">신청일</span>
                  <p className="text-gray-300">
                    {new Date(p.createdAt).toLocaleString("ko-KR")}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 text-xs">연락처</span>
                  <p className="text-gray-300">
                    {p.bizUser?.phone || p.bizUser?.email || "-"}
                  </p>
                </div>
              </div>

              {/* 연결된 구인글 */}
              {p.job && (
                <div className="text-xs text-gray-500">
                  구인글:{" "}
                  <Link
                    href={`/jobs/${p.job.id}`}
                    className="text-primary-light hover:underline"
                  >
                    {p.job.title}
                  </Link>
                </div>
              )}

              {/* 관리자 메모 (처리 완료 시) */}
              {p.adminNote && (
                <div className="text-xs text-gray-500 bg-dark-bg rounded px-3 py-2">
                  관리자 메모: {p.adminNote}
                </div>
              )}

              {/* 처리 시각 */}
              {p.verifiedAt && (
                <div className="text-xs text-gray-600">
                  처리: {new Date(p.verifiedAt).toLocaleString("ko-KR")}
                </div>
              )}

              {/* 대기 중일 때만 액션 버튼 */}
              {status === "PENDING" && (
                <div className="flex items-end gap-3 pt-2 border-t border-dark-border">
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 mb-1 block">
                      관리자 메모 (선택)
                    </label>
                    <input
                      type="text"
                      value={noteInput[p.id] || ""}
                      onChange={(e) =>
                        setNoteInput((prev) => ({
                          ...prev,
                          [p.id]: e.target.value,
                        }))
                      }
                      className="input-field text-sm py-2"
                      placeholder="메모 입력"
                    />
                  </div>
                  <button
                    onClick={() => handleAction(p.id, "approve")}
                    disabled={actionLoading === p.id}
                    className="btn-primary text-sm py-2 px-4 shrink-0"
                  >
                    {actionLoading === p.id ? "처리중..." : "입금 확인"}
                  </button>
                  <button
                    onClick={() => handleAction(p.id, "reject")}
                    disabled={actionLoading === p.id}
                    className="bg-urgent/20 text-urgent hover:bg-urgent/30 text-sm py-2 px-4 rounded-lg shrink-0 transition-colors"
                  >
                    거절
                  </button>
                </div>
              )}
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
              className={`w-10 h-10 rounded-lg text-sm ${
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
