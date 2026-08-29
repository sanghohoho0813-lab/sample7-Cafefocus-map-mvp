"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, MapPin, TrainFront, Coffee, Loader2 } from "lucide-react";
import { AREAS, CAFES } from "@/lib/data/cafes";
import type { AreaKey } from "@/lib/types";

interface Suggestion {
  type: "area" | "station" | "cafe";
  label: string;
  sub: string;
  areaKey?: AreaKey;
  cafeId?: string;
}

export default function SearchBox({
  onSelectArea,
  onSelectCafe,
  placeholder = "지역·역·카페 검색 (예: 성수, 홍대입구역)",
  className = "",
}: {
  onSelectArea: (key: AreaKey) => void;
  onSelectCafe: (id: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    if (!query.trim()) return;
    setLoading(true);
    const t = window.setTimeout(() => setLoading(false), 280);
    return () => window.clearTimeout(t);
  }, [query]);

  const suggestions = useMemo<Suggestion[]>(() => {
    const q = query.trim().toLowerCase();
    const areaItems: Suggestion[] = AREAS.map((a) => ({
      type: "area" as const,
      label: a.name,
      sub: "지역",
      areaKey: a.key,
    }));
    const stationItems: Suggestion[] = AREAS.map((a) => ({
      type: "station" as const,
      label: a.station,
      sub: `${a.name} 인근`,
      areaKey: a.key,
    }));
    const cafeItems: Suggestion[] = CAFES.map((c) => ({
      type: "cafe" as const,
      label: c.name,
      sub: c.address,
      cafeId: c.id,
    }));
    const all = [...areaItems, ...stationItems, ...cafeItems];
    if (!q) return [...areaItems, ...cafeItems.slice(0, 4)];
    return all
      .filter(
        (s) =>
          s.label.toLowerCase().includes(q) || s.sub.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [query]);

  const pick = (s: Suggestion) => {
    setQuery(s.label);
    setOpen(false);
    if (s.type === "cafe" && s.cafeId) onSelectCafe(s.cafeId);
    else if (s.areaKey) onSelectArea(s.areaKey);
  };

  return (
    <div ref={boxRef} className={`relative ${className}`}>
      <div className="flex items-center gap-2 rounded-full border border-cream-300 bg-white px-4 py-2.5 shadow-sm transition-all duration-200 focus-within:border-coffee-400 focus-within:shadow-card">
        {loading ? (
          <Loader2 size={20} className="shrink-0 animate-spin text-coffee-400" />
        ) : (
          <Search size={20} className="shrink-0 text-coffee-400" />
        )}
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="w-full bg-transparent text-[18px] text-coffee-800 outline-none placeholder:text-coffee-300"
          aria-label="검색"
        />
      </div>

      {open && suggestions.length > 0 && (
        <div className="absolute inset-x-0 top-full z-50 mt-2 max-h-80 overflow-y-auto rounded-2xl border border-cream-200 bg-white py-1.5 shadow-card-lg animate-fade-up">
          {suggestions.map((s, i) => (
            <button
              key={`${s.type}-${s.label}-${i}`}
              onClick={() => pick(s)}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-cream-100"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cream-100 text-coffee-500">
                {s.type === "area" ? (
                  <MapPin size={17.5} />
                ) : s.type === "station" ? (
                  <TrainFront size={17.5} />
                ) : (
                  <Coffee size={17.5} />
                )}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[17.5px] font-semibold text-coffee-800">
                  {s.label}
                </span>
                <span className="block truncate text-[15px] text-coffee-400">
                  {s.sub}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
      {open && query.trim() && suggestions.length === 0 && !loading && (
        <div className="absolute inset-x-0 top-full z-50 mt-2 rounded-2xl border border-cream-200 bg-white px-4 py-5 text-center text-[17px] text-coffee-400 shadow-card-lg animate-fade-up">
          검색 결과가 없어요. 다른 지역이나 카페명을 입력해 보세요.
        </div>
      )}
    </div>
  );
}
