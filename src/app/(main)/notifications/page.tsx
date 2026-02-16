"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface Notification {
  id: string;
  type: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

interface Pagination {
  page: number;
  totalPages: number;
  total: number;
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

const TYPE_LABEL: Record<string, string> = {
  COMMENT: "댓글",
  REPLY: "답글",
  LIKE: "좋아요",
  POPULAR: "인기글",
  REPORT_RESOLVED: "신고처리",
  AD_INQUIRY: "광고문의",
  SYSTEM: "시스템",
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);

  if (mins < 1) return "방금 전";
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;

  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/notifications?page=${page}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setPagination(data.pagination || null);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      // 무시
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth/login");
      return;
    }
    if (status === "authenticated") {
      fetchNotifications();
    }
  }, [status, router, fetchNotifications]);

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

  const deleteNotification = async (id: string) => {
    try {
      await fetch("/api/notifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id }),
      });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch {
      // 무시
    }
  };

  const deleteAll = async () => {
    if (!confirm("모든 알림을 삭제하시겠습니까?")) return;
    try {
      await fetch("/api/notifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deleteAll: true }),
      });
      setNotifications([]);
      setUnreadCount(0);
    } catch {
      // 무시
    }
  };

  const markRead = async (id: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // 무시
    }
  };

  if (status === "loading" || (status === "authenticated" && loading)) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-dark-surface rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!session || (session.user.userType !== "USER" && session.user.role !== "ADMIN")) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-400">알림을 볼 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">알림</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-400 mt-0.5">
              읽지 않은 알림 {unreadCount}개
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="btn-outline text-xs py-1.5 px-3">
              모두 읽기
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={deleteAll}
              className="text-xs text-gray-500 hover:text-urgent transition-colors px-2 py-1.5"
            >
              전체 삭제
            </button>
          )}
        </div>
      </div>

      {/* 알림 목록 */}
      {notifications.length === 0 ? (
        <div className="text-center py-16">
          <svg
            className="w-12 h-12 mx-auto text-gray-600 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          <p className="text-gray-500">알림이 없습니다</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`card ${
                !n.isRead ? "border-primary/30 bg-primary/5" : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-lg mt-0.5 shrink-0">
                  {TYPE_ICON[n.type] || "🔔"}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-1.5 py-0.5 rounded bg-dark-card text-gray-400">
                      {TYPE_LABEL[n.type] || n.type}
                    </span>
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-primary-light" />
                    )}
                  </div>
                  {n.link ? (
                    <Link
                      href={n.link}
                      onClick={() => {
                        if (!n.isRead) markRead(n.id);
                      }}
                      className="text-sm leading-relaxed hover:text-primary-light transition-colors whitespace-pre-wrap"
                    >
                      {n.message}
                    </Link>
                  ) : (
                    <p className="text-sm leading-relaxed text-gray-300 whitespace-pre-wrap">
                      {n.message}
                    </p>
                  )}
                  <p className="text-xs text-gray-600 mt-1.5">
                    {formatDate(n.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!n.isRead && (
                    <button
                      onClick={() => markRead(n.id)}
                      className="text-xs text-gray-500 hover:text-white px-1.5 py-1"
                      title="읽음 처리"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(n.id)}
                    className="text-xs text-gray-500 hover:text-urgent px-1.5 py-1"
                    title="삭제"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 페이지네이션 */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm rounded-lg border border-dark-border disabled:opacity-30 hover:bg-dark-surface transition-colors"
          >
            이전
          </button>
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
            .filter(
              (p) =>
                p === 1 ||
                p === pagination.totalPages ||
                Math.abs(p - page) <= 2
            )
            .reduce<(number | "...")[]>((acc, p, i, arr) => {
              if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
              acc.push(p);
              return acc;
            }, [])
            .map((p, i) =>
              p === "..." ? (
                <span key={`dots-${i}`} className="px-2 text-gray-600">
                  ...
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p as number)}
                  className={`w-8 h-8 text-sm rounded-lg transition-colors ${
                    page === p
                      ? "bg-primary text-white"
                      : "border border-dark-border hover:bg-dark-surface"
                  }`}
                >
                  {p}
                </button>
              )
            )}
          <button
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={page === pagination.totalPages}
            className="px-3 py-1.5 text-sm rounded-lg border border-dark-border disabled:opacity-30 hover:bg-dark-surface transition-colors"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}
