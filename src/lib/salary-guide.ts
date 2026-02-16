// ==========================================
// 업종별 급여 가이드라인
// 일급 기준 (만원), 실제 현장 평균 참고
// ==========================================

export interface SalaryRange {
  bizType: string;
  dailyMin: number; // 만원
  dailyMax: number; // 만원
  note: string; // 참고 설명
}

export const SALARY_GUIDE: SalaryRange[] = [
  { bizType: "룸싸롱", dailyMin: 40, dailyMax: 80, note: "TC 기준, 지역·시스템에 따라 차이" },
  { bizType: "텐프로", dailyMin: 50, dailyMax: 100, note: "TC 기준, 강남권 상위" },
  { bizType: "클럽", dailyMin: 20, dailyMax: 50, note: "시급+팁 구조, 포지션별 차이" },
  { bizType: "라운지", dailyMin: 25, dailyMax: 60, note: "TC 또는 시급+인센티브" },
  { bizType: "바", dailyMin: 15, dailyMax: 35, note: "시급 위주, 팁 별도" },
  { bizType: "착석바", dailyMin: 20, dailyMax: 50, note: "TC 또는 일급제" },
  { bizType: "퍼브", dailyMin: 15, dailyMax: 35, note: "시급 위주" },
  { bizType: "가라오케", dailyMin: 25, dailyMax: 60, note: "TC 기준" },
  { bizType: "노래주점", dailyMin: 20, dailyMax: 45, note: "일급 또는 TC" },
  { bizType: "마사지", dailyMin: 15, dailyMax: 40, note: "건당 또는 일급제" },
  { bizType: "보도", dailyMin: 30, dailyMax: 70, note: "TC 기준, 매칭 수에 따라 변동" },
  { bizType: "해외", dailyMin: 30, dailyMax: 100, note: "국가·업종별 편차 큼" },
  { bizType: "기타", dailyMin: 15, dailyMax: 50, note: "업종에 따라 상이" },
];

const guideMap = new Map(SALARY_GUIDE.map((g) => [g.bizType, g]));

export function getGuideForBizType(bizType: string): SalaryRange | undefined {
  return guideMap.get(bizType);
}

// ==========================================
// 급여 문자열 파싱 → 일급 만원 단위 숫자
// ==========================================

/**
 * 자유형 급여 문자열에서 대표 일급(만원)을 추출한다.
 * "일급 50만원" → 50
 * "월 200만원" → 약 일급 환산 (÷ 25일)
 * "TC 협의" → null (파싱 불가)
 * "30~50" → 40 (중간값)
 * 반환: 일급(만원) 또는 null
 */
export function parseSalaryToDaily(salary: string): number | null {
  if (!salary) return null;

  const s = salary.replace(/,/g, "").replace(/\s+/g, " ").trim();

  // "협의", "면접 후 결정" 등 → null
  if (/협의|면접|결정|문의|전화/.test(s)) return null;

  // 숫자 추출 (범위 포함: "30~50", "30-50", "30만~50만")
  const rangeMatch = s.match(
    /(\d+)\s*(?:만\s*(?:원)?)?\s*[~\-–]\s*(\d+)\s*(?:만\s*(?:원)?)?/
  );
  const singleMatch = s.match(/(\d+)\s*(?:만\s*(?:원)?)?/);

  let value: number | null = null;

  if (rangeMatch) {
    const low = parseInt(rangeMatch[1]);
    const high = parseInt(rangeMatch[2]);
    value = (low + high) / 2;
  } else if (singleMatch) {
    value = parseInt(singleMatch[1]);
  }

  if (value === null || value <= 0) return null;

  // "만원" 단위가 아닌 원 단위 숫자 보정 (100 이상이면 만원 단위로 변환)
  // 예: "500000" → 50만원 → 50
  if (value >= 10000) {
    value = value / 10000;
  } else if (value >= 1000) {
    // "1000만원" 같은 경우는 그대로 (월급일 수 있음)
    // 하지만 "500만" 같은 월급은 아래서 처리
  }

  // 월급 판별 → 일급 환산
  const isMonthly = /월\s*(?:급|봉|수입|소득|\d)|월\s*\d/.test(s);
  if (isMonthly && value > 100) {
    // "월 200만원" → 일급 8만원 (25일 기준)
    value = Math.round(value / 25);
  } else if (isMonthly) {
    value = Math.round(value / 25);
  }

  // 시급 판별 → 일급 환산 (8시간 기준)
  const isHourly = /시급|시간/.test(s);
  if (isHourly) {
    value = Math.round(value * 8);
  }

  // 극단값 필터 (0 이하 또는 500만원 이상 일급은 비현실적)
  if (value <= 0 || value > 500) return null;

  return value;
}

// ==========================================
// 업종 평균 대비 비교
// ==========================================

export type SalaryLevel = "above" | "average" | "below" | null;

export interface SalaryComparison {
  level: SalaryLevel;
  label: string;
  dailyValue: number | null;
  guideMin: number;
  guideMax: number;
  guideMid: number;
}

/**
 * 급여 문자열과 업종을 받아 평균 대비 수준을 반환
 */
export function compareSalary(
  salary: string | null | undefined,
  bizType: string
): SalaryComparison | null {
  if (!salary) return null;

  const guide = getGuideForBizType(bizType);
  if (!guide) return null;

  const daily = parseSalaryToDaily(salary);
  if (daily === null) return null;

  const mid = (guide.dailyMin + guide.dailyMax) / 2;
  const margin = (guide.dailyMax - guide.dailyMin) * 0.15; // 15% 마진

  let level: SalaryLevel;
  let label: string;

  if (daily >= mid + margin) {
    level = "above";
    label = "평균 이상";
  } else if (daily <= mid - margin) {
    level = "below";
    label = "평균 이하";
  } else {
    level = "average";
    label = "평균 수준";
  }

  return {
    level,
    label,
    dailyValue: daily,
    guideMin: guide.dailyMin,
    guideMax: guide.dailyMax,
    guideMid: mid,
  };
}
