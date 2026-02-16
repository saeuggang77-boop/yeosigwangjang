"use client";

import { useState, useEffect, useCallback } from "react";

interface BannerAd {
  id: string;
  bannerImage: string | null;
  bannerLink: string | null;
  business: { name: string; slug: string };
}

export default function MainBanner() {
  const [ads, setAds] = useState<BannerAd[]>([]);
  const [current, setCurrent] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/ads/active?type=MAIN_BANNER");
        const data = await res.json();
        setAds(data.ads || []);
      } catch {
        // 무시
      } finally {
        setLoaded(true);
      }
    }
    load();
  }, []);

  // 자동 슬라이드 (5초)
  useEffect(() => {
    if (ads.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % ads.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [ads.length]);

  const goTo = useCallback(
    (index: number) => {
      setCurrent(((index % ads.length) + ads.length) % ads.length);
    },
    [ads.length]
  );

  // 광고 없으면 기본 placeholder
  if (loaded && ads.length === 0) {
    return (
      <section>
        <div className="relative w-full h-44 sm:h-56 rounded-2xl overflow-hidden bg-gradient-to-r from-purple-600/40 via-primary/30 to-pink-500/40 border border-primary/20">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-premium-gold/10 via-transparent to-transparent" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
            <h2 className="text-xl sm:text-2xl font-bold mb-1">
              여시광장에서 만나는{" "}
              <span className="text-premium-gold">프리미엄</span> 파트너
            </h2>
            <p className="text-sm text-gray-300 mb-4">
              성형 · 뷰티 · 헤어 — 여시 전용 혜택
            </p>
            <a href="/directory" className="btn-primary text-sm py-2 px-5">
              업체 보러가기 &rarr;
            </a>
          </div>
        </div>
      </section>
    );
  }

  if (!loaded) {
    return (
      <section>
        <div className="w-full h-44 sm:h-56 rounded-2xl bg-dark-surface animate-pulse" />
      </section>
    );
  }

  const ad = ads[current];

  return (
    <section>
      <div className="relative w-full h-44 sm:h-56 rounded-2xl overflow-hidden border border-dark-border group">
        {/* 배너 */}
        {ad.bannerImage ? (
          <a
            href={ad.bannerLink || "#"}
            target={ad.bannerLink ? "_blank" : undefined}
            rel="noopener noreferrer"
            className="block w-full h-full"
          >
            <img
              src={ad.bannerImage}
              alt={ad.business.name}
              className="w-full h-full object-cover"
            />
          </a>
        ) : (
          <a
            href={ad.bannerLink || "#"}
            target={ad.bannerLink ? "_blank" : undefined}
            rel="noopener noreferrer"
            className="block w-full h-full bg-gradient-to-r from-purple-600/40 via-primary/30 to-pink-500/40"
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-premium-gold/10 via-transparent to-transparent" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
              <h2 className="text-xl sm:text-2xl font-bold mb-2">
                {ad.business.name}
              </h2>
              <a href={ad.bannerLink || `/directory`} className="btn-primary text-sm py-2 px-5">
                업체 보러가기 &rarr;
              </a>
            </div>
          </a>
        )}

        {/* 좌우 화살표 (2개 이상일 때) */}
        {ads.length > 1 && (
          <>
            <button
              onClick={() => goTo(current - 1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-dark-bg/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-dark-bg/80"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => goTo(current + 1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-dark-bg/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-dark-bg/80"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* 인디케이터 dots */}
        {ads.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {ads.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === current ? "bg-primary-light" : "bg-dark-border"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
