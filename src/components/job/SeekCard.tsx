import Link from "next/link";

export interface SeekCardData {
  id: string;
  title: string;
  desiredRegions: string[];
  desiredBizTypes: string[];
  experience?: string | null;
  contact: string;
  createdAt: string;
}

interface Props {
  job: SeekCardData;
  canView: boolean; // 열람권 보유 여부
}

export default function SeekCard({ job, canView }: Props) {
  return (
    <Link href={`/jobs/${job.id}`} className="block">
      <div className="card group hover:border-primary/50 transition-all relative">
        <h3 className="font-bold text-sm mb-1 group-hover:text-primary-light transition-colors">
          {job.title}
        </h3>
        <p className="text-sm text-gray-400 mt-1">
          {job.desiredRegions.slice(0, 3).join(", ")}
          {job.desiredRegions.length > 3 && ` 외 ${job.desiredRegions.length - 3}곳`}
          {" · "}
          {job.desiredBizTypes.slice(0, 2).join(", ")}
          {job.desiredBizTypes.length > 2 && ` 외`}
        </p>
        {job.experience && (
          <p className="text-xs text-secondary mt-1">경력: {job.experience}</p>
        )}

        {/* 연락처: 블러 or 보이기 */}
        {canView ? (
          <p className="text-xs text-gray-300 mt-2">
            카카오톡: {job.contact}
          </p>
        ) : (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-gray-600 blur-sm select-none">
              카카오톡: abcdef123
            </span>
            <span className="text-xs text-accent">열람권 필요</span>
          </div>
        )}

        <p className="text-xs text-gray-600 mt-2">
          {new Date(job.createdAt).toLocaleDateString("ko-KR")}
        </p>
      </div>
    </Link>
  );
}
