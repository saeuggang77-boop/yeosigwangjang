"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface CategoryItem {
  key: string;
  label: string;
  icon: string;
  count: number;
}

export default function DirectoryPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/directory")
      .then((r) => r.json())
      .then((data) => setCategories(data.categories || []))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">업체 디렉토리</h1>
        <p className="text-sm text-gray-400">
          여시들을 위한 성형·뷰티·생활 업체 모음
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-gray-500">로딩 중...</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.key}
              href={`/directory/${cat.key}`}
              className="card group hover:border-primary/50 transition-all text-center py-8"
            >
              <span className="text-3xl block mb-3">{cat.icon}</span>
              <p className="font-bold text-sm group-hover:text-primary-light transition-colors">
                {cat.label}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {cat.count}개 업체
              </p>
            </Link>
          ))}
        </div>
      )}

      {/* 입점 안내 */}
      <div className="mt-12 card text-center">
        <p className="text-sm text-gray-400 mb-3">
          업체 입점을 원하시나요?
        </p>
        <Link
          href="/ad-inquiry"
          className="btn-primary text-sm py-2.5 px-6 inline-block"
        >
          입점/광고 문의
        </Link>
      </div>
    </div>
  );
}
