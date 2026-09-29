"use client";

import { Scale, Check } from "lucide-react";
import { useApp } from "@/lib/store";
import { getCafe } from "@/lib/data/cafes";

/** 비교함 담기/빼기. compact는 아이콘만(좁은 하단 바) */
export default function CompareToggle({
  cafeId,
  compact = false,
  className = "",
}: {
  cafeId: string;
  compact?: boolean;
  className?: string;
}) {
  const { inCompare, toggleCompare, showToast, hydrated, compare } = useApp();
  const active = hydrated && inCompare(cafeId);

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const name = getCafe(cafeId)?.name ?? "카페";
    const wasFull = !active && compare.length >= 3;
    const added = toggleCompare(cafeId);
    if (added) {
      showToast(`${name}을(를) 비교함에 담았어요`, { label: "비교하기", href: "/compare" });
    } else if (!wasFull) {
      showToast(`${name}을(를) 비교함에서 뺐어요`);
    }
  };

  if (compact) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`icon-btn ${active ? "border-coffee-800 bg-coffee-800 text-cream-50 hover:text-cream-50" : ""} ${className}`}
        aria-pressed={active}
        aria-label={active ? "비교함에서 빼기" : "비교함에 담기"}
      >
        {active ? <Check size={17} strokeWidth={2.6} /> : <Scale size={17} />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`btn h-10 rounded-xl px-3 text-label ${
        active ? "bg-coffee-100 text-coffee-800" : "text-coffee-500 hover:bg-cream-200/60 hover:text-coffee-800"
      } ${className}`}
      aria-pressed={active}
    >
      {active ? <Check size={16} strokeWidth={2.6} /> : <Scale size={16} />}
      {active ? "비교함에 담김" : "비교 담기"}
    </button>
  );
}
