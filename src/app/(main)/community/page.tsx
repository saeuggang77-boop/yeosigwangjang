"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Board {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  minGrade: string;
  isPublic: boolean;
  _count: { posts: number };
}

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

const BOARD_ICONS: Record<string, string> = {
  "free-chat": "💬",
  questions: "❓",
  announcements: "📢",
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

export default function CommunityPage() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [latestPosts, setLatestPosts] = useState<PostSummary[]>([]);
  const [popularPosts, setPopularPosts] = useState<PostSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [boardRes, latestRes, popularRes] = await Promise.all([
          fetch("/api/community/boards"),
          fetch("/api/community/posts?sort=latest&limit=10"),
          fetch("/api/community/posts?sort=popular&limit=10"),
        ]);
        const boardData = await boardRes.json();
        const latestData = await latestRes.json();
        const popularData = await popularRes.json();
        setBoards(boardData.boards || []);
        setLatestPosts(latestData.posts || []);
        setPopularPosts(popularData.posts || []);
      } catch {
        console.error("커뮤니티 로드 실패");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-dark-surface rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold">여시광장</h1>
        <p className="text-sm text-gray-400 mt-1">
          여시들의 자유로운 소통 공간
        </p>
      </div>

      {/* 게시판 목록 */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {boards.map((board) => (
            <Link
              key={board.id}
              href={`/community/${board.slug}`}
              className="card hover:border-primary/50 transition-all group"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">
                  {BOARD_ICONS[board.slug] || "📋"}
                </span>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm group-hover:text-primary-light transition-colors">
                    {board.name}
                  </h3>
                  {board.description && (
                    <p className="text-xs text-gray-500 truncate">
                      {board.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-600 mt-0.5">
                    게시글 {board._count.posts}개
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 인기글 */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <svg
              className="w-5 h-5 text-premium-gold"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            인기글
          </h2>
        </div>
        {popularPosts.length === 0 ? (
          <p className="text-sm text-gray-500">아직 인기글이 없습니다.</p>
        ) : (
          <div className="card divide-y divide-dark-border">
            {popularPosts.slice(0, 5).map((post) => (
              <PostRow key={post.id} post={post} />
            ))}
          </div>
        )}
      </section>

      {/* 최신글 */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">최신글</h2>
        </div>
        {latestPosts.length === 0 ? (
          <p className="text-sm text-gray-500">아직 게시글이 없습니다.</p>
        ) : (
          <div className="card divide-y divide-dark-border">
            {latestPosts.map((post) => (
              <PostRow key={post.id} post={post} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function PostRow({ post }: { post: PostSummary }) {
  return (
    <Link
      href={`/community/${post.board.slug}/${post.id}`}
      className="flex items-center gap-3 py-3 px-2 hover:bg-dark-card/50 transition-colors first:pt-1 last:pb-1"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {post.isPinned && (
            <span className="text-xs text-primary-light font-bold">[공지]</span>
          )}
          {post.isPopular && (
            <span className="text-xs text-premium-gold font-bold">[인기]</span>
          )}
          <span className="text-xs text-gray-600">{post.board.name}</span>
        </div>
        <h3 className="text-sm font-medium truncate mt-0.5">{post.title}</h3>
        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
          <span>{post.author.nickname}</span>
          <span>{timeAgo(post.createdAt)}</span>
        </div>
      </div>
      <div className="flex items-center gap-3 text-xs text-gray-500 shrink-0">
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          {post.viewCount}
        </span>
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          {post._count.likes}
        </span>
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {post._count.comments}
        </span>
      </div>
    </Link>
  );
}
