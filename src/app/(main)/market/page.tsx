"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";

const CATEGORIES = [
  { key: "ALL", label: "전체" },
  { key: "CLOTHING", label: "의상" },
  { key: "BAG", label: "가방" },
  { key: "SHOES", label: "신발" },
  { key: "ACCESSORY", label: "소품" },
  { key: "ETC", label: "기타" },
];

const SORT_OPTIONS = [
  { key: "latest", label: "최신순" },
  { key: "price_asc", label: "가격 낮은순" },
  { key: "price_desc", label: "가격 높은순" },
];

interface MarketListItem {
  id: string;
  title: string;
  price: number;
  category: string;
  images: string[];
  isSoldOut: boolean;
  viewCount: number;
  createdAt: string;
  author: { nickname: string };
}

export default function MarketPage() {
  const { data: session } = useSession();
  const [items, setItems] = useState<MarketListItem[]>([]);
  const [category, setCategory] = useState("ALL");
  const [sort, setSort] = useState("latest");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        category,
        sort,
        page: page.toString(),
      });
      if (search) params.set("search", search);

      const res = await fetch(`/api/market?${params}`);
      const data = await res.json();
      setItems(data.items || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch {
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [category, sort, search, page]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const canWrite =
    session?.user.userType === "USER" &&
    (session.user.grade === "REGULAR" || session.user.role === "ADMIN");

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">중고장터</h1>
        {canWrite ? (
          <Link
            href="/market/write"
            className="btn-primary text-sm py-2 px-4"
          >
            글쓰기
          </Link>
        ) : session ? (
          <span className="text-xs text-gray-500">정회원만 작성 가능</span>
        ) : (
          <Link
            href="/auth/login"
            className="text-sm text-primary-light hover:underline"
          >
            로그인 후 글쓰기
          </Link>
        )}
      </div>

      {/* 카테고리 필터 */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => {
              setCategory(c.key);
              setPage(1);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              category === c.key
                ? "bg-primary text-white"
                : "bg-dark-card text-gray-400 hover:text-white"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* 검색 + 정렬 */}
      <div className="flex gap-3 flex-wrap items-center">
        <form onSubmit={handleSearch} className="flex-1 min-w-[200px]">
          <div className="flex items-center bg-dark-card border border-dark-border rounded-lg px-3 py-2">
            <svg
              className="w-4 h-4 text-gray-500 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="검색어를 입력하세요"
              className="bg-transparent text-sm text-white placeholder-gray-500 ml-2 w-full outline-none"
            />
          </div>
        </form>
        <select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value);
            setPage(1);
          }}
          className="bg-dark-card border border-dark-border rounded-lg px-3 py-2 text-sm text-gray-300 outline-none"
        >
          {SORT_OPTIONS.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* 목록 */}
      {isLoading ? (
        <div className="text-center py-16 text-gray-500">로딩 중...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 mb-4">등록된 매물이 없습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/market/${item.id}`}
              className="group"
            >
              <div className="card p-0 overflow-hidden hover:border-primary/30 transition-colors">
                {/* 썸네일 */}
                <div className="relative aspect-square bg-dark-card">
                  {item.images.length > 0 ? (
                    <Image
                      src={item.images[0]}
                      alt={item.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600">
                      <svg
                        className="w-12 h-12"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}
                  {item.isSoldOut && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="text-sm font-bold text-gray-300 border border-gray-400 px-3 py-1 rounded">
                        판매완료
                      </span>
                    </div>
                  )}
                </div>
                {/* 정보 */}
                <div className="p-3">
                  <p className="text-sm font-medium truncate group-hover:text-primary-light transition-colors">
                    {item.title}
                  </p>
                  <p className="text-base font-bold text-primary mt-1">
                    {item.price === 0
                      ? "나눔"
                      : `₩${item.price.toLocaleString()}`}
                  </p>
                  <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                    <span>{item.author.nickname}</span>
                    <span>조회 {item.viewCount}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
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
