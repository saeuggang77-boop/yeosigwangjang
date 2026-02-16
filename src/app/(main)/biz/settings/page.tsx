"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { REGIONS } from "@/lib/constants";

interface BizProfile {
  email: string;
  bizName: string;
  region: string;
  phone: string;
  bizRegNumber: string | null;
  isVerifiedBiz: boolean;
  createdAt: string;
}

export default function BizSettingsPage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<BizProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // 프로필 폼
  const [form, setForm] = useState({
    bizName: "",
    region: "",
    phone: "",
    bizRegNumber: "",
  });

  // 비밀번호 폼
  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMessage, setPwMessage] = useState("");
  const [pwError, setPwError] = useState("");

  useEffect(() => {
    fetch("/api/biz/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.email) {
          setProfile(data);
          setForm({
            bizName: data.bizName,
            region: data.region,
            phone: data.phone,
            bizRegNumber: data.bizRegNumber || "",
          });
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
      const res = await fetch("/api/biz/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }

      setProfile((prev) => (prev ? { ...prev, ...data } : prev));
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
      const res = await fetch("/api/biz/settings", {
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
    return <div className="text-center py-20 text-gray-500">로딩 중...</div>;
  }

  if (!profile) {
    return (
      <div className="text-center py-20 text-gray-500">
        정보를 불러올 수 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">설정</h1>

      {/* 계정 정보 */}
      <div className="card">
        <h2 className="font-bold text-sm text-gray-300 mb-1">계정 정보</h2>
        <p className="text-sm text-gray-400">
          {profile.email}
        </p>
        <p className="text-xs text-gray-600 mt-1">
          가입일: {new Date(profile.createdAt).toLocaleDateString("ko-KR")}
          {profile.isVerifiedBiz && (
            <span className="ml-2 badge-verified text-xs">인증업소</span>
          )}
        </p>
      </div>

      {/* 프로필 수정 */}
      <form onSubmit={handleProfileSubmit} className="card space-y-4">
        <h2 className="font-bold text-sm text-gray-300">업소 정보 수정</h2>

        {message && (
          <p className="text-success text-sm bg-success/10 py-2 px-3 rounded-lg">
            {message}
          </p>
        )}
        {error && (
          <p className="text-urgent text-sm bg-urgent/10 py-2 px-3 rounded-lg">
            {error}
          </p>
        )}

        <div>
          <label className="block text-sm text-gray-400 mb-1">업소명</label>
          <input
            type="text"
            value={form.bizName}
            onChange={(e) =>
              setForm((p) => ({ ...p, bizName: e.target.value }))
            }
            className="input-field"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">지역</label>
          <select
            value={form.region}
            onChange={(e) =>
              setForm((p) => ({ ...p, region: e.target.value }))
            }
            className="input-field"
            required
          >
            <option value="">지역 선택</option>
            {REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">연락처</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) =>
              setForm((p) => ({ ...p, phone: e.target.value }))
            }
            className="input-field"
            placeholder="010-0000-0000"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">
            사업자등록번호
            <span className="text-xs text-gray-600 ml-1">(선택)</span>
          </label>
          <input
            type="text"
            value={form.bizRegNumber}
            onChange={(e) =>
              setForm((p) => ({ ...p, bizRegNumber: e.target.value }))
            }
            className="input-field"
            placeholder="000-00-00000"
          />
          {!profile.isVerifiedBiz && (
            <p className="text-xs text-gray-600 mt-1">
              사업자등록번호를 입력하면 관리자 인증 심사를 받을 수 있습니다.
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="btn-primary py-2.5 w-full disabled:opacity-50"
        >
          {isSaving ? "저장 중..." : "저장하기"}
        </button>
      </form>

      {/* 비밀번호 변경 */}
      <form onSubmit={handlePasswordSubmit} className="card space-y-4">
        <h2 className="font-bold text-sm text-gray-300">비밀번호 변경</h2>

        {pwMessage && (
          <p className="text-success text-sm bg-success/10 py-2 px-3 rounded-lg">
            {pwMessage}
          </p>
        )}
        {pwError && (
          <p className="text-urgent text-sm bg-urgent/10 py-2 px-3 rounded-lg">
            {pwError}
          </p>
        )}

        <div>
          <label className="block text-sm text-gray-400 mb-1">
            현재 비밀번호
          </label>
          <input
            type="password"
            value={pwForm.currentPassword}
            onChange={(e) =>
              setPwForm((p) => ({ ...p, currentPassword: e.target.value }))
            }
            className="input-field"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">
            새 비밀번호
          </label>
          <input
            type="password"
            value={pwForm.newPassword}
            onChange={(e) =>
              setPwForm((p) => ({ ...p, newPassword: e.target.value }))
            }
            className="input-field"
            placeholder="8자 이상"
            required
            minLength={8}
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">
            새 비밀번호 확인
          </label>
          <input
            type="password"
            value={pwForm.confirmPassword}
            onChange={(e) =>
              setPwForm((p) => ({ ...p, confirmPassword: e.target.value }))
            }
            className="input-field"
            required
            minLength={8}
          />
        </div>

        <button
          type="submit"
          disabled={pwSaving}
          className="btn-outline py-2.5 w-full disabled:opacity-50"
        >
          {pwSaving ? "변경 중..." : "비밀번호 변경"}
        </button>
      </form>

      {/* 계정 안내 */}
      <div className="text-xs text-gray-600 space-y-1">
        <p>* 업소명 변경 시 기존 구인글의 업소명은 자동 변경되지 않습니다.</p>
        <p>* 계정 삭제는 고객센터로 문의해주세요.</p>
      </div>
    </div>
  );
}
