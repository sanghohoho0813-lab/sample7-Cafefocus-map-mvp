import { Coffee } from "lucide-react";

export default function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-cream-200/30 bg-coffee-700 text-cream-100">
        <Coffee size={18} strokeWidth={2.2} />
      </div>
      <div className="leading-tight">
        <div className="font-display text-[17px] font-bold tracking-[0.1em] text-white">
          CAFE FOCUS
        </div>
        <div className="text-caption text-cream-100/70">일하기 좋은 카페 지도</div>
      </div>
    </div>
  );
}
