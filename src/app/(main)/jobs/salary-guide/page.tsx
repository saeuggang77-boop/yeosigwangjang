import Link from "next/link";
import { SALARY_GUIDE } from "@/lib/salary-guide";

export default function SalaryGuidePage() {
  const maxSalary = Math.max(...SALARY_GUIDE.map((g) => g.dailyMax));

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">업종별 급여 가이드라인</h1>
        <Link
          href="/jobs"
          className="text-sm text-gray-400 hover:text-primary-light"
        >
          구인글 목록
        </Link>
      </div>

      <div className="card">
        <p className="text-sm text-gray-400">
          아래 급여 범위는 업계 평균을 참고하여 작성된 가이드라인입니다.
          실제 급여는 지역, 업소 규모, 경력, 포지션 등에 따라 달라질 수 있습니다.
        </p>
        <p className="text-xs text-gray-500 mt-2">
          기준: 일급(만원) · 최종 수정: 2025.01
        </p>
      </div>

      {/* 급여 차트 */}
      <div className="space-y-3">
        {SALARY_GUIDE.map((guide) => {
          const minPct = (guide.dailyMin / maxSalary) * 100;
          const rangePct =
            ((guide.dailyMax - guide.dailyMin) / maxSalary) * 100;
          const mid = (guide.dailyMin + guide.dailyMax) / 2;

          return (
            <div key={guide.bizType} className="card">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-sm">{guide.bizType}</h3>
                <span className="text-sm text-secondary font-medium">
                  {guide.dailyMin}~{guide.dailyMax}만원
                </span>
              </div>

              {/* 바 차트 */}
              <div className="relative h-6 bg-dark-card rounded-lg overflow-hidden">
                <div
                  className="absolute h-full rounded-lg bg-gradient-to-r from-primary/40 to-primary/80"
                  style={{
                    left: `${minPct}%`,
                    width: `${rangePct}%`,
                  }}
                />
                {/* 중간값 마커 */}
                <div
                  className="absolute top-0 h-full w-0.5 bg-secondary"
                  style={{ left: `${(mid / maxSalary) * 100}%` }}
                />
              </div>

              {/* 스케일 */}
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-gray-600">0</span>
                <span className="text-[10px] text-gray-500">
                  평균 {mid}만원
                </span>
                <span className="text-[10px] text-gray-600">
                  {maxSalary}만원
                </span>
              </div>

              <p className="text-xs text-gray-500 mt-1">{guide.note}</p>
            </div>
          );
        })}
      </div>

      {/* 안내 */}
      <div className="card bg-gradient-to-br from-dark-surface to-dark-card border-primary/20">
        <h3 className="font-bold text-sm mb-2">급여 가이드라인 안내</h3>
        <ul className="text-xs text-gray-400 space-y-1.5">
          <li>
            구인글에 표시되는 &quot;평균 이상/이하&quot; 태그는 해당 업종의
            가이드라인 범위를 기준으로 자동 산출됩니다.
          </li>
          <li>
            &quot;TC 협의&quot; 등 숫자가 명시되지 않은 급여는 비교가 불가하여
            태그가 표시되지 않습니다.
          </li>
          <li>
            가이드라인은 참고용이며, 실제 급여 조건은 반드시 업소와 직접
            확인하시기 바랍니다.
          </li>
        </ul>
      </div>

      <div className="text-center">
        <Link href="/jobs" className="btn-outline text-sm py-2 px-6">
          구인글 둘러보기
        </Link>
      </div>
    </div>
  );
}
