# CafeFocus — 카페 작업환경 지도

[![CI](https://github.com/sanghohoho0813-lab/sample7-Cafefocus-map-mvp/actions/workflows/ci.yml/badge.svg?branch=claude/cafefocus-map-mvp-nqs0vx)](https://github.com/sanghohoho0813-lab/sample7-Cafefocus-map-mvp/actions/workflows/ci.yml)

**"지금 이 시간에, 내가 작업하기 가장 좋은 카페는 어디인가?"**

지도에서 작업 목적·시간에 맞는 카페를 찾고, **작업 계획을 세우고, 다녀온 뒤 체크인으로 기록**하는
반응형 웹앱입니다. 미래AI랩 샘플 MVP로, 외부 API 키 없이 결정적(deterministic) 데모 데이터로 동작합니다.

Next.js 15 (App Router) · React 19 · TypeScript strict · Tailwind CSS · Vitest · Playwright · axe-core

## 빠르게 시작

```bash
npm install
npm run dev          # http://localhost:3000
```

| 명령 | 내용 |
| --- | --- |
| `npm run build` / `start` | 프로덕션 빌드 · 실행 (79개 경로 정적 생성, Vercel 배포 가능) |
| `npm run lint` | ESLint (next/core-web-vitals + next/typescript) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | 단위 테스트 (Vitest) |
| `npm run test:e2e` | E2E · 접근성 테스트 (Playwright, 프로덕션 빌드 필요) |
| `npm run check` | lint + typecheck + 단위 테스트 한 번에 |

환경 변수는 하나뿐입니다. `NEXT_PUBLIC_SITE_URL` — OG 이미지·사이트맵의 절대 주소 (Vercel에서는 자동).

## 핵심 흐름

1. **지도** `/` — 지역·작업 목적·시간을 고르면 적합도순 정렬. 마커는 점수 알약(85+ 초록), 확대하면 간격만 벌어지고 끌어서 이동. 마커 ↔ 목록 카드 선택·강조·스크롤 동기화
2. **상세** `/cafe/[id]` — 결론(적합도·한 줄 판단) → 이유 → 주의점 → "N시에 여기서 작업하기". 목적은 결론 블록에서, 시간은 그래프 막대로 바로 바꿔 다시 판단
3. **계획** `/cafe/[id]/plan` — 날짜·도착 시간(시간별 예상 혼잡)·체류·목적·메모. 지난 시간·영업 외·다른 계획과 겹침은 고르기 전부터 막힘
4. **계획 확인** `/plans/[id]` — 지도 마커·상세 배너·사이드바 "다음 작업"에 즉시 반영
5. **체크인** `/cafe/[id]/review?plan=` — 별점 + 소음·콘센트·Wi-Fi → 계획이 '완료'로 바뀌고 후기·통계에 반영
6. **내 작업** `/my` — 예정·지난 기록, 최근 7일 작업 시간, 선호 조건, 데모 초기화

보조 화면: `/recommend`(3단계 맞춤 추천), `/favorites`(저장 → 비교 담기), `/compare`(2~3곳 비교 + 결론).

## 설계에서 신경 쓴 것

**주소가 곧 상태** — 지도의 지역·목적·시간·필터·선택한 카페는 쿼리스트링에 담깁니다
(`/?area=seongsu&p=study&t=15&f=outlet,quiet&cafe=workroom-17`). 새로고침·공유·뒤로가기에도 같은 화면이 나오고,
손으로 고친 잘못된 값은 조용히 버립니다. `history.replaceState`를 써서 조건을 바꿀 때마다 기록이 쌓이지 않습니다.
→ `lib/exploreQuery.ts`

**하이드레이션 안전** — 서버 HTML에는 현재 시각을 쓰지 않습니다. `useNow()`는 마운트 전 `null`을 돌려주고,
그동안은 고정 기준 시각(15시)과 자리표시를 그려 서버·클라이언트 마크업이 항상 일치합니다. → `lib/useNow.ts`, `lib/time.ts`

**깨지지 않는 저장소** — localStorage 값은 읽을 때 항목 단위로 검증합니다. 사용자가 값을 고치거나 이전 버전 데이터가 남아 있어도
손상된 항목만 버리고 나머지 기록은 유지하며, 점수 계산을 망가뜨릴 수 있는 잘못된 목적 값은 기본값으로 되돌립니다.
시크릿 모드처럼 저장소를 쓸 수 없으면 메모리 상태로 동작합니다. → `lib/storage.ts`

**규칙은 한 곳에서** — 계획 검증(영업 시간·지난 시간·마감 초과·겹침)은 `validatePlan` 하나를 폼의 실시간 안내와
저장 직전 가드가 같이 씁니다. 빠른 더블클릭에도 계획이 두 번 생기지 않도록 동기 ref로 막습니다. → `lib/plans.ts`, `lib/store.tsx`

**설명 가능한 점수** — 적합도는 AI 예측이 아닌 규칙 기반 가중합입니다. 목적별 가중치(합 1.0)에 시간대 예측(소음 50:50, 혼잡 40:60)을 섞고,
화면에 "규칙 기반 · 데모 예측값"을 밝힙니다. 데이터가 없는 새벽·심야에는 가장 가까운 시간으로 보정하고 "밤 9시 기준"처럼 표기합니다.
지도 왼쪽 위 범례를 누르면 현재 목적의 가중치가 보입니다. → `lib/fit.ts`

**접근성** — 모든 화면과 열린 시트를 axe(WCAG 2.1 AA)로 검사해 위반 0건을 CI에서 유지합니다. 보조 글자색도 모든 배경에서 4.5:1 이상,
본문 건너뛰기 링크, 시트의 포커스 가두기·복귀, 키보드 단축키(`/` 검색, `Esc` 선택 해제), 핀치 줌 허용,
`prefers-reduced-motion` 존중.

**데모 데이터의 정직함** — 카페 22곳과 시간대 데이터는 고정 시드입니다. 첫 방문 시 샘플 계정(이틀 전 완료한 작업 1건·후기 1건)이
**오늘 기준 상대 날짜**로 채워지고, `내 작업 → 데모 데이터 초기화`로 언제든 되돌릴 수 있습니다.

## 테스트

```
tests/
  unit/   Vitest — 시간·계획 검증·적합도 엔진·필터·추천·URL 상태·저장소 검증 (51개)
  e2e/    Playwright — 골든 패스, 시간 겹침, URL 상태, axe 접근성 (모바일·데스크톱 2개 프로젝트)
```

E2E는 시계를 화요일 14:10(서울)으로 고정하고 외부 요청을 막아 결과가 항상 같습니다.
CI(GitHub Actions)는 lint → typecheck → 단위 테스트 → 빌드 → E2E 순서로 돌고, 실패하면 Playwright 리포트와 trace를 남깁니다.

브라우저가 미리 설치된 환경에서는 `PW_CHROMIUM_PATH=/path/to/chromium npm run test:e2e`로 실행 파일을 지정할 수 있습니다.

## 구조

```
app/                    라우트 (App Router)
  page.tsx              지도 탐색
  cafe/[id]/            상세 · plan · review (정적 생성)
  plans/[id]/           계획 확인 (클라이언트 저장소에서 읽음)
  error.tsx, global-error.tsx, not-found.tsx
  sitemap.ts, robots.ts, manifest.ts, opengraph-image.tsx
components/             화면 조각 — MapView/MapCanvas, CafeDetail, PlanForm, ReviewForm, Sheet …
lib/
  data/                 데모 카페 22곳 · 샘플 계정 시드
  fit.ts                적합도·판단 문구·이유
  plans.ts              계획 검증·집계
  exploreQuery.ts       지도 상태 ↔ URL
  storage.ts            localStorage 읽기·쓰기·검증
  store.tsx             앱 상태 (React Context)
  time.ts, useNow.ts    날짜·시간 (하이드레이션 안전)
supabase/schema.sql     실데이터 전환용 스키마 (cafes, hourly_metrics, work_plans, reviews …)
tests/                  unit · e2e
```

화면 컴포넌트는 `lib/`의 순수 함수만 부르고, 상태 변경은 `store.tsx`의 액션을 거칩니다.
실데이터로 옮길 때는 `lib/data`를 API로, `store.tsx`의 저장 계층을 Supabase 호출로 바꾸면 됩니다.

## 디자인 원칙

- 색: coffee(주색) + forest(좋음 강조 하나) + cream(중립) + amber(주의). 메뉴별 색 없음
- 글자: 역할별 스케일(`caption 13 / meta 14 / body 16 / title 18 / section 21 / page 26 / score 30`)
- 한 화면에 주 행동 하나. 결론 → 이유 → 다음 행동 순서
- 제작사 표시는 상단 한 줄 바와 파비콘. 외부 상담 CTA는 핵심 흐름을 마친 뒤에만

## 카페 사진

`/public/images/cafes/`에 22곳의 사진이 있습니다 — `{id}.webp`(1440×810, 상세) · `{id}-card.webp`(720×540, 카드).
`next/image`로 서빙하며 로딩 중에는 원본에서 만든 blur placeholder가 보입니다. 사진을 바꿀 때는 파일명을 카페 id와 맞춘 뒤
아래를 실행하고, 출력된 blur 맵을 `lib/data/cafes.ts`의 `BLUR`에 반영하세요.

```bash
node scripts/optimize-images.js <원본디렉터리>
```
