import Link from "next/link";

export const metadata = {
  title: "여시광장 소개",
  description: "밤여시 카페 2만 회원의 구인구직 커뮤니티, 여시광장을 소개합니다.",
};

const CAFE_URL = "https://cafe.naver.com/bamyeosi";

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-12">
      {/* 히어로 */}
      <section className="text-center space-y-4 pt-4">
        <h1 className="text-3xl font-bold text-primary-light">여시광장</h1>
        <p className="text-lg text-gray-300">
          밤여시 카페 2만 회원과 함께하는
          <br className="sm:hidden" /> 구인구직 커뮤니티
        </p>
      </section>

      {/* 소개 */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold">여시광장이란?</h2>
        <p className="text-gray-400 leading-relaxed">
          여시광장은 네이버 카페 &lsquo;밤여시&rsquo;에서 시작된 구인구직
          전문 플랫폼입니다. 유흥·뷰티·서비스업 종사자와 업소를 연결하며,
          신뢰할 수 있는 채용 정보와 커뮤니티를 제공합니다.
        </p>
      </section>

      {/* 주요 기능 */}
      <section className="space-y-6">
        <h2 className="text-xl font-bold">주요 기능</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            {
              title: "구인구직",
              desc: "지역·업종별 구인글과 구직글을 한 눈에 확인하고, 간편하게 지원할 수 있습니다.",
              href: "/jobs",
            },
            {
              title: "업체 디렉토리",
              desc: "성형외과, 피부과, 네일샵 등 업종별 업체 정보를 검색하고 비교할 수 있습니다.",
              href: "/directory",
            },
            {
              title: "중고장터",
              desc: "의상, 가방, 신발 등 업무 관련 중고물품을 사고팔 수 있습니다.",
              href: "/market",
            },
            {
              title: "여시광장 커뮤니티",
              desc: "자유수다, 질문 게시판에서 회원들과 소통하고 정보를 나눌 수 있습니다.",
              href: "/community",
            },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block p-5 bg-dark-card border border-dark-border rounded-xl hover:border-primary/50 transition-colors"
            >
              <h3 className="font-semibold text-white mb-2">{item.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                {item.desc}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* 이용 안내 */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold">이용 안내</h2>
        <div className="space-y-3 text-sm text-gray-400">
          <div className="flex gap-3 items-start">
            <span className="shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary-light text-xs flex items-center justify-center font-bold">
              1
            </span>
            <p>
              <strong className="text-gray-200">일반 회원</strong> — 회원가입
              후 커뮤니티 이용, 구직글 작성, 스크랩 기능을 사용할 수 있습니다.
              정회원 승급 시 중고장터 이용이 가능합니다.
            </p>
          </div>
          <div className="flex gap-3 items-start">
            <span className="shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary-light text-xs flex items-center justify-center font-bold">
              2
            </span>
            <p>
              <strong className="text-gray-200">업소 회원</strong> — 구인글
              등록, 구직자 열람, 끌올 기능 등 채용에 필요한 도구를 제공합니다.
            </p>
          </div>
          <div className="flex gap-3 items-start">
            <span className="shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary-light text-xs flex items-center justify-center font-bold">
              3
            </span>
            <p>
              <strong className="text-gray-200">광고 회원</strong> — 메인
              배너, 팝업, 구인페이지 배너 등 광고 지면을 구매하고 관리할 수
              있습니다.
            </p>
          </div>
        </div>
      </section>

      {/* 카페 연결 */}
      <section className="bg-dark-card border border-dark-border rounded-xl p-6 text-center space-y-3">
        <p className="text-gray-300">
          더 많은 정보는 네이버 카페에서 확인하세요
        </p>
        <a
          href={CAFE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 btn-primary text-sm py-2.5 px-6"
        >
          밤여시 카페 바로가기
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>
      </section>

      {/* 문의 */}
      <section className="text-center space-y-2 pb-4">
        <p className="text-sm text-gray-500">
          광고 및 제휴 문의는{" "}
          <Link
            href="/ad-inquiry"
            className="text-primary-light hover:underline"
          >
            광고문의 페이지
          </Link>
          를 이용해주세요.
        </p>
      </section>
    </div>
  );
}
