"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Star,
  MapPin,
  Clock3,
  Volume2,
  Wifi,
  Plug,
  Armchair,
  Timer,
  Laptop,
  Car,
  Bath,
  Table2,
  CalendarCheck2,
  PenLine,
} from "lucide-react";
import type { Cafe, Plan } from "@/lib/types";
import { AREA_MAP, CAFES } from "@/lib/data/cafes";
import {
  distanceKm,
  formatDistance,
  formatHours,
  formatStay,
  metricLabel,
  noiseLabel,
  outletLabel,
} from "@/lib/scoring";
import { bestHour, explainFit, rankByFit } from "@/lib/fit";
import { dateKey, hm, relativeDate } from "@/lib/time";
import { checkinSummary, reviewsForCafe } from "@/lib/reviews";
import { buildExploreQuery } from "@/lib/exploreQuery";
import { useApp } from "@/lib/store";
import { useFitContext } from "@/lib/useFitContext";
import CafePhoto from "@/components/CafePhoto";
import HourlyChart from "@/components/HourlyChart";
import FavoriteButton from "@/components/FavoriteButton";
import CompareToggle from "@/components/CompareToggle";
import ShareButton from "@/components/ShareButton";
import CafeCard from "@/components/CafeCard";
import DecisionPanel from "@/components/detail/DecisionPanel";
import TimeCompare, { type TimeSlot } from "@/components/detail/TimeCompare";
import CheckinSummary from "@/components/detail/CheckinSummary";

/** 상세 섹션 바로가기 — 모바일은 결론부터, 데스크톱은 결론이 오른쪽에 늘 보이므로 제외 */
type TabKey = "decision" | "time" | "checkin" | "info";
const TABS: { key: TabKey; label: string }[] = [
  { key: "decision", label: "결론" },
  { key: "time", label: "시간대" },
  { key: "checkin", label: "체크인" },
  { key: "info", label: "정보" },
];
/** 스크롤 위치를 잴 때 위에 겹쳐 있는 고정 머리글 높이(px) */
const HEADER_OFFSET = { mobile: 108, desktop: 60 };

function SectionTabs({
  tabs,
  active,
  onPick,
  className = "",
}: {
  tabs: typeof TABS;
  active: TabKey;
  onPick: (k: TabKey) => void;
  className?: string;
}) {
  return (
    <nav aria-label="상세 섹션 바로가기" className={className}>
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => onPick(t.key)}
          aria-current={active === t.key ? "true" : undefined}
          className={`relative flex h-full items-center justify-center px-1 text-label transition-colors ${
            active === t.key ? "text-coffee-900" : "text-coffee-400 hover:text-coffee-700"
          }`}
        >
          {t.label}
          <span
            className={`absolute inset-x-2 bottom-0 h-[2px] rounded-full bg-coffee-900 transition-opacity ${active === t.key ? "opacity-100" : "opacity-0"}`}
            aria-hidden
          />
        </button>
      ))}
    </nav>
  );
}

/** 모바일은 섹션 사이를 두꺼운 띠로 나눠(국내 상용 앱의 리듬) 한 화면에 한 주제씩, 데스크톱은 얇은 선 */
function Section({
  id,
  title,
  action,
  children,
}: {
  id?: TabKey;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      data-section={id}
      className="border-t-[10px] border-cream-100 px-4 py-7 sm:px-6 lg:border-t lg:border-cream-300/70 lg:px-0"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-section text-coffee-900">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

/**
 * 카페 상세 — 결론 중심.
 * 결론(갈 만한가) → 이유 → 주의 → 시간대 비교 → 작업자 체크인 → 상세 정보 → 계획.
 * 사진 다음에 긴 설명부터 나오지 않도록, 매장 소개는 "상세 정보"로 내렸다.
 */
export default function CafeDetail({ cafe }: { cafe: Cafe }) {
  const router = useRouter();
  const { addRecent, plans, reviews, hydrated, setPurpose } = useApp();
  const { purpose, hour: contextHour, now, isLive, timeWord: contextWord, stayMin, stayFromHistory, timeSel } = useFitContext();
  const [pickedHour, setPickedHour] = useState<number | null>(null);
  const [metric, setMetric] = useState<"crowd" | "noise">("crowd");

  // ---- 스크롤: 사진이 지나가면 작은 머리글(이름·저장·섹션 바로가기)을 띄운다 ----
  const scrollRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const [compact, setCompact] = useState(false);
  const [tab, setTab] = useState<TabKey>("decision");
  const frame = useRef(0);
  const measure = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const desktop = window.innerWidth >= 1024;
    const hero = heroRef.current;
    setCompact(!desktop && !!hero && el.scrollTop > hero.offsetHeight - 72);
    const offset = desktop ? HEADER_OFFSET.desktop : HEADER_OFFSET.mobile;
    const top = el.getBoundingClientRect().top;
    let cur: TabKey = desktop ? "time" : "decision";
    for (const sec of el.querySelectorAll<HTMLElement>("[data-section]")) {
      if (!sec.offsetParent) continue; // 이 화면 크기에서 숨겨진 블록
      if (sec.getBoundingClientRect().top - top <= offset + 2) cur = sec.dataset.section as TabKey;
    }
    // 맨 아래까지 내렸으면 마지막 섹션
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 4) cur = "info";
    setTab(cur);
  }, []);
  const onScroll = () => {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(measure);
  };
  useEffect(() => () => cancelAnimationFrame(frame.current), []);
  const goTo = (key: TabKey) => {
    const el = scrollRef.current;
    if (!el) return;
    const sec = [...el.querySelectorAll<HTMLElement>(`[data-section="${key}"]`)].find((x) => x.offsetParent);
    if (!sec) return;
    const desktop = window.innerWidth >= 1024;
    const offset = desktop ? HEADER_OFFSET.desktop : HEADER_OFFSET.mobile;
    const target = sec.getBoundingClientRect().top - el.getBoundingClientRect().top + el.scrollTop - offset + 1;
    el.scrollTo({ top: Math.max(target, 0), behavior: "smooth" });
  };

  useEffect(() => {
    addRecent(cafe.id);
  }, [cafe.id, addRecent]);

  const hour = pickedHour ?? contextHour;
  const timeWord = hour === contextHour ? contextWord : `${hour}시`;
  const ex = explainFit(cafe, purpose, hour, { stayMin, timeWord });
  const area = AREA_MAP[cafe.area];
  const ready = now !== null && hydrated;

  // ---- 시간대 비교: 지금 · 내가 고른 시간 · 가장 추천 (같은 시간이면 한 칸으로) ----
  const best = bestHour(cafe, purpose, isLive ? contextHour : undefined, stayMin);
  const slots: TimeSlot[] = useMemo(() => {
    const list: TimeSlot[] = [];
    const add = (h: number | null | undefined, role: TimeSlot["roles"][number]) => {
      if (h === null || h === undefined) return;
      const found = list.find((s) => s.hour === h);
      if (found) found.roles.push(role);
      else list.push({ hour: h, roles: [role] });
    };
    if (isLive) add(contextHour, "now");
    // 지도에서 고른 도착 시간 또는 그래프에서 고른 시간
    add(pickedHour ?? (timeSel !== "now" ? contextHour : null), "picked");
    // 새벽·심야에 "지금"으로 들어오면 가장 가까운 데이터 시간을 기준으로 비교한다
    if (!isLive && timeSel === "now" && pickedHour === null) add(contextHour, "base");
    add(best?.hour, "best");
    return list.sort((a, b) => a.hour - b.hour);
  }, [isLive, contextHour, pickedHour, timeSel, best?.hour]);

  /** 이 카페에 예정된 가장 가까운 작업 */
  const myPlan: Plan | null = useMemo(() => {
    if (!hydrated) return null;
    const today = now ? dateKey(now) : "";
    return (
      plans
        .filter((p) => p.cafeId === cafe.id && p.status === "planned" && (!today || p.date >= today))
        .sort((a, b) => (a.date === b.date ? a.startHour - b.startHour : a.date < b.date ? -1 : 1))[0] ?? null
    );
  }, [plans, cafe.id, now, hydrated]);

  const myReviews = useMemo(() => (hydrated ? reviews : []), [hydrated, reviews]);
  const allReviews = useMemo(() => reviewsForCafe(cafe, myReviews), [cafe, myReviews]);
  const summary = useMemo(() => checkinSummary(cafe, myReviews), [cafe, myReviews]);
  const myReviewCount = allReviews.filter((r) => r.mine).length;

  const similar = useMemo(
    () => rankByFit(CAFES.filter((c) => c.area === cafe.area && c.id !== cafe.id), purpose, hour, stayMin).slice(0, 3),
    [cafe, purpose, hour, stayMin]
  );

  // 주 행동: 예정된 작업이 있으면 그 일정, 영업 중이면 지금 고른 시간, 영업 외면 가장 추천하는 시간으로
  const planHourParam = ex.open ? hour : best?.hour;
  const planHref = myPlan
    ? `/plans/${myPlan.id}`
    : `/cafe/${cafe.id}/plan${planHourParam !== undefined ? `?hour=${planHourParam}` : ""}`;
  const ctaLabel = myPlan
    ? "예정된 작업 보기"
    : ex.open
      ? `${hour}시에 여기서 작업하기`
      : best
        ? `${best.hour}시로 작업 계획하기`
        : "작업 계획 세우기";

  const env = [
    { icon: Volume2, label: "소음", value: noiseLabel(cafe.metrics.noiseScore) },
    { icon: Plug, label: "콘센트", value: outletLabel(cafe.metrics.outletScore) },
    { icon: Wifi, label: "Wi-Fi", value: `${cafe.wifiMbps}Mbps` },
    { icon: Armchair, label: "좌석", value: metricLabel(cafe.metrics.seatScore) },
    { icon: Table2, label: "테이블", value: cafe.amenities.bigTable ? "넓은 편" : "보통 크기" },
    { icon: Timer, label: "평균 체류", value: formatStay(cafe.avgStayMinutes) },
    { icon: Laptop, label: "노트북 분위기", value: cafe.amenities.laptopFriendly ? "눈치 안 보임" : "짧은 작업 위주" },
    { icon: Bath, label: "화장실", value: cafe.amenities.restroom ? "매장 안" : "건물 공용" },
    { icon: Car, label: "주차", value: cafe.amenities.parking ? "가능" : "불가" },
  ];

  const decisionPanel = (
    <DecisionPanel
      cafe={cafe}
      ex={ex}
      hour={hour}
      timeWord={timeWord}
      purpose={purpose}
      onPurpose={setPurpose}
      picked={pickedHour !== null && pickedHour !== contextHour}
      onResetHour={() => setPickedHour(null)}
      stayMin={stayMin}
      stayFromHistory={stayFromHistory}
      ready={ready}
    />
  );

  const planBanner = myPlan && (
    <div className="flex items-center gap-3 rounded-xl bg-coffee-800 px-4 py-3 text-cream-50">
      <CalendarCheck2 size={18} className="shrink-0" />
      <span className="min-w-0 flex-1 text-meta">
        <b className="num font-semibold">
          {relativeDate(myPlan.date, now)} {hm(myPlan.startHour)}
        </b>{" "}
        작업 예정이에요
      </span>
      <Link
        href={`/cafe/${cafe.id}/plan`}
        className="flex shrink-0 items-center gap-1 text-label text-cream-100 underline-offset-4 hover:underline"
      >
        다른 시간 추가
      </Link>
    </div>
  );

  const metaLine = (
    <>
      <span className="flex items-center gap-1">
        <Star size={14} className="fill-amber2-400 text-amber2-400" aria-hidden />
        <b className="num font-semibold">{cafe.rating.toFixed(1)}</b>
        <span className="num opacity-80">({(cafe.reviewCount + myReviewCount).toLocaleString()})</span>
      </span>
      <span aria-hidden>·</span>
      <span className="num">{formatHours(cafe)}</span>
      <span aria-hidden>·</span>
      <span className="num">{formatDistance(distanceKm(cafe.lat, cafe.lng))}</span>
    </>
  );

  return (
    <div ref={scrollRef} onScroll={onScroll} className="h-full overflow-y-auto bg-white lg:bg-cream-50">
      {/* ---------- 모바일: 사진이 지나가면 나타나는 머리글 ---------- */}
      <div
        className={`sticky top-0 z-40 -mb-[100px] transition-[opacity,visibility] duration-200 lg:hidden ${
          compact ? "visible opacity-100" : "invisible opacity-0"
        }`}
      >
        <div className="flex h-14 items-center gap-1 bg-white pl-1.5 pr-2.5">
          <button
            type="button"
            onClick={() => (window.history.length > 1 ? router.back() : router.push("/"))}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-coffee-800 hover:bg-cream-100"
            aria-label="뒤로 가기"
          >
            <ArrowLeft size={20} />
          </button>
          <p className="min-w-0 flex-1 truncate text-title text-coffee-900">{cafe.name}</p>
          <ShareButton title={cafe.name} path={`/cafe/${cafe.id}`} />
          <CompareToggle cafeId={cafe.id} compact className="!border-transparent" />
          <FavoriteButton cafeId={cafe.id} className="!border-transparent" />
        </div>
        <SectionTabs
          tabs={TABS}
          active={tab}
          onPick={goTo}
          className="grid h-11 grid-cols-4 border-b border-cream-300/70 bg-white px-2 shadow-[0_6px_12px_-10px_rgba(44,32,21,0.25)]"
        />
      </div>

      <div className="mx-auto max-w-6xl pb-32 lg:px-8 lg:pb-16 lg:pt-6">
        {/* ---------- 사진: 공간이 먼저 보이게 크게 ---------- */}
        <div ref={heroRef} className="relative">
          <CafePhoto
            cafe={cafe}
            variant="wide"
            priority
            overlay={false}
            className="aspect-[4/3] w-full sm:aspect-[16/9] lg:aspect-[3/1] lg:rounded-[28px]"
            sizes="(max-width: 1024px) 100vw, 1100px"
          />
          {/* 위: 버튼 가독성 · 아래: 데스크톱 제목 가독성 */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/30 to-transparent lg:rounded-t-[28px]" aria-hidden />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-2/3 rounded-b-[28px] bg-gradient-to-t from-black/70 via-black/25 to-transparent lg:block" aria-hidden />
          <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4 lg:p-5">
            <button
              type="button"
              onClick={() => (window.history.length > 1 ? router.back() : router.push("/"))}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-coffee-800 shadow-card transition-colors hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              aria-label="뒤로 가기"
            >
              <ArrowLeft size={19} />
            </button>
            <div className="flex items-center gap-2 lg:hidden">
              <ShareButton title={cafe.name} path={`/cafe/${cafe.id}`} onImage />
              <CompareToggle cafeId={cafe.id} onImage />
              <FavoriteButton cafeId={cafe.id} onImage />
            </div>
          </div>
          {/* 데스크톱: 이름을 사진 위에 — 잡지처럼 공간과 이름을 한 번에 */}
          <div className="absolute inset-x-0 bottom-0 hidden px-9 pb-8 text-white lg:block">
            <p className="text-meta font-semibold text-white/85">
              {area.name} · <span className="num">{cafe.station} {cafe.stationDistanceM}m</span>
            </p>
            <h1 className="mt-1 text-[38px] font-extrabold leading-tight tracking-[-0.03em]">{cafe.name}</h1>
            <p className="mt-2 flex flex-wrap items-center gap-x-2 text-meta text-white/90 [&_.fill-amber2-400]:fill-amber2-400">
              {metaLine}
            </p>
          </div>
        </div>

        {/* 모바일: 사진 위로 살짝 겹쳐 올라오는 본문 */}
        <div className="relative -mt-6 rounded-t-[28px] bg-white pt-6 lg:mt-0 lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-10 lg:rounded-none lg:bg-transparent lg:pt-0">
          {/* ---------- 본문 ---------- */}
          <div className="min-w-0 lg:pt-2 lg:[&>section:first-of-type]:border-t-0">
            <header className="px-4 pb-5 sm:px-6 lg:hidden">
              <p className="text-meta font-semibold text-coffee-500">
                {area.name} · <span className="num">{cafe.station} {cafe.stationDistanceM}m</span>
              </p>
              <h1 className="mt-1 text-display text-coffee-900">{cafe.name}</h1>
              <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-meta text-coffee-600">{metaLine}</p>
            </header>

            {/* 모바일: 결론을 이름 바로 아래에 */}
            <div data-section="decision" className="px-4 pb-7 sm:px-6 lg:hidden">
              {planBanner && <div className="mb-4">{planBanner}</div>}
              <div className="rounded-2xl border border-cream-300/70 bg-white p-5 shadow-card" data-decision>
                {decisionPanel}
              </div>
            </div>

            {/* 데스크톱: 본문 위에 붙는 섹션 바로가기 (결론은 오른쪽 패널에 늘 보임) */}
            <SectionTabs
              tabs={TABS.filter((t) => t.key !== "decision")}
              active={tab === "decision" ? "time" : tab}
              onPick={goTo}
              className="sticky top-0 z-30 -mx-1 hidden h-12 gap-5 border-b border-cream-300/70 bg-cream-50 lg:flex"
            />

            <Section id="time" title="언제 가면 좋을까">
              {ready && (
                <TimeCompare
                  cafe={cafe}
                  purpose={purpose}
                  stayMin={stayMin}
                  slots={slots}
                  activeHour={hour}
                  scope={isLive ? "오늘 남은 시간 중" : "하루 중"}
                  onPick={(h) => setPickedHour(h)}
                />
              )}
              <div className="mt-6">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-label text-coffee-700">시간대별 {metric === "crowd" ? "혼잡도" : "소음"}</p>
                  <div className="flex rounded-xl border border-cream-300 bg-white p-1" role="tablist" aria-label="그래프 기준">
                    {(["crowd", "noise"] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        role="tab"
                        aria-selected={metric === m}
                        onClick={() => setMetric(m)}
                        className={`h-8 rounded-lg px-3 text-label transition-colors ${
                          metric === m ? "bg-coffee-800 text-cream-50" : "text-coffee-500 hover:text-coffee-800"
                        }`}
                      >
                        {m === "crowd" ? "혼잡도" : "소음"}
                      </button>
                    ))}
                  </div>
                </div>
                <HourlyChart
                  cafe={cafe}
                  metric={metric}
                  selectedHour={hour}
                  onSelect={setPickedHour}
                  nowHour={isLive ? contextHour : undefined}
                  bestHour={best?.hour}
                />
                <p className="mt-3 text-caption text-coffee-400">막대를 누르면 그 시간 기준으로 위 결론을 다시 계산해요 · 데모 예측값</p>
              </div>
            </Section>

            <Section
              id="checkin"
              title="작업자 체크인"
              action={
                <Link href={`/cafe/${cafe.id}/review`} className="btn-quiet h-10 text-label">
                  <PenLine size={16} />
                  체크인 남기기
                </Link>
              }
            >
              <CheckinSummary summary={summary} reviews={allReviews} />
            </Section>

            <Section id="info" title="상세 정보">
              <p className="text-body text-coffee-600">{cafe.description}</p>
              <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
                {env.map(({ icon: Icon, label, value }) => (
                  // dl의 자식은 dt/dd를 바로 담은 div만 허용된다 — 아이콘은 dt 안의 장식으로 둔다
                  <div key={label} className="relative min-w-0 pl-12">
                    <dt className="text-caption text-coffee-400">
                      <span className="absolute left-0 top-0 flex h-9 w-9 items-center justify-center rounded-xl bg-cream-100 text-coffee-600" aria-hidden>
                        <Icon size={18} />
                      </span>
                      {label}
                    </dt>
                    <dd className="truncate text-meta font-semibold text-coffee-800">{value}</dd>
                  </div>
                ))}
              </dl>
              <ul className="mt-6 space-y-3 text-body text-coffee-700">
                <li className="flex items-start gap-3">
                  <MapPin size={18} className="mt-1 shrink-0 text-coffee-400" aria-hidden />
                  <span>
                    {cafe.address}
                    <span className="block text-meta text-coffee-400">
                      현재 위치(데모)에서 {formatDistance(distanceKm(cafe.lat, cafe.lng))} ·{" "}
                      <Link
                        href={`/${buildExploreQuery({ area: cafe.area, purpose, time: "now", filters: [], cafe: cafe.id }, { explicit: true })}`}
                        className="font-semibold text-coffee-700 underline underline-offset-4"
                      >
                        지도에서 보기
                      </Link>
                    </span>
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Clock3 size={18} className="mt-1 shrink-0 text-coffee-400" aria-hidden />
                  <span className="num">매일 {formatHours(cafe)}</span>
                </li>
              </ul>
              <p className="mt-4 text-caption text-coffee-400">
                방문자 평점 ★{cafe.rating.toFixed(1)} · 후기 {(cafe.reviewCount + myReviewCount).toLocaleString()}개
              </p>
            </Section>

            {similar.length > 0 && (
              <Section title={`${area.name}의 다른 작업 카페`}>
                {/* 모바일은 옆으로 넘기는 사진 카드, 데스크톱은 3열 */}
                <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-pl-4 px-4 pb-1 sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0">
                  {similar.map(({ cafe: c }) => (
                    <div key={c.id} className="w-[236px] shrink-0 snap-start lg:w-auto">
                      <CafeCard cafe={c} variant="tile" purpose={purpose} hour={hour} now={now} />
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </div>

          {/* ---------- 데스크톱: 스티키 결정 패널 ---------- */}
          <aside className="hidden lg:block">
            <div className="sticky top-6 mt-7 space-y-4">
              {planBanner}
              <div className="rounded-2xl border border-cream-300/80 bg-white p-6 shadow-card" data-decision>
                {decisionPanel}
                <Link href={planHref} className="btn-primary mt-6 w-full">
                  {ctaLabel}
                  <ArrowRight size={17} />
                </Link>
                <div className="mt-3 flex items-center justify-between">
                  <CompareToggle cafeId={cafe.id} />
                  <div className="flex items-center gap-1">
                    <ShareButton title={cafe.name} path={`/cafe/${cafe.id}`} />
                    <FavoriteButton cafeId={cafe.id} />
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* ---------- 모바일: 하단 고정 CTA ---------- */}
      <div data-bottom-bar className="fixed inset-x-0 bottom-0 z-40 border-t border-cream-300/70 bg-white/95 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:hidden">
        <div className="mx-auto max-w-xl">
          {/* 행동과 그 결과(점수)를 한 버튼에 — 무엇을 누르는지 다시 확인하지 않아도 되게 */}
          <Link href={planHref} className="btn-primary h-[52px] w-full justify-between rounded-2xl pl-5 pr-3">
            <span className="truncate">{ctaLabel}</span>
            {!myPlan && ex.open ? (
              <span className="num shrink-0 rounded-lg bg-white/15 px-2 py-1 text-label">{ex.score}점</span>
            ) : (
              <ArrowRight size={18} className="mr-1 shrink-0" />
            )}
          </Link>
        </div>
      </div>
    </div>
  );
}
