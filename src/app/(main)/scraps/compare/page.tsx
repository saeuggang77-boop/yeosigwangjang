"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

interface CompareJob {
  id: string;
  type: string;
  tier: string;
  title: string;
  bizName: string | null;
  region: string;
  subRegion: string | null;
  bizType: string;
  salary: string | null;
  workHours: string | null;
  requirements: string | null;
  benefits: string[];
  description: string;
  contactType: string;
  isUrgent: boolean;
  viewCount: number;
  scrapCount: number;
  createdAt: string;
}

const COMPARE_ROWS: { label: string; key: string }[] = [
  { label: "업소명", key: "bizName" },
  { label: "지역", key: "region" },
  { label: "업종", key: "bizType" },
  { label: "급여", key: "salary" },
  { label: "근무시간", key: "workHours" },
  { label: "우대조건", key: "requirements" },
  { label: "등급", key: "tier" },
  { label: "긴급", key: "isUrgent" },
  { label: "복리후생", key: "benefits" },
  { label: "조회수", key: "viewCount" },
  { label: "스크랩수", key: "scrapCount" },
];

function formatCell(job: CompareJob, key: string): React.ReactNode {
  switch (key) {
    case "bizName":
      return job.bizName || "-";
    case "region":
      return `${job.region}${job.subRegion ? ` ${job.subRegion}` : ""}`;
    case "bizType":
      return job.bizType;
    case "salary":
      return job.salary || "-";
    case "workHours":
      return job.workHours || "-";
    case "requirements":
      return job.requirements || "-";
    case "tier":
      if (job.tier === "PREMIUM")
        return <span className="text-premium-gold font-medium">프리미엄</span>;
      if (job.tier === "BASIC")
        return <span className="text-secondary font-medium">기본</span>;
      return <span className="text-gray-500">라이트</span>;
    case "isUrgent":
      return job.isUrgent ? (
        <span className="text-urgent font-medium">긴급</span>
      ) : (
        "-"
      );
    case "benefits":
      if (job.benefits.length === 0) return "-";
      return (
        <div className="flex flex-wrap gap-1">
          {job.benefits.map((b, i) => (
            <span
              key={i}
              className="px-1.5 py-0.5 bg-dark-card rounded text-[10px] text-gray-400"
            >
              {b}
            </span>
          ))}
        </div>
      );
    case "viewCount":
      return job.viewCount.toLocaleString();
    case "scrapCount":
      return job.scrapCount.toLocaleString();
    default:
      return "-";
  }
}

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="max-w-5xl mx-auto px-4 py-10 text-center text-gray-400">로딩 중...</div>}>
      <CompareContent />
    </Suspense>
  );
}

function CompareContent() {
  const searchParams = useSearchParams();
  const [jobs, setJobs] = useState<CompareJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ids = searchParams.get("ids") || "";
    if (!ids) {
      setError("비교할 구인글을 선택해주세요.");
      setIsLoading(false);
      return;
    }

    (async () => {
      try {
        const res = await fetch(`/api/jobs/compare?ids=${ids}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "조회 중 오류가 발생했습니다.");
        } else {
          setJobs(data.jobs || []);
        }
      } catch {
        setError("조회 중 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [searchParams]);

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="text-center py-16 text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (error || jobs.length < 2) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="text-center py-16">
          <p className="text-gray-400 mb-4">
            {error || "비교 가능한 구인글이 부족합니다."}
          </p>
          <Link href="/scraps" className="btn-primary text-sm">
            스크랩 목록으로
          </Link>
        </div>
      </div>
    );
  }

  const colCount = jobs.length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">구인글 비교</h1>
        <Link
          href="/scraps"
          className="text-sm text-gray-400 hover:text-primary-light"
        >
          스크랩 목록
        </Link>
      </div>

      {/* 비교 테이블 */}
      <div className="overflow-x-auto snap-x scrollbar-hide -mx-4 px-4">
        <table className="w-full min-w-[600px] border-collapse">
          {/* 헤더: 구인글 제목 */}
          <thead>
            <tr>
              <th className="w-24 sm:w-32" />
              {jobs.map((job) => (
                <th
                  key={job.id}
                  className={`p-3 text-left align-top snap-start ${
                    colCount === 2 ? "w-1/2" : "w-1/3"
                  }`}
                >
                  <div
                    className={`card ${
                      job.tier === "PREMIUM"
                        ? "border-premium-border"
                        : job.isUrgent
                          ? "border-urgent"
                          : ""
                    }`}
                  >
                    <Link
                      href={`/jobs/${job.id}`}
                      className="font-bold text-sm hover:text-primary-light transition-colors line-clamp-2"
                    >
                      {job.title}
                    </Link>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(job.createdAt).toLocaleDateString("ko-KR")}
                    </p>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* 비교 행 */}
          <tbody>
            {COMPARE_ROWS.map((row) => (
              <tr key={row.key} className="border-t border-dark-border">
                <td className="py-3 px-2 text-xs text-gray-500 font-medium align-top whitespace-nowrap">
                  {row.label}
                </td>
                {jobs.map((job) => (
                  <td key={job.id} className="py-3 px-3 text-sm align-top">
                    {formatCell(job, row.key)}
                  </td>
                ))}
              </tr>
            ))}

            {/* 상세 설명 미리보기 */}
            <tr className="border-t border-dark-border">
              <td className="py-3 px-2 text-xs text-gray-500 font-medium align-top whitespace-nowrap">
                상세설명
              </td>
              {jobs.map((job) => (
                <td key={job.id} className="py-3 px-3 text-sm align-top">
                  <p className="text-gray-400 text-xs line-clamp-4 whitespace-pre-wrap">
                    {job.description.slice(0, 200)}
                    {job.description.length > 200 && "..."}
                  </p>
                  <Link
                    href={`/jobs/${job.id}`}
                    className="text-xs text-primary-light hover:underline mt-1 inline-block"
                  >
                    상세보기
                  </Link>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* 하단 */}
      <div className="flex justify-center">
        <Link
          href="/scraps"
          className="btn-outline text-sm py-2 px-6"
        >
          스크랩 목록으로
        </Link>
      </div>
    </div>
  );
}
