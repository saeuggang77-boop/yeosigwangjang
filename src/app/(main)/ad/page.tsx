"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BIZ_CATEGORIES } from "@/lib/constants";

const BIZ_CAT_LABEL: Record<string, string> = Object.fromEntries(
  BIZ_CATEGORIES.map((c) => [c.enum, c.label])
);

interface DashboardData {
  profile: {
    email: string;
    representName: string;
    bizRegNumber: string;
    bizCategory: string;
    phone: string;
    isApproved: boolean;
    createdAt: string;
  };
  stats: {
    totalBusinesses: number;
    activeAds: number;
    activeEvents: number;
    totalViews: number;
    totalPhoneClicks: number;
    totalKakaoClicks: number;
    totalClicks: number;
    totalSpent: number;
  };
  businesses: {
    id: string;
    name: string;
    slug: string;
    category: string;
    isApproved: boolean;
    isPremium: boolean;
    viewCount: number;
    phoneClickCount: number;
    kakaoClickCount: number;
    activeAds: number;
    activeEvents: number;
    ads: { id: string; type: string; startDate: string; endDate: string }[];
  }[];
}

export default function AdDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/ad/dashboard")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return <div className="text-center py-16 text-gray-500">로딩 중...</div>;
  }

  if (!data) {
    return <div className="text-center py-16 text-gray-400">데이터를 불러올 수 없습니다.</div>;
  }

  const { profile, stats, businesses } = data;

  // 만료 임박 광고 (7일 이내)
  const expiringAds = businesses.flatMap((biz) =>
    biz.ads
      .filter((ad) => {
        const daysLeft = Math.ceil(
          (new Date(ad.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        return daysLeft <= 7 && daysLeft > 0;
      })
      .map((ad) => ({ ...ad, bizName: biz.name }))
  );

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">광고 업체 대시보드</h1>

      {/* 프로필 카드 */}
      <div className="card">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-bold">{profile.representName}</p>
            <p className="text-xs text-gray-500 mt-1">
              {profile.email} &middot; {profile.bizRegNumber}
            </p>
            <p className="text-xs text-gray-500">
              {BIZ_CAT_LABEL[profile.bizCategory] || profile.bizCategory} &middot; {profile.phone}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {profile.isApproved ? (
              <span className="badge-verified text-xs">승인됨</span>
            ) : (
              <span className="text-xs text-accent bg-accent/10 px-2 py-0.5 rounded">승인 대기</span>
            )}
            <Link href="/ad/settings" className="text-xs text-gray-400 hover:text-white">
              수정
            </Link>
          </div>
        </div>
      </div>

      {!profile.isApproved && (
        <div className="bg-accent/10 border border-accent/20 rounded-xl p-4">
          <p className="text-sm text-accent font-medium">관리자 승인 대기 중</p>
          <p className="text-xs text-gray-400 mt-1">
            승인 완료 후 광고 결제 및 업체 등록이 가능합니다. 보통 1~2 영업일 내 처리됩니다.
          </p>
        </div>
      )}

      {/* 만료 임박 알림 */}
      {expiringAds.length > 0 && (
        <div className="bg-accent/10 border border-accent/20 rounded-xl p-4">
          <p className="text-sm text-accent font-medium mb-2">만료 임박 광고</p>
          {expiringAds.map((ad) => {
            const daysLeft = Math.ceil(
              (new Date(ad.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            );
            return (
              <p key={ad.id} className="text-xs text-gray-400">
                {ad.bizName} - {ad.type === "PREMIUM" ? "프리미엄" : ad.type === "BASIC" ? "기본" : ad.type}
                {" "}광고 ({daysLeft}일 남음)
              </p>
            );
          })}
          <Link href="/ad/payments/checkout" className="text-xs text-accent hover:underline mt-2 inline-block">
            광고 연장하기 &rarr;
          </Link>
        </div>
      )}

      {/* 통계 카드 - 2행 */}
      <div className="space-y-3">
        {/* 1행: 핵심 지표 */}
        <div className="grid grid-cols-3 gap-3">
          <div className="card text-center">
            <p className="text-xs text-gray-500">총 조회수</p>
            <p className="text-xl font-bold text-secondary mt-1">
              {stats.totalViews.toLocaleString()}
            </p>
          </div>
          <div className="card text-center">
            <p className="text-xs text-gray-500">전화 클릭</p>
            <p className="text-xl font-bold text-success mt-1">
              {stats.totalPhoneClicks.toLocaleString()}
            </p>
          </div>
          <div className="card text-center">
            <p className="text-xs text-gray-500">카카오 클릭</p>
            <p className="text-xl font-bold text-premium-gold mt-1">
              {stats.totalKakaoClicks.toLocaleString()}
            </p>
          </div>
        </div>

        {/* 2행: 부가 지표 */}
        <div className="grid grid-cols-4 gap-3">
          <div className="card text-center">
            <p className="text-xs text-gray-500">등록 업체</p>
            <p className="text-lg font-bold mt-1">
              {stats.totalBusinesses}<span className="text-xs text-gray-400 ml-0.5">개</span>
            </p>
          </div>
          <div className="card text-center">
            <p className="text-xs text-gray-500">활성 광고</p>
            <p className="text-lg font-bold mt-1">
              {stats.activeAds}<span className="text-xs text-gray-400 ml-0.5">건</span>
            </p>
          </div>
          <div className="card text-center">
            <p className="text-xs text-gray-500">진행 이벤트</p>
            <p className="text-lg font-bold mt-1">
              {stats.activeEvents}<span className="text-xs text-gray-400 ml-0.5">건</span>
            </p>
          </div>
          <div className="card text-center">
            <p className="text-xs text-gray-500">총 결제</p>
            <p className="text-lg font-bold mt-1 text-sm">
              ₩{stats.totalSpent.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* 업체별 통계 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-sm">업체별 통계</h2>
          {profile.isApproved && (
            <Link href="/ad/payments/checkout" className="text-xs text-secondary hover:underline">
              광고 결제 &rarr;
            </Link>
          )}
        </div>

        {businesses.length === 0 ? (
          <div className="card text-center py-8">
            <p className="text-gray-400 text-sm">등록된 업체가 없습니다.</p>
            <p className="text-xs text-gray-500 mt-1">관리자 승인 후 업체를 등록할 수 있습니다.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {businesses.map((biz) => (
              <div key={biz.id} className="card">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm">{biz.name}</p>
                      {biz.isPremium && (
                        <span className="text-xs text-premium-gold bg-premium-gold/10 px-1.5 py-0.5 rounded">
                          프리미엄
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {BIZ_CAT_LABEL[biz.category] || biz.category}
                    </p>
                  </div>
                  <Link
                    href={`/directory/${biz.category.toLowerCase().replace("_", "-")}/${biz.slug}`}
                    className="text-xs text-gray-400 hover:text-white"
                  >
                    보기 &rarr;
                  </Link>
                </div>

                {/* 업체별 조회/클릭 통계 바 */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-dark-bg rounded-lg py-2">
                    <p className="text-xs text-gray-500">조회</p>
                    <p className="font-bold text-sm">{biz.viewCount.toLocaleString()}</p>
                  </div>
                  <div className="bg-dark-bg rounded-lg py-2">
                    <p className="text-xs text-gray-500">전화</p>
                    <p className="font-bold text-sm text-success">{biz.phoneClickCount}</p>
                  </div>
                  <div className="bg-dark-bg rounded-lg py-2">
                    <p className="text-xs text-gray-500">카카오</p>
                    <p className="font-bold text-sm text-premium-gold">{biz.kakaoClickCount}</p>
                  </div>
                </div>

                {/* 활성 광고/이벤트 */}
                <div className="flex gap-2 mt-2 flex-wrap">
                  {biz.ads.map((ad) => {
                    const daysLeft = Math.ceil(
                      (new Date(ad.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                    );
                    return (
                      <span
                        key={ad.id}
                        className={`text-xs px-2 py-0.5 rounded ${
                          daysLeft <= 7
                            ? "text-accent bg-accent/10"
                            : "text-success bg-success/10"
                        }`}
                      >
                        {ad.type === "PREMIUM" ? "프리미엄" : ad.type === "BASIC" ? "기본" : ad.type}{" "}
                        ~{new Date(ad.endDate).toLocaleDateString("ko-KR")}
                        {daysLeft <= 7 && ` (${daysLeft}일)`}
                      </span>
                    );
                  })}
                  {biz.activeEvents > 0 && (
                    <span className="text-xs text-primary-light bg-primary/10 px-2 py-0.5 rounded">
                      이벤트 {biz.activeEvents}건
                    </span>
                  )}
                  {biz.ads.length === 0 && (
                    <span className="text-xs text-gray-500">활성 광고 없음</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 빠른 액션 */}
      {profile.isApproved && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link href="/ad/payments/checkout" className="card text-center hover:border-secondary/30 transition-colors">
            <p className="text-2xl mb-1">🛒</p>
            <p className="text-sm font-medium">광고 결제</p>
          </Link>
          <Link href="/ad/ads" className="card text-center hover:border-secondary/30 transition-colors">
            <p className="text-2xl mb-1">📢</p>
            <p className="text-sm font-medium">광고 관리</p>
          </Link>
          <Link href="/ad/events" className="card text-center hover:border-secondary/30 transition-colors">
            <p className="text-2xl mb-1">🎉</p>
            <p className="text-sm font-medium">이벤트 관리</p>
          </Link>
          <Link href="/ad/payments" className="card text-center hover:border-secondary/30 transition-colors">
            <p className="text-2xl mb-1">💳</p>
            <p className="text-sm font-medium">결제 내역</p>
          </Link>
        </div>
      )}
    </div>
  );
}
