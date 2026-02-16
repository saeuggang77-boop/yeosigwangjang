import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { formatPriceWithUnit } from "@/lib/pricing";

interface Props {
  params: { id: string };
}

export default async function JobDetailPage({ params }: Props) {
  const job = await prisma.job.findUnique({
    where: { id: params.id },
    include: {
      bizUser: {
        select: {
          bizName: true,
          isVerifiedBiz: true,
          isRecommended: true,
        },
      },
    },
  });

  if (!job || !job.isActive) notFound();

  // 조회수 증가
  await prisma.job.update({
    where: { id: params.id },
    data: { viewCount: { increment: 1 } },
  });

  const user = await getCurrentUser();

  // 구직글 열람 권한
  const isSeek = job.type === "SEEK";
  const isBlurred =
    isSeek &&
    !(user?.id === job.authorUserId) &&
    !(user?.userType === "BIZ" && user?.hasSeekAccess) &&
    !(user?.userType === "AD") &&
    !(user?.userType === "ADMIN");

  const tierLabel =
    job.tier === "PREMIUM"
      ? "PREMIUM"
      : job.tier === "BASIC"
        ? "BASIC"
        : "FREE";

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* 뱃지 */}
      <div className="flex items-center gap-2 mb-3">
        {job.isUrgent && <span className="badge-urgent">긴급</span>}
        {job.tier === "PREMIUM" && (
          <span className="badge-premium">PREMIUM</span>
        )}
        {job.bizUser?.isVerifiedBiz && (
          <span className="badge-verified">인증업소</span>
        )}
        <span className="text-xs text-gray-500">{tierLabel}</span>
      </div>

      {/* 제목 */}
      <h1 className="text-2xl font-bold mb-2">{job.title}</h1>
      <p className="text-gray-400 text-sm mb-6">
        조회 {job.viewCount + 1} ·{" "}
        {new Date(job.createdAt).toLocaleDateString("ko-KR")}
      </p>

      {/* 사진 슬라이더 */}
      {job.images.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-3 mb-6 snap-x scrollbar-hide">
          {job.images.map((img, i) => (
            <div
              key={i}
              className="min-w-[260px] h-44 rounded-xl bg-dark-card border border-dark-border flex items-center justify-center snap-start shrink-0"
            >
              <span className="text-xs text-gray-600">
                이미지 {i + 1}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 기본 정보 */}
      <div
        className={`card mb-4 ${
          job.tier === "PREMIUM"
            ? "border-premium-border"
            : job.isUrgent
              ? "border-urgent"
              : ""
        }`}
      >
        <dl className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
          {job.type === "HIRE" ? (
            <>
              <div>
                <dt className="text-gray-500">업소명</dt>
                <dd className="font-medium">{job.bizName}</dd>
              </div>
              <div>
                <dt className="text-gray-500">지역</dt>
                <dd>
                  {job.region}
                  {job.subRegion && ` ${job.subRegion}`}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">업종</dt>
                <dd>{job.bizType}</dd>
              </div>
              {job.salary && (
                <div>
                  <dt className="text-gray-500">급여</dt>
                  <dd className="text-secondary font-medium">{job.salary}</dd>
                </div>
              )}
              {job.workHours && (
                <div>
                  <dt className="text-gray-500">근무시간</dt>
                  <dd>{job.workHours}</dd>
                </div>
              )}
              {job.requirements && (
                <div className="col-span-2">
                  <dt className="text-gray-500">우대조건</dt>
                  <dd>{job.requirements}</dd>
                </div>
              )}
            </>
          ) : (
            <>
              <div>
                <dt className="text-gray-500">희망 지역</dt>
                <dd>{isBlurred ? "***" : job.desiredRegions.join(", ")}</dd>
              </div>
              <div>
                <dt className="text-gray-500">희망 업종</dt>
                <dd>{isBlurred ? "***" : job.desiredBizTypes.join(", ")}</dd>
              </div>
              {job.experience && (
                <div>
                  <dt className="text-gray-500">경력</dt>
                  <dd>{job.experience}</dd>
                </div>
              )}
            </>
          )}
        </dl>

        {/* 복리후생 */}
        {job.benefits.length > 0 && (
          <div className="mt-4 pt-4 border-t border-dark-border">
            <p className="text-gray-500 text-xs mb-2">복리후생</p>
            <div className="flex flex-wrap gap-2">
              {job.benefits.map((b, i) => (
                <span
                  key={i}
                  className="px-2 py-1 bg-dark-card rounded text-xs text-gray-300"
                >
                  {b}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 상세 설명 */}
      <div className={`card mb-4 ${isBlurred ? "relative" : ""}`}>
        <h2 className="text-sm font-medium text-gray-400 mb-3">상세 설명</h2>
        <div
          className={`prose prose-invert prose-sm max-w-none whitespace-pre-wrap ${
            isBlurred ? "blur-content" : ""
          }`}
        >
          {isBlurred ? job.description.slice(0, 100) + "..." : job.description}
        </div>
        {isBlurred && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="font-bold mb-2">열람권이 필요합니다</p>
              <p className="text-sm text-gray-400 mb-3">
                {formatPriceWithUnit(50000)}/월
              </p>
              <Link href="/jobs?tab=seek" className="btn-accent text-sm">
                열람권 구매 &rarr;
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* 연락처 */}
      <div className="card mb-4">
        <h2 className="text-sm font-medium text-gray-400 mb-3">연락하기</h2>
        {isBlurred ? (
          <p className="text-gray-500">열람권 구매 후 확인 가능합니다.</p>
        ) : (
          <div className="flex gap-3">
            {(job.contactType === "PHONE" || job.contactType === "BOTH") && (
              <a
                href={`tel:${job.contact}`}
                className={`flex-1 text-center py-3 rounded-lg font-medium transition-colors ${
                  job.tier === "PREMIUM"
                    ? "btn-secondary text-base"
                    : "btn-outline text-sm"
                }`}
              >
                전화하기
              </a>
            )}
            {(job.contactType === "KAKAO" || job.contactType === "BOTH") && (
              <button
                className={`flex-1 text-center py-3 rounded-lg font-medium transition-colors ${
                  job.tier === "PREMIUM"
                    ? "bg-[#FEE500] text-[#191919] text-base"
                    : "bg-[#FEE500]/80 text-[#191919] text-sm"
                }`}
              >
                카톡 연락
              </button>
            )}
          </div>
        )}
      </div>

      {/* 카페 연동 + 신고 */}
      <div className="card bg-gradient-to-br from-dark-surface to-dark-card border-primary/20">
        <p className="text-sm text-gray-300 mb-2">
          여시광장에서 이야기 나눠보세요
        </p>
        <div className="flex gap-3">
          <a
            href="https://cafe.naver.com/bamyeosi"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline text-xs py-1.5 px-3"
          >
            카페에서 물어보기
          </a>
          <button className="text-xs text-gray-500 hover:text-urgent transition-colors">
            허위 구인글 신고하기
          </button>
        </div>
      </div>

      {/* 하단 네비 */}
      <div className="mt-6">
        <Link
          href="/jobs"
          className="text-sm text-gray-400 hover:text-primary-light"
        >
          &larr; 목록으로
        </Link>
      </div>
    </div>
  );
}
