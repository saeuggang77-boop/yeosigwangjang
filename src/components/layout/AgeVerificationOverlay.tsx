"use client";

import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";

const COOKIE_NAME = "age_verified";
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30일 (초)

type Tab = "guest" | "member";
type MemberType = "member" | "biz";

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? match[2] : null;
}

function setCookie(name: string, value: string, maxAge: number) {
  document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export default function AgeVerificationOverlay() {
  const { data: session, status } = useSession();
  const [verified, setVerified] = useState(true); // 기본 true로 깜빡임 방지
  const [tab, setTab] = useState<Tab>("member");
  const [memberType, setMemberType] = useState<MemberType>("member");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // 로그인 상태면 인증 완료
    if (session) {
      setVerified(true);
      return;
    }
    // 쿠키 확인
    const cookie = getCookie(COOKIE_NAME);
    if (cookie === "true") {
      setVerified(true);
      return;
    }
    // 로딩 끝나면 오버레이 표시
    if (status !== "loading") {
      setVerified(false);
    }
  }, [session, status]);

  // PASS 본인인증 (UI만 — 실제 연동 전)
  const handlePassVerify = () => {
    // TODO: NICE PASS 본인인증 팝업 연동
    // 인증 성공 시 쿠키 세팅
    setCookie(COOKIE_NAME, "true", COOKIE_MAX_AGE);
    setVerified(true);
  };

  // 소셜 로그인
  const handleSocialLogin = (provider: string) => {
    signIn(provider, { callbackUrl: "/" });
  };

  // 업소/광고 이메일 로그인
  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError("");

    const result = await signIn("biz-login", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      const adResult = await signIn("ad-login", {
        email,
        password,
        redirect: false,
      });
      if (adResult?.error) {
        setLoginError("이메일 또는 비밀번호가 일치하지 않습니다.");
        setIsLoading(false);
        return;
      }
    }

    setVerified(true);
    setIsLoading(false);
  };

  // 미성년자 나가기
  const handleExit = () => {
    window.location.href = "https://www.naver.com";
  };

  if (verified) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 블러 (뒤에 콘텐츠 보임 = SEO) */}
      <div className="absolute inset-0 bg-dark-bg/85 backdrop-blur-sm" />

      {/* 모달 */}
      <div className="relative z-10 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="bg-dark-surface border border-dark-border rounded-2xl shadow-2xl p-6 sm:p-8">
          {/* 경고 아이콘 & 문구 */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-full bg-urgent/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-urgent">19</span>
            </div>
            <h2 className="text-lg font-bold mb-3">19세 미만 이용불가</h2>
            <p className="text-sm text-gray-400 leading-relaxed">
              본 정보내용은 청소년유해매체물로서
              <br />
              정보통신망 이용촉진 및 정보보호 등에 관한
              <br />
              법률 및 청소년보호법의 규정에 의하여
              <br />
              <span className="text-gray-300 font-medium">
                만 19세 미만의 청소년이 이용할 수 없습니다.
              </span>
            </p>
          </div>

          {/* 탭 전환: 비회원 인증 / 회원 인증 */}
          <div className="flex rounded-lg bg-dark-card p-1 mb-5">
            <button
              onClick={() => setTab("guest")}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                tab === "guest"
                  ? "bg-primary text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              비회원 인증
            </button>
            <button
              onClick={() => setTab("member")}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                tab === "member"
                  ? "bg-primary text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              회원 인증
            </button>
          </div>

          {tab === "guest" ? (
            /* ─── 비회원: PASS 본인인증 ─── */
            <div className="space-y-4">
              <p className="text-sm text-gray-400 text-center">
                PASS 본인인증으로 성인 여부를 확인합니다.
                <br />
                <span className="text-xs text-gray-500">
                  열람만 가능하며, 글 작성은 회원가입이 필요합니다.
                </span>
              </p>
              <button
                onClick={handlePassVerify}
                className="w-full py-3 rounded-lg font-bold text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                PASS 본인인증
              </button>
              <p className="text-xs text-gray-600 text-center">
                인증 정보는 30일간 유지됩니다
              </p>
            </div>
          ) : (
            /* ─── 회원 인증: 소셜 + 이메일 ─── */
            <div className="space-y-4">
              {/* 회원 구분 */}
              <div className="flex items-center gap-4 justify-center">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="memberType"
                    checked={memberType === "member"}
                    onChange={() => setMemberType("member")}
                    className="accent-primary"
                  />
                  <span className="text-sm">일반회원</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="memberType"
                    checked={memberType === "biz"}
                    onChange={() => setMemberType("biz")}
                    className="accent-primary"
                  />
                  <span className="text-sm">업소회원</span>
                </label>
              </div>

              {memberType === "member" ? (
                /* 소셜 로그인 */
                <div className="space-y-2.5">
                  <button
                    onClick={() => handleSocialLogin("kakao")}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-sm bg-[#FEE500] text-[#191919] hover:bg-[#FDD800] transition-colors"
                  >
                    카카오로 시작하기
                  </button>
                  <button
                    onClick={() => handleSocialLogin("naver")}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-sm bg-[#03C75A] text-white hover:bg-[#02B350] transition-colors"
                  >
                    네이버로 시작하기
                  </button>
                  <button
                    onClick={() => handleSocialLogin("google")}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-sm bg-white text-gray-800 hover:bg-gray-100 transition-colors"
                  >
                    Google로 시작하기
                  </button>
                  <button
                    onClick={() => handleSocialLogin("apple")}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-sm bg-black text-white border border-gray-700 hover:bg-gray-900 transition-colors"
                  >
                    Apple로 시작하기
                  </button>
                </div>
              ) : (
                /* 업소/광고 이메일 로그인 */
                <form onSubmit={handleCredentialsLogin} className="space-y-3">
                  {loginError && (
                    <p className="text-urgent text-xs text-center bg-urgent/10 py-1.5 rounded-lg">
                      {loginError}
                    </p>
                  )}
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field text-sm"
                    placeholder="이메일"
                    required
                  />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field text-sm"
                    placeholder="비밀번호"
                    required
                  />
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full btn-primary py-2.5 text-sm disabled:opacity-50"
                  >
                    {isLoading ? "로그인 중..." : "로그인"}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* 성인인증 우회 (테스트용 — 배포 전 반드시 제거할 것) */}
          <button
            onClick={() => {
              setCookie(COOKIE_NAME, "true", COOKIE_MAX_AGE);
              setVerified(true);
            }}
            className="w-full mt-4 py-2 rounded-lg text-xs text-yellow-500 border border-yellow-500/30 hover:bg-yellow-500/10 transition-colors"
          >
            [TEST] 성인인증 우회
          </button>

          {/* 나가기 */}
          <button
            onClick={handleExit}
            className="w-full mt-3 py-2 text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            만 19세 미만 나가기
          </button>
        </div>
      </div>
    </div>
  );
}
