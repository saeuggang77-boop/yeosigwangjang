"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";

const CATEGORY_LABELS: Record<string, string> = {
  CLOTHING: "의상",
  BAG: "가방",
  SHOES: "신발",
  ACCESSORY: "소품",
  ETC: "기타",
};

interface MarketDetail {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  isSoldOut: boolean;
  viewCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    nickname: string;
    profileImage: string | null;
  };
}

export default function MarketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [item, setItem] = useState<MarketDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [imageIdx, setImageIdx] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchItem = useCallback(async () => {
    try {
      const res = await fetch(`/api/market/${params.id}`);
      if (res.ok) {
        setItem(await res.json());
      }
    } catch {
      /* ignore */
    } finally {
      setIsLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchItem();
  }, [fetchItem]);

  const isOwner = session?.user.id === item?.author.id;
  const isAdmin = session?.user.role === "ADMIN";

  const handleSoldToggle = async () => {
    if (!item) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/market/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isSoldOut: !item.isSoldOut }),
      });
      if (res.ok) {
        setItem({ ...item, isSoldOut: !item.isSoldOut });
      }
    } catch {
      alert("상태 변경 중 오류가 발생했습니다.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!item || !confirm("정말 삭제하시겠습니까?")) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/market/${item.id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/market");
      } else {
        const data = await res.json();
        alert(data.error || "삭제 중 오류가 발생했습니다.");
      }
    } catch {
      alert("삭제 중 오류가 발생했습니다.");
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-20 text-gray-500">로딩 중...</div>;
  }

  if (!item) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400 mb-4">게시글을 찾을 수 없습니다.</p>
        <Link href="/market" className="text-primary-light hover:underline">
          목록으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* 뒤로가기 */}
      <Link
        href="/market"
        className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        목록
      </Link>

      {/* 이미지 갤러리 */}
      {item.images.length > 0 && (
        <div className="space-y-2">
          <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-dark-card">
            <Image
              src={item.images[imageIdx]}
              alt={`${item.title} 이미지 ${imageIdx + 1}`}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 672px"
            />
            {item.isSoldOut && (
              <div className="absolute top-3 left-3 bg-black/70 text-gray-200 text-sm font-bold px-3 py-1 rounded">
                판매완료
              </div>
            )}
            {/* 좌우 화살표 */}
            {item.images.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setImageIdx(
                      (imageIdx - 1 + item.images.length) % item.images.length
                    )
                  }
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <button
                  onClick={() =>
                    setImageIdx((imageIdx + 1) % item.images.length)
                  }
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </>
            )}
          </div>
          {/* 이미지 인디케이터 */}
          {item.images.length > 1 && (
            <div className="flex justify-center gap-2">
              {item.images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setImageIdx(i)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i === imageIdx ? "bg-primary" : "bg-dark-border"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 상품 정보 */}
      <div className="card">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="text-xs text-gray-500 bg-dark-card px-2 py-1 rounded">
            {CATEGORY_LABELS[item.category] || item.category}
          </span>
          {item.isSoldOut && (
            <span className="text-xs text-gray-400 bg-dark-border px-2 py-1 rounded font-medium">
              판매완료
            </span>
          )}
        </div>

        <h1 className="text-lg font-bold mb-2">{item.title}</h1>

        <p className="text-2xl font-bold text-primary mb-4">
          {item.price === 0
            ? "나눔"
            : `₩${item.price.toLocaleString()}`}
        </p>

        <div className="border-t border-dark-border pt-4">
          <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
            {item.description}
          </p>
        </div>

        {/* 메타 정보 */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-dark-border text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary/30 flex items-center justify-center text-[10px] text-primary-light font-bold">
              {item.author.nickname[0]}
            </div>
            <span>{item.author.nickname}</span>
          </div>
          <div className="flex gap-3">
            <span>조회 {item.viewCount}</span>
            <span>
              {new Date(item.createdAt).toLocaleDateString("ko-KR")}
            </span>
          </div>
        </div>
      </div>

      {/* 작성자 액션 */}
      {(isOwner || isAdmin) && (
        <div className="flex gap-3">
          <button
            onClick={handleSoldToggle}
            disabled={actionLoading}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
              item.isSoldOut
                ? "bg-success/20 text-success border border-success/30 hover:bg-success/30"
                : "bg-dark-card text-gray-300 border border-dark-border hover:bg-dark-border"
            }`}
          >
            {item.isSoldOut ? "판매중으로 변경" : "판매완료로 변경"}
          </button>
          {isOwner && (
            <Link
              href={`/market/write?edit=${item.id}`}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium text-center bg-dark-card text-gray-300 border border-dark-border hover:bg-dark-border transition-colors"
            >
              수정
            </Link>
          )}
          <button
            onClick={handleDelete}
            disabled={actionLoading}
            className="py-2.5 px-4 rounded-lg text-sm font-medium text-urgent border border-urgent/30 hover:bg-urgent/10 transition-colors disabled:opacity-50"
          >
            삭제
          </button>
        </div>
      )}
    </div>
  );
}
