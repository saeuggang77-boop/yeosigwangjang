"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface PostSummary {
  id: string;
  title: string;
  isAnonymous: boolean;
  isPinned: boolean;
  isPopular: boolean;
  viewCount: number;
  createdAt: string;
  author: { id: string | null; nickname: string };
  board: { slug: string; name: string };
  _count: { comments: number; likes: number };
}

interface Pagination {
  page: number;
  totalPages: number;
  total: number;
}

const BOARD_NAMES: Record<string, string> = {
  "free-chat": "자유수다",
  questions: "질문있어요",
  announcements: "공지사항",
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

export default function BoardPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();

  const boardSlug = params.boardSlug as string;
  const currentPage = parseInt(searchParams.get("page") || "1");
  const currentSort = searchParams.get("sort") || "latest";

  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);

  const boardName = BOARD_NAMES[boardSlug] || boardSlug;

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/community/posts?board=${boardSlug}&sort=${currentSort}&page=${currentPage}`
      );
      const data = await res.json();
      setPosts(data.posts || []);
      setPagination(data.pagination || null);
    } catch {
      console.error("게시글 로드 실패");
    } finally {
      setLoading(false);
    }
  }, [boardSlug, currentSort, currentPage]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const setSort = (sort: string) => {
    router.push(`/community/${boardSlug}?sort=${sort}`);
  };

  const goPage = (page: number) => {
    router.push(`/community/${boardSlug}?sort=${currentSort}&page=${page}`);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
      {/* 브레드크럼 */}
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/community" className="hover:text-white transition-colors">
          여시광장
        </Link>
        <span>/</span>
        <span className="text-white">{boardName}</span>
      </nav>

      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{boardName}</h1>
        {session?.user?.userType === "USER" && (
          <Link
            href={`/community/${boardSlug}/write`}
            className="btn-primary text-sm py-1.5 px-4"
          >
            글쓰기
          </Link>
        )}
      </div>

      {/* 정렬 탭 */}
      <div className="flex gap-1 border-b border-dark-border">
        {[
          { key: "latest", label: "최신순" },
          { key: "popular", label: "인기순" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSort(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              currentSort === tab.key
                ? "border-primary text-primary-light"
                : "border-transparent text-gray-500 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 게시글 목록 */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-dark-surface rounded-lg animate-pulse" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500">아직 게시글이 없습니다.</p>
          {session?.user?.userType === "USER" && (
            <Link
              href={`/community/${boardSlug}/write`}
              className="inline-block mt-4 btn-primary text-sm"
            >
              첫 글을 작성해보세요
            </Link>
          )}
        </div>
      ) : (
        <div className="divide-y divide-dark-border">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/community/${boardSlug}/${post.id}`}
              className="flex items-center gap-3 py-3.5 px-1 hover:bg-dark-surface/30 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {post.isPinned && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary/20 text-primary-light">
                      공지
                    </span>
                  )}
                  {post.isPopular && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-premium-gold/20 text-premium-gold">
                      인기
                    </span>
                  )}
                  <h3 className="text-sm font-medium truncate">{post.title}</h3>
                  {post._count.comments > 0 && (
                    <span className="text-xs text-primary-light">
                      [{post._count.comments}]
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                  <span>{post.author.nickname}</span>
                  <span>{timeAgo(post.createdAt)}</span>
                  <span className="flex items-center gap-0.5">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    {post.viewCount}
                  </span>
                  <span className="flex items-center gap-0.5">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    {post._count.likes}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* 페이지네이션 */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 pt-4">
          <button
            onClick={() => goPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 text-sm rounded-lg border border-dark-border disabled:opacity-30 hover:bg-dark-surface transition-colors"
          >
            이전
          </button>
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
            .filter(
              (p) =>
                p === 1 ||
                p === pagination.totalPages ||
                Math.abs(p - currentPage) <= 2
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
                  onClick={() => goPage(p as number)}
                  className={`w-8 h-8 text-sm rounded-lg transition-colors ${
                    currentPage === p
                      ? "bg-primary text-white"
                      : "border border-dark-border hover:bg-dark-surface"
                  }`}
                >
                  {p}
                </button>
              )
            )}
          <button
            onClick={() => goPage(Math.min(pagination.totalPages, currentPage + 1))}
            disabled={currentPage === pagination.totalPages}
            className="px-3 py-1.5 text-sm rounded-lg border border-dark-border disabled:opacity-30 hover:bg-dark-surface transition-colors"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}
