"use client";

import { useCallback, useEffect, useState } from "react";

interface EventItem {
  id: string;
  title: string;
  description: string;
  image: string | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isExpired: boolean;
  business: { id: string; name: string };
}

interface BizOption {
  id: string;
  name: string;
}

export default function AdEventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [businesses, setBusinesses] = useState<BizOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // 생성 폼
  const [showForm, setShowForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    businessId: "",
    title: "",
    description: "",
    image: "",
    startDate: "",
    endDate: "",
  });

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/ad/events");
      const data = await res.json();
      setEvents(data.events || []);
      setBusinesses(data.businesses || []);
      if (data.businesses?.length > 0 && !form.businessId) {
        setForm((p) => ({ ...p, businessId: data.businesses[0].id }));
      }
    } catch {
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  }, [form.businessId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!form.businessId || !form.title || !form.description || !form.startDate || !form.endDate) {
      setFormError("필수 항목을 입력해주세요.");
      return;
    }

    setIsCreating(true);
    try {
      const res = await fetch("/api/ad/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error);
        return;
      }
      setForm((p) => ({ ...p, title: "", description: "", image: "", startDate: "", endDate: "" }));
      setShowForm(false);
      fetchEvents();
    } catch {
      setFormError("생성 중 오류가 발생했습니다.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleAction = async (eventId: string, action: "toggle" | "delete") => {
    if (action === "delete" && !confirm("이벤트를 삭제하시겠습니까?")) return;

    setActionLoading(eventId);
    try {
      const res = await fetch("/api/ad/events", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, action }),
      });
      if (res.ok) fetchEvents();
    } catch {
      alert("처리 중 오류가 발생했습니다.");
    } finally {
      setActionLoading(null);
    }
  };

  const activeCount = events.filter((e) => e.isActive && !e.isExpired).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">이벤트 관리</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-xs text-secondary hover:text-white px-3 py-1.5 rounded-lg border border-secondary/30 hover:border-secondary hover:bg-secondary/10 transition-colors"
        >
          {showForm ? "취소" : "+ 이벤트 등록"}
        </button>
      </div>

      {/* 요약 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card text-center">
          <p className="text-xs text-gray-500">진행 중</p>
          <p className="text-lg font-bold text-success mt-1">{activeCount}건</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-500">총 이벤트</p>
          <p className="text-lg font-bold mt-1">{events.length}건</p>
        </div>
      </div>

      {/* 생성 폼 */}
      {showForm && (
        <form onSubmit={handleCreate} className="card space-y-4 border-secondary/20">
          <h2 className="font-bold text-sm">새 이벤트 등록</h2>

          {formError && (
            <p className="text-urgent text-sm bg-urgent/10 py-2 px-3 rounded-lg">{formError}</p>
          )}

          {businesses.length > 1 && (
            <div>
              <label className="block text-sm text-gray-400 mb-1">업체</label>
              <select
                value={form.businessId}
                onChange={(e) => setForm((p) => ({ ...p, businessId: e.target.value }))}
                className="input-field"
                required
              >
                {businesses.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-400 mb-1">
              이벤트 제목 <span className="text-urgent">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              className="input-field"
              placeholder="예: 신규 고객 20% 할인"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">
              설명 <span className="text-urgent">*</span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              className="input-field min-h-[80px] resize-none"
              placeholder="이벤트 상세 내용을 입력해주세요."
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">이미지 URL (선택)</label>
            <input
              type="url"
              value={form.image}
              onChange={(e) => setForm((p) => ({ ...p, image: e.target.value }))}
              className="input-field"
              placeholder="https://..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                시작일 <span className="text-urgent">*</span>
              </label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                종료일 <span className="text-urgent">*</span>
              </label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))}
                className="input-field"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isCreating}
            className="btn-primary py-2.5 w-full disabled:opacity-50"
          >
            {isCreating ? "등록 중..." : "이벤트 등록"}
          </button>
        </form>
      )}

      {/* 이벤트 목록 */}
      {isLoading ? (
        <div className="text-center py-16 text-gray-500">로딩 중...</div>
      ) : businesses.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p>등록된 업체가 없습니다.</p>
          <p className="text-xs text-gray-500 mt-1">업체 등록 후 이벤트를 생성할 수 있습니다.</p>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p>등록된 이벤트가 없습니다.</p>
          <button
            onClick={() => setShowForm(true)}
            className="text-xs text-secondary hover:underline mt-2"
          >
            첫 이벤트 등록하기
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => {
            const isRunning = event.isActive && !event.isExpired;
            return (
              <div key={event.id} className="card">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-sm">{event.title}</p>
                      {isRunning ? (
                        <span className="text-xs text-success bg-success/10 px-2 py-0.5 rounded">
                          진행 중
                        </span>
                      ) : event.isExpired ? (
                        <span className="text-xs text-gray-400 bg-gray-700 px-2 py-0.5 rounded">
                          종료
                        </span>
                      ) : (
                        <span className="text-xs text-accent bg-accent/10 px-2 py-0.5 rounded">
                          숨김
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{event.business.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{event.description}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {new Date(event.startDate).toLocaleDateString("ko-KR")} ~{" "}
                      {new Date(event.endDate).toLocaleDateString("ko-KR")}
                    </p>
                  </div>

                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      onClick={() => handleAction(event.id, "toggle")}
                      disabled={actionLoading === event.id}
                      className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded border border-dark-border hover:border-gray-500 transition-colors disabled:opacity-50"
                    >
                      {event.isActive ? "숨기기" : "활성화"}
                    </button>
                    <button
                      onClick={() => handleAction(event.id, "delete")}
                      disabled={actionLoading === event.id}
                      className="text-xs text-gray-400 hover:text-urgent px-2 py-1 rounded border border-dark-border hover:border-urgent transition-colors disabled:opacity-50"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
