import { Coffee } from "lucide-react";
import type { Cafe } from "@/lib/types";

/**
 * 카페 사진 자리. 실제 이미지는 /public/images/cafes/{id}.jpg 로 추후 교체.
 * 지금은 카페별 고유 그라디언트 + 패턴으로 완성된 카드 비율을 유지한다.
 */
export default function CafePhoto({
  cafe,
  className = "",
  iconSize = 28,
}: {
  cafe: Cafe;
  className?: string;
  iconSize?: number;
}) {
  const [from, to] = cafe.gradient;
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)` }}
      role="img"
      aria-label={`${cafe.name} 사진`}
    >
      {/* 은은한 창문 패턴 */}
      <div
        className="absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, rgba(255,255,255,0.9) 0 1px, transparent 1px 26px), repeating-linear-gradient(0deg, rgba(255,255,255,0.9) 0 1px, transparent 1px 26px)",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-white/10" />
      <div className="absolute inset-0 flex items-center justify-center text-white/40">
        <Coffee size={iconSize} strokeWidth={1.6} />
      </div>
    </div>
  );
}
