# CafeFocus — 카페 작업환경 지도 MVP

**"지금 이 시간에, 내가 작업하기 가장 좋은 카페는 어디인가?"**

지도에서 작업 목적·시간에 맞는 카페를 찾고, **작업 계획을 세우고, 다녀온 뒤 체크인으로 기록**하는
반응형 웹앱 MVP입니다. 미래AI랩 샘플 MVP이며 외부 API 키 없이 데모 데이터로 동작합니다.

## 실행

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # 프로덕션 빌드 (Vercel 배포 가능)
npm run lint       # ESLint (next/core-web-vitals + next/typescript)
npm run typecheck  # tsc --noEmit
```

## 핵심 흐름 (Golden Path)

1. **지도** `/` — 지역·작업 목적·시간을 고르면 적합도순으로 정렬. 마커 ↔ 목록 카드가 서로 선택·강조·스크롤 동기화
2. **상세** `/cafe/[id]` — 결론(적합도·한 줄 판단) → 이유 3가지 → 주의점 → "N시에 여기서 작업하기"
3. **계획** `/cafe/[id]/plan` — 날짜·도착 시간(시간별 예상 혼잡)·체류·목적·메모. 지난 시간·영업 외·다른 계획과 겹침은 저장 불가
4. **계획 확인** `/plans/[id]` — 저장된 계획. 지도 마커·상세 배너·사이드바 "다음 작업"에 바로 반영
5. **체크인** `/cafe/[id]/review?plan=` — 별점 + 조용했나요/콘센트/Wi-Fi(필수) → 계획이 '완료'로 바뀌고 후기 목록·통계에 반영
6. **내 작업** `/my` — 예정/지난 기록, 최근 7일 작업 시간, 내 후기, 선호 조건, 데모 초기화

모든 상태는 `localStorage`에 저장되어 새로고침·뒤로가기·딥링크 후에도 유지됩니다.
처음 방문하면 샘플 계정 상태(이틀 전 완료한 작업 1건 + 후기 1건)가 **오늘 기준 상대 날짜**로 채워지고,
`내 작업 → 데모 설정 → 처음 상태로 되돌리기`로 언제든 복원할 수 있습니다.

## 화면

| 경로 | 설명 |
| --- | --- |
| `/` | 지도 탐색 — 검색, 지역/목적/시간, 필수 조건 3개 + 필터 시트, 모바일 바텀시트 |
| `/cafe/[id]` | 상세 — 결론 블록, 시간대별 붐빔, 작업 환경, 매장 정보, 후기, 다른 카페 |
| `/cafe/[id]/plan` | 작업 계획 만들기 |
| `/cafe/[id]/review` | 체크인·후기 작성 |
| `/plans/[id]` | 계획 확인·취소 |
| `/recommend` | 목적 → 중요한 조건 → 체류 시간 3단계 추천 (선택은 선호 조건으로 저장, 지도에 적용) |
| `/favorites` | 저장한 카페 → 비교 담기 |
| `/compare` | 2~3곳 비교 — 결론("이 조건에서 가장 잘 맞아요") + 근거 표 |
| `/my` | 내 작업 |

`/cafes`는 지도(`/`)로 통합되어 리다이렉트됩니다.

## 적합도 계산 (규칙 기반)

`lib/fit.ts` — 결정적(Deterministic) 규칙 기반 점수이며 AI 예측이 아닙니다.

- 작업 목적별 가중치(`PURPOSE_WEIGHTS`): 집중 작업·공부·미팅·가벼운 작업·독서
- 시간 반영: 소음은 기본 지표와 해당 시간 예측치를 50:50, 혼잡은 40:60으로 섞음
- 영업 중인 곳 우선 → 점수 → 역 거리 순 정렬
- 지도 목록의 "기준 보기"에서 현재 목적의 가중치를 확인할 수 있습니다

시간 데이터는 09~21시만 있으므로, 그 밖의 시간에는 가장 가까운 시간 기준으로 계산하고
"오전 9시 기준" / "밤 9시 기준"처럼 명시합니다.

## 구조

```
app/                 페이지 (App Router)
components/
  AppShell, TopBrandBar     전역 레이아웃 (데스크톱 사이드바 / 모바일 4탭)
  MapView, MapCanvas        데모 지도 + 마커
  ExploreControls, SearchBox, Sheet, MobileBottomSheet
  CafeCard, CafeMiniCard, CafeDetail, HourlyChart, ScorePill
  PlanForm, PlanView, ReviewForm
  SampleBridgeCTA           미래AI랩 연결 CTA (완료 화면·내 작업에만)
lib/
  data/cafes.ts   데모 카페 22곳 + 시간대 패턴
  data/seed.ts    샘플 계정 상태 (상대 날짜)
  fit.ts          적합도·판단 문구·이유
  plans.ts        계획 검증(지난 시간·영업시간·겹침)
  reviews.ts      체크인 선택지·후기 요약
  filters.ts      필수/추가 조건
  recommendation.ts  3단계 추천
  time.ts, useNow.ts 날짜·시간 유틸 (하이드레이션 안전)
  store.tsx       즐겨찾기·최근 본·비교함·계획·후기·선호 (localStorage)
  brand.ts        미래AI랩 링크·문구
supabase/schema.sql  실데이터 전환용 스키마 (work_plans 포함)
```

## 디자인 원칙

- 색: coffee(주색) + forest(좋음 강조 하나) + cream(중립) + amber(주의). 메뉴별 색 없음
- 글자: 역할별 스케일(`caption 13 / meta 14 / body 16 / title 18 / section 21 / page 26 / score 30`)
- 한 화면에 주 행동 하나. 결론 → 이유 → 다음 행동 순서
- 제작사 표시는 상단 한 줄 바와 파비콘, 외부 상담 CTA는 핵심 흐름을 마친 뒤에만 노출

## 카페 사진

카페 22곳의 실사진이 `/public/images/cafes/`에 있습니다.

| 파일 | 크기 | 용도 |
| --- | --- | --- |
| `{id}.webp` | 1440×810 (16:9) | 상세 Hero |
| `{id}-card.webp` | 720×540 (4:3) | 카드·썸네일 |

`next/image`로 서빙하며 로딩 중에는 blur placeholder(`lib/data/cafes.ts`의 `BLUR`)가 보입니다.
사진 교체 시 파일명을 카페 id와 맞춘 뒤 실행하고, 출력된 blur 맵을 `BLUR`에 반영하세요.

```bash
node scripts/optimize-images.js <원본디렉터리>
```
