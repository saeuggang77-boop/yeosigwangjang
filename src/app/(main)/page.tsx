import Link from "next/link";
import {
  JobCardUrgent,
  JobCardPremium,
  JobCardBasic,
  JobCardFree,
} from "@/components/job/JobCard";
import type { JobCardData } from "@/components/job/JobCard";
import MainBanner from "@/components/ad/MainBanner";

// ==========================================
// 더미 데이터
// ==========================================

const URGENT_JOBS: JobCardData[] = [
  {
    id: "u1",
    title: "강남 OO클럽 긴급 모집",
    bizName: "OO클럽",
    region: "서울",
    subRegion: "강남",
    bizType: "클럽",
    salary: "TC 협의 · 보장 가능",
    workHours: "오후 8시 ~ 새벽 3시",
    tier: "PREMIUM",
    isUrgent: true,
    images: ["placeholder"],
  },
  {
    id: "u2",
    title: "이태원 OO라운지 급구",
    bizName: "OO라운지",
    region: "서울",
    subRegion: "이태원",
    bizType: "라운지",
    salary: "일급 30만~",
    workHours: "오후 9시 ~ 새벽 4시",
    tier: "BASIC",
    isUrgent: true,
  },
  {
    id: "u3",
    title: "해운대 OO바 오늘 출근 가능",
    bizName: "OO바",
    region: "부산",
    subRegion: "해운대",
    bizType: "바",
    salary: "TC 50%",
    workHours: "오후 8시 ~ 새벽 2시",
    tier: "BASIC",
    isUrgent: true,
  },
];

const PREMIUM_JOBS: JobCardData[] = [
  {
    id: "p1",
    title: "강남 역삼 OO룸싸롱 스탭 모집",
    bizName: "OO룸싸롱",
    region: "서울",
    subRegion: "강남",
    bizType: "룸싸롱",
    salary: "TC 협의 · 교통비 지원",
    workHours: "오후 7시 ~ 새벽 3시",
    tier: "PREMIUM",
    images: ["placeholder"],
  },
  {
    id: "p2",
    title: "청담 OO텐프로 고급 인력 모집",
    bizName: "OO텐프로",
    region: "서울",
    subRegion: "청담",
    bizType: "텐프로",
    salary: "보장 100만 이상",
    workHours: "오후 8시 ~ 새벽 4시",
    tier: "PREMIUM",
    images: ["placeholder"],
  },
  {
    id: "p3",
    title: "부산 서면 OO라운지 함께할 분",
    bizName: "OO라운지",
    region: "부산",
    subRegion: "서면",
    bizType: "라운지",
    salary: "TC 협의 · 숙소 제공",
    workHours: "오후 9시 ~ 새벽 3시",
    tier: "PREMIUM",
    images: ["placeholder"],
  },
  {
    id: "p4",
    title: "대구 동성로 OO클럽 직원 구합니다",
    bizName: "OO클럽",
    region: "대구",
    subRegion: "동성로",
    bizType: "클럽",
    salary: "일급 25만~",
    workHours: "오후 10시 ~ 새벽 5시",
    tier: "PREMIUM",
    images: ["placeholder"],
  },
  {
    id: "p5",
    title: "인천 구월동 OO가라오케 모집",
    bizName: "OO가라오케",
    region: "인천",
    subRegion: "구월동",
    bizType: "가라오케",
    salary: "TC 50% · 식사 제공",
    workHours: "오후 7시 ~ 새벽 2시",
    tier: "PREMIUM",
  },
];

const BASIC_JOBS: JobCardData[] = [
  {
    id: "b1",
    title: "홍대 OO퍼브 파트타임",
    bizName: "OO퍼브",
    region: "서울",
    subRegion: "마포",
    bizType: "퍼브",
    salary: "TC 협의",
    tier: "BASIC",
  },
  {
    id: "b2",
    title: "강남 OO착석바 스탭 모집",
    bizName: "OO착석바",
    region: "서울",
    subRegion: "강남",
    bizType: "착석바",
    salary: "일급 20만~",
    tier: "BASIC",
  },
  {
    id: "b3",
    title: "수원 인계동 OO노래주점",
    bizName: "OO노래주점",
    region: "경기",
    subRegion: "수원",
    bizType: "노래주점",
    salary: "TC 협의",
    tier: "BASIC",
  },
  {
    id: "b4",
    title: "부산 서면 OO바 직원 구함",
    bizName: "OO바",
    region: "부산",
    subRegion: "서면",
    bizType: "바",
    salary: "시급 15,000원~",
    tier: "BASIC",
  },
];

const FREE_JOBS: JobCardData[] = [
  {
    id: "f1",
    title: "대구 동성로 OO바 모집",
    bizName: "OO바",
    region: "대구",
    subRegion: "중구",
    bizType: "바",
    salary: "TC 협의",
    tier: "FREE",
  },
  {
    id: "f2",
    title: "인천 부평 OO노래주점 모집",
    bizName: "OO노래주점",
    region: "인천",
    subRegion: "부평",
    bizType: "노래주점",
    tier: "FREE",
  },
  {
    id: "f3",
    title: "광주 충장로 OO바 스탭 구함",
    bizName: "OO바",
    region: "광주",
    subRegion: "동구",
    bizType: "바",
    tier: "FREE",
  },
  {
    id: "f4",
    title: "천안 쌍용동 OO퍼브",
    bizName: "OO퍼브",
    region: "충남",
    subRegion: "천안",
    bizType: "퍼브",
    tier: "FREE",
  },
];

const CAFE_POPULAR = [
  "강남 OO클럽 후기 (진짜 괜찮았어요)",
  "신입 언니들 한 달 수입 공유",
  "이번 주 면접 후기 총정리",
  "업소 옮길 때 주의할 점",
  "사장님이 좋은 업소 특징",
];

const CAFE_RECENT = [
  "오늘 첫 출근 했어요!",
  "퇴근 후 수다 떨어요~",
  "업소 추천 부탁드려요",
  "마사지 자격증 후기",
  "면접 볼 때 옷차림 팁",
];

const SEEK_DUMMY = [
  { id: "s1", title: "경력 3년 여시 구직합니다", region: "서울 · 강남", bizType: "룸싸롱", contact: "카카오톡: yeosi***" },
  { id: "s2", title: "1년차 해외 경험 있습니다", region: "서울 · 전체", bizType: "라운지", contact: "카카오톡: night***" },
  { id: "s3", title: "부산 경력 5년 이직 희망", region: "부산 · 해운대", bizType: "텐프로", contact: "카카오톡: bsyeo***" },
];

const RECOMMENDED_BIZ = [
  { id: "ad1", name: "OO성형외과", category: "성형/피부", region: "강남", desc: "여시 전용 할인 이벤트" },
  { id: "ad2", name: "OO헤어살롱", category: "헤어/메이크업", region: "청담", desc: "출근 전 헤어 세팅 30% 할인" },
  { id: "ad3", name: "OO네일아트", category: "네일/뷰티", region: "강남", desc: "여시 회원 20% 상시 할인" },
  { id: "ad4", name: "OO세무회계", category: "세무/법률", region: "강남", desc: "종합소득세 무료 상담" },
];

// ==========================================
// 메인 페이지
// ==========================================
export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-10">

      {/* ── 1. 메인 배너 (광고업체 슬라이더) ── */}
      <MainBanner />

      {/* ── 2. 긴급 구인 ── */}
      <section>
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-urgent animate-pulse" />
          긴급 구인
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {URGENT_JOBS.map((job) => (
            <JobCardUrgent key={job.id} job={job} />
          ))}
        </div>
      </section>

      {/* ── 3. 프리미엄 구인 (가로 스크롤) ── */}
      <section>
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <span className="text-premium-gold">&#9733;</span>
          프리미엄 구인
        </h2>
        <div className="flex gap-4 overflow-x-auto pb-3 -mx-4 px-4 snap-x scrollbar-hide">
          {PREMIUM_JOBS.map((job) => (
            <JobCardPremium key={job.id} job={job} />
          ))}
        </div>
      </section>

      {/* ── 4. 최신 구인 (기본 + 무료) ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">최신 구인</h2>
          <Link
            href="/jobs"
            className="text-sm text-primary-light hover:underline"
          >
            구인 전체보기 &rarr;
          </Link>
        </div>

        {/* 기본 카드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {BASIC_JOBS.map((job) => (
            <JobCardBasic key={job.id} job={job} />
          ))}
        </div>

        {/* 무료 카드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {FREE_JOBS.map((job) => (
            <JobCardFree key={job.id} job={job} />
          ))}
        </div>
      </section>

      {/* ── 5. 여시광장 (카페 섹션) ── */}
      <section>
        <div className="card bg-gradient-to-br from-dark-surface to-dark-card border-primary/20">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-primary-light">
                여시광장
              </h2>
              <p className="text-sm text-gray-400 mt-0.5">
                20,077명의 여시가 함께하고 있어요
              </p>
            </div>
            <div className="flex gap-2">
              <a
                href="https://cafe.naver.com/bamyeosi"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline text-xs py-2 px-4"
              >
                카페 바로가기
              </a>
              <Link
                href="/community"
                className="hidden sm:inline-flex btn-primary text-xs py-2 px-4"
              >
                여시광장 게시판
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-1.5">
                <svg className="w-4 h-4 text-premium-gold" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                카페 인기글
              </h3>
              <ul className="space-y-2">
                {CAFE_POPULAR.map((t, i) => (
                  <li
                    key={i}
                    className="text-sm text-gray-400 hover:text-white cursor-pointer truncate flex items-center gap-2"
                  >
                    <span className="text-xs text-gray-600 w-5 text-right shrink-0">
                      {i + 1}
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-1.5">
                <svg className="w-4 h-4 text-primary-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                카페 최신글
              </h3>
              <ul className="space-y-2">
                {CAFE_RECENT.map((t, i) => (
                  <li
                    key={i}
                    className="text-sm text-gray-400 hover:text-white cursor-pointer truncate flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-success shrink-0" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          {/* 모바일 게시판 링크 */}
          <Link
            href="/community"
            className="sm:hidden block text-center text-sm text-primary-light mt-4 hover:underline"
          >
            여시광장 게시판 &rarr;
          </Link>
        </div>
      </section>

      {/* ── 6. 최신 구직 (블러 처리) ── */}
      <section>
        <h2 className="text-lg font-bold mb-4">최신 구직</h2>
        <div className="relative">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 blur-content">
            {SEEK_DUMMY.map((s) => (
              <div key={s.id} className="card">
                <h3 className="font-bold mb-1">{s.title}</h3>
                <p className="text-sm text-gray-400">{s.region} · {s.bizType}</p>
                <p className="text-sm text-gray-500 mt-2">{s.contact}</p>
              </div>
            ))}
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="font-bold mb-2">
                열람권 구매하고 여시들 만나보세요
              </p>
              <p className="text-sm text-gray-400 mb-3">
                ₩50,000/월 · 구직글 무제한 열람
              </p>
              <Link href="/jobs?tab=seek" className="btn-accent text-sm">
                열람권 구매 &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. 추천 업체 (광고업체 카드 슬라이더) ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">추천 업체</h2>
          <Link
            href="/directory"
            className="text-sm text-primary-light hover:underline"
          >
            업체 전체보기 &rarr;
          </Link>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-3 -mx-4 px-4 snap-x scrollbar-hide">
          {RECOMMENDED_BIZ.map((biz) => (
            <Link
              key={biz.id}
              href={`/directory/${biz.id}`}
              className="min-w-[200px] sm:min-w-[220px] snap-start shrink-0"
            >
              <div className="card hover:border-secondary/50 transition-all h-full">
                <div className="w-full h-20 rounded-lg bg-gradient-to-br from-secondary/10 to-dark-card mb-3 flex items-center justify-center">
                  <span className="text-2xl font-bold text-secondary/30">
                    {biz.name[0]}
                  </span>
                </div>
                <span className="text-xs text-secondary">{biz.category}</span>
                <h3 className="font-bold text-sm mt-1">{biz.name}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{biz.region}</p>
                <p className="text-xs text-accent mt-2">{biz.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
