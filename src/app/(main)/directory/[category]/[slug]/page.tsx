"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { BIZ_CATEGORY_MAP } from "@/lib/constants";

interface BizEvent {
  id: string;
  title: string;
  description: string;
  image: string | null;
  startDate: string;
  endDate: string;
}

interface BusinessDetail {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string | null;
  logo: string | null;
  images: string[];
  phone: string | null;
  kakaoId: string | null;
  instagram: string | null;
  website: string | null;
  address: string | null;
  addressDetail: string | null;
  region: string | null;
  subRegion: string | null;
  openingHours: string | null;
  priceInfo: string | null;
  isPremium: boolean;
  viewCount: number;
  events: BizEvent[];
}

const CAFE_URL = "https://cafe.naver.com/bamyeosi";

export default function BusinessDetailPage() {
  const params = useParams();
  const router = useRouter();
  const category = params.category as string;
  const slug = params.slug as string;

  const [biz, setBiz] = useState<BusinessDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const catInfo = BIZ_CATEGORY_MAP[category];

  useEffect(() => {
    fetch(`/api/directory/${category}/${slug}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setBiz)
      .catch(() => router.replace("/directory"))
      .finally(() => setIsLoading(false));
  }, [category, slug, router]);

  const trackClick = (type: "phone" | "kakao") => {
    fetch(`/api/directory/${category}/${slug}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
    }).catch(() => {});
  };

  if (isLoading) {
    return (
      <div className="text-center py-20 text-gray-500">로딩 중...</div>
    );
  }

  if (!biz) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* 뒤로가기 */}
      <div className="flex items-center gap-2 mb-6 text-sm">
        <Link
          href={`/directory/${category}`}
          className="text-gray-500 hover:text-white transition-colors"
        >
          &larr; {catInfo?.label || category}
        </Link>
      </div>

      {/* 헤더 */}
      <div className="card mb-6">
        <div className="flex items-start gap-4">
          {/* 로고 */}
          <div className="w-20 h-20 rounded-xl bg-dark-card flex items-center justify-center shrink-0">
            <span className="text-2xl opacity-40">{catInfo?.icon || "🏢"}</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold">{biz.name}</h1>
              {biz.isPremium && (
                <span className="text-xs text-premium-gold bg-premium-gold/10 px-2 py-0.5 rounded">
                  PREMIUM
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {catInfo?.label}
              {biz.region && ` · ${biz.region}`}
              {biz.subRegion && ` ${biz.subRegion}`}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              조회 {biz.viewCount.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* 이미지 갤러리 플레이스홀더 */}
      {biz.images.length > 0 && (
        <div className="mb-6 flex gap-2 overflow-x-auto scrollbar-hide snap-x">
          {biz.images.map((_, i) => (
            <div
              key={i}
              className="w-64 h-44 rounded-xl bg-dark-card shrink-0 snap-start flex items-center justify-center text-gray-600 text-sm"
            >
              사진 {i + 1}
            </div>
          ))}
        </div>
      )}

      {/* 소개 */}
      {biz.description && (
        <div className="card mb-6">
          <h2 className="font-bold text-sm text-gray-300 mb-3">업체 소개</h2>
          <p className="text-sm text-gray-400 whitespace-pre-line leading-relaxed">
            {biz.description}
          </p>
        </div>
      )}

      {/* 상세 정보 */}
      <div className="card mb-6">
        <h2 className="font-bold text-sm text-gray-300 mb-3">상세 정보</h2>
        <div className="space-y-3 text-sm">
          {biz.address && (
            <div className="flex gap-3">
              <span className="text-gray-500 shrink-0 w-16">주소</span>
              <span className="text-gray-300">
                {biz.address}
                {biz.addressDetail && ` ${biz.addressDetail}`}
              </span>
            </div>
          )}
          {biz.openingHours && (
            <div className="flex gap-3">
              <span className="text-gray-500 shrink-0 w-16">영업시간</span>
              <span className="text-gray-300">{biz.openingHours}</span>
            </div>
          )}
          {biz.priceInfo && (
            <div className="flex gap-3">
              <span className="text-gray-500 shrink-0 w-16">가격</span>
              <span className="text-gray-300 whitespace-pre-line">
                {biz.priceInfo}
              </span>
            </div>
          )}
          {biz.instagram && (
            <div className="flex gap-3">
              <span className="text-gray-500 shrink-0 w-16">인스타</span>
              <span className="text-gray-300">@{biz.instagram}</span>
            </div>
          )}
          {biz.website && (
            <div className="flex gap-3">
              <span className="text-gray-500 shrink-0 w-16">웹사이트</span>
              <a
                href={biz.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-light hover:underline"
              >
                {biz.website}
              </a>
            </div>
          )}
        </div>
      </div>

      {/* 진행 중인 이벤트 */}
      {biz.events.length > 0 && (
        <div className="card mb-6">
          <h2 className="font-bold text-sm text-gray-300 mb-3">
            진행 중인 이벤트
          </h2>
          <div className="space-y-3">
            {biz.events.map((evt) => (
              <div
                key={evt.id}
                className="p-3 rounded-lg bg-dark-bg border border-dark-border"
              >
                <p className="font-medium text-sm">{evt.title}</p>
                <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                  {evt.description}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {new Date(evt.startDate).toLocaleDateString("ko-KR")} ~{" "}
                  {new Date(evt.endDate).toLocaleDateString("ko-KR")}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 카페 후기 안내 (리뷰 대체) */}
      <div className="card mb-6 border-primary/20 bg-primary/5">
        <h2 className="font-bold text-sm text-gray-300 mb-2">
          솔직한 후기는 여시광장에서!
        </h2>
        <p className="text-xs text-gray-400 mb-3">
          업체 리뷰와 솔직한 후기는 밤여시 카페에서 확인하세요.
          <br />
          2만 여시가 함께하는 커뮤니티에서 실제 경험을 공유합니다.
        </p>
        <a
          href={CAFE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-outline text-xs py-2 px-4 inline-block"
        >
          밤여시 카페에서 후기 보기
        </a>
      </div>

      {/* 연락처 버튼 */}
      <div className="sticky bottom-4 flex gap-3">
        {biz.phone && (
          <a
            href={`tel:${biz.phone}`}
            onClick={() => trackClick("phone")}
            className="flex-1 btn-outline py-3 text-center text-sm font-medium"
          >
            전화 문의
          </a>
        )}
        {biz.kakaoId && (
          <button
            onClick={() => {
              trackClick("kakao");
              window.open(
                `https://open.kakao.com/o/${biz.kakaoId}`,
                "_blank"
              );
            }}
            className="flex-1 py-3 rounded-xl text-center text-sm font-medium bg-[#FEE500] text-[#191919] hover:bg-[#FDD800] transition-colors"
          >
            카카오톡 문의
          </button>
        )}
        {!biz.phone && !biz.kakaoId && (
          <p className="flex-1 text-center text-sm text-gray-500 py-3">
            연락처 정보가 없습니다.
          </p>
        )}
      </div>
    </div>
  );
}
