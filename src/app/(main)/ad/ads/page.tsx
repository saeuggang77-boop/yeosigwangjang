"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { BIZ_CATEGORIES } from "@/lib/constants";

const BIZ_CAT_LABEL: Record<string, string> = Object.fromEntries(
  BIZ_CATEGORIES.map((c) => [c.enum, c.label])
);

const AD_TYPE_LABELS: Record<string, string> = {
  BASIC: "기본 광고",
  PREMIUM: "프리미엄 광고",
  MAIN_BANNER: "메인 배너",
  JOB_PAGE_BANNER: "구인 페이지 배너",
  POPUP: "팝업 광고",
};

interface AdItem {
  id: string;
  type: string;
  bannerImage: string | null;
  bannerLink: string | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isExpired: boolean;
  business: { id: string; name: string; category: string };
  payment: { amount: number; months: number; status: string } | null;
}

export default function AdAdsPage() {
  const [ads, setAds] = useState<AdItem[]>([]);
  const [filter, setFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  const fetchAds = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/ad/ads?status=${filter}`);
      const data = await res.json();
      setAds(data.ads || []);
    } catch {
      setAds([]);
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  const activeCount = ads.filter((a) => a.isActive && !a.isExpired).length;
  const expiredCount = ads.filter((a) => !a.isActive || a.isExpired).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">광고 관리</h1>
        <Link href="/ad/payments/checkout" className="text-xs text-secondary hover:underline">
          새 광고 결제 &rarr;
        </Link>
      </div>

      {/* 요약 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card text-center">
          <p className="text-xs text-gray-500">활성 광고</p>
          <p className="text-lg font-bold text-success mt-1">{activeCount}건</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-500">만료 광고</p>
          <p className="text-lg font-bold text-gray-400 mt-1">{expiredCount}건</p>
        </div>
      </div>

      {/* 필터 */}
      <div className="flex gap-2">
        {[
          { key: "all", label: "전체" },
          { key: "active", label: "활성" },
          { key: "expired", label: "만료" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
              filter === f.key
                ? "bg-secondary/20 text-secondary"
                : "bg-dark-card text-gray-500 hover:text-white"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* 광고 목록 */}
      {isLoading ? (
        <div className="text-center py-16 text-gray-500">로딩 중...</div>
      ) : ads.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400">광고가 없습니다.</p>
          <Link href="/ad/payments/checkout" className="text-xs text-secondary hover:underline mt-2 inline-block">
            첫 광고 시작하기
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {ads.map((ad) => {
            const isRunning = ad.isActive && !ad.isExpired;
            const daysLeft = Math.ceil(
              (new Date(ad.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            );

            return (
              <div key={ad.id} className="card">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm">
                        {AD_TYPE_LABELS[ad.type] || ad.type}
                      </span>
                      {isRunning ? (
                        <span className="text-xs text-success bg-success/10 px-2 py-0.5 rounded">
                          활성
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 bg-gray-700 px-2 py-0.5 rounded">
                          만료
                        </span>
                      )}
                      {ad.type === "PREMIUM" && (
                        <span className="text-xs text-premium-gold bg-premium-gold/10 px-1.5 py-0.5 rounded">
                          프리미엄
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-gray-500 mt-1">
                      {ad.business.name} &middot;{" "}
                      {BIZ_CAT_LABEL[ad.business.category] || ad.business.category}
                    </p>

                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(ad.startDate).toLocaleDateString("ko-KR")} ~{" "}
                      {new Date(ad.endDate).toLocaleDateString("ko-KR")}
                      {isRunning && daysLeft > 0 && (
                        <span className={`ml-1 ${daysLeft <= 7 ? "text-accent" : "text-gray-400"}`}>
                          ({daysLeft}일 남음)
                        </span>
                      )}
                    </p>

                    {ad.payment && (
                      <p className="text-xs text-gray-600 mt-0.5">
                        ₩{ad.payment.amount.toLocaleString()}
                        {ad.payment.months > 1 && ` (${ad.payment.months}개월)`}
                      </p>
                    )}
                  </div>

                  {isRunning && daysLeft <= 7 && (
                    <Link
                      href="/ad/payments/checkout"
                      className="text-xs text-accent hover:text-white px-3 py-1 rounded border border-accent/30 hover:border-accent hover:bg-accent/10 transition-colors shrink-0"
                    >
                      연장
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
