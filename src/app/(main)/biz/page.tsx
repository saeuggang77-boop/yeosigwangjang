"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatPriceWithUnit } from "@/lib/pricing";

interface DashboardData {
  profile: {
    bizName: string;
    region: string;
    isVerifiedBiz: boolean;
    createdAt: string;
  };
  stats: {
    activeJobs: number;
    urgentJobs: number;
    premiumJobs: number;
    totalViews: number;
    totalContactClicks: number;
    totalSpent: number;
  };
  seekAccess: {
    hasAccess: boolean;
    expiresAt: string | null;
  };
}

export default function BizDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/biz/dashboard")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return <div className="text-center py-20 text-gray-500">로딩 중...</div>;
  }

  if (!data) {
    return (
      <div className="text-center py-20 text-gray-500">
        데이터를 불러올 수 없습니다.
      </div>
    );
  }

  const { profile, stats, seekAccess } = data;

  return (
    <div className="space-y-6">
      {/* 환영 메시지 */}
      <div>
        <h1 className="text-2xl font-bold">
          {profile.bizName}
          {profile.isVerifiedBiz && (
            <span className="ml-2 badge-verified text-xs">인증업소</span>
          )}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {profile.region} &middot; 가입일{" "}
          {new Date(profile.createdAt).toLocaleDateString("ko-KR")}
        </p>
      </div>

      {/* 통계 카드 그리드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="활성 구인글" value={stats.activeJobs} unit="건" />
        <StatCard label="총 조회수" value={stats.totalViews} unit="회" />
        <StatCard
          label="연락처 클릭"
          value={stats.totalContactClicks}
          unit="회"
        />
        <StatCard
          label="총 결제액"
          value={formatPriceWithUnit(stats.totalSpent)}
        />
      </div>

      {/* 빠른 액션 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* 구인글 현황 */}
        <div className="card">
          <h2 className="font-bold text-sm text-gray-300 mb-3">구인글 현황</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">활성 구인글</span>
              <span className="font-medium">{stats.activeJobs}건</span>
            </div>
            {stats.urgentJobs > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-400">긴급 구인</span>
                <span className="font-medium text-urgent">
                  {stats.urgentJobs}건
                </span>
              </div>
            )}
            {stats.premiumJobs > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-400">프리미엄</span>
                <span className="font-medium text-premium-gold">
                  {stats.premiumJobs}건
                </span>
              </div>
            )}
          </div>
          <div className="flex gap-2 mt-4">
            <Link href="/jobs/write" className="btn-primary text-xs py-2 px-3">
              새 구인글 등록
            </Link>
            <Link
              href="/biz/jobs"
              className="btn-outline text-xs py-2 px-3"
            >
              전체 관리
            </Link>
          </div>
        </div>

        {/* 열람권 상태 */}
        <div className="card">
          <h2 className="font-bold text-sm text-gray-300 mb-3">
            구직글 열람권
          </h2>
          {seekAccess.hasAccess ? (
            <>
              <div className="flex items-center gap-2 mb-2">
                <span className="badge-verified">이용중</span>
                <span className="text-sm text-gray-300">열람권 활성</span>
              </div>
              {seekAccess.expiresAt && (
                <p className="text-xs text-gray-500">
                  만료일:{" "}
                  {new Date(seekAccess.expiresAt).toLocaleDateString("ko-KR")}
                </p>
              )}
              <Link
                href="/seek-access"
                className="btn-outline text-xs py-2 px-3 mt-4 inline-block"
              >
                기간 연장
              </Link>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-400 mb-2">
                구직글 연락처를 확인하려면 열람권이 필요합니다.
              </p>
              <Link
                href="/seek-access"
                className="btn-primary text-xs py-2 px-3 mt-2 inline-block"
              >
                열람권 구매
              </Link>
            </>
          )}
        </div>
      </div>

      {/* 최근 결제 요약 */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-sm text-gray-300">최근 결제</h2>
          <Link href="/biz/payments" className="text-xs text-primary-light">
            전체보기
          </Link>
        </div>
        <p className="text-sm text-gray-400">
          누적 결제: <span className="text-secondary font-bold">{formatPriceWithUnit(stats.totalSpent)}</span>
        </p>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  unit,
}: {
  label: string;
  value: number | string;
  unit?: string;
}) {
  return (
    <div className="card text-center">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-xl font-bold">
        {typeof value === "number" ? value.toLocaleString() : value}
        {unit && <span className="text-sm text-gray-400 ml-0.5">{unit}</span>}
      </p>
    </div>
  );
}
