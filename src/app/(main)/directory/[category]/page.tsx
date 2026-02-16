"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { REGIONS } from "@/lib/constants";

interface BizItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  images: string[];
  region: string | null;
  subRegion: string | null;
  isPremium: boolean;
  viewCount: number;
}

interface CategoryInfo {
  key: string;
  label: string;
  icon: string;
}

export default function CategoryPage() {
  return (
    <Suspense>
      <CategoryContent />
    </Suspense>
  );
}

function CategoryContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const category = params.category as string;

  const region = searchParams.get("region") || "";
  const page = parseInt(searchParams.get("page") || "1");

  const [catInfo, setCatInfo] = useState<CategoryInfo | null>(null);
  const [businesses, setBusinesses] = useState<BizItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString() });
      if (region) params.set("region", region);

      const res = await fetch(`/api/directory/${category}?${params}`);
      if (!res.ok) {
        router.replace("/directory");
        return;
      }
      const data = await res.json();
      setCatInfo(data.category);
      setBusinesses(data.businesses || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotal(data.pagination?.total || 0);
    } catch {
      setBusinesses([]);
    } finally {
      setIsLoading(false);
    }
  }, [category, region, page, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateParam = (key: string, value: string) => {
    const p = new URLSearchParams(searchParams.toString());
    if (value) p.set(key, value);
    else p.delete(key);
    if (key !== "page") p.set("page", "1");
    router.push(`/directory/${category}?${p}`);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/directory"
          className="text-gray-500 hover:text-white transition-colors"
        >
          &larr;
        </Link>
        <div>
          <h1 className="text-2xl font-bold">
            {catInfo?.icon} {catInfo?.label || category}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{total}개 업체</p>
        </div>
      </div>

      {/* 지역 필터 */}
      <div className="mb-6">
        <select
          value={region}
          onChange={(e) => updateParam("region", e.target.value)}
          className="input-field w-auto text-sm py-2"
        >
          <option value="">전체 지역</option>
          {REGIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      {/* 목록 */}
      {isLoading ? (
        <div className="text-center py-20 text-gray-500">로딩 중...</div>
      ) : businesses.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 mb-4">등록된 업체가 없습니다.</p>
          <Link href="/ad-inquiry" className="btn-primary text-sm">
            입점 문의하기
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {businesses.map((biz) => (
            <Link
              key={biz.id}
              href={`/directory/${category}/${biz.slug}`}
              className="block"
            >
              <div
                className={`card group hover:border-primary/50 transition-all ${
                  biz.isPremium ? "border-premium-gold/30" : ""
                }`}
              >
                {/* 썸네일 */}
                {(biz.logo || biz.images.length > 0) ? (
                  <div className="w-full h-40 rounded-lg bg-dark-card mb-3 overflow-hidden">
                    <div className="w-full h-full bg-gradient-to-br from-dark-card to-dark-border flex items-center justify-center text-gray-600 text-sm">
                      {biz.logo ? "로고" : "사진"}
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-28 rounded-lg bg-dark-card mb-3 flex items-center justify-center">
                    <span className="text-3xl opacity-30">
                      {catInfo?.icon}
                    </span>
                  </div>
                )}

                {/* 정보 */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm group-hover:text-primary-light transition-colors truncate">
                        {biz.name}
                      </h3>
                      {biz.isPremium && (
                        <span className="text-xs text-premium-gold bg-premium-gold/10 px-1.5 py-0.5 rounded shrink-0">
                          PREMIUM
                        </span>
                      )}
                    </div>
                    {biz.region && (
                      <p className="text-xs text-gray-500 mt-1">
                        {biz.region}
                        {biz.subRegion && ` ${biz.subRegion}`}
                      </p>
                    )}
                    {biz.description && (
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                        {biz.description}
                      </p>
                    )}
                  </div>
                </div>

                <p className="text-xs text-gray-600 mt-2">
                  조회 {biz.viewCount.toLocaleString()}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-10">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => updateParam("page", p.toString())}
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
    </div>
  );
}
