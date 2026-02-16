"use client";

import { useState } from "react";

interface Props {
  jobId: string;
  initialBookmarked: boolean;
  initialScrapCount: number;
}

export default function JobBookmarkButton({
  jobId,
  initialBookmarked,
  initialScrapCount,
}: Props) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [scrapCount, setScrapCount] = useState(initialScrapCount);
  const [isLoading, setIsLoading] = useState(false);

  const toggle = async () => {
    setIsLoading(true);
    // 낙관적 업데이트
    const prev = bookmarked;
    setBookmarked(!prev);
    setScrapCount((c) => (prev ? Math.max(0, c - 1) : c + 1));

    try {
      const res = await fetch(`/api/jobs/${jobId}/bookmark`, {
        method: "POST",
      });
      if (!res.ok) {
        // 롤백
        setBookmarked(prev);
        setScrapCount((c) => (prev ? c + 1 : Math.max(0, c - 1)));
      } else {
        const data = await res.json();
        setBookmarked(data.bookmarked);
        setScrapCount(data.scrapCount);
      }
    } catch {
      setBookmarked(prev);
      setScrapCount((c) => (prev ? c + 1 : Math.max(0, c - 1)));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={isLoading}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
        bookmarked
          ? "bg-primary/20 text-primary border border-primary/40"
          : "bg-dark-card text-gray-400 border border-dark-border hover:text-white hover:border-gray-500"
      } disabled:opacity-50`}
    >
      <svg
        className="w-4 h-4"
        fill={bookmarked ? "currentColor" : "none"}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
        />
      </svg>
      <span>스크랩 {scrapCount > 0 && scrapCount}</span>
    </button>
  );
}
