"use client";

import { useEffect, useState } from "react";
import { BIZ_CATEGORIES } from "@/lib/constants";

const BIZ_CAT_LABEL: Record<string, string> = Object.fromEntries(
  BIZ_CATEGORIES.map((c) => [c.enum, c.label])
);

interface AdProfile {
  email: string;
  representName: string;
  bizRegNumber: string;
  bizCategory: string;
  phone: string;
  isApproved: boolean;
  createdAt: string;
}

export default function AdSettingsPage() {
  const [profile, setProfile] = useState<AdProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({ representName: "", phone: "" });

  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMessage, setPwMessage] = useState("");
  const [pwError, setPwError] = useState("");

  useEffect(() => {
    fetch("/api/ad/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.email) {
          setProfile(data);
          setForm({ representName: data.representName, phone: data.phone });
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setIsSaving(true);

    try {
      const res = await fetch("/api/ad/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setProfile(data);
      setMessage("저장되었습니다.");
    } catch {
      setError("저장 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");
    setPwMessage("");

    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError("새 비밀번호가 일치하지 않습니다.");
      return;
    }
    if (pwForm.newPassword.length < 8) {
      setPwError("새 비밀번호는 8자 이상이어야 합니다.");
      return;
    }

    setPwSaving(true);
    try {
      const res = await fetch("/api/ad/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: pwForm.currentPassword,
          newPassword: pwForm.newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPwError(data.error);
        return;
      }
      setPwMessage("비밀번호가 변경되었습니다.");
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch {
      setPwError("변경 중 오류가 발생했습니다.");
    } finally {
      setPwSaving(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-16 text-gray-500">로딩 중...</div>;
  }
  if (!profile) {
    return <div className="text-center py-16 text-gray-400">정보를 불러올 수 없습니다.</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">프로필 설정</h1>

      {/* 계정 정보 (읽기 전용) */}
      <div className="card">
        <h2 className="font-bold text-sm text-gray-300 mb-2">계정 정보</h2>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">이메일</span>
            <span>{profile.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">사업자등록번호</span>
            <span>{profile.bizRegNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">업종</span>
            <span>{BIZ_CAT_LABEL[profile.bizCategory] || profile.bizCategory}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">가입일</span>
            <span>{new Date(profile.createdAt).toLocaleDateString("ko-KR")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">승인 상태</span>
            {profile.isApproved ? (
              <span className="badge-verified text-xs">승인됨</span>
            ) : (
              <span className="text-xs text-accent bg-accent/10 px-2 py-0.5 rounded">대기</span>
            )}
          </div>
        </div>
      </div>

      {/* 프로필 수정 */}
      <form onSubmit={handleProfileSubmit} className="card space-y-4">
        <h2 className="font-bold text-sm text-gray-300">정보 수정</h2>

        {message && (
          <p className="text-success text-sm bg-success/10 py-2 px-3 rounded-lg">{message}</p>
        )}
        {error && (
          <p className="text-urgent text-sm bg-urgent/10 py-2 px-3 rounded-lg">{error}</p>
        )}

        <div>
          <label className="block text-sm text-gray-400 mb-1">대표자명</label>
          <input
            type="text"
            value={form.representName}
            onChange={(e) => setForm((p) => ({ ...p, representName: e.target.value }))}
            className="input-field"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">연락처</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
            className="input-field"
            placeholder="010-0000-0000"
            required
          />
        </div>

        <button type="submit" disabled={isSaving} className="btn-primary py-2.5 w-full disabled:opacity-50">
          {isSaving ? "저장 중..." : "저장하기"}
        </button>
      </form>

      {/* 비밀번호 변경 */}
      <form onSubmit={handlePasswordSubmit} className="card space-y-4">
        <h2 className="font-bold text-sm text-gray-300">비밀번호 변경</h2>

        {pwMessage && (
          <p className="text-success text-sm bg-success/10 py-2 px-3 rounded-lg">{pwMessage}</p>
        )}
        {pwError && (
          <p className="text-urgent text-sm bg-urgent/10 py-2 px-3 rounded-lg">{pwError}</p>
        )}

        <div>
          <label className="block text-sm text-gray-400 mb-1">현재 비밀번호</label>
          <input
            type="password"
            value={pwForm.currentPassword}
            onChange={(e) => setPwForm((p) => ({ ...p, currentPassword: e.target.value }))}
            className="input-field"
            required
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">새 비밀번호</label>
          <input
            type="password"
            value={pwForm.newPassword}
            onChange={(e) => setPwForm((p) => ({ ...p, newPassword: e.target.value }))}
            className="input-field"
            placeholder="8자 이상"
            required
            minLength={8}
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">새 비밀번호 확인</label>
          <input
            type="password"
            value={pwForm.confirmPassword}
            onChange={(e) => setPwForm((p) => ({ ...p, confirmPassword: e.target.value }))}
            className="input-field"
            required
            minLength={8}
          />
        </div>

        <button type="submit" disabled={pwSaving} className="btn-outline py-2.5 w-full disabled:opacity-50">
          {pwSaving ? "변경 중..." : "비밀번호 변경"}
        </button>
      </form>

      <div className="text-xs text-gray-600 space-y-1">
        <p>* 이메일, 사업자등록번호, 업종은 변경할 수 없습니다.</p>
        <p>* 계정 삭제는 고객센터로 문의해주세요.</p>
      </div>
    </div>
  );
}
