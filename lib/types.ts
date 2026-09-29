export type AreaKey =
  | "seongsu"
  | "gangnam"
  | "hongdae"
  | "jamsil"
  | "jongno"
  | "hapjeong";

export interface Area {
  key: AreaKey;
  name: string;
  station: string;
  lat: number;
  lng: number;
}

/** 0-100. noise/crowd 계열은 값이 높을수록 "조용함/한산함"이 아니라 환경 점수(높을수록 좋음)로 통일한다. */
export interface CafeMetrics {
  /** 높을수록 조용함 */
  noiseScore: number;
  /** 높을수록 빠르고 안정적 */
  wifiScore: number;
  /** 높을수록 콘센트 좌석 비율 높음 */
  outletScore: number;
  /** 높을수록 좌석/테이블이 작업에 편함 */
  seatScore: number;
  /** 높을수록 한산함 */
  crowdScore: number;
  /** 높을수록 장시간 체류 부담 없음 */
  stayScore: number;
}

/** 시간대별 원시 상태값. noise/crowd는 높을수록 시끄럽고 붐빔 (0-100) */
export interface HourlyPoint {
  hour: number;
  noise: number;
  crowd: number;
}

export interface Review {
  id: string;
  author: string;
  visitTime: string;
  purpose: string;
  stayMinutes: number;
  rating: number;
  text: string;
  tags: string[];
}

export interface Cafe {
  id: string;
  name: string;
  area: AreaKey;
  address: string;
  station: string;
  stationDistanceM: number;
  lat: number;
  lng: number;
  open: number;
  close: number;
  rating: number;
  reviewCount: number;
  wifiMbps: number;
  avgStayMinutes: number;
  metrics: CafeMetrics;
  hourly: HourlyPoint[];
  tags: string[];
  description: string;
  amenities: {
    restroom: boolean;
    parking: boolean;
    laptopFriendly: boolean;
    bigTable: boolean;
  };
  /** 이미지 로딩 전 배경 (사진 톤과 맞춘 값) */
  gradient: [string, string];
  /** next/image blur placeholder (원본에서 생성한 12x7 WebP) */
  blurDataURL: string;
  reviews: Review[];
}

export type FilterKey =
  | "quiet"
  | "outlet"
  | "wifi"
  | "bigTable"
  | "longStay"
  | "lateNight"
  | "calmNow";

export type Purpose = "focus" | "study" | "meeting" | "light" | "reading";

export type PriorityKey = "quiet" | "outlet" | "wifi" | "seat" | "access";

export type StayLength = "short" | "medium" | "long";

/** 지도·상세·비교가 공유하는 기준 시간. "now"는 현재 시각을 따라간다. */
export type TimeSel = "now" | number;

/** 사용자가 저장해 두는 선호 조건 (맞춤 추천 결과로 갱신) */
export interface Prefs {
  purpose: Purpose;
  priorities: PriorityKey[];
  stay: StayLength;
}

/* ---------------- 핵심 완료 이벤트: 작업 계획 ---------------- */

export type PlanStatus = "planned" | "completed" | "cancelled";

export interface Plan {
  id: string;
  cafeId: string;
  /** 로컬 날짜 YYYY-MM-DD */
  date: string;
  startHour: number;
  durationMin: number;
  purpose: Purpose;
  memo: string;
  status: PlanStatus;
  createdAt: string;
  completedAt?: string;
  cancelledAt?: string;
  reviewId?: string;
}

export type PlanInput = Pick<
  Plan,
  "cafeId" | "date" | "startHour" | "durationMin" | "purpose" | "memo"
>;

/* ---------------- 방문 후 작업환경 체크인 ---------------- */

export type NoiseFeel = "quiet" | "normal" | "loud";
export type OutletFeel = "easy" | "some" | "none";
export type WifiFeel = "fast" | "ok" | "slow";

export interface UserReview {
  id: string;
  cafeId: string;
  planId?: string;
  createdAt: string;
  /** "평일 오후" 형태 */
  visitLabel: string;
  purpose: Purpose;
  stayMinutes: number;
  rating: number;
  noise: NoiseFeel;
  outlet: OutletFeel;
  wifi: WifiFeel;
  text: string;
}

export type ReviewInput = Omit<UserReview, "id" | "createdAt">;
