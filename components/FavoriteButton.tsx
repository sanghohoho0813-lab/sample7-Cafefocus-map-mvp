"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { useApp } from "@/lib/store";
import { getCafe } from "@/lib/data/cafes";

export default function FavoriteButton({
  cafeId,
  size = "md",
  className = "",
}: {
  cafeId: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const { isFavorite, toggleFavorite, showToast, hydrated } = useApp();
  const [popping, setPopping] = useState(false);
  const fav = hydrated && isFavorite(cafeId);

  const dims =
    size === "sm" ? "h-8 w-8" : size === "lg" ? "h-11 w-11" : "h-9 w-9";
  const iconSize = size === "sm" ? 15 : size === "lg" ? 19 : 17;

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const name = getCafe(cafeId)?.name ?? "카페";
        toggleFavorite(cafeId);
        setPopping(true);
        window.setTimeout(() => setPopping(false), 400);
        if (!fav) {
          showToast(`${name}을(를) 저장했어요.`, {
            label: "즐겨찾기",
            href: "/favorites",
          });
        } else {
          showToast(`${name} 저장을 해제했어요.`);
        }
      }}
      className={`flex items-center justify-center rounded-full border transition-all duration-200 active:scale-90 ${dims} ${
        fav
          ? "border-red-200 bg-red-50 text-red-400"
          : "border-cream-300 bg-white/90 text-coffee-400 hover:border-coffee-200 hover:text-coffee-600"
      } ${className}`}
      aria-label={fav ? "저장 해제" : "저장"}
      aria-pressed={fav}
    >
      <Heart
        size={iconSize}
        strokeWidth={2.1}
        fill={fav ? "currentColor" : "none"}
        className={popping ? "animate-heart-pop" : ""}
      />
    </button>
  );
}
