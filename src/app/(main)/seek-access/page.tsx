"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  SEEK_ACCESS_PRICE,
  PREPAY_DISCOUNT,
  calcPrepayPrice,
  formatPriceWithUnit,
} from "@/lib/pricing";
import type { PrepayMonths } from "@/lib/pricing";

export default function SeekAccessPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [months, setMonths] = useState<PrepayMonths>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [accessInfo, setAccessInfo] = useState<{
    hasAccess: boolean;
    expiresAt?: string;
    reason?: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/seek-access")
      .then((r) => r.json())
      .then(setAccessInfo)
      .catch(() => {});
  }, []);

  const price = calcPrepayPrice(SEEK_ACCESS_PRICE, months);
  const discount = PREPAY_DISCOUNT[months];

  const handlePurchase = async () => {
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/seek-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ months }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        return;
      }

      router.push("/jobs?tab=seek&purchased=true");
    } catch {
      setError("구매 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 비로그인 또는 비업소회원
  if (!session || session.user.userType !== "BIZ") {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">구직글 열람권</h1>
        <p className="text-gray-400 mb-6">
          업소 회원만 열람권을 구매할 수 있습니다.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/auth/login" className="btn-primary py-2 px-4 text-sm">
            업소 로그인
          </Link>
          <Link
            href="/auth/register/biz"
            className="btn-outline py-2 px-4 text-sm"
          >
            업소 회원가입
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-2">구직글 열람권</h1>
      <p className="text-sm text-gray-400 mb-6">
        열람권을 구매하면 구직글의 연락처와 상세 내용을 확인할 수 있습니다.
      </p>

      {/* 현재 상태 */}
      {accessInfo?.hasAccess && (
        <div className="card border-success/30 mb-6">
          <div className="flex items-center gap-2">
            <span className="badge-verified">이용중</span>
            <span className="text-sm text-gray-300">열람권 활성화 상태</span>
          </div>
          {accessInfo.expiresAt && (
            <p className="text-xs text-gray-500 mt-2">
              만료일: {new Date(accessInfo.expiresAt).toLocaleDateString("ko-KR")}
            </p>
          )}
          {accessInfo.reason === "ad_user" && (
            <p className="text-xs text-secondary mt-2">
              광고업체 회원은 열람권이 자동 포함됩니다.
            </p>
          )}
        </div>
      )}

      {/* 가격표 */}
      <div className="card mb-6 space-y-4">
        <h2 className="font-bold text-sm text-gray-300">기간 선택</h2>

        <div className="space-y-3">
          {([1, 2, 3] as PrepayMonths[]).map((m) => {
            const p = calcPrepayPrice(SEEK_ACCESS_PRICE, m);
            const d = PREPAY_DISCOUNT[m];
            const original = SEEK_ACCESS_PRICE * m;

            return (
              <button
                key={m}
                type="button"
                onClick={() => setMonths(m)}
                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                  months === m
                    ? "border-primary bg-primary/10"
                    : "border-dark-border hover:border-gray-500"
                }`}
              >
                <div className="text-left">
                  <p className="font-medium">
                    {m}개월
                    {d > 0 && (
                      <span className="ml-2 text-xs text-accent">
                        {d * 100}% 할인
                      </span>
                    )}
                    {m === 3 && (
                      <span className="ml-2 text-xs bg-accent/20 text-accent px-1.5 py-0.5 rounded">
                        추천
                      </span>
                    )}
                  </p>
                  {d > 0 && (
                    <p className="text-xs text-gray-500 line-through mt-0.5">
                      {formatPriceWithUnit(original)}
                    </p>
                  )}
                </div>
                <p className="font-bold text-secondary">
                  {formatPriceWithUnit(p)}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 혜택 안내 */}
      <div className="card mb-6">
        <h2 className="font-bold text-sm text-gray-300 mb-3">열람권 혜택</h2>
        <ul className="space-y-2 text-sm text-gray-400">
          <li className="flex items-start gap-2">
            <span className="text-success mt-0.5">&#10003;</span>
            구직글 연락처(카카오톡 ID) 열람
          </li>
          <li className="flex items-start gap-2">
            <span className="text-success mt-0.5">&#10003;</span>
            구직글 상세 내용 전체 열람
          </li>
          <li className="flex items-start gap-2">
            <span className="text-success mt-0.5">&#10003;</span>
            기간 내 무제한 열람
          </li>
        </ul>
      </div>

      {error && (
        <p className="text-urgent text-sm bg-urgent/10 py-3 px-4 rounded-lg mb-4">
          {error}
        </p>
      )}

      {/* 결제 */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <span className="text-gray-400">결제 금액</span>
          <span className="text-xl font-bold text-secondary">
            {formatPriceWithUnit(price)}
          </span>
        </div>
        {discount > 0 && (
          <p className="text-xs text-gray-500 mb-4 text-right">
            {discount * 100}% 할인 적용 (VAT 포함)
          </p>
        )}
        <button
          onClick={handlePurchase}
          disabled={isLoading}
          className="w-full btn-primary py-3 disabled:opacity-50"
        >
          {isLoading ? "처리 중..." : `${formatPriceWithUnit(price)} 결제하기`}
        </button>
        <p className="text-xs text-gray-600 text-center mt-3">
          본 서비스는 디지털 콘텐츠로 열람 1건 이상 시 환불이 불가합니다.
        </p>
      </div>
    </div>
  );
}
