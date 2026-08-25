"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { CAFES } from "@/lib/data/cafes";
import { demoHour } from "@/lib/scoring";
import CafeCard from "@/components/CafeCard";
import EmptyState from "@/components/EmptyState";
import { useApp } from "@/lib/store";

export default function FavoritesPage() {
  const { favorites, hydrated } = useApp();
  const [hour, setHour] = useState(15);
  useEffect(() => setHour(demoHour(new Date())), []);

  const cafes = CAFES.filter((c) => favorites.includes(c.id));

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-6xl space-y-4 px-4 py-4 lg:px-6 lg:py-6">
        <div>
          <h1 className="text-[20px] font-bold text-coffee-800">즐겨찾기</h1>
          <p className="mt-0.5 text-[13px] text-coffee-400">
            저장해 둔 작업 카페 {hydrated ? cafes.length : 0}곳
          </p>
        </div>

        {hydrated && cafes.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="마음에 드는 작업 카페를 저장해보세요."
            description="지도나 카페 상세에서 하트를 누르면 여기에 모여요."
            action={
              <Link
                href="/"
                className="rounded-full bg-coffee-700 px-4 py-2 text-[13px] font-semibold text-cream-50 transition-colors hover:bg-coffee-600"
              >
                지도에서 카페 찾기
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 pb-6 sm:grid-cols-2 lg:grid-cols-3">
            {cafes.map((cafe) => (
              <CafeCard key={cafe.id} cafe={cafe} hour={hour} variant="card" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
