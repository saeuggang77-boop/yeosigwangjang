"use client";

import { useCallback, useEffect, useState } from "react";

interface PaymentItem {
  id: string;
  type: string;
  amount: number;
  months: number;
  status: string;
  description: string | null;
  createdAt: string;
}

const TYPE_LABELS: Record<string, string> = {
  AD_BASIC: "기본 광고",
  AD_PREMIUM: "프리미엄 광고",
  AD_MAIN_BANNER: "메인 배너",
  AD_JOB_PAGE_BANNER: "구인 페이지 배너",
  AD_POPUP: "팝업 광고",
};

const STATUS_STYLES: Record<string, { label: string; cls: string }> = {
  COMPLETED: { label: "완료", cls: "text-success bg-success/10" },
  PENDING: { label: "대기", cls: "text-accent bg-accent/10" },
  CANCELLED: { label: "취소", cls: "text-gray-400 bg-gray-700" },
  REFUNDED: { label: "환불", cls: "text-urgent bg-urgent/10" },
};

export default function AdPaymentsPage() {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPayments = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/ad/payments?page=${page}`);
      const data = await res.json();
      setPayments(data.payments || []);
      setTotalSpent(data.totalSpent || 0);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch {
      setPayments([]);
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">결제 내역</h1>

      {/* 총 결제 금액 */}
      <div className="card bg-gradient-to-r from-secondary/10 to-transparent border-secondary/20">
        <p className="text-xs text-gray-400">누적 결제 금액</p>
        <p className="text-2xl font-bold text-secondary mt-1">
          ₩{totalSpent.toLocaleString()}
        </p>
      </div>

      {/* 결제 목록 */}
      {isLoading ? (
        <div className="text-center py-16 text-gray-500">로딩 중...</div>
      ) : payments.length === 0 ? (
        <div className="text-center py-16 text-gray-400">결제 내역이 없습니다.</div>
      ) : (
        <div className="space-y-3">
          {payments.map((p) => {
            const st = STATUS_STYLES[p.status] || STATUS_STYLES.PENDING;
            return (
              <div key={p.id} className="card">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-sm">
                      {TYPE_LABELS[p.type] || p.type}
                      {p.months > 1 && (
                        <span className="text-xs text-gray-400 ml-1">
                          ({p.months}개월)
                        </span>
                      )}
                    </p>
                    {p.description && (
                      <p className="text-xs text-gray-500 mt-0.5">{p.description}</p>
                    )}
                    <p className="text-xs text-gray-600 mt-1">
                      {new Date(p.createdAt).toLocaleDateString("ko-KR")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">₩{p.amount.toLocaleString()}</p>
                    <span className={`text-xs px-2 py-0.5 rounded mt-1 inline-block ${st.cls}`}>
                      {st.label}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-9 h-9 rounded-lg text-sm ${
                p === page
                  ? "bg-secondary text-white"
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
