"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { REGIONS, BIZ_TYPES, EXPERIENCE_OPTIONS, CONTACT_TYPES } from "@/lib/constants";
import { getGuideForBizType } from "@/lib/salary-guide";

export default function SeekWritePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    desiredRegions: [] as string[],
    desiredBizTypes: [] as string[],
    experience: "",
    desiredCondition: "",
    description: "",
    contact: "",
    contactType: "KAKAO",
  });

  const updateField = (field: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleItem = (field: "desiredRegions" | "desiredBizTypes", item: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter((v) => v !== item)
        : [...prev[field], item],
    }));
  };

  // 권한 체크
  const isRegular = session?.user.userType === "USER" && session.user.grade === "REGULAR";
  const isLoggedIn = !!session;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.desiredRegions.length === 0) {
      setError("희망 지역을 1개 이상 선택해주세요.");
      return;
    }
    if (form.desiredBizTypes.length === 0) {
      setError("희망 업종을 1개 이상 선택해주세요.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "SEEK",
          title: form.title,
          region: form.desiredRegions[0],
          bizType: form.desiredBizTypes[0],
          description: form.description,
          contact: form.contact,
          contactType: form.contactType,
          desiredRegions: form.desiredRegions,
          desiredBizTypes: form.desiredBizTypes,
          experience: form.experience,
          desiredCondition: form.desiredCondition,
          // 구직글은 법적 동의 불필요
          agreeNoFraud: true,
          agreeNoDiscrimination: true,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        return;
      }

      router.push(`/jobs/${data.id}`);
    } catch {
      setError("등록 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 비로그인 또는 준회원
  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">구직글 작성</h1>
        <p className="text-gray-400 mb-6">로그인이 필요합니다.</p>
        <Link href="/auth/login" className="btn-primary py-3 px-6">
          로그인하기
        </Link>
      </div>
    );
  }

  if (!isRegular) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">구직글 작성</h1>
        <div className="card">
          <p className="text-gray-400 mb-2">정회원만 구직글을 작성할 수 있습니다.</p>
          <p className="text-sm text-gray-500 mb-4">
            현재 등급: <span className="text-secondary">준회원</span>
          </p>
          <p className="text-xs text-gray-600">
            관리자 승인 후 정회원이 되면 구직글을 작성할 수 있습니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-2">구직글 작성</h1>
      <p className="text-sm text-gray-400 mb-6">
        무료 · 무제한 작성 가능 · 열람은 유료 업소만
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
              className="input-field"
              placeholder="예: 경력 3년 여시 구직합니다"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              희망 지역 <span className="text-urgent">*</span>
              <span className="text-xs text-gray-600 ml-1">(복수 선택)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {REGIONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => toggleItem("desiredRegions", r)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                    form.desiredRegions.includes(r)
                      ? "bg-primary text-white"
                      : "bg-dark-card text-gray-400 hover:text-white"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            {form.desiredRegions.length > 0 && (
              <p className="text-xs text-primary-light mt-2">
                선택: {form.desiredRegions.join(", ")}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              희망 업종 <span className="text-urgent">*</span>
              <span className="text-xs text-gray-600 ml-1">(복수 선택)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {BIZ_TYPES.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => toggleItem("desiredBizTypes", b)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                    form.desiredBizTypes.includes(b)
                      ? "bg-primary text-white"
                      : "bg-dark-card text-gray-400 hover:text-white"
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
            {form.desiredBizTypes.length > 0 && (
              <p className="text-xs text-primary-light mt-2">
                선택: {form.desiredBizTypes.join(", ")}
              </p>
            )}

            {/* 선택 업종별 급여 가이드 */}
            {form.desiredBizTypes.length > 0 && (
              <div className="mt-3 space-y-1.5">
                <p className="text-xs text-gray-500">선택 업종 평균 급여 (일급 기준)</p>
                <div className="flex flex-wrap gap-2">
                  {form.desiredBizTypes.map((bt) => {
                    const guide = getGuideForBizType(bt);
                    if (!guide) return null;
                    return (
                      <span
                        key={bt}
                        className="text-xs bg-dark-card border border-dark-border rounded-lg px-2.5 py-1.5"
                      >
                        <span className="text-gray-400">{bt}</span>{" "}
                        <span className="text-secondary font-medium">
                          {guide.dailyMin}~{guide.dailyMax}만원
                        </span>
                      </span>
                    );
                  })}
                </div>
                <Link
                  href="/jobs/salary-guide"
                  className="text-[10px] text-gray-600 hover:text-primary-light transition-colors"
                >
                  전체 급여 가이드 보기 &rarr;
                </Link>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">
              경력 <span className="text-urgent">*</span>
            </label>
            <select
              value={form.experience}
              onChange={(e) => updateField("experience", e.target.value)}
              className="input-field"
              required
            >
              <option value="">경력 선택</option>
              {EXPERIENCE_OPTIONS.map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">
              희망 조건
            </label>
            <input
              type="text"
              value={form.desiredCondition}
              onChange={(e) => updateField("desiredCondition", e.target.value)}
              className="input-field"
              placeholder="급여, 근무시간 등 자유 입력"
            />
          </div>
        </div>

        {/* ─── 자기소개 & 연락처 ─── */}
        <div className="card space-y-4">
          <h2 className="font-bold text-sm text-gray-300">자기소개</h2>

          <div>
            <label className="block text-sm text-gray-400 mb-1">
              자기소개 <span className="text-urgent">*</span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              className="input-field min-h-[160px] resize-y"
              placeholder="본인의 경력, 강점, 원하는 근무 환경 등을 자유롭게 작성해주세요."
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                연락처 <span className="text-urgent">*</span>
              </label>
              <input
                type="text"
                value={form.contact}
                onChange={(e) => updateField("contact", e.target.value)}
                className="input-field"
                placeholder={form.contactType === "PHONE" ? "010-0000-0000" : "카카오톡 ID"}
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
          <p className="text-xs text-gray-600">
            열람권을 구매한 업소만 확인할 수 있습니다.
          </p>
        </div>

        {/* ─── 안내 ─── */}
        <div className="bg-dark-card border border-dark-border rounded-xl p-4 text-sm text-gray-400">
          <p className="font-medium text-gray-300 mb-2">구직글 안내</p>
          <ul className="space-y-1 text-xs">
            <li>· 구직글은 <span className="text-success">무료</span>이며 삭제 전까지 유지됩니다.</li>
            <li>· 연락처(카카오톡 ID)는 열람권을 구매한 업소만 볼 수 있습니다.</li>
            <li>· 미결제 업소에게는 블러 처리되어 노출됩니다.</li>
          </ul>
        </div>

        {/* ─── 제출 ─── */}
        <div className="flex gap-3">
          <Link href="/jobs?tab=seek" className="btn-outline flex-1 text-center py-3">
            취소
          </Link>
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary flex-1 py-3 disabled:opacity-50"
          >
            {isLoading ? "등록 중..." : "무료로 등록"}
          </button>
        </div>
      </form>
    </div>
  );
}
