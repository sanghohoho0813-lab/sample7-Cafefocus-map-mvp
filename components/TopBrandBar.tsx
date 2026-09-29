import Image from "next/image";

/**
 * 제작사 표기 (앱 전체에서 단 한 곳).
 * 서비스보다 눈에 띄지 않도록 얇고 낮은 대비로 두고,
 * 데모 데이터로 동작한다는 사실을 함께 정직하게 알린다.
 */
export default function TopBrandBar() {
  return (
    <div className="flex h-8 shrink-0 items-center justify-between gap-3 border-b border-cream-300/70 bg-cream-200/70 px-4 text-caption text-coffee-500">
      <span className="flex min-w-0 items-center gap-1.5">
        <Image
          src="/brand/mirae-ai-lab-mark.png"
          alt=""
          width={176}
          height={116}
          className="h-3.5 w-auto shrink-0"
        />
        <span className="truncate">
          <b className="font-semibold text-coffee-700">미래AI랩</b> 샘플 MVP
        </span>
      </span>
      <span className="shrink-0 whitespace-nowrap">데모 데이터로 동작해요</span>
    </div>
  );
}
