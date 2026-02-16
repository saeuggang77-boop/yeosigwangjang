"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

const BOARD_NAMES: Record<string, string> = {
  "free-chat": "자유수다",
  questions: "질문있어요",
  announcements: "공지사항",
};

export default function WritePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();

  const boardSlug = params.boardSlug as string;
  const boardName = BOARD_NAMES[boardSlug] || boardSlug;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (status === "loading") {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="animate-pulse h-64 bg-dark-surface rounded-xl" />
      </div>
    );
  }

  if (!session || session.user.userType !== "USER") {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h2 className="text-lg font-bold mb-2">로그인이 필요합니다</h2>
        <p className="text-sm text-gray-400 mb-4">
          게시글을 작성하려면 일반 회원으로 로그인해주세요.
        </p>
        <Link href="/auth/login" className="btn-primary text-sm">
          로그인
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError("제목과 내용을 입력해주세요.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          boardSlug,
          title: title.trim(),
          content: content.trim(),
          isAnonymous,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "작성에 실패했습니다.");
        return;
      }

      router.push(`/community/${boardSlug}/${data.postId}`);
    } catch {
      setError("서버 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
      {/* 브레드크럼 */}
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/community" className="hover:text-white transition-colors">
          여시광장
        </Link>
        <span>/</span>
        <Link
          href={`/community/${boardSlug}`}
          className="hover:text-white transition-colors"
        >
          {boardName}
        </Link>
        <span>/</span>
        <span className="text-white">글쓰기</span>
      </nav>

      <h1 className="text-xl font-bold">{boardName} 글쓰기</h1>

      {error && (
        <div className="bg-urgent/10 border border-urgent/30 text-urgent text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 제목 */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            제목
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목을 입력해주세요"
            className="input-field"
            maxLength={100}
          />
        </div>

        {/* 내용 */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            내용
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="내용을 입력해주세요"
            rows={12}
            className="input-field resize-none"
          />
        </div>

        {/* 옵션 */}
        {boardSlug !== "announcements" && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="w-4 h-4 rounded border-dark-border bg-dark-card text-primary focus:ring-primary"
            />
            <span className="text-sm text-gray-300">익명으로 작성</span>
          </label>
        )}

        {/* 버튼 */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary text-sm disabled:opacity-50"
          >
            {submitting ? "게시 중..." : "게시하기"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-outline text-sm"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  );
}
