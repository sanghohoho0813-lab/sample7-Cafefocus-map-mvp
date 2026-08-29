"use client";

import { Scale, Check } from "lucide-react";
import { useApp } from "@/lib/store";
import { getCafe } from "@/lib/data/cafes";

export default function CompareButton({
  cafeId,
  variant = "chip",
  compact = false,
}: {
  cafeId: string;
  variant?: "chip" | "block";
  /** 좁은 카드에서 라벨을 숨기고 아이콘만 보여준다 */
  compact?: boolean;
}) {
  const { inCompare, toggleCompare, showToast, hydrated, compare } = useApp();
  const active = hydrated && inCompare(cafeId);

  const handle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const name = getCafe(cafeId)?.name ?? "카페";
    const willAdd = !inCompare(cafeId);
    toggleCompare(cafeId);
    if (willAdd && compare.length < 3) {
      showToast(`${name}을(를) 비교함에 담았어요.`, {
        label: "비교하기",
        href: "/compare",
      });
    }
  };

  if (variant === "block") {
    return (
      <button
        onClick={handle}
        className={`flex w-full items-center justify-center gap-1.5 rounded-xl border py-2.5 text-[13px] font-semibold transition-all duration-200 active:scale-[0.98] ${
          active
            ? "border-forest-500 bg-forest-50 text-forest-700"
            : "border-cream-300 bg-white text-coffee-600 hover:border-coffee-300"
        }`}
        aria-pressed={active}
      >
        {active ? <Check size={15} /> : <Scale size={15} />}
        {active ? "비교함에 담김" : "비교 담기"}
      </button>
    );
  }

  return (
    <button
      onClick={handle}
      className={`inline-flex items-center justify-center gap-1 rounded-full border text-[11.5px] font-semibold transition-all duration-200 active:scale-95 ${
        compact ? "h-8 w-8" : "px-2.5 py-1.5"
      } ${
        active
          ? "border-forest-500 bg-forest-50 text-forest-700"
          : "border-cream-300 bg-white/90 text-coffee-500 hover:border-coffee-300"
      }`}
      aria-pressed={active}
      aria-label={active ? "비교함에서 빼기" : "비교 담기"}
      title={active ? "비교함에서 빼기" : "비교 담기"}
    >
      {active ? <Check size={compact ? 14 : 12} /> : <Scale size={compact ? 14 : 12} />}
      {!compact && "비교"}
    </button>
  );
}
