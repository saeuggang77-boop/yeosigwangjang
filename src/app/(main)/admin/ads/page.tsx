"use client";

import { useCallback, useEffect, useState } from "react";

interface AdItem {
  id: string;
  type: string;
  bannerImage: string | null;
  bannerLink: string | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isExpired: boolean;
  createdAt: string;
  business: { id: string; name: string; slug: string; category: string } | null;
  payment: { amount: number; months: number; status: string } | null;
}

interface BusinessOption {
  id: string;
  name: string;
}

const AD_TYPES = [
  { value: "MAIN_BANNER", label: "메인 배너" },
  { value: "JOB_PAGE_BANNER", label: "구인 페이지 배너" },
  { value: "POPUP", label: "팝업 광고" },
  { value: "PREMIUM", label: "프리미엄" },
  { value: "BASIC", label: "기본" },
];

const TYPE_LABEL: Record<string, string> = {
  MAIN_BANNER: "메인 배너",
  JOB_PAGE_BANNER: "구인 배너",
  POPUP: "팝업",
  PREMIUM: "프리미엄",
  BASIC: "기본",
};

const TYPE_COLOR: Record<string, string> = {
  MAIN_BANNER: "bg-premium-gold/20 text-premium-gold",
  JOB_PAGE_BANNER: "bg-primary/20 text-primary-light",
  POPUP: "bg-accent/20 text-accent",
  PREMIUM: "bg-secondary/20 text-secondary",
  BASIC: "bg-dark-border text-gray-400",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("ko-KR", {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
  });
}

export default function AdminAdsPage() {
  const [ads, setAds] = useState<AdItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // 등록 폼
  const [showForm, setShowForm] = useState(false);
  const [businesses, setBusinesses] = useState<BusinessOption[]>([]);
  const [form, setForm] = useState({
    type: "MAIN_BANNER",
    bannerImage: "",
    bannerLink: "",
    businessId: "",
    startDate: "",
    endDate: "",
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchAds = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`/api/admin/ads?${params}`);
      const data = await res.json();
      setAds(data.ads || []);
    } catch {
      setAds([]);
    } finally {
      setIsLoading(false);
    }
  }, [typeFilter, statusFilter]);

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  // 업체 목록 fetch (폼 열릴 때)
  useEffect(() => {
    if (!showForm) return;
    async function loadBusinesses() {
      try {
        const res = await fetch("/api/admin/businesses");
        const data = await res.json();
        setBusinesses(data.businesses || []);
      } catch {
        setBusinesses([]);
      }
    }
    loadBusinesses();
  }, [showForm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!form.businessId) {
      setFormError("업체를 선택해주세요.");
      return;
    }
    if (!form.startDate || !form.endDate) {
      setFormError("시작일과 종료일을 입력해주세요.");
      return;
    }

    setFormLoading(true);
    try {
      const res = await fetch("/api/admin/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        setFormError(data.error);
        return;
      }

      setForm({
        type: "MAIN_BANNER",
        bannerImage: "",
        bannerLink: "",
        businessId: "",
        startDate: "",
        endDate: "",
      });
      setShowForm(false);
      fetchAds();
    } catch {
      setFormError("등록 중 오류가 발생했습니다.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleAction = async (adId: string, action: string) => {
    if (action === "delete" && !confirm("이 광고를 삭제하시겠습니까?")) return;
    setActionLoading(adId);
    try {
      const res = await fetch("/api/admin/ads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adId, action }),
      });
      if (res.ok) fetchAds();
      else alert((await res.json()).error);
    } catch {
      alert("처리 중 오류가 발생했습니다.");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">광고 관리</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className={
            showForm
              ? "btn-outline text-sm py-2 px-4"
              : "btn-primary text-sm py-2 px-4"
          }
        >
          {showForm ? "취소" : "광고 등록"}
        </button>
      </div>

      {/* 안내 */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-4 text-xs text-gray-400">
        <p className="font-medium text-gray-300 mb-1">광고 타입 안내</p>
        <ul className="space-y-0.5">
          <li>
            &middot; <strong>메인 배너</strong> — 홈 최상단 슬라이더 (자동 롤링)
          </li>
          <li>
            &middot; <strong>구인 페이지 배너</strong> — 구인구직 페이지 상단
          </li>
          <li>
            &middot; <strong>팝업 광고</strong> — 사이트 진입 시 1일 1회 노출
          </li>
          <li>
            &middot; <strong>프리미엄/기본</strong> — 업체 디렉토리 노출 등급
          </li>
        </ul>
      </div>

      {/* 등록 폼 */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card space-y-4">
          <h2 className="font-bold text-sm text-gray-300">광고 등록</h2>

          {formError && (
            <p className="text-urgent text-sm bg-urgent/10 py-2 px-3 rounded-lg">
              {formError}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                광고 타입 <span className="text-urgent">*</span>
              </label>
              <select
                value={form.type}
                onChange={(e) =>
                  setForm((p) => ({ ...p, type: e.target.value }))
                }
                className="input-field"
              >
                {AD_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">
                업체 <span className="text-urgent">*</span>
              </label>
              <select
                value={form.businessId}
                onChange={(e) =>
                  setForm((p) => ({ ...p, businessId: e.target.value }))
                }
                className="input-field"
              >
                <option value="">업체 선택</option>
                {businesses.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              {businesses.length === 0 && (
                <p className="text-xs text-gray-600 mt-1">
                  등록된 업체가 없습니다.
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">
              배너 이미지 URL
            </label>
            <input
              type="url"
              value={form.bannerImage}
              onChange={(e) =>
                setForm((p) => ({ ...p, bannerImage: e.target.value }))
              }
              className="input-field"
              placeholder="https://example.com/banner.jpg"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">
              클릭 링크 URL
            </label>
            <input
              type="url"
              value={form.bannerLink}
              onChange={(e) =>
                setForm((p) => ({ ...p, bannerLink: e.target.value }))
              }
              className="input-field"
              placeholder="https://example.com"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                시작일 <span className="text-urgent">*</span>
              </label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) =>
                  setForm((p) => ({ ...p, startDate: e.target.value }))
                }
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                종료일 <span className="text-urgent">*</span>
              </label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) =>
                  setForm((p) => ({ ...p, endDate: e.target.value }))
                }
                className="input-field"
              />
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

      {/* 필터 */}
      <div className="flex flex-wrap gap-2">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="input-field w-auto text-sm py-2"
        >
          <option value="all">전체 타입</option>
          {AD_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-field w-auto text-sm py-2"
        >
          <option value="all">전체 상태</option>
          <option value="active">활성</option>
          <option value="expired">만료</option>
          <option value="inactive">비활성</option>
        </select>
      </div>

      {/* 목록 */}
      {isLoading ? (
        <div className="text-center py-16 text-gray-500">로딩 중...</div>
      ) : ads.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 mb-4">등록된 광고가 없습니다.</p>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary text-sm"
          >
            첫 번째 광고 등록하기
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {ads.map((ad) => (
            <div
              key={ad.id}
              className={`card ${
                !ad.isActive || ad.isExpired ? "opacity-60" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {/* 타입 뱃지 */}
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-medium ${
                        TYPE_COLOR[ad.type] || "bg-dark-border text-gray-400"
                      }`}
                    >
                      {TYPE_LABEL[ad.type] || ad.type}
                    </span>

                    {/* 상태 */}
                    {ad.isExpired ? (
                      <span className="text-xs text-gray-600">만료</span>
                    ) : !ad.isActive ? (
                      <span className="text-xs text-urgent">비활성</span>
                    ) : (
                      <span className="text-xs text-success">활성</span>
                    )}

                    {/* 결제 정보 */}
                    {ad.payment && (
                      <span className="text-xs text-gray-600">
                        {ad.payment.amount.toLocaleString()}원 /{" "}
                        {ad.payment.months}개월
                      </span>
                    )}
                  </div>

                  {/* 업체명 */}
                  <p className="text-sm font-medium">
                    {ad.business?.name || "업체 없음"}
                    {ad.business?.category && (
                      <span className="text-xs text-gray-500 ml-1.5">
                        ({ad.business.category})
                      </span>
                    )}
                  </p>

                  {/* 기간 */}
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDate(ad.startDate)} ~ {formatDate(ad.endDate)}
                  </p>

                  {/* 이미지/링크 미리보기 */}
                  <div className="flex items-center gap-3 mt-1.5">
                    {ad.bannerImage && (
                      <a
                        href={ad.bannerImage}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary-light hover:underline"
                      >
                        이미지 보기
                      </a>
                    )}
                    {ad.bannerLink && (
                      <a
                        href={ad.bannerLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary-light hover:underline"
                      >
                        링크 보기
                      </a>
                    )}
                  </div>
                </div>

                {/* 액션 버튼 */}
                <div className="flex gap-1.5 shrink-0">
                  {ad.isActive ? (
                    <button
                      onClick={() => handleAction(ad.id, "deactivate")}
                      disabled={actionLoading === ad.id}
                      className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded border border-dark-border hover:border-gray-500 transition-colors disabled:opacity-50"
                    >
                      비활성
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAction(ad.id, "activate")}
                      disabled={actionLoading === ad.id}
                      className="text-xs text-success hover:text-white px-2 py-1 rounded border border-success/30 hover:border-success transition-colors disabled:opacity-50"
                    >
                      활성화
                    </button>
                  )}
                  <button
                    onClick={() => handleAction(ad.id, "delete")}
                    disabled={actionLoading === ad.id}
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
