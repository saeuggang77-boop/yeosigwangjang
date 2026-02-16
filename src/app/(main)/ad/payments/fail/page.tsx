"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function PaymentFailPage() {
  return (
    <Suspense>
      <FailContent />
    </Suspense>
  );
}

function FailContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code") || "";
  const message = searchParams.get("message") || "결제가 취소되었거나 실패했습니다.";

  return (
    <div className="text-center py-20">
      <div className="text-4xl mb-4">😔</div>
      <p className="font-bold text-lg mb-2 text-urgent">결제 실패</p>
      <p className="text-gray-400 text-sm">{message}</p>
      {code && <p className="text-xs text-gray-600 mt-1">오류 코드: {code}</p>}

      <div className="flex gap-3 justify-center mt-6">
        <Link href="/ad/payments/checkout" className="btn-primary px-6 py-2">
          다시 시도
        </Link>
        <Link
          href="/ad"
          className="px-6 py-2 rounded-lg border border-dark-border text-gray-400 hover:text-white transition-colors"
        >
          대시보드
        </Link>
      </div>
    </div>
  );
}
