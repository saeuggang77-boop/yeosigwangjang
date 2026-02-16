"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface Post {
  id: string;
  title: string;
  content: string;
  images: string[];
  isAnonymous: boolean;
  isPinned: boolean;
  isPopular: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  author: { id: string | null; nickname: string; profileImage: string | null };
  board: { slug: string; name: string };
  _count: { comments: number; likes: number; bookmarks: number };
  isOwner: boolean;
  isLiked: boolean;
  isBookmarked: boolean;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  authorId: string;
  author: { id: string; nickname: string };
  _count: { likes: number };
  isOwner: boolean;
  isLiked: boolean;
  replies: Comment[];
}

const REPORT_REASONS = [
  "스팸/광고",
  "욕설/비하",
  "음란물",
  "개인정보 노출",
  "허위정보",
  "기타",
];

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();

  const boardSlug = params.boardSlug as string;
  const postId = params.postId as string;

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetail, setReportDetail] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  const loadPost = useCallback(async () => {
    try {
      const res = await fetch(`/api/community/posts/${postId}`);
      if (!res.ok) {
        router.push("/community");
        return;
      }
      const data = await res.json();
      setPost(data);
      setEditTitle(data.title);
      setEditContent(data.content);
    } catch {
      router.push("/community");
    }
  }, [postId, router]);

  const loadComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/community/posts/${postId}/comments`);
      const data = await res.json();
      setComments(data.comments || []);
    } catch {
      console.error("댓글 로드 실패");
    }
  }, [postId]);

  useEffect(() => {
    async function init() {
      setLoading(true);
      await Promise.all([loadPost(), loadComments()]);
      setLoading(false);
    }
    init();
  }, [loadPost, loadComments]);

  // 좋아요 토글
  const toggleLike = async () => {
    if (!session) return;
    try {
      const res = await fetch(`/api/community/posts/${postId}/like`, {
        method: "POST",
      });
      const data = await res.json();
      if (post) {
        setPost({
          ...post,
          isLiked: data.liked,
          _count: {
            ...post._count,
            likes: post._count.likes + (data.liked ? 1 : -1),
          },
        });
      }
    } catch {
      console.error("좋아요 실패");
    }
  };

  // 북마크 토글
  const toggleBookmark = async () => {
    if (!session) return;
    try {
      const res = await fetch(`/api/community/posts/${postId}/bookmark`, {
        method: "POST",
      });
      const data = await res.json();
      if (post) {
        setPost({
          ...post,
          isBookmarked: data.bookmarked,
          _count: {
            ...post._count,
            bookmarks: post._count.bookmarks + (data.bookmarked ? 1 : -1),
          },
        });
      }
    } catch {
      console.error("북마크 실패");
    }
  };

  // 댓글 작성
  const submitComment = async (parentId?: string) => {
    const text = parentId ? replyText : commentText;
    if (!text.trim() || !session) return;

    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/community/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: text.trim(),
          parentId: parentId || undefined,
        }),
      });
      if (res.ok) {
        setCommentText("");
        setReplyText("");
        setReplyingTo(null);
        await loadComments();
      }
    } catch {
      console.error("댓글 작성 실패");
    } finally {
      setSubmittingComment(false);
    }
  };

  // 댓글 좋아요
  const toggleCommentLike = async (commentId: string) => {
    if (!session) return;
    try {
      await fetch(`/api/community/comments/${commentId}`, { method: "POST" });
      await loadComments();
    } catch {
      console.error("댓글 좋아요 실패");
    }
  };

  // 댓글 삭제
  const deleteComment = async (commentId: string) => {
    if (!confirm("댓글을 삭제하시겠습니까?")) return;
    try {
      await fetch(`/api/community/comments/${commentId}`, { method: "DELETE" });
      await loadComments();
    } catch {
      console.error("댓글 삭제 실패");
    }
  };

  // 게시글 삭제
  const deletePost = async () => {
    try {
      const res = await fetch(`/api/community/posts/${postId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push(`/community/${boardSlug}`);
      }
    } catch {
      console.error("게시글 삭제 실패");
    }
  };

  // 게시글 수정
  const submitEdit = async () => {
    if (!editTitle.trim() || !editContent.trim()) return;
    try {
      const res = await fetch(`/api/community/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle.trim(),
          content: editContent.trim(),
        }),
      });
      if (res.ok) {
        setEditing(false);
        await loadPost();
      }
    } catch {
      console.error("수정 실패");
    }
  };

  // 신고
  const submitReport = async () => {
    if (!reportReason) return;
    setReportSubmitting(true);
    try {
      const res = await fetch(`/api/community/posts/${postId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reportReason, detail: reportDetail }),
      });
      const data = await res.json();
      if (res.ok) {
        alert("신고가 접수되었습니다.");
        setShowReport(false);
        setReportReason("");
        setReportDetail("");
      } else {
        alert(data.error || "신고에 실패했습니다.");
      }
    } catch {
      alert("서버 오류가 발생했습니다.");
    } finally {
      setReportSubmitting(false);
    }
  };

  // 고정 토글 (관리자)
  const togglePin = async () => {
    try {
      await fetch(`/api/community/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "togglePin" }),
      });
      await loadPost();
    } catch {
      console.error("고정 실패");
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-dark-surface rounded w-3/4" />
          <div className="h-4 bg-dark-surface rounded w-1/4" />
          <div className="h-64 bg-dark-surface rounded-xl" />
        </div>
      </div>
    );
  }

  if (!post) return null;

  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
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
          {post.board.name}
        </Link>
      </nav>

      {/* 게시글 */}
      <article className="card">
        {/* 뱃지 */}
        <div className="flex items-center gap-2 mb-3">
          {post.isPinned && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-primary/20 text-primary-light">
              공지
            </span>
          )}
          {post.isPopular && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-premium-gold/20 text-premium-gold">
              인기
            </span>
          )}
        </div>

        {editing ? (
          /* 수정 폼 */
          <div className="space-y-3">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="input-field text-lg font-bold"
            />
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={10}
              className="input-field resize-none"
            />
            <div className="flex gap-2">
              <button onClick={submitEdit} className="btn-primary text-sm">
                수정 완료
              </button>
              <button
                onClick={() => setEditing(false)}
                className="btn-outline text-sm"
              >
                취소
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* 제목 */}
            <h1 className="text-xl font-bold">{post.title}</h1>

            {/* 작성자 + 메타 */}
            <div className="flex items-center justify-between mt-3 pb-3 border-b border-dark-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs text-primary-light font-bold">
                  {post.author.nickname[0]}
                </div>
                <div>
                  <span className="text-sm font-medium">
                    {post.author.nickname}
                  </span>
                  <p className="text-xs text-gray-500">
                    {formatDate(post.createdAt)}
                    {post.updatedAt !== post.createdAt && " (수정됨)"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span>조회 {post.viewCount}</span>
                <span>좋아요 {post._count.likes}</span>
                <span>댓글 {post._count.comments}</span>
              </div>
            </div>

            {/* 본문 */}
            <div className="py-6 text-sm leading-relaxed whitespace-pre-wrap min-h-[120px]">
              {post.content}
            </div>
          </>
        )}

        {/* 하단 액션 바 */}
        {!editing && (
          <div className="flex items-center justify-between pt-3 border-t border-dark-border">
            <div className="flex items-center gap-2">
              {/* 좋아요 */}
              <button
                onClick={toggleLike}
                disabled={!session}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  post.isLiked
                    ? "bg-urgent/10 text-urgent"
                    : "bg-dark-card text-gray-400 hover:text-white"
                } disabled:opacity-40`}
              >
                <svg
                  className="w-4 h-4"
                  fill={post.isLiked ? "currentColor" : "none"}
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
                {post._count.likes}
              </button>

              {/* 북마크 */}
              <button
                onClick={toggleBookmark}
                disabled={!session}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  post.isBookmarked
                    ? "bg-premium-gold/10 text-premium-gold"
                    : "bg-dark-card text-gray-400 hover:text-white"
                } disabled:opacity-40`}
              >
                <svg
                  className="w-4 h-4"
                  fill={post.isBookmarked ? "currentColor" : "none"}
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                  />
                </svg>
                {post._count.bookmarks}
              </button>

              {/* 신고 */}
              {session && !post.isOwner && (
                <button
                  onClick={() => setShowReport(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-dark-card text-gray-400 hover:text-urgent transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  신고
                </button>
              )}
            </div>

            {/* 수정/삭제/고정 */}
            <div className="flex items-center gap-2">
              {isAdmin && (
                <button
                  onClick={togglePin}
                  className={`text-xs px-2 py-1 rounded ${
                    post.isPinned
                      ? "bg-primary/20 text-primary-light"
                      : "bg-dark-card text-gray-500"
                  }`}
                >
                  {post.isPinned ? "고정 해제" : "고정"}
                </button>
              )}
              {(post.isOwner || isAdmin) && (
                <>
                  <button
                    onClick={() => setEditing(true)}
                    className="text-xs px-2 py-1 rounded bg-dark-card text-gray-400 hover:text-white"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-xs px-2 py-1 rounded bg-dark-card text-gray-400 hover:text-urgent"
                  >
                    삭제
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </article>

      {/* 삭제 확인 모달 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="card max-w-sm w-full mx-4 space-y-4">
            <h3 className="font-bold">게시글을 삭제하시겠습니까?</h3>
            <p className="text-sm text-gray-400">삭제된 게시글은 복구할 수 없습니다.</p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn-outline text-sm"
              >
                취소
              </button>
              <button
                onClick={deletePost}
                className="bg-urgent hover:bg-urgent/80 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 신고 모달 */}
      {showReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="card max-w-sm w-full mx-4 space-y-4">
            <h3 className="font-bold">게시글 신고</h3>
            <div className="space-y-2">
              {REPORT_REASONS.map((r) => (
                <label
                  key={r}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="reason"
                    value={r}
                    checked={reportReason === r}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="text-primary focus:ring-primary"
                  />
                  <span className="text-sm">{r}</span>
                </label>
              ))}
            </div>
            <textarea
              value={reportDetail}
              onChange={(e) => setReportDetail(e.target.value)}
              placeholder="상세 내용 (선택)"
              rows={3}
              className="input-field resize-none text-sm"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowReport(false);
                  setReportReason("");
                  setReportDetail("");
                }}
                className="btn-outline text-sm"
              >
                취소
              </button>
              <button
                onClick={submitReport}
                disabled={!reportReason || reportSubmitting}
                className="bg-urgent hover:bg-urgent/80 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
              >
                {reportSubmitting ? "접수 중..." : "신고하기"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 댓글 섹션 */}
      <section className="space-y-4">
        <h2 className="font-bold">
          댓글 {post._count.comments}개
        </h2>

        {/* 댓글 작성 */}
        {session?.user?.userType === "USER" ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="댓글을 입력해주세요"
              className="input-field flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submitComment();
                }
              }}
            />
            <button
              onClick={() => submitComment()}
              disabled={!commentText.trim() || submittingComment}
              className="btn-primary text-sm shrink-0 disabled:opacity-50"
            >
              등록
            </button>
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            댓글을 작성하려면{" "}
            <Link href="/auth/login" className="text-primary-light hover:underline">
              로그인
            </Link>
            해주세요.
          </p>
        )}

        {/* 댓글 목록 */}
        {comments.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">
            아직 댓글이 없습니다. 첫 댓글을 남겨보세요.
          </p>
        ) : (
          <div className="space-y-0">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                isLoggedIn={!!session}
                isAdmin={!!isAdmin}
                onLike={toggleCommentLike}
                onDelete={deleteComment}
                onReply={(id) => {
                  setReplyingTo(replyingTo === id ? null : id);
                  setReplyText("");
                }}
                replyingTo={replyingTo}
                replyText={replyText}
                setReplyText={setReplyText}
                submitReply={(parentId) => submitComment(parentId)}
                submitting={submittingComment}
              />
            ))}
          </div>
        )}
      </section>

      {/* 하단 네비 */}
      <div className="flex items-center justify-between pt-4 border-t border-dark-border">
        <Link
          href={`/community/${boardSlug}`}
          className="btn-outline text-sm"
        >
          목록으로
        </Link>
      </div>
    </div>
  );
}

// 댓글 컴포넌트
function CommentItem({
  comment,
  isLoggedIn,
  isAdmin,
  onLike,
  onDelete,
  onReply,
  replyingTo,
  replyText,
  setReplyText,
  submitReply,
  submitting,
  isReply = false,
}: {
  comment: Comment;
  isLoggedIn: boolean;
  isAdmin: boolean;
  onLike: (id: string) => void;
  onDelete: (id: string) => void;
  onReply: (id: string) => void;
  replyingTo: string | null;
  replyText: string;
  setReplyText: (v: string) => void;
  submitReply: (parentId: string) => void;
  submitting: boolean;
  isReply?: boolean;
}) {
  return (
    <div className={`${isReply ? "ml-8 border-l-2 border-dark-border pl-4" : ""}`}>
      <div className="py-3 border-b border-dark-border/50">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center text-[10px] text-primary-light font-bold">
              {comment.author.nickname[0]}
            </div>
            <span className="text-sm font-medium">{comment.author.nickname}</span>
            <span className="text-xs text-gray-600">
              {formatDate(comment.createdAt)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {/* 좋아요 */}
            <button
              onClick={() => onLike(comment.id)}
              disabled={!isLoggedIn}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-xs transition-colors ${
                comment.isLiked
                  ? "text-urgent"
                  : "text-gray-500 hover:text-white"
              } disabled:opacity-40`}
            >
              <svg
                className="w-3.5 h-3.5"
                fill={comment.isLiked ? "currentColor" : "none"}
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              {comment._count.likes > 0 && comment._count.likes}
            </button>
            {/* 답글 */}
            {!isReply && isLoggedIn && (
              <button
                onClick={() => onReply(comment.id)}
                className="text-xs text-gray-500 hover:text-white px-1.5 py-0.5"
              >
                답글
              </button>
            )}
            {/* 삭제 */}
            {(comment.isOwner || isAdmin) && (
              <button
                onClick={() => onDelete(comment.id)}
                className="text-xs text-gray-500 hover:text-urgent px-1.5 py-0.5"
              >
                삭제
              </button>
            )}
          </div>
        </div>
        <p className="text-sm text-gray-300 mt-1.5 ml-8 whitespace-pre-wrap">
          {comment.content}
        </p>
      </div>

      {/* 대댓글 입력 */}
      {replyingTo === comment.id && (
        <div className="ml-8 py-2 flex gap-2">
          <input
            type="text"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder={`${comment.author.nickname}에게 답글...`}
            className="input-field flex-1 text-sm py-1.5"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submitReply(comment.id);
              }
            }}
          />
          <button
            onClick={() => submitReply(comment.id)}
            disabled={!replyText.trim() || submitting}
            className="btn-primary text-xs py-1.5 px-3 shrink-0 disabled:opacity-50"
          >
            등록
          </button>
        </div>
      )}

      {/* 대댓글 목록 */}
      {comment.replies?.map((reply) => (
        <CommentItem
          key={reply.id}
          comment={reply}
          isLoggedIn={isLoggedIn}
          isAdmin={isAdmin}
          onLike={onLike}
          onDelete={onDelete}
          onReply={onReply}
          replyingTo={replyingTo}
          replyText={replyText}
          setReplyText={setReplyText}
          submitReply={submitReply}
          submitting={submitting}
          isReply
        />
      ))}
    </div>
  );
}
