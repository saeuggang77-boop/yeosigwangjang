"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const NAV_ITEMS = [
  { href: "/ad", label: "대시보드", icon: "📊" },
  { href: "/ad/ads", label: "광고 관리", icon: "📢" },
  { href: "/ad/events", label: "이벤트", icon: "🎉" },
  { href: "/ad/payments", label: "결제내역", icon: "💳" },
  { href: "/ad/payments/checkout", label: "광고 결제", icon: "🛒" },
  { href: "/ad/settings", label: "설정", icon: "⚙️" },
];

export default function AdLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth/login");
    } else if (status === "authenticated" && session.user.userType !== "AD") {
      router.replace("/");
    }
  }, [status, session, router]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  if (!session || session.user.userType !== "AD") {
    return null;
  }

  const getIsActive = (href: string) => {
    if (href === "/ad") return pathname === "/ad";
    // /ad/payments/checkout과 /ad/payments를 구분
    if (href === "/ad/payments/checkout") return pathname.startsWith("/ad/payments/checkout");
    if (href === "/ad/payments") {
      return (
        pathname.startsWith("/ad/payments") &&
        !pathname.startsWith("/ad/payments/checkout")
      );
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* 모바일: 상단 탭 */}
      <nav className="flex gap-1 mb-6 overflow-x-auto scrollbar-hide md:hidden">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              getIsActive(item.href)
                ? "bg-secondary text-white"
                : "bg-dark-card text-gray-400 hover:text-white"
            }`}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="flex gap-6">
        {/* 데스크톱: 사이드바 */}
        <aside className="hidden md:block w-56 shrink-0">
          <div className="sticky top-24 space-y-1">
            <div className="card mb-4 border-secondary/20">
              <p className="font-bold text-sm">{session.user.email}</p>
              <p className="text-xs text-gray-500 mt-1">광고 업체</p>
              {session.user.isApproved ? (
                <span className="text-xs text-success bg-success/10 px-2 py-0.5 rounded mt-2 inline-block">
                  승인됨
                </span>
              ) : (
                <span className="text-xs text-accent bg-accent/10 px-2 py-0.5 rounded mt-2 inline-block">
                  승인 대기
                </span>
              )}
            </div>
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm transition-colors ${
                  getIsActive(item.href)
                    ? "bg-secondary/10 text-secondary font-medium"
                    : "text-gray-400 hover:text-white hover:bg-dark-card"
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        </aside>

        {/* 콘텐츠 */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
