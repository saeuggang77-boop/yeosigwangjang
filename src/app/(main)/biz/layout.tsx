"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const NAV_ITEMS = [
  { href: "/biz", label: "대시보드", icon: "📊" },
  { href: "/biz/jobs", label: "내 구인글", icon: "📋" },
  { href: "/biz/payments", label: "결제내역", icon: "💳" },
  { href: "/biz/settings", label: "설정", icon: "⚙️" },
];

export default function BizLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth/login");
    } else if (status === "authenticated" && session.user.userType !== "BIZ") {
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

  if (!session || session.user.userType !== "BIZ") {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* 모바일: 상단 탭 */}
      <nav className="flex gap-1 mb-6 overflow-x-auto scrollbar-hide md:hidden">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/biz"
              ? pathname === "/biz"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? "bg-primary text-white"
                  : "bg-dark-card text-gray-400 hover:text-white"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex gap-6">
        {/* 데스크톱: 사이드바 */}
        <aside className="hidden md:block w-56 shrink-0">
          <div className="sticky top-24 space-y-1">
            <div className="card mb-4">
              <p className="font-bold text-sm">{session.user.bizName}</p>
              <p className="text-xs text-gray-500 mt-1">업소 회원</p>
            </div>
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.href === "/biz"
                  ? pathname === "/biz"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary-light font-medium"
                      : "text-gray-400 hover:text-white hover:bg-dark-card"
                  }`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        </aside>

        {/* 콘텐츠 */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
