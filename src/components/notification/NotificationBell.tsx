"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";

interface Notification {
  id: string;
  type: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

const TYPE_ICON: Record<string, string> = {
  COMMENT: "💬",
  REPLY: "↩️",
  LIKE: "❤️",
  POPULAR: "🔥",
  REPORT_RESOLVED: "✅",
  AD_INQUIRY: "📩",
  SYSTEM: "📢",
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "방금";
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return new Date(dateStr).toLocaleDateString("ko-KR");
}

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // 읽지 않은 수 폴링 (30초)
  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?countOnly=1");
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      // 무시
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const timer = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(timer);
  }, [fetchUnreadCount]);

  // 드롭다운 열릴 때 알림 목록 fetch
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications?page=1");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      // 무시
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleOpen = () => {
    const next = !open;
    setOpen(next);
    if (next) fetchNotifications();
  };

  // 외부 클릭 감지
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // 모두 읽기
  const markAllRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ readAll: true }),
      });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // 무시
    }
  };

  // 단일 알림 클릭 → 읽음 처리
  const markRead = async (notificationId: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      });
    } catch {
      // 무시
    }
  };

  return (
    <div ref={ref} className="relative">
      {/* 벨 아이콘 */}
      <button
        onClick={toggleOpen}
        className="relative p-2 text-gray-400 hover:text-white transition-colors"
        aria-label="알림"
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
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {/* 뱃지 */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-urgent text-white text-[10px] font-bold rounded-full px-1">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* 드롭다운 패널 */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-dark-surface border border-dark-border rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* 헤더 */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-dark-border">
            <h3 className="font-bold text-sm">알림</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-primary-light hover:underline"
                >
                  모두 읽기
                </button>
              )}
              <Link
                href="/notifications"
                onClick={() => setOpen(false)}
                className="text-xs text-gray-400 hover:text-white"
              >
                전체보기
              </Link>
            </div>
          </div>

          {/* 알림 목록 */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="py-8 text-center text-gray-500 text-sm">
                로딩 중...
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-gray-500 text-sm">
                알림이 없습니다
              </div>
            ) : (
              notifications.map((n) => {
                const content = (
                  <div
                    className={`flex items-start gap-3 px-4 py-3 border-b border-dark-border/50 hover:bg-dark-card/50 transition-colors cursor-pointer ${
                      !n.isRead ? "bg-primary/5" : ""
                    }`}
                    onClick={() => {
                      if (!n.isRead) markRead(n.id);
                      setOpen(false);
                    }}
                  >
                    <span className="text-base mt-0.5 shrink-0">
                      {TYPE_ICON[n.type] || "🔔"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm leading-snug ${
                          !n.isRead ? "text-white" : "text-gray-400"
                        } line-clamp-2`}
                      >
                        {n.message}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {timeAgo(n.createdAt)}
                      </p>
                    </div>
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-primary-light shrink-0 mt-1.5" />
                    )}
                  </div>
                );

                return n.link ? (
                  <Link key={n.id} href={n.link}>
                    {content}
                  </Link>
                ) : (
                  <div key={n.id}>{content}</div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
