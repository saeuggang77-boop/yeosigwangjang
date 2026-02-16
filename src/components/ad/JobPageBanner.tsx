"use client";

import { useState, useEffect } from "react";

interface BannerAd {
  id: string;
  bannerImage: string | null;
  bannerLink: string | null;
  business: { name: string; slug: string };
}

export default function JobPageBanner() {
  const [ads, setAds] = useState<BannerAd[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/ads/active?type=JOB_PAGE_BANNER");
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

  if (!loaded || ads.length === 0) return null;

  // 단일 배너
  if (ads.length === 1) {
    const ad = ads[0];
    return (
      <div className="mb-6">
        <a
          href={ad.bannerLink || "#"}
          target={ad.bannerLink ? "_blank" : undefined}
          rel="noopener noreferrer"
          className="relative block w-full h-24 sm:h-32 rounded-xl overflow-hidden border border-dark-border group"
        >
          {ad.bannerImage ? (
            <img
              src={ad.bannerImage}
              alt={ad.business.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-secondary/10 via-dark-surface to-primary/10 flex items-center justify-center">
              <div className="text-center">
                <p className="font-bold text-sm">{ad.business.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">광고</p>
              </div>
            </div>
          )}
          <span className="absolute top-2 right-2 text-[10px] text-gray-500 bg-dark-bg/60 px-1.5 py-0.5 rounded">
            AD
          </span>
        </a>
      </div>
    );
  }

  // 여러 개면 가로 스크롤
  return (
    <div className="mb-6">
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x scrollbar-hide">
        {ads.map((ad) => (
          <a
            key={ad.id}
            href={ad.bannerLink || "#"}
            target={ad.bannerLink ? "_blank" : undefined}
            rel="noopener noreferrer"
            className="relative min-w-[280px] sm:min-w-[360px] h-24 sm:h-32 rounded-xl overflow-hidden border border-dark-border shrink-0 snap-start"
          >
            {ad.bannerImage ? (
              <img
                src={ad.bannerImage}
                alt={ad.business.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-secondary/10 via-dark-surface to-primary/10 flex items-center justify-center">
                <div className="text-center">
                  <p className="font-bold text-sm">{ad.business.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">광고</p>
                </div>
              </div>
            )}
            <span className="absolute top-2 right-2 text-[10px] text-gray-500 bg-dark-bg/60 px-1.5 py-0.5 rounded">
              AD
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
