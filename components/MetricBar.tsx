import type { LucideIcon } from "lucide-react";

/** 첨부 시안의 세그먼트 바 스타일 지표 행 */
export default function MetricBar({
  icon: Icon,
  label,
  value,
  valueLabel,
  segments = 5,
}: {
  icon: LucideIcon;
  label: string;
  value: number; // 0-100
  valueLabel: string;
  segments?: number;
}) {
  const filled = Math.round((value / 100) * segments);
  return (
    <div className="flex items-center gap-3">
      <div className="flex w-24 shrink-0 items-center gap-2 text-coffee-500">
        <Icon size={15} strokeWidth={2} />
        <span className="text-[12.5px]">{label}</span>
      </div>
      <div className="flex flex-1 gap-1">
        {Array.from({ length: segments }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
              i < filled ? "bg-forest-500" : "bg-cream-200"
            }`}
          />
        ))}
      </div>
      <span className="w-16 shrink-0 text-right text-[12.5px] font-semibold text-coffee-700">
        {valueLabel}
      </span>
    </div>
  );
}
