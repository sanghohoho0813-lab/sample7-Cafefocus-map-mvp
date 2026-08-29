# CafeFocus — 카페 작업환경 지도 MVP

**"지금 이 시간에, 내가 노트북 작업하기 가장 좋은 카페는 어디인가?"**

소음·혼잡도·콘센트·Wi-Fi·좌석 데이터를 기반으로, 시간대별 작업환경이 좋은 카페를
지도에서 탐색·비교·저장할 수 있는 반응형 웹앱 MVP입니다.

## 실행

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # 프로덕션 빌드 (Vercel 배포 가능)
```

외부 API 키 없이 동작하는 **Demo Mode**입니다. 지도는 자체 제작 데모 맵 레이어,
카페 22곳과 시간대별(09~21시) 소음/혼잡 데이터는 `lib/data/cafes.ts`의
결정적(Deterministic) 시드 데이터입니다.

## 주요 화면

| 경로 | 설명 |
| --- | --- |
| `/` | 지도 탐색 — 마커, 미니 카드, 검색, 지역/시간대/퀵필터, 모바일 Bottom Sheet |
| `/cafes` | 카페 리스트 (지역 탭 + 필터 + 이미지 카드 그리드) |
| `/cafe/[id]` | 상세 — 작업점수 링, 환경 지표, 시간대별 소음/혼잡 차트, 작업환경 리뷰 |
| `/compare` | 카페 2~3곳 나란히 비교 (항목별 최고값 하이라이트) |
| `/recommend` | 목적/우선순위/체류시간 3단계 → Rule 기반 가중치 추천 Top 3 |
| `/favorites` | 저장한 카페 |
| `/my` | 마이페이지 — 저장·최근 본 카페·후기·선호 작업환경 |

## 구조

```
app/            페이지 (App Router)
components/     MapView, CafeCard, CafeMiniCard, WorkScoreRing, HourlyChart,
                MobileBottomSheet, FilterChips, SearchBox, ...
lib/
  data/cafes.ts 데모 카페 22곳 + 시간대 패턴 (officeLunch/campusEvening/... 6종)
  scoring.ts    작업점수·상태 라벨·거리 계산
  filters.ts    퀵필터 정의/적용
  recommendation.ts  목적별 가중치 추천 엔진
  store.tsx     즐겨찾기·최근 본·비교함 (localStorage)
supabase/schema.sql  실데이터 전환용 스키마 (users/cafes/cafe_metrics/hourly_metrics/reviews/favorites/recent_views)
```

## 기술 스택

Next.js 15 · TypeScript · Tailwind CSS · Lucide Icons · (지도/데이터: Demo Layer, 추후 Mapbox·Supabase 전환 구조)

## 카페 사진

카페 22곳의 실사진이 `/public/images/cafes/` 에 포함되어 있습니다.

| 파일 | 크기 | 용도 |
| --- | --- | --- |
| `{id}.webp` | 1440×810 (16:9) | 상세 Hero |
| `{id}-card.webp` | 720×540 (4:3) | 리스트 카드·썸네일 |

`next/image`로 서빙하며, 로딩 중에는 원본에서 생성한 blur placeholder
(`lib/data/cafes.ts`의 `BLUR` 맵)가 표시됩니다. 전체 22곳 44장 합계 약 3.5MB입니다.

사진을 교체할 때는 원본 파일명을 카페 id와 맞춘 뒤 아래를 실행하고,
출력된 blur 맵을 `lib/data/cafes.ts`의 `BLUR`에 반영하세요.

```bash
node scripts/optimize-images.js <원본디렉터리>
```
