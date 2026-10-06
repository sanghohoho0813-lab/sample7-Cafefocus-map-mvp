import type { AreaKey, FilterKey, Purpose, TimeSel } from "@/lib/types";
import { AREA_MAP, CAFE_MAP } from "@/lib/data/cafes";
import { PURPOSE_LABEL } from "@/lib/fit";
import { FILTER_LABEL } from "@/lib/filters";
import { DATA_HOURS } from "@/lib/time";

/**
 * 지도 탐색 상태 ↔ URL 쿼리.
 * 새로고침·공유·뒤로가기 후에도 같은 화면이 나오도록, 지도 상태를 주소에 담는다.
 *
 *   /?area=seongsu&p=study&t=15&f=quiet,outlet&cafe=workroom-17
 *
 * 알 수 없는 값은 조용히 버린다 (주소를 손으로 고쳐도 화면이 깨지지 않게).
 */
export interface ExploreQuery {
  area?: AreaKey | null;
  purpose?: Purpose;
  time?: TimeSel;
  filters?: FilterKey[];
  cafe?: string | null;
}

const isArea = (v: string): v is AreaKey => v in AREA_MAP;
const isPurpose = (v: string): v is Purpose => v in PURPOSE_LABEL;
const isFilter = (v: string): v is FilterKey => v in FILTER_LABEL;

/** 쿼리에 실제로 있는 값만 돌려준다 — 없는 키는 현재 상태를 그대로 두라는 뜻 */
export function parseExploreQuery(search: string | URLSearchParams): ExploreQuery {
  const q = typeof search === "string" ? new URLSearchParams(search) : search;
  const out: ExploreQuery = {};

  const area = q.get("area");
  if (area !== null) out.area = area === "all" || !isArea(area) ? null : area;

  const p = q.get("p");
  if (p !== null && isPurpose(p)) out.purpose = p;

  const t = q.get("t");
  if (t !== null) {
    const h = Number(t);
    out.time = t !== "" && Number.isInteger(h) && DATA_HOURS.includes(h) ? h : "now";
  }

  const f = q.get("f");
  if (f !== null) out.filters = [...new Set(f.split(",").filter(isFilter))];

  const cafe = q.get("cafe");
  if (cafe !== null) out.cafe = CAFE_MAP[cafe] ? cafe : null;

  return out;
}

/**
 * 기본값(모든 지역 · 지금 · 필터 없음 · 선택 없음)은 생략해 주소를 짧게 유지한다.
 * explicit: 다른 화면에서 지도로 보내는 링크처럼, 받는 쪽의 기존 상태를 확실히 덮어써야 할 때
 */
export function buildExploreQuery(
  s: {
    area: AreaKey | null;
    purpose: Purpose;
    time: TimeSel;
    filters: FilterKey[];
    cafe: string | null;
  },
  { explicit = false }: { explicit?: boolean } = {}
): string {
  const q = new URLSearchParams();
  if (s.area || explicit) q.set("area", s.area ?? "all");
  q.set("p", s.purpose);
  if (s.time !== "now" || explicit) q.set("t", String(s.time));
  if (s.filters.length || explicit) q.set("f", [...s.filters].sort().join(","));
  if (s.cafe) q.set("cafe", s.cafe);
  const str = q.toString().replace(/%2C/g, ",");
  return str ? `?${str}` : "";
}
