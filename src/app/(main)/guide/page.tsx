import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "신입 가이드 - 밤여시 여시광장",
  description:
    "밤문화 업계 신입을 위한 완벽 가이드. 면접 팁, 업종별 차이, 용어 정리, 사기 예방법까지. 밤여시 여시광장에서 안전하게 시작하세요.",
  keywords: [
    "밤문화 알바",
    "룸싸롱 면접",
    "텐프로 신입",
    "유흥업소 용어",
    "밤일 사기 예방",
    "밤여시 가이드",
  ],
};

// ─── 데이터 ───

const GLOSSARY = [
  { term: "TC", desc: "Total Charge. 손님 테이블에서 발생하는 총 매출 중 일정 비율을 받는 급여 체계." },
  { term: "일급", desc: "하루 근무 기준으로 받는 고정 급여. 출근만 하면 보장." },
  { term: "시급", desc: "시간 단위 급여. 클럽·바 등에서 주로 사용." },
  { term: "보도", desc: "업소에 소속되지 않고 여러 업소를 돌며 근무하는 형태. 보도방에서 매칭." },
  { term: "마담/실장", desc: "업소 운영을 관리하는 중간 관리자. 스케줄·인력 관리 담당." },
  { term: "웨이터/MD", desc: "손님 응대·예약 관리·매출 관리를 담당하는 남성 직원." },
  { term: "초이스", desc: "손님이 여러 직원 중 함께할 사람을 선택하는 과정." },
  { term: "착석", desc: "손님 테이블에 앉아 대화·서비스하는 것. 착석바는 이 형태의 바." },
  { term: "2차", desc: "업소 영업 종료 후 손님과 별도로 만나는 것. 강제할 수 없음." },
  { term: "끌올", desc: "구인글을 목록 상단으로 다시 올리는 유료 기능." },
  { term: "원복", desc: "업소에서 제공하는 근무 의상(드레스 등)." },
  { term: "팁/봉사료", desc: "손님이 서비스에 만족하여 별도로 주는 금액." },
  { term: "선불/후불", desc: "급여를 근무 전/후에 받는 방식. 선불은 사기 위험 주의." },
  { term: "정산", desc: "근무 종료 후 당일 매출과 급여를 계산하는 과정." },
];

const BIZ_COMPARE = [
  {
    type: "룸싸롱",
    style: "프라이빗 룸에서 착석 서비스",
    salary: "TC 기준 일급 40~80만원",
    dress: "드레스·원복 (업소 제공 多)",
    hours: "오후 7시~새벽 2시",
    difficulty: "중상",
  },
  {
    type: "텐프로",
    style: "고급 룸싸롱. 강남·역삼 중심",
    salary: "TC 기준 일급 50~100만원",
    dress: "고급 드레스 (자비 or 지원)",
    hours: "오후 7시~새벽 2시",
    difficulty: "상",
  },
  {
    type: "라운지",
    style: "오픈형 홀 또는 반프라이빗",
    salary: "TC/일급 25~60만원",
    dress: "자유복 또는 드레스",
    hours: "오후 8시~새벽 3시",
    difficulty: "중",
  },
  {
    type: "클럽",
    style: "대형 음악 중심 공간, 다수 손님",
    salary: "시급+팁 20~50만원",
    dress: "자유복·트렌디",
    hours: "오후 10시~새벽 5시",
    difficulty: "중하",
  },
  {
    type: "바/착석바",
    style: "소규모 바 카운터 또는 착석",
    salary: "시급/일급 15~50만원",
    dress: "자유복 또는 캐주얼",
    hours: "오후 8시~새벽 3시",
    difficulty: "하~중",
  },
  {
    type: "가라오케",
    style: "노래방 형태, 착석 서비스",
    salary: "TC 기준 25~60만원",
    dress: "드레스 또는 자유",
    hours: "오후 7시~새벽 2시",
    difficulty: "중",
  },
  {
    type: "보도",
    style: "소속 없이 여러 업소 파견",
    salary: "TC 기준 30~70만원",
    dress: "업소 제공 또는 자비",
    hours: "업소 스케줄에 따름",
    difficulty: "중상",
  },
];

const INTERVIEW_TIPS = [
  {
    title: "전화 상담 먼저",
    desc: "방문 전 전화로 급여 체계, 근무 조건, 복장 등을 확인하세요. 정보를 회피하는 업소는 주의.",
  },
  {
    title: "동행자와 함께",
    desc: "첫 면접은 가능하면 지인과 함께 가세요. 업소 위치와 분위기를 미리 파악.",
  },
  {
    title: "급여 체계 확인",
    desc: "TC인지 일급인지, 정산 주기(일/주/월), 세금 공제 여부를 명확히 확인.",
  },
  {
    title: "근무 조건 서면 확인",
    desc: "구두 약속만 믿지 말고, 카톡이라도 급여·시간·조건을 문자로 남기세요.",
  },
  {
    title: "선입금 요구 거절",
    desc: "보증금, 의상비 선불, 교육비 명목으로 돈을 요구하면 100% 사기.",
  },
  {
    title: "첫날은 체험으로",
    desc: "가능하면 1일 체험 후 결정하세요. 좋은 업소는 체험을 허용합니다.",
  },
  {
    title: "2차 강요 거부",
    desc: "영업 종료 후 2차는 본인 의사. 강제하는 업소는 즉시 떠나세요.",
  },
  {
    title: "신분증 맡기지 않기",
    desc: "면접 시 신분증 원본을 맡기라는 요구는 절대 거절. 사본 제공도 신중히.",
  },
];

const SCAM_PATTERNS = [
  {
    pattern: "보증금/선입금 요구",
    detail: "의상비, 교육비, 보증금 명목으로 면접 전후에 돈을 요구. 합법 업소는 절대 면접자에게 돈을 요구하지 않습니다.",
    danger: "high",
  },
  {
    pattern: "과도한 급여 보장",
    detail: "\"무조건 일 300만\", \"월 1000만 보장\" 등 비현실적 수입 보장. 실제 급여는 업종·경력·시기에 따라 큰 차이.",
    danger: "high",
  },
  {
    pattern: "업소 정보 비공개",
    detail: "업소 이름, 위치, 사업자 정보를 알려주지 않고 만남만 유도. 정상 업소는 정보를 숨길 이유가 없습니다.",
    danger: "high",
  },
  {
    pattern: "개인정보 과다 수집",
    detail: "면접 전에 주민번호, 계좌번호, 가족 정보 등을 요구. 면접 단계에서는 연락처 외 불필요.",
    danger: "medium",
  },
  {
    pattern: "빠른 입금 유도",
    detail: "\"지금 바로 보내야 자리 확보\" 등 시간 압박. 정상 채용은 급하게 돈을 요구하지 않습니다.",
    danger: "medium",
  },
  {
    pattern: "SNS/메신저 전용 모집",
    detail: "공식 채널 없이 개인 SNS로만 모집. 밤여시 같은 검증된 플랫폼을 이용하세요.",
    danger: "medium",
  },
];

// ─── 페이지 ───

export default function GuidePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-12">
      {/* 히어로 */}
      <section className="text-center space-y-4">
        <h1 className="text-3xl font-bold">신입 가이드</h1>
        <p className="text-gray-400 max-w-lg mx-auto">
          밤문화 업계에 처음 발을 내딛는 분들을 위한 종합 안내서입니다.
          면접부터 용어, 업종별 차이, 사기 예방까지 알아두면 도움이 되는 정보를 정리했습니다.
        </p>
        <nav className="flex flex-wrap justify-center gap-2">
          {[
            { id: "terms", label: "용어 정리" },
            { id: "types", label: "업종별 비교" },
            { id: "interview", label: "면접 팁" },
            { id: "scam", label: "사기 예방" },
            { id: "rights", label: "근로자 권리" },
          ].map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="px-3 py-1.5 rounded-lg text-xs bg-dark-card text-gray-400 hover:text-white hover:bg-primary/20 transition-colors"
            >
              {s.label}
            </a>
          ))}
        </nav>
      </section>

      {/* ─── 용어 정리 ─── */}
      <section id="terms">
        <SectionHeader emoji="1" title="용어 정리" subtitle="업계에서 자주 쓰이는 기본 용어" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {GLOSSARY.map((g) => (
            <div key={g.term} className="card">
              <p className="font-bold text-sm text-primary-light">{g.term}</p>
              <p className="text-xs text-gray-400 mt-1">{g.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 업종별 비교 ─── */}
      <section id="types">
        <SectionHeader emoji="2" title="업종별 비교" subtitle="업종마다 분위기, 급여, 난이도가 다릅니다" />
        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full min-w-[640px] text-sm border-collapse">
            <thead>
              <tr className="border-b border-dark-border text-xs text-gray-500">
                <th className="text-left py-3 font-medium">업종</th>
                <th className="text-left py-3 font-medium">형태</th>
                <th className="text-left py-3 font-medium">급여 범위</th>
                <th className="text-left py-3 font-medium">복장</th>
                <th className="text-left py-3 font-medium">시간</th>
                <th className="text-center py-3 font-medium">난이도</th>
              </tr>
            </thead>
            <tbody>
              {BIZ_COMPARE.map((b) => (
                <tr key={b.type} className="border-b border-dark-border/50">
                  <td className="py-3 font-medium text-gray-200">{b.type}</td>
                  <td className="py-3 text-gray-400 text-xs">{b.style}</td>
                  <td className="py-3 text-secondary text-xs font-medium">{b.salary}</td>
                  <td className="py-3 text-gray-400 text-xs">{b.dress}</td>
                  <td className="py-3 text-gray-400 text-xs">{b.hours}</td>
                  <td className="py-3 text-center">
                    <DifficultyBadge level={b.difficulty} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-600 mt-3">
          * 급여는 지역·경력·시기에 따라 달라집니다.{" "}
          <Link href="/jobs/salary-guide" className="text-primary-light hover:underline">
            상세 급여 가이드 보기
          </Link>
        </p>
      </section>

      {/* ─── 면접 팁 ─── */}
      <section id="interview">
        <SectionHeader emoji="3" title="면접 팁" subtitle="첫 면접에서 꼭 확인할 것들" />
        <div className="space-y-3">
          {INTERVIEW_TIPS.map((tip, i) => (
            <div key={i} className="card flex gap-3">
              <span className="text-primary font-bold text-lg shrink-0 w-7 text-center">
                {i + 1}
              </span>
              <div>
                <p className="font-bold text-sm">{tip.title}</p>
                <p className="text-xs text-gray-400 mt-1">{tip.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 사기 예방 ─── */}
      <section id="scam">
        <SectionHeader emoji="4" title="사기 예방" subtitle="이런 패턴은 무조건 피하세요" />
        <div className="space-y-3">
          {SCAM_PATTERNS.map((s, i) => (
            <div
              key={i}
              className={`card border-l-4 ${
                s.danger === "high"
                  ? "border-l-urgent"
                  : "border-l-accent"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                    s.danger === "high"
                      ? "bg-urgent/20 text-urgent"
                      : "bg-accent/20 text-accent"
                  }`}
                >
                  {s.danger === "high" ? "위험" : "주의"}
                </span>
                <p className="font-bold text-sm">{s.pattern}</p>
              </div>
              <p className="text-xs text-gray-400">{s.detail}</p>
            </div>
          ))}
        </div>

        <div className="card bg-urgent/5 border-urgent/20 mt-4">
          <p className="text-sm font-bold text-urgent mb-2">사기 피해 시 대처 방법</p>
          <ul className="text-xs text-gray-400 space-y-1.5">
            <li>1. 모든 대화 내용(카톡, 문자) 캡처하여 보관</li>
            <li>2. 입금 내역, 계좌 정보 캡처</li>
            <li>3. 가까운 경찰서 방문 또는 112 신고</li>
            <li>4. 사이버수사대 온라인 신고 (ecrm.police.go.kr)</li>
            <li>5. 밤여시 허위 구인글 신고 기능 활용</li>
          </ul>
        </div>
      </section>

      {/* ─── 근로자 권리 ─── */}
      <section id="rights">
        <SectionHeader emoji="5" title="근로자 권리" subtitle="어떤 업종이든 법적으로 보호받습니다" />
        <div className="space-y-3">
          <RightsCard
            title="근로계약서 작성 권리"
            desc="모든 근로자는 근로계약서를 작성할 권리가 있습니다. 구두 계약만으로는 분쟁 시 보호받기 어렵습니다."
          />
          <RightsCard
            title="임금 체불 시 신고"
            desc="약속한 급여를 받지 못하면 고용노동부(1350)에 신고할 수 있습니다. 업종과 관계없이 임금 체불은 불법입니다."
          />
          <RightsCard
            title="산업재해 보상"
            desc="근무 중 부상을 입으면 산재 보상을 받을 수 있습니다. 4대보험 미가입 업소도 마찬가지입니다."
          />
          <RightsCard
            title="성희롱·폭행 대응"
            desc="손님이나 업주의 성희롱·폭행은 형사 처벌 대상입니다. 112 신고 후 증거를 확보하세요."
          />
          <RightsCard
            title="퇴직의 자유"
            desc="언제든 퇴직할 수 있습니다. 위약금이나 벌금을 요구하는 것은 불법입니다."
          />
        </div>

        <div className="card bg-gradient-to-br from-dark-surface to-dark-card border-primary/20 mt-4">
          <p className="text-sm font-medium text-gray-300 mb-2">도움이 필요할 때</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-400">
            <div className="flex items-center gap-2">
              <span className="text-primary font-bold">1350</span>
              <span>고용노동부 (임금 체불, 근로 상담)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-primary font-bold">112</span>
              <span>경찰 (폭행, 성범죄, 감금)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-primary font-bold">1366</span>
              <span>여성긴급전화 (성폭력, 가정폭력)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-primary font-bold">1644-8295</span>
              <span>법률구조공단 (무료 법률 상담)</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="text-center space-y-4 py-4">
        <p className="text-gray-400 text-sm">
          밤여시 여시광장은 안전한 구인구직 환경을 만들기 위해 노력합니다.
        </p>
        <div className="flex justify-center gap-3">
          <Link href="/jobs" className="btn-primary text-sm py-2.5 px-6">
            구인글 둘러보기
          </Link>
          <Link href="/community" className="btn-outline text-sm py-2.5 px-6">
            커뮤니티
          </Link>
        </div>
      </section>
    </div>
  );
}

// ─── 컴포넌트 ───

function SectionHeader({
  emoji,
  title,
  subtitle,
}: {
  emoji: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-1">
        <span className="w-7 h-7 rounded-lg bg-primary/20 text-primary text-sm font-bold flex items-center justify-center">
          {emoji}
        </span>
        <h2 className="text-xl font-bold">{title}</h2>
      </div>
      <p className="text-sm text-gray-500">{subtitle}</p>
    </div>
  );
}

function DifficultyBadge({ level }: { level: string }) {
  const colorMap: Record<string, string> = {
    "하": "bg-success/20 text-success",
    "하~중": "bg-success/20 text-success",
    "중하": "bg-primary/20 text-primary-light",
    "중": "bg-primary/20 text-primary-light",
    "중상": "bg-accent/20 text-accent",
    "상": "bg-urgent/20 text-urgent",
  };
  return (
    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${colorMap[level] || "bg-gray-700 text-gray-400"}`}>
      {level}
    </span>
  );
}

function RightsCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="card">
      <p className="font-bold text-sm flex items-center gap-2">
        <svg className="w-4 h-4 text-success shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        {title}
      </p>
      <p className="text-xs text-gray-400 mt-1 ml-6">{desc}</p>
    </div>
  );
}
