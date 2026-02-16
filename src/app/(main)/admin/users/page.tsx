"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface UserItem {
  id: string;
  email: string | null;
  nickname?: string;
  role?: string;
  grade?: string;
  isVerified?: boolean;
  // AD 전용
  representName?: string;
  bizRegNumber?: string;
  phone?: string;
  isApproved?: boolean;
  createdAt: string;
}

export default function AdminUsersPage() {
  return (
    <Suspense>
      <UsersContent />
    </Suspense>
  );
}

function UsersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const type = searchParams.get("type") || "user";
  const filter = searchParams.get("filter") || "all";
  const page = parseInt(searchParams.get("page") || "1");

  const [users, setUsers] = useState<UserItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ type, filter, page: page.toString() });
      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      setUsers(data.users || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotal(data.pagination?.total || 0);
    } catch {
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [type, filter, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    if (key !== "page") params.set("page", "1");
    router.push(`/admin/users?${params}`);
  };

  const handleAction = async (userId: string, action: string) => {
    setActionLoading(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, type, action }),
      });
      const data = await res.json();
      if (res.ok) {
        fetchUsers();
      } else {
        alert(data.error);
      }
    } catch {
      alert("처리 중 오류가 발생했습니다.");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">회원 관리</h1>
        <span className="text-sm text-gray-500">총 {total}명</span>
      </div>

      {/* 회원 유형 탭 */}
      <div className="flex gap-2">
        {[
          { key: "user", label: "일반 회원" },
          { key: "ad", label: "광고 업체" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => updateParam("type", t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              type === t.key
                ? "bg-primary text-white"
                : "bg-dark-card text-gray-400 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 필터 */}
      <div className="flex gap-2">
        {[
          { key: "all", label: "전체" },
          { key: "pending", label: type === "ad" ? "승인 대기" : "준회원" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => updateParam("filter", f.key)}
            className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
              filter === f.key
                ? "bg-accent/20 text-accent"
                : "bg-dark-card text-gray-500 hover:text-white"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* 목록 */}
      {isLoading ? (
        <div className="text-center py-16 text-gray-500">로딩 중...</div>
      ) : users.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          {filter === "pending" ? "대기 중인 회원이 없습니다." : "회원이 없습니다."}
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((user) => (
            <div key={user.id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {type === "ad" ? (
                    // 광고 업체
                    <>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-sm">
                          {user.representName}
                        </p>
                        {user.isApproved ? (
                          <span className="badge-verified text-xs">승인</span>
                        ) : (
                          <span className="text-xs text-accent bg-accent/10 px-2 py-0.5 rounded">
                            대기
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {user.email} &middot; {user.bizRegNumber} &middot;{" "}
                        {user.phone}
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {new Date(user.createdAt).toLocaleDateString("ko-KR")}
                      </p>
                    </>
                  ) : (
                    // 일반 회원
                    <>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-sm">{user.nickname}</p>
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            user.grade === "REGULAR"
                              ? "bg-success/10 text-success"
                              : "bg-gray-700 text-gray-400"
                          }`}
                        >
                          {user.grade === "REGULAR" ? "정회원" : "준회원"}
                        </span>
                        {user.role === "STAFF" && (
                          <span className="text-xs text-primary-light bg-primary/10 px-2 py-0.5 rounded">
                            스태프
                          </span>
                        )}
                        {user.role === "ADMIN" && (
                          <span className="text-xs text-urgent bg-urgent/10 px-2 py-0.5 rounded">
                            관리자
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {user.email || "이메일 없음"} &middot;{" "}
                        {new Date(user.createdAt).toLocaleDateString("ko-KR")}
                      </p>
                    </>
                  )}
                </div>

                {/* 액션 버튼 */}
                <div className="flex gap-2 shrink-0">
                  {type === "ad" ? (
                    user.isApproved ? (
                      <button
                        onClick={() => handleAction(user.id, "revoke")}
                        disabled={actionLoading === user.id}
                        className="text-xs text-gray-400 hover:text-urgent px-2 py-1 rounded border border-dark-border hover:border-urgent transition-colors disabled:opacity-50"
                      >
                        승인 취소
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAction(user.id, "approve")}
                        disabled={actionLoading === user.id}
                        className="text-xs text-success hover:text-white px-3 py-1 rounded border border-success/30 hover:border-success hover:bg-success/10 transition-colors disabled:opacity-50"
                      >
                        {actionLoading === user.id ? "..." : "승인"}
                      </button>
                    )
                  ) : user.role !== "ADMIN" ? (
                    <>
                      {user.grade === "ASSOCIATE" ? (
                        <button
                          onClick={() => handleAction(user.id, "approve")}
                          disabled={actionLoading === user.id}
                          className="text-xs text-success hover:text-white px-3 py-1 rounded border border-success/30 hover:border-success hover:bg-success/10 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === user.id ? "..." : "정회원 승인"}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAction(user.id, "revoke")}
                          disabled={actionLoading === user.id}
                          className="text-xs text-gray-400 hover:text-urgent px-2 py-1 rounded border border-dark-border hover:border-urgent transition-colors disabled:opacity-50"
                        >
                          준회원으로
                        </button>
                      )}
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => updateParam("page", p.toString())}
              className={`w-9 h-9 rounded-lg text-sm ${
                p === page
                  ? "bg-primary text-white"
                  : "bg-dark-card text-gray-400 hover:text-white"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
