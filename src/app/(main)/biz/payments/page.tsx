"use client";

import { useCallback, useEffect, useState } from "react";
import { formatPriceWithUnit } from "@/lib/pricing";

interface PaymentRecord {
  id: string;
  type: string;
  amount: number;
  months: number;
  status: string;
  description: string | null;
  createdAt: string;
}

const TYPE_LABELS: Record<string, string> = {
  JOB_BASIC: "구인글 (기본)",
  JOB_PREMIUM: "구인글 (프리미엄)",
  JOB_URGENT: "긴급 구인 추가",
  JOB_BUMP: "끌올",
  JOB_BUMP_PKG: "끌올 패키지",
  JOB_PKG_BASIC: "패키지 (기본)",
  JOB_PKG_PREMIUM: "패키지 (프리미엄)",
  SEEK_ACCESS: "구직글 열람권",
};

const STATUS_LABELS: Record<string, { text: string; className: string }> = {
  COMPLETED: { text: "완료", className: "text-success" },
  PENDING: { text: "대기", className: "text-accent" },
  CANCELLED: { text: "취소", className: "text-gray-500" },
  REFUNDED: { text: "환불", className: "text-urgent" },
};

export default function BizPaymentsPage() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPayments = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/biz/payments?page=${page}`);
      const data = await res.json();
      setPayments(data.payments || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalSpent(data.totalSpent || 0);
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
      <h1 className="text-xl font-bold">결제내역</h1>

      {/* 누적 결제 */}
      <div className="card bg-gradient-to-r from-primary/10 to-transparent">
        <p className="text-xs text-gray-400 mb-1">누적 결제 금액</p>
        <p className="text-2xl font-bold text-secondary">
          {formatPriceWithUnit(totalSpent)}
        </p>
      </div>

      {/* 결제 목록 */}
      {isLoading ? (
        <div className="text-center py-16 text-gray-500">로딩 중...</div>
      ) : payments.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400">결제 내역이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map((p) => {
            const statusInfo = STATUS_LABELS[p.status] || {
              text: p.status,
              className: "text-gray-400",
            };

            return (
              <div key={p.id} className="card">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm">
                        {p.description || TYPE_LABELS[p.type] || p.type}
                      </p>
                      <span
                        className={`text-xs font-medium ${statusInfo.className}`}
                      >
                        {statusInfo.text}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {TYPE_LABELS[p.type] || p.type}
                      {p.months > 1 && ` (${p.months}개월)`}
                      {" · "}
                      {new Date(p.createdAt).toLocaleDateString("ko-KR")}{" "}
                      {new Date(p.createdAt).toLocaleTimeString("ko-KR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <p className="font-bold text-sm shrink-0">
                    {formatPriceWithUnit(p.amount)}
                  </p>
                </div>
              </div>
            );
          })}
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

      {/* 안내 */}
      <div className="text-xs text-gray-600 space-y-1">
        <p>* 결제 관련 문의는 고객센터로 연락해주세요.</p>
        <p>* 환불 정책은 이용약관을 참고해주세요.</p>
      </div>
    </div>
  );
}
