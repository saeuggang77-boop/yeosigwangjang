"use client";

import { useState, useEffect } from "react";

interface PopupAdData {
  id: string;
  bannerImage: string | null;
  bannerLink: string | null;
  business: { name: string; slug: string };
}

function getTodayKey() {
  return `popup_closed_${new Date().toISOString().slice(0, 10)}`;
}

export default function PopupAd() {
  const [ad, setAd] = useState<PopupAdData | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // 오늘 이미 닫았으면 표시 안 함
    const key = getTodayKey();
    if (typeof window !== "undefined" && localStorage.getItem(key)) return;

    async function load() {
      try {
        const res = await fetch("/api/ads/active?type=POPUP");
        const data = await res.json();
        if (data.ads?.length > 0) {
          // 랜덤 1개 선택
          const selected =
            data.ads[Math.floor(Math.random() * data.ads.length)];
          setAd(selected);
          setVisible(true);
        }
      } catch {
        // 무시
      }
    }
    load();
  }, []);

  const close = () => {
    setVisible(false);
  };

  const closeToday = () => {
    localStorage.setItem(getTodayKey(), "1");
    setVisible(false);
  };

  if (!visible || !ad) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="relative max-w-sm w-full bg-dark-surface rounded-2xl overflow-hidden border border-dark-border shadow-2xl">
        {/* 닫기 버튼 */}
        <button
          onClick={close}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-dark-bg/70 text-white flex items-center justify-center hover:bg-dark-bg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* 이미지 영역 */}
        <a
          href={ad.bannerLink || "#"}
          target={ad.bannerLink ? "_blank" : undefined}
          rel="noopener noreferrer"
          onClick={close}
        >
          {ad.bannerImage ? (
            <img
              src={ad.bannerImage}
              alt={ad.business.name}
              className="w-full aspect-[4/5] object-cover"
            />
          ) : (
            <div className="w-full aspect-[4/5] bg-gradient-to-b from-primary/20 via-dark-surface to-secondary/10 flex flex-col items-center justify-center px-6 text-center">
              <p className="text-xs text-gray-500 mb-3">AD</p>
              <h3 className="text-xl font-bold mb-2">{ad.business.name}</h3>
              <p className="text-sm text-gray-400">
                여시 전용 특별 혜택을 확인하세요
              </p>
            </div>
          )}
        </a>

        {/* 하단 바 */}
        <div className="flex items-center justify-between px-4 py-3 bg-dark-card border-t border-dark-border">
          <button
            onClick={closeToday}
            className="text-xs text-gray-500 hover:text-white transition-colors"
          >
            오늘 하루 보지 않기
          </button>
          <button
            onClick={close}
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
