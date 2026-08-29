/**
 * 작업환경 지표별 아이콘 컬러.
 * 밝은 배경(카드) 기준이며, 항목을 한눈에 구분할 수 있게 톤을 나눈다.
 */
export const METRIC_ICON = {
  noise: "text-sky-500",
  wifi: "text-blue-500",
  outlet: "text-amber-500",
  seat: "text-emerald-500",
  table: "text-lime-600",
  crowd: "text-orange-500",
  stay: "text-violet-500",
  laptop: "text-teal-500",
  restroom: "text-cyan-500",
  parking: "text-slate-500",
  clock: "text-violet-500",
  location: "text-rose-500",
  star: "text-amber2-400",
} as const;

/** 아이콘 배경 pill 색 (상세 페이지 환경 그리드) */
export const METRIC_ICON_BG = {
  noise: "bg-sky-50",
  wifi: "bg-blue-50",
  outlet: "bg-amber-50",
  seat: "bg-emerald-50",
  table: "bg-lime-50",
  crowd: "bg-orange-50",
  stay: "bg-violet-50",
  laptop: "bg-teal-50",
  restroom: "bg-cyan-50",
  parking: "bg-slate-100",
} as const;

export type MetricIconKey = keyof typeof METRIC_ICON;
