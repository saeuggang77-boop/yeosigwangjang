"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import NotificationBell from "@/components/notification/NotificationBell";

const NAV_ITEMS = [
  { href: "/jobs", label: "구인구직" },
  { href: "/directory", label: "업체" },
  { href: "/market", label: "장터" },
  { href: "/community", label: "여시광장" },
];

export default function Header() {
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-dark-bg/95 backdrop-blur border-b border-dark-border">
      {/* 상단 바 */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* 로고 */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="text-xl font-bold text-primary-light">
              여시광장
            </span>
            <span className="hidden sm:inline text-xs text-gray-500">
              2만 여시의 커뮤니티
            </span>
          </Link>

          {/* 데스크톱 네비게이션 */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-dark-surface transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* 우측: 검색 + 유저 */}
          <div className="flex items-center gap-2">
            {/* 검색 버튼 (모바일) */}
            <button className="md:hidden p-2.5 -m-0.5 text-gray-400 hover:text-white">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* 데스크톱 검색바 */}
            <div className="hidden md:flex items-center bg-dark-card border border-dark-border rounded-lg px-3 py-1.5 w-56">
              <svg className="w-4 h-4 text-gray-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="구인/업체 검색"
                className="bg-transparent text-sm text-white placeholder-gray-500 ml-2 w-full outline-none"
              />
            </div>

            {session ? (
              /* 로그인 상태 */
              <div className="flex items-center gap-2">
                <Link
                  href="/jobs/write"
                  className="hidden sm:inline-flex btn-secondary text-sm py-1.5 px-3"
                >
                  구인등록
                </Link>
                {/* 알림 벨 (일반 회원 + 관리자) */}
                {(session.user.userType === "USER" || session.user.role === "ADMIN") && (
                  <NotificationBell />
                )}
                <div className="relative group">
                  <button className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-dark-surface transition-colors">
                    <div className="w-7 h-7 rounded-full bg-primary/30 flex items-center justify-center text-xs text-primary-light font-bold">
                      {(session.user.nickname?.[0] || session.user.email?.[0] || "U").toUpperCase()}
                    </div>
                    <span className="hidden sm:inline max-w-[80px] truncate">
                      {session.user.nickname || session.user.bizName || session.user.email}
                    </span>
                  </button>
                  {/* 드롭다운 */}
                  <div className="absolute right-0 top-full mt-1 w-48 bg-dark-surface border border-dark-border rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    <div className="py-1">
                      {session.user.userType === "USER" && (
                        <Link href="/my" className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-dark-card">
                          마이페이지
                        </Link>
                      )}
                      {session.user.userType === "BIZ" && (
                        <Link href="/biz" className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-dark-card">
                          업소 관리
                        </Link>
                      )}
                      {session.user.userType === "AD" && (
                        <Link href="/ad" className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-dark-card">
                          광고 관리
                        </Link>
                      )}
                      {(session.user.userType === "ADMIN" || session.user.role === "ADMIN") && (
                        <Link href="/admin" className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-dark-card">
                          관리자
                        </Link>
                      )}
                      <button
                        onClick={() => signOut({ callbackUrl: "/" })}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-400 hover:text-urgent hover:bg-dark-card"
                      >
                        로그아웃
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* 비로그인 상태 */
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/login"
                  className="text-sm text-gray-300 hover:text-white px-2 py-1.5"
                >
                  로그인
                </Link>
                <Link
                  href="/jobs/write"
                  className="hidden sm:inline-flex btn-secondary text-sm py-1.5 px-3"
                >
                  구인등록
                </Link>
              </div>
            )}

            {/* 모바일 햄버거 */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2.5 -m-0.5 text-gray-400 hover:text-white"
            >
              {mobileOpen ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 모바일 메뉴 */}
      {mobileOpen && (
        <div className="md:hidden border-t border-dark-border bg-dark-bg">
          <nav className="px-4 py-3 space-y-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-3 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-dark-surface"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/jobs/write"
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-3 rounded-lg text-sm font-medium text-secondary hover:bg-dark-surface"
            >
              구인등록
            </Link>
          </nav>
          {/* 모바일 검색 */}
          <div className="px-4 pb-3">
            <div className="flex items-center bg-dark-card border border-dark-border rounded-lg px-3 py-2">
              <svg className="w-4 h-4 text-gray-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="구인/업체 검색"
                className="bg-transparent text-sm text-white placeholder-gray-500 ml-2 w-full outline-none"
              />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
