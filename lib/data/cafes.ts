import type {
  Area,
  AreaKey,
  Cafe,
  CafeMetrics,
  HourlyPoint,
  Review,
} from "@/lib/types";

export const AREAS: Area[] = [
  { key: "seongsu", name: "성수", station: "성수역", lat: 37.5446, lng: 127.0559 },
  { key: "gangnam", name: "강남", station: "강남역", lat: 37.4979, lng: 127.0276 },
  { key: "hongdae", name: "홍대·연남", station: "홍대입구역", lat: 37.5563, lng: 126.9236 },
  { key: "jamsil", name: "잠실", station: "잠실역", lat: 37.5133, lng: 127.1 },
  { key: "jongno", name: "종로", station: "종각역", lat: 37.57, lng: 126.983 },
  { key: "hapjeong", name: "합정", station: "합정역", lat: 37.5495, lng: 126.9139 },
];

export const AREA_MAP: Record<AreaKey, Area> = Object.fromEntries(
  AREAS.map((a) => [a.key, a])
) as Record<AreaKey, Area>;

/** 데모 현재 위치: 성수역 인근 */
export const DEMO_LOCATION = { lat: 37.5441, lng: 127.0567 };

export const HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];

/* ---------------- 시간대 패턴 ----------------
 * noise / crowd: 높을수록 시끄럽고 붐빔 (0-100)
 * 카페 성격별 기본 곡선을 두고, 카페마다 강도/오프셋을 다르게 준다.
 */
type PatternKey =
  | "officeLunch" // 오피스 상권: 점심 피크, 오후 혼잡, 저녁 한산
  | "campusEvening" // 대학가: 오후부터 저녁까지 상승
  | "residentialCalm" // 주택가: 하루 종일 잔잔, 정오 약간 상승
  | "brunchPeak" // 브런치형: 오전-점심 피크, 오후 완화
  | "steadyBusy" // 핫플: 11-19시 꾸준히 붐빔
  | "nightOwl"; // 심야형: 낮 한산, 저녁 이후 상승

const PATTERNS: Record<PatternKey, { noise: number[]; crowd: number[] }> = {
  //          9   10  11  12  13  14  15  16  17  18  19  20  21
  officeLunch: {
    noise: [22, 26, 38, 72, 68, 52, 48, 46, 40, 34, 28, 24, 20],
    crowd: [18, 24, 40, 82, 76, 58, 52, 48, 42, 32, 24, 18, 14],
  },
  campusEvening: {
    noise: [20, 24, 32, 44, 50, 56, 62, 66, 72, 74, 70, 60, 48],
    crowd: [14, 20, 30, 44, 52, 60, 66, 72, 78, 80, 74, 62, 46],
  },
  residentialCalm: {
    noise: [18, 22, 28, 40, 38, 34, 32, 30, 32, 30, 26, 22, 18],
    crowd: [12, 18, 26, 42, 40, 34, 30, 28, 30, 28, 22, 16, 12],
  },
  brunchPeak: {
    noise: [34, 52, 68, 74, 66, 52, 44, 40, 36, 32, 28, 24, 20],
    crowd: [30, 52, 72, 80, 70, 54, 44, 38, 34, 30, 24, 18, 12],
  },
  steadyBusy: {
    noise: [30, 38, 52, 62, 66, 68, 70, 68, 66, 64, 60, 52, 42],
    crowd: [24, 34, 50, 62, 68, 72, 74, 72, 70, 66, 60, 50, 38],
  },
  nightOwl: {
    noise: [16, 18, 22, 30, 32, 34, 36, 40, 46, 54, 60, 62, 58],
    crowd: [10, 14, 18, 28, 30, 32, 36, 42, 50, 60, 66, 68, 62],
  },
};

/** 결정적 지터: 카페 id + hour 기반이라 SSR/CSR이 항상 같다 */
function jitter(id: string, hour: number, span = 6): number {
  let h = 0;
  const s = id + hour;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 997;
  return (h % (span * 2 + 1)) - span;
}

function buildHourly(
  id: string,
  pattern: PatternKey,
  intensity: number,
  offset: number
): HourlyPoint[] {
  const p = PATTERNS[pattern];
  return HOURS.map((hour, i) => ({
    hour,
    noise: clamp(Math.round(p.noise[i] * intensity + offset + jitter(id, hour))),
    crowd: clamp(
      Math.round(p.crowd[i] * intensity + offset + jitter(id + "c", hour))
    ),
  }));
}

function clamp(v: number, min = 4, max = 96): number {
  return Math.max(min, Math.min(max, v));
}

/* ---------------- 리뷰 풀 ---------------- */

interface ReviewSeed {
  author: string;
  visitTime: string;
  purpose: string;
  stayMinutes: number;
  rating: number;
  text: string;
  tags: string[];
  /** 이 리뷰가 어울리는 조건 */
  trait: "quiet" | "outlet" | "wifi" | "busy" | "stay" | "meeting" | "seat";
}

const REVIEW_POOL: ReviewSeed[] = [
  { author: "집중모드ON", visitTime: "평일 오전", purpose: "집중 작업", stayMinutes: 150, rating: 5, text: "평일 오전이 가장 조용하고 좌석도 여유로워요. 콘센트도 넉넉해서 자리 걱정이 없습니다.", tags: ["조용함", "콘센트"], trait: "quiet" },
  { author: "라떼루틴", visitTime: "평일 오후", purpose: "노트북 작업", stayMinutes: 135, rating: 4, text: "커피도 맛있고 분위기도 좋아요. 다만 점심시간대는 사람이 많으니 피하는 걸 추천해요.", tags: ["점심 혼잡"], trait: "busy" },
  { author: "디지털노마드K", visitTime: "평일 오후", purpose: "원격 근무", stayMinutes: 240, rating: 5, text: "와이파이가 정말 빠르고 끊김이 없어요. 화상회의도 문제없이 했습니다.", tags: ["Wi-Fi 좋음"], trait: "wifi" },
  { author: "취준생일기", visitTime: "평일 저녁", purpose: "공부", stayMinutes: 180, rating: 4, text: "저녁에는 공부하는 사람이 대부분이라 눈치 안 보고 오래 있기 좋아요.", tags: ["오래 있기 좋음"], trait: "stay" },
  { author: "회의는짧게", visitTime: "평일 오후", purpose: "미팅", stayMinutes: 90, rating: 4, text: "테이블 간격이 넓어서 1시간 정도 미팅하기 딱 좋았어요. 적당한 백색소음도 괜찮습니다.", tags: ["미팅하기 좋음"], trait: "meeting" },
  { author: "콘센트헌터", visitTime: "주말 오전", purpose: "노트북 작업", stayMinutes: 120, rating: 5, text: "거의 모든 좌석에 콘센트가 있어요. 창가 자리는 채광도 좋아서 최애 자리입니다.", tags: ["콘센트 많음"], trait: "outlet" },
  { author: "주말작업러", visitTime: "주말 오후", purpose: "노트북 작업", stayMinutes: 100, rating: 3, text: "주말 2시 이후엔 꽤 붐벼서 집중이 어려워요. 오전에 오면 쾌적합니다.", tags: ["주말 혼잡"], trait: "busy" },
  { author: "북마크커피", visitTime: "평일 오전", purpose: "독서", stayMinutes: 110, rating: 5, text: "음악 볼륨이 낮고 대화 소리도 잔잔해서 책 읽기 정말 좋은 곳이에요.", tags: ["조용함"], trait: "quiet" },
  { author: "허리지킴이", visitTime: "평일 오후", purpose: "집중 작업", stayMinutes: 160, rating: 4, text: "의자가 푹신하고 테이블 높이가 노트북 작업에 딱 맞아요. 오래 앉아도 허리가 편합니다.", tags: ["좌석 편함"], trait: "seat" },
  { author: "성수동출근러", visitTime: "평일 오전", purpose: "원격 근무", stayMinutes: 200, rating: 5, text: "노트북 작업하는 사람이 많아서 전혀 눈치 보이지 않아요. 반나절 근무 단골 카페입니다.", tags: ["노트북 환영"], trait: "stay" },
  { author: "화이트노이즈", visitTime: "평일 오후", purpose: "공부", stayMinutes: 140, rating: 4, text: "적당한 소음이 오히려 집중에 도움돼요. 4시 이후엔 조금 붐빕니다.", tags: ["오후 혼잡"], trait: "busy" },
  { author: "줌미팅장인", visitTime: "평일 오전", purpose: "미팅", stayMinutes: 80, rating: 5, text: "구석 자리가 반독립형이라 화상회의하기 좋아요. Wi-Fi 속도도 안정적입니다.", tags: ["Wi-Fi 좋음", "미팅"], trait: "wifi" },
];

function pickReviews(id: string, metrics: CafeMetrics): Review[] {
  const traits: ReviewSeed["trait"][] = [];
  if (metrics.noiseScore >= 78) traits.push("quiet");
  if (metrics.outletScore >= 78) traits.push("outlet");
  if (metrics.wifiScore >= 80) traits.push("wifi");
  if (metrics.stayScore >= 78) traits.push("stay");
  if (metrics.seatScore >= 78) traits.push("seat", "meeting");
  if (metrics.crowdScore < 60) traits.push("busy");
  if (traits.length < 3) traits.push("busy", "stay", "quiet");

  const seen = new Set<number>();
  const out: Review[] = [];
  let salt = 0;
  for (const t of traits) {
    if (out.length >= 3) break;
    const candidates = REVIEW_POOL.map((r, i) => ({ r, i })).filter(
      ({ r }) => r.trait === t
    );
    if (!candidates.length) continue;
    const idx = Math.abs(jitter(id + t + salt, salt, 50)) % candidates.length;
    const chosen = candidates[idx];
    salt++;
    if (seen.has(chosen.i)) continue;
    seen.add(chosen.i);
    out.push({ id: `${id}-rv-${out.length}`, ...chosen.r });
  }
  return out;
}

/* ---------------- 카페 정의 ---------------- */

interface CafeSeed {
  id: string;
  name: string;
  area: AreaKey;
  address: string;
  stationDistanceM: number;
  dLat: number;
  dLng: number;
  open: number;
  close: number;
  rating: number;
  reviewCount: number;
  wifiMbps: number;
  avgStayMinutes: number;
  metrics: CafeMetrics;
  pattern: PatternKey;
  intensity: number;
  offset: number;
  tags: string[];
  description: string;
  amenities: Cafe["amenities"];
  gradient: [string, string];
}

const SEEDS: CafeSeed[] = [
  // ---------- 성수 ----------
  {
    id: "cafe-morrow", name: "Cafe Morrow", area: "seongsu",
    address: "서울 성동구 성수이로 88", stationDistanceM: 240, dLat: 0.0021, dLng: 0.0018,
    open: 8, close: 22, rating: 4.6, reviewCount: 323, wifiMbps: 94, avgStayMinutes: 135,
    metrics: { noiseScore: 88, wifiScore: 92, outletScore: 90, seatScore: 84, crowdScore: 72, stayScore: 90 },
    pattern: "residentialCalm", intensity: 1.0, offset: 0,
    tags: ["조용함", "콘센트 많음", "Wi-Fi 빠름"],
    description: "붉은 벽돌 창고를 개조한 작업 특화 카페. 좌석 간격이 넓고 전 좌석에 콘센트가 있어 반나절 작업에도 부담이 없어요.",
    amenities: { restroom: true, parking: true, laptopFriendly: true, bigTable: true },
    gradient: ["#8A6F52", "#463525"],
  },
  {
    id: "slow-bean", name: "Slow Bean", area: "seongsu",
    address: "서울 성동구 연무장길 41", stationDistanceM: 420, dLat: -0.0016, dLng: 0.0034,
    open: 9, close: 21, rating: 4.4, reviewCount: 189, wifiMbps: 62, avgStayMinutes: 120,
    metrics: { noiseScore: 82, wifiScore: 74, outletScore: 78, seatScore: 80, crowdScore: 68, stayScore: 84 },
    pattern: "residentialCalm", intensity: 1.1, offset: 4,
    tags: ["조용함", "따뜻한 분위기", "오래 있기 좋음"],
    description: "느린 배전과 낮은 음악 볼륨이 시그니처. 따뜻한 원목 인테리어에서 차분하게 몰입할 수 있는 공간입니다.",
    amenities: { restroom: true, parking: false, laptopFriendly: true, bigTable: false },
    gradient: ["#A98F73", "#5A4530"],
  },
  {
    id: "atelier-coffee", name: "Atelier Coffee", area: "seongsu",
    address: "서울 성동구 왕십리로 96", stationDistanceM: 350, dLat: 0.0034, dLng: -0.0022,
    open: 10, close: 23, rating: 4.3, reviewCount: 161, wifiMbps: 78, avgStayMinutes: 105,
    metrics: { noiseScore: 70, wifiScore: 82, outletScore: 66, seatScore: 76, crowdScore: 58, stayScore: 74 },
    pattern: "steadyBusy", intensity: 0.9, offset: 0,
    tags: ["감성 인테리어", "늦게까지", "Wi-Fi 빠름"],
    description: "식물과 자연광이 어우러진 아틀리에 콘셉트. 오후엔 활기가 있지만 밤 시간대는 작업하기 좋게 차분해집니다.",
    amenities: { restroom: true, parking: false, laptopFriendly: true, bigTable: true },
    gradient: ["#7C9C61", "#3A502C"],
  },
  {
    id: "workroom-17", name: "Workroom 17", area: "seongsu",
    address: "서울 성동구 아차산로 117", stationDistanceM: 180, dLat: -0.0028, dLng: -0.0015,
    open: 7, close: 24, rating: 4.7, reviewCount: 274, wifiMbps: 110, avgStayMinutes: 165,
    metrics: { noiseScore: 90, wifiScore: 95, outletScore: 94, seatScore: 88, crowdScore: 75, stayScore: 94 },
    pattern: "nightOwl", intensity: 0.8, offset: -2,
    tags: ["집중석", "콘센트 많음", "늦게까지", "Wi-Fi 빠름"],
    description: "카페와 코워킹의 중간 형태. 1인 집중석과 넓은 공용 테이블, 기가 인터넷까지 갖춘 성수의 대표 워크 카페입니다.",
    amenities: { restroom: true, parking: true, laptopFriendly: true, bigTable: true },
    gradient: ["#33665F", "#2C2015"],
  },
  // ---------- 강남 ----------
  {
    id: "monday-roast", name: "Monday Roast", area: "gangnam",
    address: "서울 강남구 테헤란로 152", stationDistanceM: 200, dLat: 0.0019, dLng: 0.0026,
    open: 7, close: 22, rating: 4.2, reviewCount: 412, wifiMbps: 85, avgStayMinutes: 95,
    metrics: { noiseScore: 58, wifiScore: 86, outletScore: 72, seatScore: 70, crowdScore: 45, stayScore: 66 },
    pattern: "officeLunch", intensity: 1.1, offset: 4,
    tags: ["Wi-Fi 빠름", "미팅하기 좋음", "점심 혼잡"],
    description: "테헤란로 한복판의 오피스형 카페. 점심시간만 피하면 미팅과 짧은 집중 작업에 최적화된 공간입니다.",
    amenities: { restroom: true, parking: false, laptopFriendly: true, bigTable: true },
    gradient: ["#6F563E", "#38291C"],
  },
  {
    id: "deep-work-lounge", name: "딥워크 라운지", area: "gangnam",
    address: "서울 강남구 강남대로 396", stationDistanceM: 320, dLat: -0.0022, dLng: -0.0018,
    open: 9, close: 23, rating: 4.5, reviewCount: 238, wifiMbps: 105, avgStayMinutes: 150,
    metrics: { noiseScore: 85, wifiScore: 93, outletScore: 88, seatScore: 86, crowdScore: 64, stayScore: 88 },
    pattern: "campusEvening", intensity: 0.75, offset: 0,
    tags: ["집중석", "조용함", "콘센트 많음"],
    description: "라이브러리 톤의 저소음 라운지. 키보드 소리조차 조심스러운 몰입형 분위기로 강남 직장인의 피난처입니다.",
    amenities: { restroom: true, parking: true, laptopFriendly: true, bigTable: false },
    gradient: ["#3E7C74", "#2D3F23"],
  },
  {
    id: "brick-coffee", name: "Brick Coffee", area: "gangnam",
    address: "서울 서초구 서초대로77길 24", stationDistanceM: 450, dLat: 0.0008, dLng: -0.0038,
    open: 8, close: 21, rating: 4.1, reviewCount: 156, wifiMbps: 55, avgStayMinutes: 85,
    metrics: { noiseScore: 62, wifiScore: 68, outletScore: 58, seatScore: 72, crowdScore: 52, stayScore: 62 },
    pattern: "officeLunch", intensity: 0.95, offset: 0,
    tags: ["브런치", "미팅하기 좋음"],
    description: "벽돌과 원목의 클래식한 무드. 커피 맛으로 유명하지만 오전 시간대에는 작업 자리로도 손색이 없습니다.",
    amenities: { restroom: true, parking: false, laptopFriendly: true, bigTable: false },
    gradient: ["#C4902F", "#6F563E"],
  },
  {
    id: "quiet-quarter", name: "콰이어트 쿼터", area: "gangnam",
    address: "서울 강남구 선릉로 428", stationDistanceM: 280, dLat: 0.0036, dLng: 0.0009,
    open: 10, close: 22, rating: 4.6, reviewCount: 201, wifiMbps: 88, avgStayMinutes: 140,
    metrics: { noiseScore: 92, wifiScore: 84, outletScore: 80, seatScore: 82, crowdScore: 70, stayScore: 86 },
    pattern: "residentialCalm", intensity: 0.9, offset: -2,
    tags: ["조용함", "노 키즈존", "오래 있기 좋음"],
    description: "이름 그대로 조용함이 규칙인 카페. 대화 최소 존과 집중 존이 나뉘어 있어 시험 기간 단골이 많습니다.",
    amenities: { restroom: true, parking: false, laptopFriendly: true, bigTable: true },
    gradient: ["#5F7F47", "#2D3F23"],
  },
  // ---------- 홍대·연남 ----------
  {
    id: "onion-yeonnam", name: "어니언 연남", area: "hongdae",
    address: "서울 마포구 성미산로 161-10", stationDistanceM: 380, dLat: 0.0031, dLng: 0.0012,
    open: 8, close: 22, rating: 4.6, reviewCount: 323, wifiMbps: 94, avgStayMinutes: 130,
    metrics: { noiseScore: 84, wifiScore: 90, outletScore: 86, seatScore: 82, crowdScore: 62, stayScore: 84 },
    pattern: "brunchPeak", intensity: 0.85, offset: 2,
    tags: ["조용함", "콘센트 많음", "Wi-Fi 빠름"],
    description: "연남동 골목의 높은 층고 카페. 조용하고 좌석과 큰 창가가 매력적이며 오후 볕이 특히 좋습니다.",
    amenities: { restroom: true, parking: false, laptopFriendly: true, bigTable: true },
    gradient: ["#8A6F52", "#33665F"],
  },
  {
    id: "cafe-masil", name: "카페 마실", area: "hongdae",
    address: "서울 마포구 연남로 27", stationDistanceM: 450, dLat: 0.0044, dLng: -0.0021,
    open: 9, close: 21, rating: 4.4, reviewCount: 189, wifiMbps: 70, avgStayMinutes: 115,
    metrics: { noiseScore: 78, wifiScore: 76, outletScore: 82, seatScore: 78, crowdScore: 60, stayScore: 78 },
    pattern: "residentialCalm", intensity: 1.15, offset: 2,
    tags: ["따뜻한 분위기", "콘센트 많음"],
    description: "따뜻한 분위기에서 작업하기 좋은 동네 카페. 주인장이 작업자를 배려해 콘센트 멀티탭까지 준비해 둡니다.",
    amenities: { restroom: true, parking: false, laptopFriendly: true, bigTable: false },
    gradient: ["#A98F73", "#463525"],
  },
  {
    id: "coffee-plant", name: "커피플랜트", area: "hongdae",
    address: "서울 마포구 동교로 210", stationDistanceM: 260, dLat: -0.0012, dLng: 0.0029,
    open: 10, close: 22, rating: 4.3, reviewCount: 161, wifiMbps: 66, avgStayMinutes: 100,
    metrics: { noiseScore: 72, wifiScore: 72, outletScore: 64, seatScore: 74, crowdScore: 55, stayScore: 70 },
    pattern: "campusEvening", intensity: 0.9, offset: 2,
    tags: ["식물 카페", "채광 좋음"],
    description: "식물과 자연광이 들어오는 공간. 낮 시간대엔 독서와 가벼운 작업, 저녁엔 스터디 모임이 많은 곳입니다.",
    amenities: { restroom: true, parking: false, laptopFriendly: true, bigTable: true },
    gradient: ["#7C9C61", "#33665F"],
  },
  {
    id: "local-stitch", name: "로컬스티치 연남", area: "hongdae",
    address: "서울 마포구 동교로 255", stationDistanceM: 500, dLat: 0.0018, dLng: -0.0036,
    open: 8, close: 23, rating: 4.2, reviewCount: 99, wifiMbps: 92, avgStayMinutes: 145,
    metrics: { noiseScore: 74, wifiScore: 88, outletScore: 84, seatScore: 80, crowdScore: 66, stayScore: 82 },
    pattern: "nightOwl", intensity: 0.85, offset: 2,
    tags: ["콘센트 많음", "늦게까지", "코워킹 무드"],
    description: "깔끔한 인테리어와 커피가 좋은 크리에이터 거점. 밤늦게까지 노트북 인구 밀도가 높은 곳입니다.",
    amenities: { restroom: true, parking: false, laptopFriendly: true, bigTable: true },
    gradient: ["#5A4530", "#2C2015"],
  },
  {
    id: "sunday-desk", name: "Sunday Desk", area: "hongdae",
    address: "서울 마포구 와우산로 94", stationDistanceM: 300, dLat: -0.0031, dLng: 0.0008,
    open: 11, close: 24, rating: 4.5, reviewCount: 178, wifiMbps: 80, avgStayMinutes: 155,
    metrics: { noiseScore: 80, wifiScore: 82, outletScore: 88, seatScore: 84, crowdScore: 58, stayScore: 88 },
    pattern: "nightOwl", intensity: 0.95, offset: 0,
    tags: ["늦게까지", "콘센트 많음", "오래 있기 좋음"],
    description: "자정까지 여는 심야 작업실 콘셉트. 늦은 밤 마감 작업이 필요한 프리랜서들이 모여드는 홍대의 명소.",
    amenities: { restroom: true, parking: false, laptopFriendly: true, bigTable: true },
    gradient: ["#463525", "#2C2015"],
  },
  // ---------- 잠실 ----------
  {
    id: "archive-cafe", name: "Archive Cafe", area: "jamsil",
    address: "서울 송파구 올림픽로 300", stationDistanceM: 350, dLat: 0.0024, dLng: -0.0019,
    open: 9, close: 22, rating: 4.4, reviewCount: 145, wifiMbps: 75, avgStayMinutes: 125,
    metrics: { noiseScore: 81, wifiScore: 80, outletScore: 76, seatScore: 82, crowdScore: 66, stayScore: 80 },
    pattern: "residentialCalm", intensity: 1.05, offset: 2,
    tags: ["조용함", "서재 무드"],
    description: "책과 아카이브 선반으로 둘러싸인 서재형 카페. 종이 넘기는 소리가 어울리는 차분한 공간입니다.",
    amenities: { restroom: true, parking: true, laptopFriendly: true, bigTable: false },
    gradient: ["#6F563E", "#3A502C"],
  },
  {
    id: "lake-view-work", name: "레이크뷰 워크", area: "jamsil",
    address: "서울 송파구 석촌호수로 262", stationDistanceM: 550, dLat: -0.0026, dLng: 0.0014,
    open: 8, close: 21, rating: 4.3, reviewCount: 210, wifiMbps: 68, avgStayMinutes: 110,
    metrics: { noiseScore: 68, wifiScore: 74, outletScore: 62, seatScore: 78, crowdScore: 50, stayScore: 72 },
    pattern: "brunchPeak", intensity: 0.95, offset: 2,
    tags: ["뷰 맛집", "브런치"],
    description: "석촌호수가 내려다보이는 전망 카페. 주말은 붐비지만 평일 오후는 의외의 작업 명당입니다.",
    amenities: { restroom: true, parking: true, laptopFriendly: true, bigTable: false },
    gradient: ["#3E7C74", "#5F7F47"],
  },
  {
    id: "study-hub-jamsil", name: "스터디허브 잠실", area: "jamsil",
    address: "서울 송파구 백제고분로 358", stationDistanceM: 240, dLat: 0.0012, dLng: 0.0033,
    open: 7, close: 24, rating: 4.5, reviewCount: 189, wifiMbps: 98, avgStayMinutes: 190,
    metrics: { noiseScore: 89, wifiScore: 90, outletScore: 92, seatScore: 80, crowdScore: 60, stayScore: 92 },
    pattern: "campusEvening", intensity: 0.8, offset: -2,
    tags: ["집중석", "콘센트 많음", "늦게까지"],
    description: "스터디카페와 카페의 하이브리드. 좌석마다 개인 조명과 콘센트가 있어 시험공부와 장기 작업에 최적입니다.",
    amenities: { restroom: true, parking: true, laptopFriendly: true, bigTable: true },
    gradient: ["#33665F", "#38291C"],
  },
  // ---------- 종로 ----------
  {
    id: "hanok-desk", name: "한옥책상", area: "jongno",
    address: "서울 종로구 북촌로 47", stationDistanceM: 600, dLat: 0.0038, dLng: 0.0011,
    open: 10, close: 20, rating: 4.7, reviewCount: 132, wifiMbps: 52, avgStayMinutes: 95,
    metrics: { noiseScore: 86, wifiScore: 64, outletScore: 54, seatScore: 74, crowdScore: 64, stayScore: 68 },
    pattern: "brunchPeak", intensity: 0.8, offset: -2,
    tags: ["조용함", "한옥", "감성 인테리어"],
    description: "북촌 한옥을 개조한 고요한 찻집형 카페. 마당을 바라보며 글쓰기와 독서에 몰입하기 좋습니다.",
    amenities: { restroom: true, parking: false, laptopFriendly: true, bigTable: false },
    gradient: ["#8A6F52", "#5F7F47"],
  },
  {
    id: "gwanghwamun-page", name: "광화문 페이지", area: "jongno",
    address: "서울 종로구 세종대로 175", stationDistanceM: 300, dLat: -0.0014, dLng: -0.0027,
    open: 7, close: 22, rating: 4.2, reviewCount: 265, wifiMbps: 82, avgStayMinutes: 90,
    metrics: { noiseScore: 60, wifiScore: 84, outletScore: 74, seatScore: 76, crowdScore: 46, stayScore: 64 },
    pattern: "officeLunch", intensity: 1.05, offset: 2,
    tags: ["Wi-Fi 빠름", "미팅하기 좋음", "점심 혼잡"],
    description: "광화문 직장인의 회의실 겸 작업실. 반개방형 부스 좌석이 있어 짧은 미팅과 통화 업무에 편리합니다.",
    amenities: { restroom: true, parking: false, laptopFriendly: true, bigTable: true },
    gradient: ["#6F563E", "#33665F"],
  },
  {
    id: "ikseon-slow", name: "익선 슬로우", area: "jongno",
    address: "서울 종로구 수표로28길 17", stationDistanceM: 420, dLat: 0.0009, dLng: 0.0031,
    open: 11, close: 22, rating: 4.4, reviewCount: 174, wifiMbps: 58, avgStayMinutes: 105,
    metrics: { noiseScore: 71, wifiScore: 66, outletScore: 60, seatScore: 72, crowdScore: 48, stayScore: 70 },
    pattern: "steadyBusy", intensity: 0.85, offset: 0,
    tags: ["감성 인테리어", "따뜻한 분위기"],
    description: "익선동 골목의 아늑한 은신처. 관광객이 빠지는 저녁 시간대에 조용히 작업하기 좋아집니다.",
    amenities: { restroom: true, parking: false, laptopFriendly: true, bigTable: false },
    gradient: ["#C4902F", "#8A6F52"],
  },
  // ---------- 합정 ----------
  {
    id: "riverside-roast", name: "리버사이드 로스트", area: "hapjeong",
    address: "서울 마포구 토정로 135", stationDistanceM: 480, dLat: -0.0024, dLng: -0.0016,
    open: 8, close: 22, rating: 4.3, reviewCount: 158, wifiMbps: 72, avgStayMinutes: 120,
    metrics: { noiseScore: 76, wifiScore: 78, outletScore: 70, seatScore: 80, crowdScore: 62, stayScore: 78 },
    pattern: "residentialCalm", intensity: 1.1, offset: 0,
    tags: ["한강 근처", "조용함"],
    description: "한강 산책로 초입의 로스터리. 널찍한 우드 테이블과 잔잔한 재즈가 흐르는 작업 친화 공간입니다.",
    amenities: { restroom: true, parking: true, laptopFriendly: true, bigTable: true },
    gradient: ["#3E7C74", "#463525"],
  },
  {
    id: "hapjeong-craft", name: "합정 크래프트", area: "hapjeong",
    address: "서울 마포구 양화로 45", stationDistanceM: 150, dLat: 0.0017, dLng: 0.0024,
    open: 9, close: 23, rating: 4.1, reviewCount: 226, wifiMbps: 86, avgStayMinutes: 100,
    metrics: { noiseScore: 64, wifiScore: 85, outletScore: 76, seatScore: 70, crowdScore: 48, stayScore: 68 },
    pattern: "steadyBusy", intensity: 0.95, offset: 2,
    tags: ["역세권", "Wi-Fi 빠름"],
    description: "합정역 바로 앞 대형 카페. 회전이 빨라 자리 잡기 쉽고, 2층 창가 라인이 작업 명당으로 통합니다.",
    amenities: { restroom: true, parking: false, laptopFriendly: true, bigTable: true },
    gradient: ["#5A4530", "#33665F"],
  },
  {
    id: "mangwon-workshop", name: "망원 워크샵", area: "hapjeong",
    address: "서울 마포구 망원로 57", stationDistanceM: 700, dLat: 0.0041, dLng: -0.0029,
    open: 10, close: 22, rating: 4.6, reviewCount: 143, wifiMbps: 90, avgStayMinutes: 160,
    metrics: { noiseScore: 87, wifiScore: 88, outletScore: 86, seatScore: 86, crowdScore: 70, stayScore: 90 },
    pattern: "residentialCalm", intensity: 0.95, offset: -2,
    tags: ["조용함", "콘센트 많음", "오래 있기 좋음"],
    description: "망원동 주택가의 조용한 2층 작업실 카페. 단골 대부분이 노트북 작업자라 서로의 몰입을 지켜줍니다.",
    amenities: { restroom: true, parking: false, laptopFriendly: true, bigTable: true },
    gradient: ["#5F7F47", "#38291C"],
  },
];

function buildCafe(seed: CafeSeed): Cafe {
  const area = AREA_MAP[seed.area];
  return {
    id: seed.id,
    name: seed.name,
    area: seed.area,
    address: seed.address,
    station: area.station,
    stationDistanceM: seed.stationDistanceM,
    lat: area.lat + seed.dLat,
    lng: area.lng + seed.dLng,
    open: seed.open,
    close: seed.close,
    rating: seed.rating,
    reviewCount: seed.reviewCount,
    wifiMbps: seed.wifiMbps,
    avgStayMinutes: seed.avgStayMinutes,
    metrics: seed.metrics,
    hourly: buildHourly(seed.id, seed.pattern, seed.intensity, seed.offset),
    tags: seed.tags,
    description: seed.description,
    amenities: seed.amenities,
    gradient: seed.gradient,
    reviews: pickReviews(seed.id, seed.metrics),
  };
}

export const CAFES: Cafe[] = SEEDS.map(buildCafe);

export const CAFE_MAP: Record<string, Cafe> = Object.fromEntries(
  CAFES.map((c) => [c.id, c])
);

export function getCafe(id: string): Cafe | undefined {
  return CAFE_MAP[id];
}
