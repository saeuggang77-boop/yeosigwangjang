import Link from "next/link";
import { compareSalary } from "@/lib/salary-guide";
import SalaryTag from "@/components/job/SalaryTag";

// 업종별 아이콘 & 그라데이션 매핑
function getBizIcon(bizType: string): string {
  const map: Record<string, string> = {
    "클럽": "🎵", "라운지": "🍸", "룸싸롱": "🎤", "텐프로": "🎤",
    "바": "🍸", "퍼브": "🍺", "착석바": "🍷", "노래주점": "🎵",
    "가라오케": "🎶", "마사지": "💆‍♀️", "스파": "💆‍♀️",
    "헤어": "✂️", "네일": "💅", "뷰티": "💄", "성형": "💉", "피부과": "✨",
  };
  for (const [key, icon] of Object.entries(map)) {
    if (bizType.includes(key)) return icon;
  }
  return "✨";
}

function getBizGradient(bizType: string): string {
  if (bizType.includes("클럽") || bizType.includes("텐프로")) return "from-purple-600/30 to-pink-500/20";
  if (bizType.includes("라운지") || bizType.includes("바") || bizType.includes("착석")) return "from-blue-600/30 to-indigo-500/20";
  if (bizType.includes("룸싸롱")) return "from-rose-600/30 to-amber-500/20";
  if (bizType.includes("노래") || bizType.includes("가라오케")) return "from-violet-600/30 to-fuchsia-500/20";
  if (bizType.includes("마사지") || bizType.includes("스파")) return "from-teal-600/30 to-cyan-500/20";
  return "from-primary/30 to-secondary/20";
}

export interface JobCardData {
  id: string;
  title: string;
  bizName: string;
  region: string;
  subRegion?: string;
  bizType: string;
  salary?: string;
  workHours?: string;
  tier: "LIGHT" | "BASIC" | "PREMIUM";
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
      <div className="card-premium group hover:shadow-premium-border/20 hover:shadow-xl transition-all min-w-[260px] sm:min-w-[280px] snap-start shrink-0">
        {/* 썸네일 영역 — 업종별 그라데이션 + 아이콘 */}
        <div className={`w-full h-36 rounded-lg bg-gradient-to-br ${getBizGradient(job.bizType)} mb-3 flex items-center justify-center border border-premium-border/10`}>
          <span className="text-4xl">{getBizIcon(job.bizType)}</span>
        </div>

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

// ─── 라이트 구인 카드 ───
export function JobCardLight({ job }: { job: JobCardData }) {
  return (
    <Link href={`/jobs/${job.id}`} className="block">
      <div className="card-light group hover:opacity-80 transition-all">
        <h3 className="font-medium text-sm text-gray-300 mb-1 group-hover:text-white transition-colors">
          {job.title}
        </h3>
        <p className="text-xs text-gray-400">{job.bizName}</p>
        <p className="text-xs text-gray-500 mt-0.5">
          {job.region}
          {job.subRegion && ` ${job.subRegion}`} · {job.bizType}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {job.salary || "급여 협의"}
        </p>
      </div>
    </Link>
  );
}

// ─── 자동 분기 래퍼 ───
export default function JobCard({ job }: { job: JobCardData }) {
  if (job.isUrgent) return <JobCardUrgent job={job} />;
  if (job.tier === "PREMIUM") return <JobCardPremium job={job} />;
  if (job.tier === "BASIC") return <JobCardBasic job={job} />;
  return <JobCardLight job={job} />;
}
