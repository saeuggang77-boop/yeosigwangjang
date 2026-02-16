"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function PaymentSuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [details, setDetails] = useState<{
    adType?: string;
    months?: number;
    endDate?: string;
  }>({});

  useEffect(() => {
    const paymentKey = searchParams.get("paymentKey");
    const orderId = searchParams.get("orderId");
    const amount = searchParams.get("amount");
    const businessId = searchParams.get("businessId");

    if (!paymentKey || !orderId || !amount) {
      setStatus("error");
      setMessage("결제 정보가 누락되었습니다.");
      return;
    }

    fetch("/api/ad/payments/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount: parseInt(amount),
        businessId,
      }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setStatus("success");
          setMessage(data.message || "결제가 완료되었습니다.");
          setDetails({
            adType: data.adType,
            months: data.months,
            endDate: data.endDate,
          });
        } else {
          setStatus("error");
          setMessage(data.error || "결제 승인에 실패했습니다.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("결제 처리 중 오류가 발생했습니다.");
      });
  }, [searchParams]);

  const adTypeLabel: Record<string, string> = {
    BASIC: "기본 광고",
    PREMIUM: "프리미엄 광고",
    MAIN_BANNER: "메인 배너",
    JOB_PAGE_BANNER: "구인 페이지 배너",
    POPUP: "팝업 광고",
  };

  if (status === "loading") {
    return (
      <div className="text-center py-20">
        <div className="text-4xl mb-4">⏳</div>
        <p className="text-gray-400">결제를 확인하고 있습니다...</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="text-center py-20">
        <div className="text-4xl mb-4">❌</div>
        <p className="text-urgent font-bold text-lg mb-2">결제 실패</p>
        <p className="text-gray-400 text-sm">{message}</p>
        <Link
          href="/ad/payments/checkout"
          className="inline-block mt-6 btn-primary px-6 py-2"
        >
          다시 시도
        </Link>
      </div>
    );
  }

  return (
    <div className="text-center py-20">
      <div className="text-4xl mb-4">✅</div>
      <p className="font-bold text-lg mb-2">결제 완료!</p>
      <p className="text-gray-400 text-sm">{message}</p>

      {details.adType && (
        <div className="card max-w-sm mx-auto mt-6 text-left">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">광고 유형</span>
              <span>{adTypeLabel[details.adType] || details.adType}</span>
            </div>
            {details.months && (
              <div className="flex justify-between">
                <span className="text-gray-400">기간</span>
                <span>{details.months}개월</span>
              </div>
            )}
            {details.endDate && (
              <div className="flex justify-between">
                <span className="text-gray-400">만료일</span>
                <span>{new Date(details.endDate).toLocaleDateString("ko-KR")}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-3 justify-center mt-6">
        <Link href="/ad" className="btn-primary px-6 py-2">
          대시보드
        </Link>
        <Link
          href="/ad/payments"
          className="px-6 py-2 rounded-lg border border-dark-border text-gray-400 hover:text-white transition-colors"
        >
          결제 내역
        </Link>
      </div>
    </div>
  );
}
