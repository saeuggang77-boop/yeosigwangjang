"use client";

import { useCallback, useEffect, useState } from "react";

interface CafePost {
  id: string;
  title: string;
  url: string;
  category: string;
  isPinned: boolean;
  isActive: boolean;
  createdAt: string;
}

const CATEGORIES = ["인기글", "최신글", "공지"];

export default function AdminCafePostsPage() {
  const [posts, setPosts] = useState<CafePost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // 등록 폼
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    url: "",
    category: "인기글",
    isPinned: false,
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/cafe-posts");
      const data = await res.json();
      setPosts(data.posts || []);
    } catch {
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormLoading(true);

    try {
      const res = await fetch("/api/admin/cafe-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        setFormError(data.error);
        return;
      }

      setForm({ title: "", url: "", category: "인기글", isPinned: false });
      setShowForm(false);
      fetchPosts();
    } catch {
      setFormError("등록 중 오류가 발생했습니다.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleAction = async (postId: string, action: string) => {
    if (action === "delete" && !confirm("삭제하시겠습니까?")) return;
    setActionLoading(postId);
    try {
      const res = await fetch("/api/admin/cafe-posts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, action }),
      });
      if (res.ok) fetchPosts();
      else alert((await res.json()).error);
    } catch {
      alert("처리 중 오류가 발생했습니다.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleTogglePin = async (postId: string, currentPinned: boolean) => {
    setActionLoading(postId);
    try {
      await fetch("/api/admin/cafe-posts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, isPinned: !currentPinned }),
      });
      fetchPosts();
    } catch {
      alert("처리 중 오류가 발생했습니다.");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">카페 인기글 관리</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className={showForm ? "btn-outline text-sm py-2 px-4" : "btn-primary text-sm py-2 px-4"}
        >
          {showForm ? "취소" : "새 글 등록"}
        </button>
      </div>

      {/* 안내 */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-4 text-xs text-gray-400">
        <p className="font-medium text-gray-300 mb-1">카페 연동 안내</p>
        <ul className="space-y-0.5">
          <li>
            &middot; 네이버 카페 인기글의 <strong>제목 + 링크</strong>만 수동
            등록합니다. (주 2~3회)
          </li>
          <li>&middot; 카페 게시글 본문은 절대 사이트에 복제하지 않습니다.</li>
          <li>
            &middot; 등록된 글은 메인 페이지 &ldquo;여시광장&rdquo; 섹션에
            표시됩니다.
          </li>
        </ul>
      </div>

      {/* 등록 폼 */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card space-y-4">
          <h2 className="font-bold text-sm text-gray-300">카페 글 등록</h2>

          {formError && (
            <p className="text-urgent text-sm bg-urgent/10 py-2 px-3 rounded-lg">
              {formError}
            </p>
          )}

          <div>
            <label className="block text-sm text-gray-400 mb-1">
              제목 <span className="text-urgent">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) =>
                setForm((p) => ({ ...p, title: e.target.value }))
              }
              className="input-field"
              placeholder="카페 글 제목"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">
              URL <span className="text-urgent">*</span>
            </label>
            <input
              type="url"
              value={form.url}
              onChange={(e) =>
                setForm((p) => ({ ...p, url: e.target.value }))
              }
              className="input-field"
              placeholder="https://cafe.naver.com/..."
              required
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm text-gray-400 mb-1">분류</label>
              <select
                value={form.category}
                onChange={(e) =>
                  setForm((p) => ({ ...p, category: e.target.value }))
                }
                className="input-field"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isPinned}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, isPinned: e.target.checked }))
                  }
                  className="rounded border-dark-border"
                />
                상단 고정
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={formLoading}
            className="btn-primary py-2.5 w-full disabled:opacity-50"
          >
            {formLoading ? "등록 중..." : "등록"}
          </button>
        </form>
      )}

      {/* 목록 */}
      {isLoading ? (
        <div className="text-center py-16 text-gray-500">로딩 중...</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 mb-4">등록된 카페 글이 없습니다.</p>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary text-sm"
          >
            첫 번째 글 등록하기
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div
              key={post.id}
              className={`card ${!post.isActive ? "opacity-50" : ""}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {post.isPinned && (
                      <span className="text-xs text-accent">PIN</span>
                    )}
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded ${
                        post.category === "인기글"
                          ? "bg-primary/10 text-primary-light"
                          : post.category === "공지"
                            ? "bg-urgent/10 text-urgent"
                            : "bg-dark-border text-gray-400"
                      }`}
                    >
                      {post.category}
                    </span>
                    <a
                      href={post.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-sm hover:text-primary-light transition-colors truncate"
                    >
                      {post.title}
                    </a>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {new Date(post.createdAt).toLocaleDateString("ko-KR")}{" "}
                    {new Date(post.createdAt).toLocaleTimeString("ko-KR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => handleTogglePin(post.id, post.isPinned)}
                    disabled={actionLoading === post.id}
                    className={`text-xs px-2 py-1 rounded border transition-colors disabled:opacity-50 ${
                      post.isPinned
                        ? "text-accent border-accent/30 hover:border-accent"
                        : "text-gray-500 border-dark-border hover:border-gray-500 hover:text-white"
                    }`}
                  >
                    {post.isPinned ? "고정 해제" : "고정"}
                  </button>
                  <button
                    onClick={() => handleAction(post.id, "toggle_active")}
                    disabled={actionLoading === post.id}
                    className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded border border-dark-border hover:border-gray-500 transition-colors disabled:opacity-50"
                  >
                    {post.isActive ? "숨김" : "표시"}
                  </button>
                  <button
                    onClick={() => handleAction(post.id, "delete")}
                    disabled={actionLoading === post.id}
                    className="text-xs text-urgent hover:text-white px-2 py-1 rounded border border-urgent/30 hover:border-urgent hover:bg-urgent/10 transition-colors disabled:opacity-50"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
