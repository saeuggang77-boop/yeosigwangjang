"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { REGIONS, SUB_REGIONS, BIZ_TYPES, BENEFIT_OPTIONS, CONTACT_TYPES, BANK_ACCOUNT } from "@/lib/constants";
import { filterJobForm } from "@/lib/filter";
import { JOB_PRICES, formatPriceWithUnit } from "@/lib/pricing";
import { getGuideForBizType, compareSalary } from "@/lib/salary-guide";

type TierKey = "LIGHT" | "BASIC" | "PREMIUM" | "PKG_BASIC" | "PKG_PREMIUM";

const TIER_OPTIONS: {
  key: TierKey;
  label: string;
  price: number;
  desc: string;
  benefits?: string[];
  borderClass: string;
  bizOnly?: boolean;
}[] = [
  {
    key: "LIGHT",
    label: "라이트",
    price: JOB_PRICES.LIGHT,
    desc: "최하단 · 텍스트만 · 사진불가",
    borderClass: "border-primary bg-primary/10",
  },
  {
    key: "BASIC",
    label: "기본",
    price: JOB_PRICES.BASIC,
    desc: "일반노출 · 사진3장",
    borderClass: "border-primary bg-primary/10",
  },
  {
    key: "PREMIUM",
    label: "프리미엄",
    price: JOB_PRICES.PREMIUM,
    desc: "상단고정 · 사진5장",
    borderClass: "border-premium-border bg-premium-border/10",
  },
  {
    key: "PKG_BASIC",
    label: "기본패키지",
    price: JOB_PRICES.PKG_BASIC,
    desc: "기본 구인글 + 열람권",
    benefits: ["기본 구인글 30일", "구직글 열람권 1개월"],
    borderClass: "border-secondary bg-secondary/10",
    bizOnly: true,
  },
  {
    key: "PKG_PREMIUM",
    label: "프리미엄패키지",
    price: JOB_PRICES.PKG_PREMIUM,
    desc: "프리미엄 + 열람권 + 긴급",
    benefits: ["프리미엄 구인글 30일", "구직글 열람권 1개월", "긴급 구인 7일 포함"],
    borderClass: "border-premium-border bg-premium-border/10",
    bizOnly: true,
  },
];

// 유료 결제 필요한 tier
const PAID_TIERS = new Set<TierKey>(["LIGHT", "BASIC", "PREMIUM", "PKG_BASIC", "PKG_PREMIUM"]);

// checkout에 전달할 packageType 매핑
const CHECKOUT_TYPE: Record<string, string> = {
  LIGHT: "LIGHT",
  BASIC: "BASIC",
  PREMIUM: "PREMIUM",
  PKG_BASIC: "PKG_BASIC",
  PKG_PREMIUM: "PKG_PREMIUM",
};

function getSubmitPrice(tier: TierKey, isUrgent: boolean): number {
  const base = TIER_OPTIONS.find((t) => t.key === tier)?.price ?? 0;
  // 긴급 추가: 단품만 (패키지 PREMIUM은 이미 포함, LIGHT 제외)
  const urgentExtra =
    isUrgent && tier !== "LIGHT" && tier !== "PKG_PREMIUM"
      ? JOB_PRICES.URGENT
      : 0;
  return base + urgentExtra;
}

export default function JobWritePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [filterWarning, setFilterWarning] = useState<string[]>([]);

  const isBiz = session?.user.userType === "BIZ";

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
    tier: "LIGHT" as TierKey,
    isUrgent: false,
    agreeNoFraud: false,
    agreeNoDiscrimination: false,
    // 비회원용
    guestEmail: "",
    guestPhone: "",
    // 결제 수단
    paymentMethod: "TOSS" as "TOSS" | "BANK_TRANSFER",
    depositorName: "",
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

  // 유료 결제 플로우 (checkout → Toss → confirm)
  const handlePaidSubmit = async () => {
    const jobData = {
      title: form.title,
      bizName: form.bizName,
      region: form.region,
      subRegion: form.subRegion,
      bizType: form.bizType,
      salary: form.salary,
      workHours: form.workHours,
      requirements: form.requirements,
      benefits: form.benefits,
      description: form.description,
      contact: form.contact,
      contactType: form.contactType,
      images: [],
      agreeNoFraud: form.agreeNoFraud,
      agreeNoDiscrimination: form.agreeNoDiscrimination,
    };

    // 1. Checkout — 결제 주문 생성
    const checkoutRes = await fetch("/api/biz/package/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        packageType: CHECKOUT_TYPE[form.tier],
        jobData,
        isUrgent: form.isUrgent,
        paymentMethod: form.paymentMethod,
        depositorName: form.depositorName,
      }),
    });

    const checkoutData = await checkoutRes.json();
    if (!checkoutRes.ok) {
      setError(checkoutData.error || "결제 준비 중 오류가 발생했습니다.");
      return;
    }

    // 2. 무통장 입금이면 토스 SDK 건너뛰고 바로 confirm
    const isBankTransfer = checkoutData.paymentMethod === "BANK_TRANSFER";

    const confirmRes = await fetch("/api/biz/package/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paymentKey: isBankTransfer ? null : `test_${Date.now()}`,
        orderId: checkoutData.orderId,
        amount: checkoutData.amount,
        jobData,
        paymentMethod: isBankTransfer ? "BANK_TRANSFER" : "TOSS",
      }),
    });

    const confirmData = await confirmRes.json();
    if (!confirmRes.ok) {
      setError(confirmData.error || "결제 처리 중 오류가 발생했습니다.");
      return;
    }

    // 3. 성공
    if (isBankTransfer) {
      alert(
        "무통장 입금 신청이 완료되었습니다.\n\n" +
        `입금 계좌: ${BANK_ACCOUNT.bankName} ${BANK_ACCOUNT.accountNumber}\n` +
        `예금주: ${BANK_ACCOUNT.accountHolder}\n` +
        `금액: ${checkoutData.amount.toLocaleString()}원\n\n` +
        "입금 확인 후 구인글이 활성화됩니다."
      );
      router.push("/biz/jobs");
      return;
    }

    const extras: string[] = [];
    if (confirmData.seekAccessGranted) extras.push("구직글 열람권 1개월");
    if (confirmData.isUrgent) extras.push("긴급 구인 7일");

    if (extras.length > 0) {
      alert(`결제 완료! 부가 혜택이 적용되었습니다:\n- ${extras.join("\n- ")}`);
    }

    router.push(`/jobs/${confirmData.jobId}`);
  };

  // NOTE: 라이트도 유료 결제 플로우 사용 (모든 등급 유료)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.agreeNoFraud || !form.agreeNoDiscrimination) {
      setError("필수 동의 항목을 체크해주세요.");
      return;
    }

    if (form.paymentMethod === "BANK_TRANSFER" && !form.depositorName.trim()) {
      setError("무통장 입금 시 입금자명을 입력해주세요.");
      return;
    }

    if (!session && !form.guestEmail) {
      setError("비회원은 이메일을 입력해주세요.");
      return;
    }

    // 패키지는 BIZ 회원만
    if ((form.tier === "PKG_BASIC" || form.tier === "PKG_PREMIUM") && !isBiz) {
      setError("패키지 상품은 업소 회원만 이용할 수 있습니다.");
      return;
    }

    // 유료 결제는 BIZ 회원만
    if (PAID_TIERS.has(form.tier) && !isBiz) {
      setError("유료 상품은 업소 회원만 이용할 수 있습니다.");
      return;
    }

    setIsLoading(true);

    try {
      await handlePaidSubmit();
    } catch {
      setError("등록 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const subRegions = form.region ? SUB_REGIONS[form.region] || [] : [];

  // 현재 선택 tier 계산된 가격
  const totalPrice = getSubmitPrice(form.tier, form.isUrgent);

  // 긴급 옵션 표시 조건: 유료 단품(BASIC/PREMIUM)만 (패키지 PREMIUM은 이미 포함, LIGHT 제외)
  const showUrgentOption =
    form.tier === "BASIC" || form.tier === "PREMIUM" || form.tier === "PKG_BASIC";

  // 표시할 tier 목록 (BIZ가 아니면 패키지 숨김)
  const visibleTiers = isBiz
    ? TIER_OPTIONS
    : TIER_OPTIONS.filter((t) => !t.bizOnly);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-2">구인글 등록</h1>
      <p className="text-sm text-gray-400 mb-6">
        {session
          ? `${session.user.bizName || session.user.nickname || session.user.email}님의 구인글`
          : "구인글 등록은 업소 회원만 이용할 수 있습니다."}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              {/* 업종 평균 급여 힌트 */}
              {(() => {
                const guide = form.bizType ? getGuideForBizType(form.bizType) : null;
                if (!guide) return null;
                const sc = form.salary ? compareSalary(form.salary, form.bizType) : null;
                return (
                  <div className="mt-1.5 text-xs">
                    <p className="text-gray-500">
                      {form.bizType} 평균 일급:{" "}
                      <span className="text-secondary font-medium">
                        {guide.dailyMin}~{guide.dailyMax}만원
                      </span>
                    </p>
                    {sc && (
                      <p className={`mt-0.5 font-medium ${
                        sc.level === "above"
                          ? "text-success"
                          : sc.level === "below"
                            ? "text-urgent"
                            : "text-primary-light"
                      }`}>
                        {sc.level === "above" && "\u25B2 "}
                        {sc.level === "below" && "\u25BC "}
                        입력한 급여: {sc.label}
                      </p>
                    )}
                  </div>
                );
              })()}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

          {/* 단품 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {visibleTiers
              .filter((t) => !t.bizOnly)
              .map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => {
                    updateField("tier", t.key);
                    if (t.key === "LIGHT") updateField("isUrgent", false);
                  }}
                  className={`p-4 rounded-xl border text-center transition-all ${
                    form.tier === t.key
                      ? t.borderClass
                      : "border-dark-border hover:border-gray-500"
                  }`}
                >
                  <p className="font-bold text-sm">{t.label}</p>
                  <p className="text-xs text-secondary mt-1">
                    {formatPriceWithUnit(t.price)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{t.desc}</p>
                </button>
              ))}
          </div>

          {/* 패키지 (BIZ만) */}
          {isBiz && (
            <>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 h-px bg-dark-border" />
                <span className="text-xs text-gray-500 px-2">패키지 상품</span>
                <div className="flex-1 h-px bg-dark-border" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {visibleTiers
                  .filter((t) => t.bizOnly)
                  .map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => {
                        updateField("tier", t.key);
                        // PKG_PREMIUM은 긴급 자동 포함
                        if (t.key === "PKG_PREMIUM") updateField("isUrgent", false);
                      }}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        form.tier === t.key
                          ? t.borderClass
                          : "border-dark-border hover:border-gray-500"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-bold text-sm">{t.label}</p>
                        <span className="text-xs bg-secondary/20 text-secondary px-2 py-0.5 rounded">
                          할인
                        </span>
                      </div>
                      <p className="text-lg font-bold text-secondary">
                        {formatPriceWithUnit(t.price)}
                      </p>
                      {t.benefits && (
                        <ul className="mt-2 space-y-1">
                          {t.benefits.map((b, i) => (
                            <li key={i} className="text-xs text-gray-400 flex items-center gap-1">
                              <span className="text-secondary">&#10003;</span> {b}
                            </li>
                          ))}
                        </ul>
                      )}
                    </button>
                  ))}
              </div>
            </>
          )}

          {/* 긴급 옵션 (단품 BASIC/PREMIUM, PKG_BASIC에서만) */}
          {showUrgentOption && (
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

          {/* PKG_PREMIUM 안내 */}
          {form.tier === "PKG_PREMIUM" && (
            <p className="text-xs text-gray-500 bg-premium-border/10 rounded-lg px-3 py-2">
              프리미엄패키지에는 긴급 구인(7일)이 이미 포함되어 있습니다.
            </p>
          )}
        </div>

        {/* ─── 결제 수단 선택 ─── */}
        {isBiz && (
          <div className="card space-y-4">
            <h2 className="font-bold text-sm text-gray-300">결제 수단</h2>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => updateField("paymentMethod", "TOSS")}
                className={`p-4 rounded-xl border text-center transition-all ${
                  form.paymentMethod === "TOSS"
                    ? "border-primary bg-primary/10"
                    : "border-dark-border hover:border-gray-500"
                }`}
              >
                <p className="font-bold text-sm">카드/간편결제</p>
                <p className="text-xs text-gray-500 mt-1">토스페이먼츠</p>
              </button>
              <button
                type="button"
                onClick={() => updateField("paymentMethod", "BANK_TRANSFER")}
                className={`p-4 rounded-xl border text-center transition-all ${
                  form.paymentMethod === "BANK_TRANSFER"
                    ? "border-secondary bg-secondary/10"
                    : "border-dark-border hover:border-gray-500"
                }`}
              >
                <p className="font-bold text-sm">무통장 입금</p>
                <p className="text-xs text-gray-500 mt-1">계좌이체</p>
              </button>
            </div>

            {form.paymentMethod === "BANK_TRANSFER" && (
              <div className="space-y-3">
                <div className="bg-dark-bg rounded-lg p-4 space-y-2">
                  <p className="text-sm font-medium text-gray-300">입금 계좌 정보</p>
                  <div className="text-sm text-gray-400 space-y-1">
                    <p>은행: <span className="text-white font-medium">{BANK_ACCOUNT.bankName}</span></p>
                    <p>계좌: <span className="text-white font-medium">{BANK_ACCOUNT.accountNumber}</span></p>
                    <p>예금주: <span className="text-white font-medium">{BANK_ACCOUNT.accountHolder}</span></p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    입금자명 <span className="text-urgent">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.depositorName}
                    onChange={(e) => updateField("depositorName", e.target.value)}
                    className="input-field"
                    placeholder="실제 입금자명을 입력하세요"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  입금 확인까지 영업일 기준 1~2시간이 소요됩니다. 입금 확인 후 구인글이 활성화됩니다.
                </p>
              </div>
            )}
          </div>
        )}

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
              ? "처리 중..."
              : form.paymentMethod === "BANK_TRANSFER"
                ? `${formatPriceWithUnit(totalPrice)} 무통장 입금 신청`
                : `${formatPriceWithUnit(totalPrice)} 결제하고 등록`}
          </button>
        </div>
      </form>
    </div>
  );
}
