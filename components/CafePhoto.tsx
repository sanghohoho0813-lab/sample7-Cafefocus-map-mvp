import Image from "next/image";
import type { Cafe } from "@/lib/types";

/**
 * 카페 사진.
 * - variant "wide": 16:9 원본(1440x810) — 상세 Hero용
 * - variant "card": 4:3 축소본(720x540) — 리스트/썸네일용
 * 컨테이너가 크기를 정하고 이미지는 object-cover로 채운다.
 */
export default function CafePhoto({
  cafe,
  className = "",
  variant = "card",
  sizes = "(max-width: 768px) 100vw, 400px",
  priority = false,
  overlay = true,
}: {
  cafe: Cafe;
  className?: string;
  variant?: "card" | "wide";
  sizes?: string;
  priority?: boolean;
  overlay?: boolean;
}) {
  const [from, to] = cafe.gradient;
  const src =
    variant === "wide"
      ? `/images/cafes/${cafe.id}.webp`
      : `/images/cafes/${cafe.id}-card.webp`;

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)` }}
    >
      <Image
        src={src}
        alt={`${cafe.name} 내부 사진`}
        fill
        sizes={sizes}
        placeholder="blur"
        blurDataURL={cafe.blurDataURL}
        priority={priority}
        className="object-cover"
      />
      {overlay && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
      )}
    </div>
  );
}
