"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdRegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    email: "",
    password: "",
    passwordConfirm: "",
    bizRegNumber: "",
    representName: "",
    phone: "",
  });

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register/ad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          bizRegNumber: form.bizRegNumber,
          representName: form.representName,
          phone: form.phone,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        return;
      }

      router.push("/auth/login?registered=ad");
    } catch {
      setError("회원가입 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">광고업체 회원가입</h1>
          <p className="text-gray-400 mt-2">
            업체 광고 등록 및 구직글 열람이 자동 포함됩니다
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
                이메일 <span className="text-urgent">*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                className="input-field"
                placeholder="example@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">
                비밀번호 <span className="text-urgent">*</span>
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => updateField("password", e.target.value)}
                className="input-field"
                placeholder="8자 이상"
                minLength={8}
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">
                비밀번호 확인 <span className="text-urgent">*</span>
              </label>
              <input
                type="password"
                value={form.passwordConfirm}
                onChange={(e) => updateField("passwordConfirm", e.target.value)}
                className="input-field"
                placeholder="비밀번호 재입력"
                minLength={8}
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">
                사업자등록번호 <span className="text-urgent">*</span>
              </label>
              <input
                type="text"
                value={form.bizRegNumber}
                onChange={(e) => updateField("bizRegNumber", e.target.value)}
                className="input-field"
                placeholder="000-00-00000"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">
                대표자명 <span className="text-urgent">*</span>
              </label>
              <input
                type="text"
                value={form.representName}
                onChange={(e) => updateField("representName", e.target.value)}
                className="input-field"
                placeholder="대표자 성명"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">
                연락처 <span className="text-urgent">*</span>
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                className="input-field"
                placeholder="010-0000-0000"
                required
              />
            </div>

            <div className="bg-dark-card rounded-lg p-3 text-sm text-gray-400">
              관리자 심사 후 승인되면 광고 등록이 가능합니다.
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-3 disabled:opacity-50"
            >
              {isLoading ? "가입 중..." : "회원가입"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-gray-400">
          이미 계정이 있나요?{" "}
          <Link href="/auth/login" className="text-primary-light hover:underline">
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}
