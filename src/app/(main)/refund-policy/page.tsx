import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "환불정책 - 밤여시 여시광장",
  description: "밤여시 여시광장 환불정책. 유료 서비스별 환불 기준, 절차, 소요 기간을 안내합니다.",
};

// ─── 데이터 ───

const REFUND_TABLE = [
  {
    service: "구인글 등록 (BASIC)",
    condition: "결제 후 24시간 이내, 조회수 0",
    refund: "전액 환불",
  },
  {
    service: "구인글 등록 (BASIC)",
    condition: "결제 후 24시간 경과 또는 조회수 1 이상",
    refund: "환불 불가",
  },
  {
    service: "구인글 등록 (PREMIUM)",
    condition: "결제 후 24시간 이내, 조회수 0",
    refund: "전액 환불",
  },
  {
    service: "구인글 등록 (PREMIUM)",
    condition: "결제 후 24시간 경과 또는 조회수 1 이상",
    refund: "환불 불가",
  },
  {
    service: "끌올 (BUMP)",
    condition: "결제 후 즉시 적용",
    refund: "환불 불가 (즉시 소비)",
  },
  {
    service: "구직자 열람권 (30일)",
    condition: "구매 후 미사용 (열람 0건)",
    refund: "전액 환불",
  },
  {
    service: "구직자 열람권 (30일)",
    condition: "1건 이상 열람",
    refund: "환불 불가",
  },
  {
    service: "패키지 상품",
    condition: "구성 서비스 모두 미사용",
    refund: "전액 환불",
  },
  {
    service: "패키지 상품",
    condition: "일부 사용",
    refund: "사용분 정가 차감 후 잔액 환불",
  },
];

const FAQ = [
  {
    q: "환불 신청은 어디서 하나요?",
    a: "카카오톡 상담 채널로 환불을 요청해주세요. 결제 시 사용한 계정 정보와 결제 내역을 함께 알려주시면 빠르게 처리됩니다.",
  },
  {
    q: "환불은 얼마나 걸리나요?",
    a: "환불 승인 후 영업일 기준 3~5일 이내에 결제 수단으로 환불됩니다. 카드 결제의 경우 카드사 처리 일정에 따라 다소 차이가 있을 수 있습니다.",
  },
  {
    q: "패키지 일부만 사용한 경우 어떻게 계산되나요?",
    a: "사용한 서비스는 개별 정가 기준으로 차감하고, 나머지 금액을 환불합니다. 예를 들어, PREMIUM + 끌올 3회 패키지에서 끌올 1회 사용 시, 끌올 1회 정가를 차감한 금액이 환불됩니다.",
  },
  {
    q: "구인글 수정은 환불 사유가 되나요?",
    a: "아닙니다. 구인글 내용 수정은 무료이며 별도의 비용이 발생하지 않습니다. 환불은 서비스 미사용 시에만 가능합니다.",
  },
  {
    q: "시스템 오류로 중복 결제된 경우는요?",
    a: "중복 결제는 확인 즉시 전액 환불됩니다. 카카오톡 상담으로 결제 내역을 알려주세요.",
  },
];

// ─── 컴포넌트 ───

export default function RefundPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-2">환불정책</h1>
      <p className="text-sm text-gray-500 mb-8">
        최종 수정일: 2025년 1월 1일
      </p>

      {/* ─── 기본 원칙 ─── */}
      <section className="mb-10">
        <h2 className="text-base font-bold text-gray-200 mb-3">기본 원칙</h2>
        <div className="card space-y-3 text-sm text-gray-400">
          <p>
            여시광장의 유료 서비스 환불은 「전자상거래 등에서의 소비자보호에 관한
            법률」 및 「콘텐츠이용자보호지침」에 따라 처리됩니다.
          </p>
          <ul className="space-y-1.5">
            <li className="flex gap-2">
              <span className="text-primary-light shrink-0">1.</span>
              <span>
                디지털 콘텐츠(구인글 노출, 열람권 등)는 서비스가 개시된
                이후에는 원칙적으로 환불이 불가합니다.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary-light shrink-0">2.</span>
              <span>
                서비스 미사용 시 결제일로부터 7일 이내 전액 환불이 가능합니다.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary-light shrink-0">3.</span>
              <span>
                회사의 귀책 사유(시스템 오류, 중복 결제 등)로 인한 경우 전액
                환불합니다.
              </span>
            </li>
          </ul>
        </div>
      </section>

      {/* ─── 서비스별 환불 기준표 ─── */}
      <section className="mb-10">
        <h2 className="text-base font-bold text-gray-200 mb-4">
          서비스별 환불 기준
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-dark-border text-gray-400">
                <th className="text-left py-3 px-3 font-medium">서비스</th>
                <th className="text-left py-3 px-3 font-medium">조건</th>
                <th className="text-left py-3 px-3 font-medium">환불</th>
              </tr>
            </thead>
            <tbody className="text-gray-400">
              {REFUND_TABLE.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-dark-border/50 hover:bg-dark-card/30"
                >
                  <td className="py-3 px-3 text-gray-300 font-medium whitespace-nowrap">
                    {row.service}
                  </td>
                  <td className="py-3 px-3">{row.condition}</td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span
                      className={
                        row.refund.includes("전액")
                          ? "text-success"
                          : row.refund.includes("불가")
                            ? "text-urgent"
                            : "text-secondary"
                      }
                    >
                      {row.refund}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ─── 환불 절차 ─── */}
      <section className="mb-10">
        <h2 className="text-base font-bold text-gray-200 mb-4">환불 절차</h2>
        <div className="grid gap-3">
          {[
            {
              step: 1,
              title: "환불 신청",
              desc: "카카오톡 상담 채널로 환불 요청 (결제 계정 + 결제 내역 전달)",
            },
            {
              step: 2,
              title: "검토 및 확인",
              desc: "환불 요건 확인 (사용 여부, 기간 등) — 영업일 1~2일",
            },
            {
              step: 3,
              title: "환불 승인",
              desc: "환불 승인 안내 (카카오톡 또는 이메일)",
            },
            {
              step: 4,
              title: "환불 완료",
              desc: "결제 수단으로 환불 — 승인 후 영업일 3~5일",
            },
          ].map((s) => (
            <div
              key={s.step}
              className="flex items-start gap-4 bg-dark-card border border-dark-border rounded-lg p-4"
            >
              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary-light flex items-center justify-center text-sm font-bold shrink-0">
                {s.step}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-200">
                  {s.title}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 주의사항 ─── */}
      <section className="mb-10">
        <h2 className="text-base font-bold text-gray-200 mb-3">주의사항</h2>
        <ul className="space-y-2 text-sm text-gray-400">
          {[
            "환불은 원래 결제 수단으로만 처리됩니다 (현금 환불 불가).",
            "프로모션, 이벤트 할인으로 결제한 경우 실제 결제 금액 기준으로 환불됩니다.",
            "회원 탈퇴 시 사용하지 않은 유료 서비스가 있으면 탈퇴 전 환불을 신청해주세요. 탈퇴 후에는 환불이 어려울 수 있습니다.",
            "부정 이용(허위 구인글, 약관 위반 등)으로 인한 계정 정지 시 잔여 서비스는 환불되지 않습니다.",
          ].map((item, i) => (
            <li key={i} className="flex gap-2 leading-relaxed">
              <span className="text-urgent shrink-0">!</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* ─── 자주 묻는 질문 ─── */}
      <section className="mb-10">
        <h2 className="text-base font-bold text-gray-200 mb-4">
          자주 묻는 질문
        </h2>
        <div className="space-y-3">
          {FAQ.map((faq, i) => (
            <div
              key={i}
              className="bg-dark-card border border-dark-border rounded-lg p-4"
            >
              <p className="text-sm font-medium text-gray-200 mb-2">
                Q. {faq.q}
              </p>
              <p className="text-sm text-gray-400 leading-relaxed">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 관련 법령 ─── */}
      <section className="mb-10">
        <h2 className="text-base font-bold text-gray-200 mb-3">관련 법령</h2>
        <ul className="space-y-1.5 text-sm text-gray-500">
          <li>· 전자상거래 등에서의 소비자보호에 관한 법률 제17조 (청약철회)</li>
          <li>· 콘텐츠산업진흥법 제27조 (콘텐츠이용자 보호)</li>
          <li>· 콘텐츠이용자보호지침 (방송통신위원회 고시)</li>
        </ul>
      </section>

      {/* ─── 하단 ─── */}
      <div className="mt-12 pt-6 border-t border-dark-border text-xs text-gray-600 space-y-2">
        <p>
          환불 관련 문의는 카카오톡 상담 채널로 연락해주세요.
        </p>
        <p>
          <Link
            href="/terms"
            className="text-primary-light hover:underline mr-4"
          >
            이용약관
          </Link>
          <Link
            href="/privacy"
            className="text-primary-light hover:underline"
          >
            개인정보처리방침
          </Link>
        </p>
      </div>
    </div>
  );
}
