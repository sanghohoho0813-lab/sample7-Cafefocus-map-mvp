"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Search, MapPin, TrainFront, Coffee, X } from "lucide-react";
import { AREAS, CAFES } from "@/lib/data/cafes";
import type { AreaKey } from "@/lib/types";

interface Suggestion {
  type: "area" | "station" | "cafe";
  label: string;
  sub: string;
  areaKey?: AreaKey;
  cafeId?: string;
}

/** 지역·역·카페 이름 검색 (데모 데이터 22곳 대상) */
export default function SearchBox({
  onSelectArea,
  onSelectCafe,
  placeholder = "지역·역·카페 이름 검색",
  className = "",
}: {
  onSelectArea: (key: AreaKey) => void;
  onSelectCafe: (id: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const suggestions = useMemo<Suggestion[]>(() => {
    const q = query.trim().toLowerCase();
    const areaItems: Suggestion[] = AREAS.map((a) => ({ type: "area", label: a.name, sub: "지역", areaKey: a.key }));
    const stationItems: Suggestion[] = AREAS.map((a) => ({ type: "station", label: a.station, sub: `${a.name} 인근`, areaKey: a.key }));
    const cafeItems: Suggestion[] = CAFES.map((c) => ({ type: "cafe", label: c.name, sub: c.address, cafeId: c.id }));
    if (!q) return areaItems;
    return [...areaItems, ...stationItems, ...cafeItems]
      .filter((s) => s.label.toLowerCase().includes(q) || s.sub.toLowerCase().includes(q))
      .slice(0, 8);
  }, [query]);

  const pick = (s: Suggestion) => {
    setQuery("");
    setOpen(false);
    if (s.type === "cafe" && s.cafeId) onSelectCafe(s.cafeId);
    else if (s.areaKey) onSelectArea(s.areaKey);
  };

  const showList = open && suggestions.length > 0;

  return (
    <div ref={boxRef} className={`relative ${className}`}>
      <div className="flex h-12 items-center gap-2.5 rounded-xl border border-cream-300 bg-white px-3.5 transition-colors duration-200 focus-within:border-coffee-500">
        <Search size={18} className="shrink-0 text-coffee-400" aria-hidden />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (!showList) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((i) => Math.min(i + 1, suggestions.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((i) => Math.max(i - 1, 0));
            } else if (e.key === "Enter") {
              e.preventDefault();
              pick(suggestions[active]);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-body text-coffee-800 outline-none placeholder:text-coffee-400"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-label="지역·역·카페 검색"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-coffee-400 hover:text-coffee-700"
            aria-label="검색어 지우기"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-full z-50 mt-2 max-h-80 overflow-y-auto rounded-2xl border border-cream-300 bg-white py-1.5 shadow-card-lg animate-fade-up"
        >
          {!query && <li className="px-4 pb-1 pt-2 text-caption font-semibold text-coffee-400">지역으로 보기</li>}
          {suggestions.map((s, i) => (
            <li key={`${s.type}-${s.label}`} role="option" aria-selected={i === active}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => pick(s)}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                  i === active ? "bg-cream-100" : ""
                }`}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cream-100 text-coffee-500">
                  {s.type === "area" ? <MapPin size={15} /> : s.type === "station" ? <TrainFront size={15} /> : <Coffee size={15} />}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-body font-semibold text-coffee-800">{s.label}</span>
                  <span className="block truncate text-meta text-coffee-400">{s.sub}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {open && query.trim() && suggestions.length === 0 && (
        <div className="absolute inset-x-0 top-full z-50 mt-2 rounded-2xl border border-cream-300 bg-white px-4 py-5 text-center text-meta text-coffee-400 shadow-card-lg">
          검색 결과가 없어요. 성수·강남·홍대처럼 지역 이름으로 찾아보세요.
        </div>
      )}
    </div>
  );
}
