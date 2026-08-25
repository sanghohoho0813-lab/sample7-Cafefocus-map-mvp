import { Coffee } from "lucide-react";

export default function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-cream-200/40 bg-coffee-700 text-cream-100 shadow-marker">
        <Coffee size={17} strokeWidth={2.2} />
      </div>
      {!compact && (
        <div className="leading-tight">
          <div className="font-display text-[15px] font-bold tracking-[0.12em] text-cream-50">
            CAFE FOCUS
          </div>
          <div className="text-[10px] tracking-wide text-cream-200/70">
            집중을 위한 공간
          </div>
        </div>
      )}
    </div>
  );
}
