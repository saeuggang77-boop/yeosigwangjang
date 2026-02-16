"use client";

import { useState } from "react";

// 카카오톡 채널 채팅 URL (채널 개설 후 실제 ID로 교체)
const KAKAO_CHANNEL_CHAT_URL = "https://pf.kakao.com/_bamyeosi/chat";

export default function KakaoChatButton() {
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {/* 툴팁 */}
      {isTooltipOpen && (
        <div className="bg-dark-surface border border-dark-border rounded-xl p-4 shadow-xl w-64 animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-sm">카카오톡 상담</span>
            <button
              onClick={() => setIsTooltipOpen(false)}
              className="text-gray-500 hover:text-gray-300 text-lg leading-none"
            >
              &times;
            </button>
          </div>
          <p className="text-xs text-gray-400 mb-3">
            이용 문의, 결제 문의, 신고 등<br />
            무엇이든 편하게 물어보세요.
          </p>
          <ul className="text-xs text-gray-500 space-y-1 mb-3">
            <li>· 운영 시간: 매일 18:00 ~ 04:00</li>
            <li>· 평균 응답: 30분 이내</li>
          </ul>
          <a
            href={KAKAO_CHANNEL_CHAT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center bg-[#FEE500] text-[#3C1E1E] font-bold text-sm py-2.5 rounded-lg hover:bg-[#FDD835] transition-colors"
          >
            카카오톡으로 상담하기
          </a>
          <p className="text-[10px] text-gray-600 text-center mt-2">
            등록 대행은 하지 않습니다
          </p>
        </div>
      )}

      {/* 플로팅 버튼 */}
      <button
        onClick={() => setIsTooltipOpen((prev) => !prev)}
        className="w-14 h-14 rounded-full bg-[#FEE500] hover:bg-[#FDD835] shadow-lg hover:shadow-xl transition-all flex items-center justify-center group"
        aria-label="카카오톡 상담"
      >
        {/* 카카오톡 말풍선 아이콘 */}
        <svg
          className="w-7 h-7 text-[#3C1E1E]"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 3C6.48 3 2 6.58 2 10.94c0 2.8 1.86 5.27 4.66 6.67-.15.53-.96 3.4-.99 3.62 0 0-.02.17.09.24.11.06.24.01.24.01.32-.04 3.7-2.44 4.28-2.86.55.08 1.13.12 1.72.12 5.52 0 10-3.58 10-7.8C22 6.58 17.52 3 12 3z" />
        </svg>
      </button>
    </div>
  );
}
