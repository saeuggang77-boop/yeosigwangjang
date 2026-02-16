import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // 기획서 섹션 17 디자인 가이드
        primary: {
          DEFAULT: "#6B21A8", // 딥 퍼플
          light: "#7C3AED",
          dark: "#581C87",
        },
        secondary: {
          DEFAULT: "#D4A017", // 골드
          light: "#F59E0B",
          dark: "#B8860B",
        },
        dark: {
          bg: "#1A1A2E",      // Background (다크)
          surface: "#16213E", // Surface (다크 그레이)
          card: "#1E2A4A",    // 카드 배경
          border: "#2A3A5C",  // 테두리
        },
        accent: {
          DEFAULT: "#EC4899", // 핫핑크
          light: "#F472B6",
          dark: "#DB2777",
        },
        success: "#10B981",   // 그린
        urgent: "#EF4444",    // 레드
        premium: {
          gold: "#F59E0B",    // Premium Gold
          border: "#8B5CF6",  // Premium Border
        },
      },
      fontFamily: {
        sans: [
          "Pretendard",
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "Helvetica Neue",
          "Apple SD Gothic Neo",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
