/**
 * 저장소(localStorage)를 읽기 전 한 프레임 동안 보여주는 자리표시.
 * 빈 화면이 번쩍이지 않고, 실제 레이아웃과 같은 자리에 같은 크기로 그려 레이아웃이 흔들리지 않게 한다.
 */
export default function PageSkeleton({ variant = "list" }: { variant?: "list" | "form" }) {
  return (
    <div className="h-full overflow-hidden bg-cream-50" aria-busy="true" aria-label="불러오는 중">
      <div className="mx-auto max-w-5xl animate-pulse px-4 pt-6 sm:px-6 lg:pt-8">
        <div className="h-8 w-40 rounded-lg bg-cream-200" />
        <div className="mt-3 h-4 w-64 max-w-full rounded bg-cream-200" />
        {variant === "list" ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="overflow-hidden rounded-2xl border border-cream-300/80 bg-white">
                <div className="aspect-[4/3] bg-cream-200" />
                <div className="space-y-2 p-4">
                  <div className="h-5 w-2/3 rounded bg-cream-200" />
                  <div className="h-4 w-1/2 rounded bg-cream-200" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mx-auto mt-8 max-w-xl space-y-6">
            {[0, 1, 2].map((i) => (
              <div key={i} className="space-y-3">
                <div className="h-5 w-32 rounded bg-cream-200" />
                <div className="grid grid-cols-3 gap-2">
                  <div className="h-12 rounded-xl bg-cream-200" />
                  <div className="h-12 rounded-xl bg-cream-200" />
                  <div className="h-12 rounded-xl bg-cream-200" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
