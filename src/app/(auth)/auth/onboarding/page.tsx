"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        return;
      }

      // 세션 갱신 → JWT에 새 닉네임 반영
      await update({ nickname: data.nickname });
      router.push("/");
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
          <h1 className="text-2xl font-bold">환영합니다!</h1>
          <p className="text-gray-400 mt-2">
            여시광장에서 사용할 닉네임을 설정해주세요
          </p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <p className="text-urgent text-sm text-center bg-urgent/10 py-2 rounded-lg">
                {error}
              </p>
            )}

            <div>
              <label className="block text-sm text-gray-400 mb-1">
                닉네임
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="input-field"
                placeholder="2~12자"
                minLength={2}
                maxLength={12}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                한글, 영문, 숫자 조합 가능 (2~12자)
              </p>
            </div>

            {session?.user.nickname && (
              <p className="text-xs text-gray-600">
                현재: {session.user.nickname}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading || nickname.trim().length < 2}
              className="w-full btn-primary py-3 disabled:opacity-50"
            >
              {isLoading ? "설정 중..." : "시작하기"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
