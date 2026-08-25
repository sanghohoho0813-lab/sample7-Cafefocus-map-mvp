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
  gradient: [string, string];
  reviews: Review[];
}

export type FilterKey =
  | "quiet"
  | "outlet"
  | "wifi"
  | "bigTable"
  | "longStay"
  | "meeting"
  | "lateNight"
  | "calmNow";

export type Purpose = "focus" | "study" | "meeting" | "light" | "reading";

export type PriorityKey = "quiet" | "outlet" | "wifi" | "seat" | "access";

export type StayLength = "short" | "medium" | "long";
