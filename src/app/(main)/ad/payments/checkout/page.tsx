"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BIZ_CATEGORIES } from "@/lib/constants";

const BIZ_CAT_LABEL: Record<string, string> = Object.fromEntries(
  BIZ_CATEGORIES.map((c) => [c.enum, c.label])
);

// 클라이언트용 가격 매핑
const AD_PRICES: Record<string, { basic: number; premium: number }> = {
  SURGERY_SKIN: { basic: 500_000, premium: 1_000_000 },
  HAIR_MAKEUP: { basic: 100_000, premium: 200_000 },
  FASHION: { basic: 100_000, premium: 200_000 },
  NAIL_BEAUTY: { basic: 100_000, premium: 200_000 },
  FITNESS: { basic: 100_000, premium: 200_000 },
  TAX_LAW: { basic: 80_000, premium: 150_000 },
  REALESTATE: { basic: 80_000, premium: 150_000 },
  ETC: { basic: 80_000, premium: 150_000 },
};

const EXTRA_PRICES = {
  MAIN_BANNER: 800_000,
  JOB_PAGE_BANNER: 300_000,
  POPUP: 500_000,
};

const DISCOUNT_RATES: Record<number, number> = { 1: 0, 2: 0.1, 3: 0.2 };

interface BusinessItem {
  id: string;
  name: string;
  category: string;
}

type AdProduct = "BASIC" | "PREMIUM" | "MAIN_BANNER" | "JOB_PAGE_BANNER" | "POPUP";

export default function AdCheckoutPage() {
  const router = useRouter();
  const [businesses, setBusinesses] = useState<BusinessItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [selectedBiz, setSelectedBiz] = useState("");
  const [adType, setAdType] = useState<AdProduct>("BASIC");
  const [months, setMonths] = useState(1);

  // 업체 목록 불러오기
  useEffect(() => {
    fetch("/api/ad/dashboard")
      .then((r) => r.json())
      .then((data) => {
        const bisList = (data.businesses || []).map(
          (b: { id: string; name: string; category: string }) => ({
            id: b.id,
            name: b.name,
            category: b.category,
          })
        );
        setBusinesses(bisList);
        if (bisList.length > 0) setSelectedBiz(bisList[0].id);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const selectedBusiness = businesses.find((b) => b.id === selectedBiz);
  const category = selectedBusiness?.category || "";

  // 가격 계산
  const getMonthlyPrice = (): number => {
    if (adType === "BASIC" || adType === "PREMIUM") {
      const prices = AD_PRICES[category];
      if (!prices) return 0;
      return adType === "BASIC" ? prices.basic : prices.premium;
    }
    return EXTRA_PRICES[adType as keyof typeof EXTRA_PRICES] || 0;
  };

  const monthlyPrice = getMonthlyPrice();
  const originalTotal = monthlyPrice * months;
  const discountRate = DISCOUNT_RATES[months] || 0;
  const discountAmount = Math.round(originalTotal * discountRate);
  const totalAmount = originalTotal - discountAmount;

  const handleCheckout = async () => {
    if (!selectedBiz) {
      setError("업체를 선택해주세요.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/ad/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: selectedBiz,
          adType,
          months,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        return;
      }

      // 토스 SDK 결제 요청
      if (typeof window !== "undefined" && window.TossPayments) {
        const tossPayments = window.TossPayments(
          process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || ""
        );
        await tossPayments.requestPayment("카드", {
          amount: data.amount,
          orderId: data.orderId,
          orderName: data.orderName,
          customerKey: data.customerKey,
          successUrl: `${window.location.origin}/ad/payments/success?businessId=${selectedBiz}`,
          failUrl: `${window.location.origin}/ad/payments/fail`,
        });
      } else {
        // 토스 SDK 미로드 시 — 개발 환경에서 직접 confirm
        router.push(
          `/ad/payments/success?paymentKey=test_${Date.now()}&orderId=${data.orderId}&amount=${data.amount}&businessId=${selectedBiz}`
        );
      }
    } catch {
      setError("결제 처리 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-16 text-gray-500">로딩 중...</div>;
  }

  if (businesses.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-bold">광고 결제</h1>
        <div className="card text-center py-12">
          <p className="text-gray-400">등록된 업체가 없습니다.</p>
          <p className="text-xs text-gray-500 mt-2">
            업체를 먼저 등록한 후 광고 결제를 진행해주세요.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">광고 결제</h1>

      {error && (
        <p className="text-urgent text-sm text-center bg-urgent/10 py-2 rounded-lg">
          {error}
        </p>
      )}

      {/* 1. 업체 선택 */}
      <div className="card">
        <h2 className="font-bold text-sm mb-3">1. 업체 선택</h2>
        <div className="space-y-2">
          {businesses.map((biz) => (
            <button
              key={biz.id}
              onClick={() => setSelectedBiz(biz.id)}
              className={`w-full text-left p-3 rounded-xl border transition-all ${
                selectedBiz === biz.id
                  ? "border-secondary bg-secondary/10"
                  : "border-dark-border hover:border-gray-500"
              }`}
            >
              <p className="font-medium text-sm">{biz.name}</p>
              <p className="text-xs text-gray-500">
                {BIZ_CAT_LABEL[biz.category] || biz.category}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* 2. 광고 상품 선택 */}
      <div className="card">
        <h2 className="font-bold text-sm mb-3">2. 광고 상품</h2>

        <div className="space-y-4">
          {/* 기본/프리미엄 */}
          <div>
            <p className="text-xs text-gray-400 mb-2">업체 디렉토리 광고</p>
            <div className="grid grid-cols-2 gap-2">
              <ProductCard
                selected={adType === "BASIC"}
                onClick={() => setAdType("BASIC")}
                title="기본 광고"
                price={AD_PRICES[category]?.basic || 0}
                desc="카테고리 목록 노출"
              />
              <ProductCard
                selected={adType === "PREMIUM"}
                onClick={() => setAdType("PREMIUM")}
                title="프리미엄 광고"
                price={AD_PRICES[category]?.premium || 0}
                desc="상단 고정 + 추천 뱃지"
                badge="추천"
              />
            </div>
          </div>

          {/* 추가 광고 */}
          <div>
            <p className="text-xs text-gray-400 mb-2">추가 광고 상품</p>
            <div className="grid grid-cols-1 gap-2">
              <ProductCard
                selected={adType === "MAIN_BANNER"}
                onClick={() => setAdType("MAIN_BANNER")}
                title="메인 배너"
                price={EXTRA_PRICES.MAIN_BANNER}
                desc="홈 최상단 슬라이더"
              />
              <ProductCard
                selected={adType === "JOB_PAGE_BANNER"}
                onClick={() => setAdType("JOB_PAGE_BANNER")}
                title="구인 페이지 배너"
                price={EXTRA_PRICES.JOB_PAGE_BANNER}
                desc="구인 목록 상단"
              />
              <ProductCard
                selected={adType === "POPUP"}
                onClick={() => setAdType("POPUP")}
                title="팝업 광고"
                price={EXTRA_PRICES.POPUP}
                desc="사이트 접속 시 1일 1회"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. 결제 기간 */}
      <div className="card">
        <h2 className="font-bold text-sm mb-3">3. 결제 기간</h2>
        <div className="grid grid-cols-3 gap-2">
          {[
            { m: 1, label: "1개월", discount: null },
            { m: 2, label: "2개월", discount: "10% 할인" },
            { m: 3, label: "3개월", discount: "20% 할인" },
          ].map((opt) => (
            <button
              key={opt.m}
              onClick={() => setMonths(opt.m)}
              className={`p-3 rounded-xl border text-center transition-all ${
                months === opt.m
                  ? "border-secondary bg-secondary/10"
                  : "border-dark-border hover:border-gray-500"
              }`}
            >
              <p className="font-bold text-sm">{opt.label}</p>
              {opt.discount && (
                <p className="text-xs text-premium-gold mt-0.5">{opt.discount}</p>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 결제 요약 */}
      <div className="card border-secondary/20">
        <h2 className="font-bold text-sm mb-3">결제 요약</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">업체</span>
            <span>{selectedBusiness?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">상품</span>
            <span>
              {adType === "BASIC"
                ? "기본 광고"
                : adType === "PREMIUM"
                ? "프리미엄 광고"
                : adType === "MAIN_BANNER"
                ? "메인 배너"
                : adType === "JOB_PAGE_BANNER"
                ? "구인 페이지 배너"
                : "팝업 광고"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">월 요금</span>
            <span>₩{monthlyPrice.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">기간</span>
            <span>{months}개월</span>
          </div>
          {discountAmount > 0 && (
            <>
              <div className="flex justify-between text-gray-500">
                <span>정가</span>
                <span className="line-through">₩{originalTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-premium-gold">
                <span>할인 ({Math.round(discountRate * 100)}%)</span>
                <span>-₩{discountAmount.toLocaleString()}</span>
              </div>
            </>
          )}
          <div className="border-t border-dark-border pt-2 flex justify-between font-bold text-base">
            <span>결제 금액</span>
            <span className="text-secondary">₩{totalAmount.toLocaleString()}</span>
          </div>
        </div>

        <button
          onClick={handleCheckout}
          disabled={isSubmitting || totalAmount === 0}
          className="w-full btn-primary py-3 mt-4 disabled:opacity-50"
        >
          {isSubmitting ? "처리 중..." : `₩${totalAmount.toLocaleString()} 결제하기`}
        </button>

        <p className="text-xs text-gray-600 text-center mt-2">
          구직글 열람 자동 포함 &middot; VAT 포함 금액
        </p>
      </div>
    </div>
  );
}

function ProductCard({
  selected,
  onClick,
  title,
  price,
  desc,
  badge,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  price: number;
  desc: string;
  badge?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`p-3 rounded-xl border text-left transition-all ${
        selected
          ? "border-secondary bg-secondary/10"
          : "border-dark-border hover:border-gray-500"
      }`}
    >
      <div className="flex items-center gap-1.5">
        <span className="font-medium text-sm">{title}</span>
        {badge && (
          <span className="text-xs text-premium-gold bg-premium-gold/10 px-1.5 py-0.5 rounded">
            {badge}
          </span>
        )}
      </div>
      <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
      <p className="text-sm font-bold text-secondary mt-1">
        ₩{price.toLocaleString()}/월
      </p>
    </button>
  );
}

// 토스 SDK 타입
declare global {
  interface Window {
    TossPayments?: (clientKey: string) => {
      requestPayment: (
        method: string,
        params: {
          amount: number;
          orderId: string;
          orderName: string;
          customerKey: string;
          successUrl: string;
          failUrl: string;
        }
      ) => Promise<void>;
    };
  }
}
