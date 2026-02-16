"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

type LoginTab = "member" | "biz";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const error = searchParams.get("error");

  const [tab, setTab] = useState<LoginTab>("member");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(
    error === "CredentialsSignin" ? "이메일 또는 비밀번호가 일치하지 않습니다." : ""
  );

  const handleSocialLogin = (provider: string) => {
    signIn(provider, { callbackUrl });
  };

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    // 업소 로그인 시도 → 실패 시 광고업체 로그인 시도
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
        setErrorMsg("이메일 또는 비밀번호가 일치하지 않습니다.");
        setIsLoading(false);
        return;
      }

      router.push(callbackUrl);
      return;
    }

    router.push(callbackUrl);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* 로고 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-light">
            여시광장
          </h1>
          <p className="text-gray-400 mt-2">2만 여시의 커뮤니티</p>
        </div>

        {/* 탭 선택 */}
        <div className="flex rounded-lg bg-dark-card p-1 mb-6">
          <button
            onClick={() => setTab("member")}
            className={`flex-1 py-2.5 rounded-md text-sm font-medium transition-colors ${
              tab === "member"
                ? "bg-primary text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            일반회원
          </button>
          <button
            onClick={() => setTab("biz")}
            className={`flex-1 py-2.5 rounded-md text-sm font-medium transition-colors ${
              tab === "biz"
                ? "bg-primary text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            업소 / 광고회원
          </button>
        </div>

        <div className="card">
          {tab === "member" ? (
            /* 일반회원 - 소셜 로그인 */
            <div className="space-y-3">
              <button
                onClick={() => handleSocialLogin("kakao")}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-medium bg-[#FEE500] text-[#191919] hover:bg-[#FDD800] transition-colors"
              >
                카카오로 시작하기
              </button>
              <button
                onClick={() => handleSocialLogin("naver")}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-medium bg-[#03C75A] text-white hover:bg-[#02B350] transition-colors"
              >
                네이버로 시작하기
              </button>
              <button
                onClick={() => handleSocialLogin("google")}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-medium bg-white text-gray-800 hover:bg-gray-100 transition-colors"
              >
                Google로 시작하기
              </button>
              <button
                onClick={() => handleSocialLogin("apple")}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-medium bg-black text-white border border-gray-700 hover:bg-gray-900 transition-colors"
              >
                Apple로 시작하기
              </button>
            </div>
          ) : (
            /* 업소/광고 회원 - 이메일 로그인 */
            <form onSubmit={handleCredentialsLogin} className="space-y-4">
              {errorMsg && (
                <p className="text-urgent text-sm text-center bg-urgent/10 py-2 rounded-lg">
                  {errorMsg}
                </p>
              )}
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  이메일
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="example@email.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  비밀번호
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  placeholder="8자 이상"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary py-3 disabled:opacity-50"
              >
                {isLoading ? "로그인 중..." : "로그인"}
              </button>
              <div className="flex items-center justify-between text-sm">
                <Link
                  href="/auth/forgot-password"
                  className="text-gray-400 hover:text-primary-light"
                >
                  비밀번호 찾기
                </Link>
              </div>
            </form>
          )}
        </div>

        {/* 하단 링크 */}
        <div className="mt-6 text-center text-sm text-gray-400 space-y-2">
          {tab === "biz" && (
            <div className="flex gap-4 justify-center">
              <Link
                href="/auth/register/biz"
                className="text-primary-light hover:underline"
              >
                업소 회원가입
              </Link>
              <Link
                href="/auth/register/ad"
                className="text-primary-light hover:underline"
              >
                광고업체 회원가입
              </Link>
            </div>
          )}
          <p>
            <Link href="/" className="text-gray-500 hover:text-gray-300">
              홈으로 돌아가기
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
