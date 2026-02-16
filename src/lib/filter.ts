// ==========================================
// 차별 키워드 필터링 (기획서 2-4, v6 추가)
// 고용노동부 모니터링 대응
// ==========================================

// 성별 제한 — 남녀고용평등법 제7조
const GENDER_KEYWORDS = [
  "여직원", "남직원", "여성만", "남성만", "여자만", "남자만",
  "여성 우대", "남성 우대", "여성 환영", "여사원", "남사원",
];

// 나이 제한 — 고령자고용법
const AGE_KEYWORDS = [
  "20대만", "30대만", "20~30", "20대 이하", "30대 이하",
  "나이제한", "연령제한", "젊은 분", "40대 이하",
];

// 외모 조건 — 남녀고용평등법
const APPEARANCE_KEYWORDS = [
  "외모 중시", "외모 우선", "미모", "키 제한", "몸무게",
  "외모 우대", "비주얼", "얼굴", "체형", "마른 분",
];

// 허위·과장 — 직업안정법
const FRAUD_KEYWORDS = [
  "보장 100만", "무조건 보장", "확정 수입", "월 1000만",
  "거짓 없는", "100% 보장",
];

const ALL_BANNED = [
  ...GENDER_KEYWORDS,
  ...AGE_KEYWORDS,
  ...APPEARANCE_KEYWORDS,
  ...FRAUD_KEYWORDS,
];

export interface FilterResult {
  isClean: boolean;
  violations: { keyword: string; category: string }[];
}

export function filterJobContent(text: string): FilterResult {
  const lower = text.toLowerCase();
  const violations: { keyword: string; category: string }[] = [];

  for (const kw of GENDER_KEYWORDS) {
    if (lower.includes(kw.toLowerCase())) {
      violations.push({ keyword: kw, category: "성별 제한" });
    }
  }
  for (const kw of AGE_KEYWORDS) {
    if (lower.includes(kw.toLowerCase())) {
      violations.push({ keyword: kw, category: "나이 제한" });
    }
  }
  for (const kw of APPEARANCE_KEYWORDS) {
    if (lower.includes(kw.toLowerCase())) {
      violations.push({ keyword: kw, category: "외모 조건" });
    }
  }
  for (const kw of FRAUD_KEYWORDS) {
    if (lower.includes(kw.toLowerCase())) {
      violations.push({ keyword: kw, category: "허위·과장" });
    }
  }

  return {
    isClean: violations.length === 0,
    violations,
  };
}

/** 필터링 대상 텍스트를 합쳐서 검사 */
export function filterJobForm(fields: {
  title: string;
  description: string;
  requirements?: string;
  salary?: string;
}): FilterResult {
  const combined = [
    fields.title,
    fields.description,
    fields.requirements || "",
    fields.salary || "",
  ].join(" ");
  return filterJobContent(combined);
}
