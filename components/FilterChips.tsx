"use client";

import { RotateCcw } from "lucide-react";
import { FILTERS } from "@/lib/filters";
import type { FilterKey } from "@/lib/types";

export default function FilterChips({
  active,
  onToggle,
  onReset,
  className = "",
}: {
  active: FilterKey[];
  onToggle: (key: FilterKey) => void;
  onReset?: () => void;
  className?: string;
}) {
  return (
    <div
      className={`no-scrollbar flex items-center gap-2 overflow-x-auto ${className}`}
      role="group"
      aria-label="빠른 필터"
    >
      {FILTERS.map(({ key, label }) => {
        const on = active.includes(key);
        return (
          <button
            key={key}
            onClick={() => onToggle(key)}
            className={`chip ${on ? "chip-active" : "chip-idle"}`}
            aria-pressed={on}
          >
            {label}
          </button>
        );
      })}
      {active.length > 0 && onReset && (
        <button
          onClick={onReset}
          className="chip chip-idle text-coffee-400"
          aria-label="필터 초기화"
        >
          <RotateCcw size={16.5} />
          초기화
        </button>
      )}
    </div>
  );
}
