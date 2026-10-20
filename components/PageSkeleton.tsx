/**
 * 저장소(localStorage)를 읽기 전 한 프레임 동안 보여주는 자리표시.
 * 빈 화면이 번쩍이지 않고, 실제 레이아웃과 같은 자리에 같은 크기로 그려 레이아웃이 흔들리지 않게 한다.
 * - list   : 사진 카드 그리드 (저장)
 * - form   : 단계형 입력
 * - compare: 세 칸 + 결론 + 항목 막대
 * - my     : 통계 · 다음 작업 · 기록 목록
 */
const Bar = ({ className = "" }: { className?: string }) => <div className={`rounded bg-cream-200 ${className}`} />;

export default function PageSkeleton({ variant = "list" }: { variant?: "list" | "form" | "compare" | "my" }) {
  return (
    <div className="h-full overflow-hidden bg-cream-50" aria-busy="true" aria-label="불러오는 중">
      <div className="mx-auto max-w-5xl animate-pulse px-4 pt-6 sm:px-6 lg:pt-8">
        <Bar className="h-8 w-40 rounded-lg" />
        <Bar className="mt-3 h-4 w-64 max-w-full" />

        {variant === "list" && (
          <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="overflow-hidden rounded-[20px] bg-white ring-1 ring-cream-300/60">
                <div className="aspect-[4/3] bg-cream-200" />
                <div className="space-y-2 p-3.5">
                  <Bar className="h-5 w-2/3" />
                  <Bar className="h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {variant === "form" && (
          <div className="mx-auto mt-8 max-w-xl space-y-6">
            {[0, 1, 2].map((i) => (
              <div key={i} className="space-y-3">
                <Bar className="h-5 w-32" />
                <div className="grid grid-cols-3 gap-2">
                  <div className="h-12 rounded-xl bg-cream-200" />
                  <div className="h-12 rounded-xl bg-cream-200" />
                  <div className="h-12 rounded-xl bg-cream-200" />
                </div>
              </div>
            ))}
          </div>
        )}

        {variant === "compare" && (
          <>
            <div className="mt-5 grid grid-cols-3 gap-2.5 sm:gap-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="overflow-hidden rounded-[20px] bg-white ring-1 ring-cream-300/60">
                  <div className="aspect-[4/3] bg-cream-200" />
                  <div className="space-y-2 p-3">
                    <Bar className="h-4 w-3/4" />
                    <Bar className="h-6 w-12 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 h-28 rounded-[24px] bg-cream-200" />
            <div className="mt-8 space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-28 rounded-[20px] bg-white ring-1 ring-cream-300/60" />
              ))}
            </div>
          </>
        )}

        {variant === "my" && (
          <>
            <div className="mt-5 h-[248px] rounded-[20px] bg-white ring-1 ring-cream-300/60" />
            <Bar className="mt-8 h-6 w-32 rounded-lg" />
            <div className="mt-3 h-[168px] rounded-[24px] bg-cream-200" />
            <Bar className="mt-8 h-6 w-28 rounded-lg" />
            <div className="mt-3 space-y-px overflow-hidden rounded-[20px] bg-white ring-1 ring-cream-300/60">
              {[0, 1].map((i) => (
                <div key={i} className="flex gap-3.5 p-4">
                  <div className="h-14 w-14 rounded-xl bg-cream-200" />
                  <div className="flex-1 space-y-2 py-1">
                    <Bar className="h-3.5 w-1/3" />
                    <Bar className="h-4 w-1/2" />
                    <Bar className="h-3.5 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
