import { Coffee } from "lucide-react";

export default function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-cream-200/40 bg-coffee-700 text-amber-300 shadow-marker">
        <Coffee size={21.5} strokeWidth={2.2} />
      </div>
      {!compact && (
        <div className="leading-tight">
          <div className="font-display text-[19.5px] font-bold tracking-[0.12em] text-white">
            CAFE FOCUS
          </div>
          <div className="text-[13px] tracking-wide text-cream-100/80">
            집중을 위한 공간
          </div>
        </div>
      )}
    </div>
  );
}
