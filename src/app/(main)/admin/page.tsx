"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface AdminStats {
  pendingUsers: number;
  pendingAdUsers: number;
  pendingReports: number;
  activeJobs: number;
  totalUsers: number;
  totalCafePosts: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        // 병렬 fetch
        const [usersRes, adUsersRes, reportsRes, jobsRes, cafeRes] =
          await Promise.all([
            fetch("/api/admin/users?type=user&filter=pending").then((r) =>
              r.json()
            ),
            fetch("/api/admin/users?type=ad&filter=pending").then((r) =>
              r.json()
            ),
            fetch("/api/admin/reports?status=PENDING").then((r) => r.json()),
            fetch("/api/admin/jobs?status=active").then((r) => r.json()),
            fetch("/api/admin/cafe-posts").then((r) => r.json()),
          ]);

        setStats({
          pendingUsers: usersRes.pagination?.total || 0,
          pendingAdUsers: adUsersRes.pagination?.total || 0,
          pendingReports: reportsRes.pagination?.total || 0,
          activeJobs: jobsRes.pagination?.total || 0,
          totalUsers: usersRes.pagination?.total || 0,
          totalCafePosts: cafeRes.pagination?.total || 0,
        });
      } catch {
        // 에러 시 빈 통계
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (isLoading) {
    return <div className="text-center py-20 text-gray-500">로딩 중...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">관리자 대시보드</h1>

      {/* 긴급 처리 필요 */}
      {stats && (stats.pendingReports > 0 || stats.pendingAdUsers > 0) && (
        <div className="card border-urgent/30 bg-urgent/5">
          <h2 className="font-bold text-sm text-urgent mb-3">
            처리 대기중
          </h2>
          <div className="space-y-2">
            {stats.pendingReports > 0 && (
              <Link
                href="/admin/reports"
                className="flex items-center justify-between p-3 rounded-lg bg-dark-bg hover:bg-dark-card transition-colors"
              >
                <span className="text-sm text-gray-300">미처리 신고</span>
                <span className="text-sm font-bold text-urgent">
                  {stats.pendingReports}건
                </span>
              </Link>
            )}
            {stats.pendingAdUsers > 0 && (
              <Link
                href="/admin/users?type=ad&filter=pending"
                className="flex items-center justify-between p-3 rounded-lg bg-dark-bg hover:bg-dark-card transition-colors"
              >
                <span className="text-sm text-gray-300">
                  광고업체 승인 대기
                </span>
                <span className="text-sm font-bold text-accent">
                  {stats.pendingAdUsers}건
                </span>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* 통계 그리드 */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Link href="/admin/users?filter=pending" className="card hover:border-primary/50 transition-colors">
          <p className="text-xs text-gray-500 mb-1">준회원 (승인 대기)</p>
          <p className="text-2xl font-bold">
            {stats?.pendingUsers || 0}
            <span className="text-sm text-gray-400 ml-1">명</span>
          </p>
        </Link>

        <Link href="/admin/users?type=ad&filter=pending" className="card hover:border-primary/50 transition-colors">
          <p className="text-xs text-gray-500 mb-1">광고업체 승인 대기</p>
          <p className="text-2xl font-bold">
            {stats?.pendingAdUsers || 0}
            <span className="text-sm text-gray-400 ml-1">건</span>
          </p>
        </Link>

        <Link href="/admin/reports" className="card hover:border-primary/50 transition-colors">
          <p className="text-xs text-gray-500 mb-1">미처리 신고</p>
          <p className="text-2xl font-bold text-urgent">
            {stats?.pendingReports || 0}
            <span className="text-sm text-gray-400 ml-1">건</span>
          </p>
        </Link>

        <Link href="/admin/jobs" className="card hover:border-primary/50 transition-colors">
          <p className="text-xs text-gray-500 mb-1">활성 구인글</p>
          <p className="text-2xl font-bold">
            {stats?.activeJobs || 0}
            <span className="text-sm text-gray-400 ml-1">건</span>
          </p>
        </Link>

        <Link href="/admin/cafe-posts" className="card hover:border-primary/50 transition-colors">
          <p className="text-xs text-gray-500 mb-1">카페 인기글</p>
          <p className="text-2xl font-bold">
            {stats?.totalCafePosts || 0}
            <span className="text-sm text-gray-400 ml-1">건</span>
          </p>
        </Link>
      </div>

      {/* 빠른 링크 */}
      <div className="card">
        <h2 className="font-bold text-sm text-gray-300 mb-3">빠른 작업</h2>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/users?filter=pending"
            className="btn-outline text-xs py-2 px-3"
          >
            회원 승인
          </Link>
          <Link
            href="/admin/cafe-posts"
            className="btn-outline text-xs py-2 px-3"
          >
            카페 인기글 등록
          </Link>
          <Link href="/jobs/write" className="btn-outline text-xs py-2 px-3">
            구인글 등록
          </Link>
        </div>
      </div>
    </div>
  );
}
