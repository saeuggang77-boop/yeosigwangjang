import Link from "next/link";
import { compareSalary } from "@/lib/salary-guide";
import SalaryTag from "@/components/job/SalaryTag";

export interface JobCardData {
  id: string;
  title: string;
  bizName: string;
  region: string;
  subRegion?: string;
  bizType: string;
  salary?: string;
  workHours?: string;
  tier: "FREE" | "BASIC" | "PREMIUM";
  isUrgent?: boolean;
  images?: string[];
  lastBumpedAt?: string | null;
  createdAt?: string;
  isVerifiedBiz?: boolean;
  isRecommended?: boolean;
}

// ─── 긴급 구인 카드 ───
export function JobCardUrgent({ job }: { job: JobCardData }) {
  const sc = compareSalary(job.salary, job.bizType);
  return (
    <Link href={`/jobs/${job.id}`} className="block">
      <div className="card-urgent group hover:shadow-urgent/20 hover:shadow-xl transition-all">
        <div className="flex items-center gap-2 mb-3">
          <span className="badge-urgent">긴급</span>
          {job.tier === "PREMIUM" && (
            <span className="badge-premium">PREMIUM</span>
          )}
          {job.isVerifiedBiz && <span className="badge-verified">인증업소</span>}
          {job.isRecommended && <span className="badge-recommended">추천업소</span>}
        </div>
        <h3 className="font-bold text-base mb-1 group-hover:text-urgent transition-colors">
          {job.title}
        </h3>
        <p className="text-sm text-gray-400">
          {job.region}
          {job.subRegion && ` ${job.subRegion}`} · {job.bizType}
        </p>
        {job.salary && (
          <p className="text-sm text-secondary mt-2 font-medium flex items-center gap-1.5">
            {job.salary}
            {sc && <SalaryTag level={sc.level} label={sc.label} size="xs" />}
          </p>
        )}
        {job.workHours && (
          <p className="text-xs text-gray-500 mt-1">{job.workHours}</p>
        )}
      </div>
    </Link>
  );
}

// ─── 프리미엄 구인 카드 ───
export function JobCardPremium({ job }: { job: JobCardData }) {
  const sc = compareSalary(job.salary, job.bizType);
  return (
    <Link href={`/jobs/${job.id}`} className="block">
      <div className="card-premium group hover:shadow-premium-border/20 hover:shadow-xl transition-all min-w-[280px] snap-start shrink-0">
        {/* 썸네일 영역 */}
        {job.images && job.images.length > 0 ? (
          <div className="w-full h-36 rounded-lg bg-dark-card mb-3 overflow-hidden">
            <div className="w-full h-full bg-gradient-to-br from-premium-border/20 to-premium-gold/10 flex items-center justify-center">
              <span className="text-xs text-gray-500">이미지</span>
            </div>
          </div>
        ) : (
          <div className="w-full h-36 rounded-lg bg-gradient-to-br from-premium-border/20 to-premium-gold/10 mb-3 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-premium-border/40"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
              />
            </svg>
          </div>
        )}

        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="badge-premium">PREMIUM</span>
          {job.isUrgent && <span className="badge-urgent">긴급</span>}
          {job.isVerifiedBiz && <span className="badge-verified">인증업소</span>}
          {job.isRecommended && <span className="badge-recommended">추천업소</span>}
          {job.lastBumpedAt && (
            <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded font-medium">끌올</span>
          )}
        </div>
        <h3 className="font-bold text-base mb-1 group-hover:text-premium-gold transition-colors">
          {job.title}
        </h3>
        <p className="text-sm text-gray-300 font-medium">{job.bizName}</p>
        <p className="text-sm text-gray-400 mt-1">
          {job.region}
          {job.subRegion && ` ${job.subRegion}`} · {job.bizType}
        </p>
        {job.salary && (
          <p className="text-sm text-secondary mt-2 font-medium flex items-center gap-1.5">
            {job.salary}
            {sc && <SalaryTag level={sc.level} label={sc.label} size="xs" />}
          </p>
        )}
        {job.workHours && (
          <p className="text-xs text-gray-500 mt-1">{job.workHours}</p>
        )}
      </div>
    </Link>
  );
}

// ─── 기본 구인 카드 ───
export function JobCardBasic({ job }: { job: JobCardData }) {
  const sc = compareSalary(job.salary, job.bizType);
  return (
    <Link href={`/jobs/${job.id}`} className="block">
      <div className="card group hover:border-primary/50 transition-all">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          {job.lastBumpedAt && (
            <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded font-medium">끌올</span>
          )}
          {job.isVerifiedBiz && <span className="badge-verified">인증업소</span>}
          {job.isRecommended && <span className="badge-recommended">추천업소</span>}
        </div>
        <h3 className="font-bold text-sm mb-1 group-hover:text-primary-light transition-colors">
          {job.title}
        </h3>
        <p className="text-sm text-gray-300">{job.bizName}</p>
        <p className="text-sm text-gray-400 mt-1">
          {job.region}
          {job.subRegion && ` ${job.subRegion}`} · {job.bizType}
        </p>
        {job.salary && (
          <p className="text-sm text-secondary mt-2 font-medium flex items-center gap-1.5">
            {job.salary}
            {sc && <SalaryTag level={sc.level} label={sc.label} size="xs" />}
          </p>
        )}
        {job.workHours && (
          <p className="text-xs text-gray-500 mt-1">{job.workHours}</p>
        )}
      </div>
    </Link>
  );
}

// ─── 무료 구인 카드 ───
export function JobCardFree({ job }: { job: JobCardData }) {
  return (
    <Link href={`/jobs/${job.id}`} className="block">
      <div className="card-free group hover:opacity-80 transition-all">
        <h3 className="font-medium text-sm text-gray-300 mb-1 group-hover:text-white transition-colors">
          {job.title}
        </h3>
        <p className="text-xs text-gray-500">
          {job.region}
          {job.subRegion && ` ${job.subRegion}`} · {job.bizType}
        </p>
        {job.salary && (
          <p className="text-xs text-gray-500 mt-1">{job.salary}</p>
        )}
      </div>
    </Link>
  );
}

// ─── 자동 분기 래퍼 ───
export default function JobCard({ job }: { job: JobCardData }) {
  if (job.isUrgent) return <JobCardUrgent job={job} />;
  if (job.tier === "PREMIUM") return <JobCardPremium job={job} />;
  if (job.tier === "BASIC") return <JobCardBasic job={job} />;
  return <JobCardFree job={job} />;
}
