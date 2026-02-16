import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "개인정보처리방침 - 밤여시 여시광장",
  description: "밤여시 여시광장 개인정보처리방침. 수집 항목, 이용 목적, 보유 기간, 이용자 권리 등을 안내합니다.",
};

// ─── 데이터 ───

const COLLECT_TABLE = [
  {
    purpose: "회원 가입 (일반)",
    required: "닉네임, 비밀번호, 이메일(선택)",
    optional: "프로필 이미지",
    retention: "탈퇴 시 즉시 파기",
  },
  {
    purpose: "회원 가입 (업소)",
    required: "업소명, 지역, 연락처(전화번호), 비밀번호",
    optional: "사업자등록번호, 대표자명",
    retention: "탈퇴 시 즉시 파기",
  },
  {
    purpose: "구인글 등록",
    required: "업소명, 지역, 업종, 급여, 연락처",
    optional: "근무시간, 복리후생, 우대조건",
    retention: "게시글 삭제 시 파기",
  },
  {
    purpose: "구직글 등록",
    required: "연락처(카카오톡 ID 또는 전화번호), 희망 지역, 희망 업종",
    optional: "경력, 희망 조건",
    retention: "게시글 삭제 시 파기",
  },
  {
    purpose: "유료 서비스 결제",
    required: "결제 수단 정보",
    optional: "—",
    retention: "전자상거래법에 따라 5년 보관",
  },
  {
    purpose: "서비스 이용 기록",
    required: "IP 주소, 접속 일시, 브라우저 정보",
    optional: "—",
    retention: "통신비밀보호법에 따라 3개월 보관",
  },
];

const SECTIONS = [
  {
    title: "1. 개인정보의 수집 및 이용 목적",
    items: [
      "회원 가입 및 관리: 회원 식별, 본인 확인, 서비스 부정 이용 방지",
      "서비스 제공: 구인·구직 정보 중개, 구직자 열람 서비스, 커뮤니티 운영",
      "유료 서비스: 결제 처리, 환불 처리",
      "마케팅 및 광고: 이벤트·프로모션 안내 (동의 시), 맞춤형 서비스 제공",
      "서비스 개선: 이용 통계 분석, 서비스 품질 향상",
    ],
  },
  {
    title: "3. 개인정보의 제3자 제공",
    content: `회사는 이용자의 개인정보를 원칙적으로 제3자에게 제공하지 않습니다. 다만, 다음의 경우에는 예외로 합니다.

• 이용자가 사전에 동의한 경우
• 법령에 의하여 제공이 요구되는 경우 (수사기관의 적법한 요청 등)
• 구직자가 구직글을 등록하고, 열람권을 구매한 업소회원이 해당 구직글을 열람하는 경우 (서비스의 본질적 기능)`,
  },
  {
    title: "4. 개인정보의 처리 위탁",
    content: `회사는 서비스 제공을 위해 다음과 같이 개인정보 처리를 위탁합니다.

• 결제 처리: PG사 (결제 대행)
• 서버 호스팅: 클라우드 서비스 제공자

위탁 업체가 변경되는 경우 사이트를 통해 공지합니다.`,
  },
  {
    title: "5. 개인정보의 파기",
    items: [
      "파기 시기: 보유 기간 경과, 처리 목적 달성, 회원 탈퇴 시 지체 없이 파기합니다.",
      "파기 방법: 전자적 파일은 복구 불가능한 방법으로 영구 삭제하며, 종이 문서는 분쇄합니다.",
      "법령에 따른 보존: 전자상거래법 등 관련 법령에 따라 보존이 필요한 경우, 해당 기간 동안 별도 보관 후 파기합니다.",
    ],
  },
  {
    title: "6. 이용자의 권리 및 행사 방법",
    items: [
      "이용자는 언제든지 자신의 개인정보를 조회하거나 수정할 수 있습니다.",
      "이용자는 회원 탈퇴를 통해 개인정보의 수집·이용에 대한 동의를 철회할 수 있습니다.",
      "이용자는 개인정보의 오류에 대한 정정을 요청할 수 있습니다.",
      "개인정보 열람·정정·삭제·처리정지 요구는 카카오톡 상담 또는 이메일로 신청할 수 있으며, 10일 이내에 처리합니다.",
      "만 19세 미만의 이용자는 서비스를 이용할 수 없습니다.",
    ],
  },
  {
    title: "7. 개인정보의 안전성 확보 조치",
    items: [
      "비밀번호 암호화: 회원 비밀번호는 일방향 암호화(bcrypt)하여 저장합니다.",
      "접근 통제: 개인정보 처리 시스템에 대한 접근 권한을 최소화합니다.",
      "보안 프로그램: HTTPS(SSL/TLS) 암호화 통신을 적용합니다.",
      "접속 기록 보관: 개인정보 처리 시스템의 접속 기록을 최소 1년 이상 보관합니다.",
    ],
  },
  {
    title: "8. 쿠키(Cookie)의 사용",
    content: `회사는 이용자에게 원활한 서비스를 제공하기 위해 쿠키를 사용합니다.

• 사용 목적: 로그인 상태 유지, 이용자 설정 저장
• 쿠키 거부 방법: 브라우저 설정에서 쿠키 허용/차단을 설정할 수 있습니다. 쿠키를 차단하면 일부 서비스 이용에 제한이 있을 수 있습니다.`,
  },
  {
    title: "9. 개인정보 보호책임자",
    content: `이용자의 개인정보 관련 문의, 불만, 피해구제에 관한 사항은 아래로 연락해주세요.

• 개인정보 보호책임자: (추후 지정)
• 카카오톡 상담 채널을 통해 문의 가능

기타 개인정보 침해 신고·상담이 필요한 경우:
• 개인정보침해신고센터: privacy.kisa.or.kr (☎ 118)
• 대검찰청 사이버수사과: spo.go.kr (☎ 1301)
• 경찰청 사이버수사국: ecrm.police.go.kr (☎ 182)`,
  },
  {
    title: "10. 고지의 의무",
    content:
      "이 개인정보처리방침은 법령·정책 또는 회사 내부 방침의 변경에 따라 수정될 수 있습니다. 변경 시 사이트 공지사항을 통해 안내합니다.",
  },
];

// ─── 컴포넌트 ───

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-2">개인정보처리방침</h1>
      <p className="text-sm text-gray-500 mb-8">
        최종 수정일: 2025년 1월 1일 · 시행일: 2025년 1월 1일
      </p>

      <p className="text-sm text-gray-400 leading-relaxed mb-8">
        밤여시 여시광장(이하 &quot;회사&quot;)은 「개인정보 보호법」 제30조에 따라 이용자의 개인정보를
        보호하고 이와 관련한 고충을 신속하게 처리하기 위하여 다음과 같이
        개인정보처리방침을 수립·공개합니다.
      </p>

      {/* ─── 수집 항목 표 ─── */}
      <section className="mb-10">
        <h2 className="text-base font-bold text-gray-200 mb-4">
          2. 수집하는 개인정보 항목 및 보유 기간
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-dark-border text-gray-400">
                <th className="text-left py-3 px-3 font-medium">수집 목적</th>
                <th className="text-left py-3 px-3 font-medium">필수 항목</th>
                <th className="text-left py-3 px-3 font-medium">선택 항목</th>
                <th className="text-left py-3 px-3 font-medium">보유 기간</th>
              </tr>
            </thead>
            <tbody className="text-gray-400">
              {COLLECT_TABLE.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-dark-border/50 hover:bg-dark-card/30"
                >
                  <td className="py-3 px-3 text-gray-300 font-medium whitespace-nowrap">
                    {row.purpose}
                  </td>
                  <td className="py-3 px-3">{row.required}</td>
                  <td className="py-3 px-3">{row.optional}</td>
                  <td className="py-3 px-3 text-xs whitespace-nowrap">
                    {row.retention}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 bg-dark-card border border-dark-border rounded-lg p-3">
          <p className="text-xs text-gray-500 font-medium mb-1.5">
            법령에 의한 보관 기간
          </p>
          <ul className="text-xs text-gray-500 space-y-1">
            <li>
              · 계약 또는 청약철회 등에 관한 기록: 5년 (전자상거래 등에서의
              소비자보호에 관한 법률)
            </li>
            <li>
              · 대금결제 및 재화 등의 공급에 관한 기록: 5년
            </li>
            <li>
              · 소비자 불만 또는 분쟁처리에 관한 기록: 3년
            </li>
            <li>
              · 접속에 관한 기록: 3개월 (통신비밀보호법)
            </li>
          </ul>
        </div>
      </section>

      {/* ─── 나머지 섹션 ─── */}
      <div className="space-y-8">
        {SECTIONS.map((section, idx) => (
          <section key={idx}>
            <h2 className="text-base font-bold text-gray-200 mb-3">
              {section.title}
            </h2>

            {section.content && (
              <p className="text-sm text-gray-400 leading-relaxed whitespace-pre-line">
                {section.content}
              </p>
            )}

            {section.items && (
              <ul className="space-y-2 text-sm text-gray-400">
                {section.items.map((item, i) => (
                  <li key={i} className="leading-relaxed flex gap-2">
                    <span className="text-gray-600 shrink-0">·</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>

      <div className="mt-12 pt-6 border-t border-dark-border text-xs text-gray-600">
        <p>
          본 개인정보처리방침에 대한 문의사항은 카카오톡 상담 또는 이메일로
          연락해주세요.
        </p>
      </div>
    </div>
  );
}
