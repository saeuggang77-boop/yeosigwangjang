"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error);
        return;
      }

      setIsSent(true);
    } catch {
      setError("처리 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">비밀번호 찾기</h1>
          <p className="text-gray-400 mt-2">
            가입한 이메일 주소를 입력해주세요
          </p>
        </div>

        <div className="card">
          {isSent ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-success"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2">이메일 발송 완료</h3>
              <p className="text-gray-400 text-sm">
                비밀번호 재설정 링크를 발송했습니다.
                <br />
                이메일을 확인해주세요. (1시간 유효)
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <p className="text-urgent text-sm text-center bg-urgent/10 py-2 rounded-lg">
                  {error}
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
                  placeholder="가입한 이메일 주소"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary py-3 disabled:opacity-50"
              >
                {isLoading ? "발송 중..." : "재설정 링크 발송"}
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-gray-400">
          <Link href="/auth/login" className="text-primary-light hover:underline">
            로그인으로 돌아가기
          </Link>
        </p>
      </div>
    </div>
  );
}
