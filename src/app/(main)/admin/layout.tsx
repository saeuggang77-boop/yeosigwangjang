"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const NAV_ITEMS = [
  { href: "/admin", label: "대시보드" },
  { href: "/admin/users", label: "회원 관리" },
  { href: "/admin/jobs", label: "구인글 관리" },
  { href: "/admin/reports", label: "신고 관리" },
  { href: "/admin/cafe-posts", label: "카페 인기글" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  const isAdmin =
    session?.user.userType === "ADMIN" || session?.user.role === "ADMIN";

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth/login");
    } else if (status === "authenticated" && !isAdmin) {
      router.replace("/");
    }
  }, [status, isAdmin, router]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  if (!session || !isAdmin) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* 모바일: 가로 스크롤 탭 */}
      <nav className="flex gap-1 mb-6 overflow-x-auto scrollbar-hide md:hidden">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? "bg-urgent text-white"
                  : "bg-dark-card text-gray-400 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex gap-6">
        {/* 데스크톱 사이드바 */}
        <aside className="hidden md:block w-52 shrink-0">
          <div className="sticky top-24 space-y-1">
            <div className="card mb-4 border-urgent/30">
              <p className="font-bold text-sm text-urgent">관리자</p>
              <p className="text-xs text-gray-500 mt-1">
                {session.user.nickname || session.user.email}
              </p>
            </div>
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block px-4 py-2.5 rounded-lg text-sm transition-colors ${
                    isActive
                      ? "bg-urgent/10 text-urgent font-medium"
                      : "text-gray-400 hover:text-white hover:bg-dark-card"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </aside>

        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
