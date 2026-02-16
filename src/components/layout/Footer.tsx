import Link from "next/link";

const FOOTER_LINKS = [
  { href: "/about", label: "여시광장 소개" },
  { href: "/ad-inquiry", label: "광고문의" },
  { href: "/terms", label: "이용약관" },
  { href: "/privacy", label: "개인정보처리방침" },
  { href: "/refund-policy", label: "환불정책" },
  { href: "/faq", label: "자주 묻는 질문" },
];

const CAFE_URL = "https://cafe.naver.com/bamyeosi";

export default function Footer() {
  return (
    <footer className="border-t border-dark-border bg-dark-bg mt-16">
      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* 카페 강조 */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <span className="text-lg font-bold text-primary-light">
              여시광장
            </span>
            <p className="text-sm text-gray-400 mt-1">
              밤여시 카페 2만 회원과 함께하세요
            </p>
          </div>
          <a
            href={CAFE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline text-sm py-2 px-4 inline-flex items-center gap-1.5"
          >
            카페 바로가기
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>

        {/* 링크 */}
        <nav className="flex flex-wrap gap-x-6 gap-y-2 mb-8">
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* 사업자 정보 */}
        <div className="text-xs text-gray-600 space-y-1">
          <p>사업자등록번호: 준비 중 | 대표: 준비 중</p>
          <p>직업정보제공사업 신고번호: 준비 중</p>
          <p>통신판매업 신고번호: 준비 중</p>
          <p className="mt-2">
            여시광장은 구인·구직 정보를 중개하며, 근로계약의 당사자가
            아닙니다.
          </p>
          <p className="mt-3 text-gray-700">
            &copy; {new Date().getFullYear()} 여시광장. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
