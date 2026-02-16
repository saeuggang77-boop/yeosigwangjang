"use client";

import { useState } from "react";
import Link from "next/link";
import { BIZ_CATEGORIES } from "@/lib/constants";

const KAKAO_CHANNEL_URL = "https://pf.kakao.com/_bamyeosi";

const PRICE_TABLE = [
  {
    tier: "A",
    label: "성형 / 피부 / 시술",
    categories: ["성형·피부·시술"],
    basic: 500_000,
    premium: 1_000_000,
    color: "text-premium-gold",
    bg: "bg-premium-gold/10",
  },
  {
    tier: "B",
    label: "뷰티 / 패션 / 피트니스",
    categories: ["헤어·메이크업", "의상·원복·드레스", "네일·속눈썹·왁싱", "운동·다이어트"],
    basic: 100_000,
    premium: 200_000,
    color: "text-secondary",
    bg: "bg-secondary/10",
  },
  {
    tier: "C",
    label: "기타 서비스",
    categories: ["세무·법률·보험", "부동산·원룸", "기타 서비스"],
    basic: 80_000,
    premium: 150_000,
    color: "text-primary-light",
    bg: "bg-primary/10",
  },
];

const EXTRA_ADS = [
  { name: "메인 배너", price: 800_000, desc: "홈 최상단 슬라이더 (최대 5개)" },
  { name: "구인 페이지 배너", price: 300_000, desc: "구인 목록 상단 고정" },
  { name: "팝업 광고", price: 500_000, desc: "사이트 접속 시 1일 1회" },
];

const PREMIUM_BENEFITS = [
  { feature: "카테고리 상단 고정", basic: true, premium: true },
  { feature: "PREMIUM 뱃지", basic: false, premium: true },
  { feature: "홈 추천 노출", basic: false, premium: true },
  { feature: "사진 등록", basic: "5장", premium: "10장+" },
  { feature: "이벤트 등록", basic: false, premium: true },
  { feature: "자동 끌어올리기", basic: false, premium: "7일마다" },
  { feature: "구직글 열람권", basic: true, premium: true },
  { feature: "조회/클릭 통계", basic: true, premium: true },
];

export default function AdInquiryPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    bizName: "",
    category: "",
    name: "",
    phone: "",
    email: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/ad-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setSubmitted(true);
    } catch {
      setError("문의 접수 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* ====== Hero ====== */}
      <section className="text-center py-16 px-4">
        <p className="text-sm text-secondary font-medium mb-3">
          밤여시 카페 2만 회원 기반 플랫폼
        </p>
        <h1 className="text-3xl md:text-4xl font-bold leading-tight">
          <span className="text-primary-light">여시광장</span>에{" "}
          <br className="sm:hidden" />
          업체를 등록하세요
        </h1>
        <p className="text-gray-400 mt-4 text-base max-w-xl mx-auto">
          성형·뷰티·패션·피트니스 등 2만 여시 회원에게
          <br />
          업체를 직접 노출하고 고객을 유치하세요.
        </p>
        <div className="flex gap-3 justify-center mt-8">
          <a
            href="#inquiry-form"
            className="btn-primary px-6 py-3 text-sm"
          >
            입점 문의하기
          </a>
          <a
            href={KAKAO_CHANNEL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded-xl text-sm font-medium bg-[#FEE500] text-[#3C1E1E] hover:bg-[#FDD835] transition-colors"
          >
            카카오톡 상담
          </a>
        </div>
      </section>

      {/* ====== 플랫폼 현황 ====== */}
      <section className="px-4 pb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "카페 회원", value: "20,000+", sub: "밤여시 카페" },
            { label: "월 방문자", value: "50,000+", sub: "여시광장 사이트" },
            { label: "등록 구인글", value: "500+", sub: "월 평균" },
            { label: "등록 업체", value: "100+", sub: "디렉토리" },
          ].map((stat) => (
            <div key={stat.label} className="card text-center">
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
              <p className="text-xs text-gray-600">{stat.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ====== 업종별 가격 ====== */}
      <section className="px-4 pb-12">
        <h2 className="text-xl font-bold text-center mb-2">업종별 광고 요금</h2>
        <p className="text-sm text-gray-400 text-center mb-8">
          업종에 따라 자동 책정 &middot; VAT 포함 &middot; 구직글 열람 자동 포함
        </p>

        <div className="space-y-4">
          {PRICE_TABLE.map((tier) => (
            <div key={tier.tier} className="card">
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${tier.bg} ${tier.color}`}>
                  {tier.tier} 등급
                </span>
                <span className="font-bold text-sm">{tier.label}</span>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                {tier.categories.join(" / ")}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-dark-bg rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">기본 광고</p>
                  <p className="text-lg font-bold">
                    ₩{tier.basic.toLocaleString()}
                    <span className="text-xs text-gray-400 font-normal">/월</span>
                  </p>
                </div>
                <div className={`rounded-xl p-3 text-center border ${tier.tier === "A" ? "border-premium-gold/30 bg-premium-gold/5" : "border-secondary/20 bg-secondary/5"}`}>
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <p className="text-xs text-gray-500">프리미엄</p>
                    <span className={`text-xs px-1 py-0.5 rounded ${tier.bg} ${tier.color}`}>추천</span>
                  </div>
                  <p className={`text-lg font-bold ${tier.color}`}>
                    ₩{tier.premium.toLocaleString()}
                    <span className="text-xs text-gray-400 font-normal">/월</span>
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ====== 선결제 할인 ====== */}
      <section className="px-4 pb-12">
        <div className="card bg-gradient-to-r from-secondary/5 to-premium-gold/5 border-secondary/20">
          <h3 className="font-bold text-sm mb-3 text-center">선결제 할인</h3>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xs text-gray-500">1개월</p>
              <p className="text-sm font-bold mt-1">정가</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">2개월</p>
              <p className="text-sm font-bold text-secondary mt-1">10% 할인</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">3개월</p>
              <p className="text-sm font-bold text-premium-gold mt-1">20% 할인</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 text-center mt-3">
            예) B등급 프리미엄 3개월: ₩200,000 x 3 x 0.8 = <b className="text-white">₩480,000</b>
          </p>
        </div>
      </section>

      {/* ====== 프리미엄 혜택 비교 ====== */}
      <section className="px-4 pb-12">
        <h2 className="text-xl font-bold text-center mb-2">기본 vs 프리미엄</h2>
        <p className="text-sm text-gray-400 text-center mb-6">
          프리미엄 광고로 최대 효과를 경험하세요
        </p>
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-border">
                <th className="text-left px-4 py-3 text-gray-400 font-medium">혜택</th>
                <th className="text-center px-3 py-3 text-gray-400 font-medium">기본</th>
                <th className="text-center px-3 py-3 text-premium-gold font-medium">프리미엄</th>
              </tr>
            </thead>
            <tbody>
              {PREMIUM_BENEFITS.map((row, i) => (
                <tr key={row.feature} className={i < PREMIUM_BENEFITS.length - 1 ? "border-b border-dark-border/50" : ""}>
                  <td className="px-4 py-2.5 text-gray-300 text-xs">{row.feature}</td>
                  <td className="text-center px-3 py-2.5">
                    {row.basic === true ? (
                      <span className="text-success">O</span>
                    ) : row.basic === false ? (
                      <span className="text-gray-600">-</span>
                    ) : (
                      <span className="text-xs text-gray-400">{row.basic}</span>
                    )}
                  </td>
                  <td className="text-center px-3 py-2.5">
                    {row.premium === true ? (
                      <span className="text-premium-gold">O</span>
                    ) : row.premium === false ? (
                      <span className="text-gray-600">-</span>
                    ) : (
                      <span className="text-xs text-premium-gold">{row.premium}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ====== 추가 광고 상품 ====== */}
      <section className="px-4 pb-12">
        <h2 className="text-xl font-bold text-center mb-6">추가 광고 상품</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {EXTRA_ADS.map((ad) => (
            <div key={ad.name} className="card text-center">
              <p className="font-bold text-sm">{ad.name}</p>
              <p className="text-xl font-bold text-secondary mt-2">
                ₩{ad.price.toLocaleString()}
                <span className="text-xs text-gray-400 font-normal">/월</span>
              </p>
              <p className="text-xs text-gray-500 mt-2">{ad.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ====== 입점 프로세스 ====== */}
      <section className="px-4 pb-12">
        <h2 className="text-xl font-bold text-center mb-6">입점 절차</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { step: "01", title: "문의 접수", desc: "폼 작성 또는\n카카오톡 상담" },
            { step: "02", title: "상담 & 견적", desc: "업종별 맞춤\n광고 플랜 안내" },
            { step: "03", title: "결제 & 등록", desc: "토스 간편결제\n업체 정보 등록" },
            { step: "04", title: "노출 시작", desc: "즉시 디렉토리\n노출 + 통계 제공" },
          ].map((s) => (
            <div key={s.step} className="card text-center">
              <p className="text-2xl font-bold text-secondary/50">{s.step}</p>
              <p className="font-bold text-sm mt-2">{s.title}</p>
              <p className="text-xs text-gray-500 mt-1 whitespace-pre-line">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ====== 문의 폼 ====== */}
      <section id="inquiry-form" className="px-4 pb-12 scroll-mt-20">
        <h2 className="text-xl font-bold text-center mb-2">입점 문의</h2>
        <p className="text-sm text-gray-400 text-center mb-6">
          아래 폼을 작성하시면 담당자가 빠르게 연락드립니다.
        </p>

        {submitted ? (
          <div className="card text-center py-12 border-success/20">
            <p className="text-3xl mb-3">✅</p>
            <p className="font-bold text-lg">문의가 접수되었습니다!</p>
            <p className="text-sm text-gray-400 mt-2">
              보통 1 영업일 이내 연락드립니다.
              <br />
              급한 문의는 카카오톡으로 연락해주세요.
            </p>
            <a
              href={KAKAO_CHANNEL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-4 px-6 py-2.5 rounded-xl text-sm font-medium bg-[#FEE500] text-[#3C1E1E] hover:bg-[#FDD835] transition-colors"
            >
              카카오톡 상담
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="card space-y-4 max-w-lg mx-auto">
            {error && (
              <p className="text-urgent text-sm text-center bg-urgent/10 py-2 rounded-lg">
                {error}
              </p>
            )}

            <div>
              <label className="block text-sm text-gray-400 mb-1">
                업체명 <span className="text-urgent">*</span>
              </label>
              <input
                type="text"
                value={form.bizName}
                onChange={(e) => setForm((p) => ({ ...p, bizName: e.target.value }))}
                className="input-field"
                placeholder="업체명을 입력해주세요"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">
                업종 <span className="text-urgent">*</span>
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                className="input-field"
                required
              >
                <option value="">업종을 선택해주세요</option>
                {BIZ_CATEGORIES.map((c) => (
                  <option key={c.enum} value={c.label}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">
                담당자명 <span className="text-urgent">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className="input-field"
                placeholder="담당자 성함"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">
                연락처 <span className="text-urgent">*</span>
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                className="input-field"
                placeholder="010-0000-0000"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">
                이메일 <span className="text-xs text-gray-600">(선택)</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                className="input-field"
                placeholder="example@email.com"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">
                문의 내용 <span className="text-urgent">*</span>
              </label>
              <textarea
                value={form.message}
                onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                className="input-field min-h-[100px] resize-none"
                placeholder="관심 있는 광고 상품, 궁금한 점 등을 자유롭게 적어주세요."
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full btn-primary py-3 disabled:opacity-50"
            >
              {isSubmitting ? "접수 중..." : "문의 접수하기"}
            </button>

            <p className="text-xs text-gray-600 text-center">
              제출된 정보는 광고 상담 목적으로만 사용됩니다.
            </p>
          </form>
        )}
      </section>

      {/* ====== 카카오톡 CTA ====== */}
      <section className="px-4 pb-16">
        <div className="card text-center bg-gradient-to-r from-[#FEE500]/5 to-[#FDD835]/5 border-[#FEE500]/20">
          <p className="font-bold text-base mb-2">빠른 상담이 필요하신가요?</p>
          <p className="text-sm text-gray-400 mb-4">
            카카오톡으로 실시간 상담을 받으실 수 있습니다.
          </p>
          <a
            href={KAKAO_CHANNEL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-[#FEE500] text-[#3C1E1E] hover:bg-[#FDD835] transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3C6.48 3 2 6.58 2 10.94c0 2.8 1.86 5.27 4.66 6.67-.15.56-.96 3.6-.99 3.83 0 0-.02.17.09.24.11.06.24.01.24.01.32-.04 3.7-2.44 4.28-2.86.55.08 1.13.12 1.72.12 5.52 0 10-3.58 10-7.94C22 6.58 17.52 3 12 3z" />
            </svg>
            카카오톡 상담하기
          </a>
        </div>
      </section>

      {/* ====== FAQ ====== */}
      <section className="px-4 pb-16">
        <h2 className="text-xl font-bold text-center mb-6">자주 묻는 질문</h2>
        <div className="space-y-3 max-w-lg mx-auto">
          {[
            {
              q: "광고 등록까지 얼마나 걸리나요?",
              a: "문의 후 상담이 완료되면 결제 즉시 디렉토리에 노출됩니다. 보통 1~2 영업일 이내 전체 프로세스가 완료됩니다.",
            },
            {
              q: "중도 해지/환불이 가능한가요?",
              a: "미사용 잔여 기간에 대해 환불이 가능합니다. 자세한 내용은 환불정책 페이지를 참고해주세요.",
            },
            {
              q: "어떤 업종이 등록 가능한가요?",
              a: "성형, 피부, 헤어, 메이크업, 패션, 네일, 피트니스, 세무, 법률, 부동산 등 여시 회원 대상 서비스라면 모두 가능합니다.",
            },
            {
              q: "프리미엄과 기본 광고의 차이가 뭔가요?",
              a: "프리미엄은 카테고리 상단 고정, PREMIUM 뱃지, 홈 추천 노출, 이벤트 등록, 자동 끌올 등 추가 혜택이 포함됩니다.",
            },
            {
              q: "구직글 열람권이 뭔가요?",
              a: "여시광장에 등록된 구직자 프로필을 열람할 수 있는 권한입니다. 모든 광고 상품에 자동 포함됩니다.",
            },
          ].map((item) => (
            <details key={item.q} className="card group">
              <summary className="font-medium text-sm cursor-pointer list-none flex items-center justify-between">
                {item.q}
                <span className="text-gray-500 group-open:rotate-180 transition-transform">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </summary>
              <p className="text-sm text-gray-400 mt-3">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ====== 하단 CTA ====== */}
      <section className="px-4 pb-16 text-center">
        <p className="text-gray-400 text-sm mb-4">
          지금 바로 2만 여시 회원에게 업체를 노출하세요.
        </p>
        <div className="flex gap-3 justify-center">
          <a href="#inquiry-form" className="btn-primary px-6 py-3 text-sm">
            입점 문의하기
          </a>
          <Link
            href="/auth/register/ad"
            className="btn-outline px-6 py-3 text-sm"
          >
            직접 가입하기
          </Link>
        </div>
      </section>
    </div>
  );
}
