import type { BizCategory } from "@prisma/client";

// ==========================================
// 구인글 가격 (VAT 포함)
// ==========================================
export const JOB_PRICES = {
  LIGHT: 30_000,
  BASIC: 80_000,
  PREMIUM: 150_000,
  URGENT: 20_000, // 추가옵션, 7일
  BUMP: 8_000, // 수동 끌올, 1회
  PKG_BASIC: 110_000, // 기본 + 열람권
  PKG_PREMIUM: 200_000, // 프리미엄 + 열람권 + 긴급 1회
} as const;

// ==========================================
// 끌올 패키지 (VAT 포함)
// ==========================================
export const BUMP_PKG_PRICES = {
  5: 35_000, // 정가 40,000 (12% 할인)
  10: 60_000, // 정가 80,000 (25% 할인)
} as const;

export type BumpPkgQuantity = keyof typeof BUMP_PKG_PRICES;

// ==========================================
// 구직글 열람권 (VAT 포함)
// ==========================================
export const SEEK_ACCESS_PRICE = 50_000; // ₩50,000/월

// ==========================================
// 업체 광고 가격 (카테고리별 자동 매핑)
// ==========================================
const AD_PRICE_MAP: Record<
  BizCategory,
  { tier: "A" | "B" | "C"; basic: number; premium: number }
> = {
  SURGERY_SKIN: { tier: "A", basic: 500_000, premium: 1_000_000 },
  HAIR_MAKEUP: { tier: "B", basic: 100_000, premium: 200_000 },
  FASHION: { tier: "B", basic: 100_000, premium: 200_000 },
  NAIL_BEAUTY: { tier: "B", basic: 100_000, premium: 200_000 },
  FITNESS: { tier: "B", basic: 100_000, premium: 200_000 },
  TAX_LAW: { tier: "C", basic: 80_000, premium: 150_000 },
  REALESTATE: { tier: "C", basic: 80_000, premium: 150_000 },
  ETC: { tier: "C", basic: 80_000, premium: 150_000 },
} as const;

export function getAdPriceTier(category: BizCategory) {
  return AD_PRICE_MAP[category];
}

// ==========================================
// 선결제 할인율
// ==========================================
export const PREPAY_DISCOUNT = {
  1: 0,
  2: 0.1, // 10% 할인
  3: 0.2, // 20% 할인
} as const;

export type PrepayMonths = keyof typeof PREPAY_DISCOUNT;

export function calcPrepayPrice(
  monthlyPrice: number,
  months: PrepayMonths
): number {
  const discount = PREPAY_DISCOUNT[months];
  return Math.round(monthlyPrice * months * (1 - discount));
}

// ==========================================
// 추가 광고 상품 (VAT 포함)
// ==========================================
export const AD_EXTRA_PRICES = {
  MAIN_BANNER: 800_000, // 홈 최상단 슬라이더
  JOB_PAGE_BANNER: 300_000, // 구인 목록 상단
  POPUP: 500_000, // 사이트 접속 시 1일 1회
} as const;

// ==========================================
// 포맷 헬퍼
// ==========================================
export function formatPrice(price: number): string {
  return new Intl.NumberFormat("ko-KR").format(price);
}

export function formatPriceWithUnit(price: number): string {
  if (price === 0) return "₩0";
  return `₩${formatPrice(price)}`;
}
