"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { REGIONS, SUB_REGIONS, BIZ_TYPES, BENEFIT_OPTIONS, CONTACT_TYPES } from "@/lib/constants";
import { filterJobForm } from "@/lib/filter";
import { JOB_PRICES, formatPriceWithUnit } from "@/lib/pricing";

export default function JobWritePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [filterWarning, setFilterWarning] = useState<string[]>([]);

  const [form, setForm] = useState({
    title: "",
    bizName: session?.user.bizName || "",
    region: "",
    subRegion: "",
    bizType: "",
    salary: "",
    workHours: "",
    requirements: "",
    benefits: [] as string[],
    description: "",
    contact: "",
    contactType: "KAKAO",
    tier: "FREE",
    isUrgent: false,
    agreeNoFraud: false,
    agreeNoDiscrimination: false,
    // 비회원용
    guestEmail: "",
    guestPhone: "",
  });

  const updateField = (field: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleBenefit = (benefit: string) => {
    setForm((prev) => ({
      ...prev,
      benefits: prev.benefits.includes(benefit)
        ? prev.benefits.filter((b) => b !== benefit)
        : [...prev.benefits, benefit],
    }));
  };

  // 실시간 차별 필터링
  const checkFilter = () => {
    const result = filterJobForm({
      title: form.title,
      description: form.description,
      requirements: form.requirements,
      salary: form.salary,
    });
    if (!result.isClean) {
      setFilterWarning(result.violations.map((v) => `[${v.category}] "${v.keyword}"`));
    } else {
      setFilterWarning([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.agreeNoFraud || !form.agreeNoDiscrimination) {
      setError("필수 동의 항목을 체크해주세요.");
      return;
    }

    // 비회원 체크
    if (!session && !form.guestEmail) {
      setError("비회원은 이메일을 입력해주세요.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "HIRE",
          ...form,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        return;
      }

      // 무료: 바로 완료, 유료: 결제 페이지로 (TODO)
      if (form.tier === "FREE") {
        router.push(`/jobs/${data.id}`);
      } else {
        // TODO: 결제 페이지
        router.push(`/jobs/${data.id}`);
      }
    } catch {
      setError("등록 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const subRegions = form.region ? SUB_REGIONS[form.region] || [] : [];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-2">구인글 등록</h1>
      <p className="text-sm text-gray-400 mb-6">
        {session
          ? `${session.user.bizName || session.user.nickname || session.user.email}님의 구인글`
          : "비회원도 등록 가능합니다. 이메일을 입력해주세요."}
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <p className="text-urgent text-sm bg-urgent/10 py-3 px-4 rounded-lg">
            {error}
          </p>
        )}

        {/* ─── 기본 정보 ─── */}
        <div className="card space-y-4">
          <h2 className="font-bold text-sm text-gray-300">기본 정보</h2>

          <div>
            <label className="block text-sm text-gray-400 mb-1">
              제목 <span className="text-urgent">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
              onBlur={checkFilter}
              className="input-field"
              placeholder="예: 강남 OO클럽 직원 모집"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">
              업소명 <span className="text-urgent">*</span>
            </label>
            <input
              type="text"
              value={form.bizName}
              onChange={(e) => updateField("bizName", e.target.value)}
              className="input-field"
              placeholder="업소 이름"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                지역 <span className="text-urgent">*</span>
              </label>
              <select
                value={form.region}
                onChange={(e) => {
                  updateField("region", e.target.value);
                  updateField("subRegion", "");
                }}
                className="input-field"
                required
              >
                <option value="">시/도</option>
                {REGIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                세부 지역
              </label>
              <select
                value={form.subRegion}
                onChange={(e) => updateField("subRegion", e.target.value)}
                className="input-field"
                disabled={subRegions.length === 0}
              >
                <option value="">구/군</option>
                {subRegions.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">
              업종 <span className="text-urgent">*</span>
            </label>
            <select
              value={form.bizType}
              onChange={(e) => updateField("bizType", e.target.value)}
              className="input-field"
              required
            >
              <option value="">업종 선택</option>
              {BIZ_TYPES.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                급여 조건 <span className="text-urgent">*</span>
              </label>
              <input
                type="text"
                value={form.salary}
                onChange={(e) => updateField("salary", e.target.value)}
                onBlur={checkFilter}
                className="input-field"
                placeholder="TC 협의, 일급 등"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                근무시간 <span className="text-urgent">*</span>
              </label>
              <input
                type="text"
                value={form.workHours}
                onChange={(e) => updateField("workHours", e.target.value)}
                className="input-field"
                placeholder="오후 8시~새벽 3시"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">
              우대 조건
            </label>
            <input
              type="text"
              value={form.requirements}
              onChange={(e) => updateField("requirements", e.target.value)}
              onBlur={checkFilter}
              className="input-field"
              placeholder="예: 경력 우대"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              복리후생
            </label>
            <div className="flex flex-wrap gap-2">
              {BENEFIT_OPTIONS.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => toggleBenefit(b)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                    form.benefits.includes(b)
                      ? "bg-primary text-white"
                      : "bg-dark-card text-gray-400 hover:text-white"
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ─── 상세 & 연락처 ─── */}
        <div className="card space-y-4">
          <h2 className="font-bold text-sm text-gray-300">상세 내용</h2>

          <div>
            <label className="block text-sm text-gray-400 mb-1">
              상세 설명 <span className="text-urgent">*</span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              onBlur={checkFilter}
              className="input-field min-h-[160px] resize-y"
              placeholder="업소 분위기, 근무 조건, 혜택 등을 상세히 작성해주세요."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                연락처 <span className="text-urgent">*</span>
              </label>
              <input
                type="text"
                value={form.contact}
                onChange={(e) => updateField("contact", e.target.value)}
                className="input-field"
                placeholder="전화번호 또는 카카오톡 ID"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                연락 방법 <span className="text-urgent">*</span>
              </label>
              <select
                value={form.contactType}
                onChange={(e) => updateField("contactType", e.target.value)}
                className="input-field"
              >
                {CONTACT_TYPES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 차별 필터링 경고 */}
        {filterWarning.length > 0 && (
          <div className="bg-urgent/10 border border-urgent/30 rounded-lg p-4">
            <p className="text-urgent text-sm font-bold mb-2">
              차별적·허위 표현이 감지되었습니다
            </p>
            <ul className="text-xs text-gray-300 space-y-1">
              {filterWarning.map((w, i) => (
                <li key={i}>· {w}</li>
              ))}
            </ul>
            <p className="text-xs text-gray-500 mt-2">
              해당 표현을 수정하지 않으면 등록할 수 없습니다.
            </p>
          </div>
        )}

        {/* ─── 비회원 정보 ─── */}
        {!session && (
          <div className="card space-y-4">
            <h2 className="font-bold text-sm text-gray-300">비회원 정보</h2>
            <p className="text-xs text-gray-500">
              수정/삭제 링크가 이메일로 발송됩니다.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  이메일 <span className="text-urgent">*</span>
                </label>
                <input
                  type="email"
                  value={form.guestEmail}
                  onChange={(e) => updateField("guestEmail", e.target.value)}
                  className="input-field"
                  placeholder="email@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  연락처
                </label>
                <input
                  type="tel"
                  value={form.guestPhone}
                  onChange={(e) => updateField("guestPhone", e.target.value)}
                  className="input-field"
                  placeholder="010-0000-0000"
                />
              </div>
            </div>
          </div>
        )}

        {/* ─── 상품 선택 ─── */}
        <div className="card space-y-4">
          <h2 className="font-bold text-sm text-gray-300">상품 선택</h2>

          <div className="grid grid-cols-3 gap-3">
            {(["FREE", "BASIC", "PREMIUM"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => updateField("tier", t)}
                className={`p-4 rounded-xl border text-center transition-all ${
                  form.tier === t
                    ? t === "PREMIUM"
                      ? "border-premium-border bg-premium-border/10"
                      : "border-primary bg-primary/10"
                    : "border-dark-border hover:border-gray-500"
                }`}
              >
                <p className="font-bold text-sm">
                  {t === "PREMIUM" ? "프리미엄" : t === "BASIC" ? "기본" : "무료"}
                </p>
                <p className="text-xs text-secondary mt-1">
                  {formatPriceWithUnit(JOB_PRICES[t])}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {t === "PREMIUM"
                    ? "상단고정 · 사진5장"
                    : t === "BASIC"
                      ? "일반노출 · 사진3장"
                      : "최하단 · 사진불가"}
                </p>
              </button>
            ))}
          </div>

          {form.tier !== "FREE" && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isUrgent}
                onChange={(e) => updateField("isUrgent", e.target.checked)}
                className="accent-urgent"
              />
              <span className="text-sm">
                긴급 구인 추가 (+{formatPriceWithUnit(JOB_PRICES.URGENT)}, 7일)
              </span>
            </label>
          )}
        </div>

        {/* ─── 법적 동의 (v6) ─── */}
        <div className="card space-y-3">
          <h2 className="font-bold text-sm text-gray-300">필수 동의</h2>

          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.agreeNoFraud}
              onChange={(e) => updateField("agreeNoFraud", e.target.checked)}
              className="accent-primary mt-0.5"
            />
            <span className="text-sm text-gray-400">
              본 구인 내용은 사실이며, 허위·과장 시 직업안정법에 의해 처벌받을 수
              있습니다.
            </span>
          </label>

          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.agreeNoDiscrimination}
              onChange={(e) =>
                updateField("agreeNoDiscrimination", e.target.checked)
              }
              className="accent-primary mt-0.5"
            />
            <span className="text-sm text-gray-400">
              성별·나이·외모 등 차별적 조건을 포함하지 않았음을 확인합니다.
            </span>
          </label>

          <p className="text-xs text-gray-600">
            차별적·허위 구인은 법률 위반입니다. (남녀고용평등법, 직업안정법)
          </p>
        </div>

        {/* ─── 제출 ─── */}
        <div className="flex gap-3">
          <Link
            href="/jobs"
            className="btn-outline flex-1 text-center py-3"
          >
            취소
          </Link>
          <button
            type="submit"
            disabled={isLoading || filterWarning.length > 0}
            className="btn-primary flex-1 py-3 disabled:opacity-50"
          >
            {isLoading
              ? "등록 중..."
              : form.tier === "FREE"
                ? "무료로 등록"
                : `${formatPriceWithUnit(
                    JOB_PRICES[form.tier as keyof typeof JOB_PRICES] +
                      (form.isUrgent ? JOB_PRICES.URGENT : 0)
                  )} 결제하고 등록`}
          </button>
        </div>
      </form>
    </div>
  );
}
