"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Cafe, Purpose } from "@/lib/types";
import { explainFit } from "@/lib/fit";
import { CROWD_LABEL, NOISE_LABEL, hourlyAt, levelOf } from "@/lib/scoring";
import { hm } from "@/lib/time";

const short = (s: string) => s.replace("해요", "").replace("이에요", "").replace("워요", "움");

export interface TimeSlot {
  hour: number;
  /** "지금" · "내가 고른 시간" · "추천" — 같은 시간이면 합쳐서 보여준다 */
  roles: ("now" | "picked" | "base" | "best")[];
}

const ROLE_LABEL = { now: "지금", picked: "내가 고른 시간", base: "기준 시간", best: "가장 추천" } as const;

/**
 * 시간대 비교: 지금 · 내가 고른 도착 시간 · 가장 추천하는 시간을 나란히.
 * 칸을 누르면 그 시간 기준으로 위 결론이 다시 계산되고, 추천 칸에서는 바로 계획으로 갈 수 있다.
 */
export default function TimeCompare({
  cafe,
  purpose,
  stayMin,
  slots,
  activeHour,
  scope,
  onPick,
}: {
  cafe: Cafe;
  purpose: Purpose;
  stayMin: number;
  slots: TimeSlot[];
  activeHour: number;
  /** 추천 시간을 찾은 범위: "오늘 남은 시간 중" · "하루 중" */
  scope: string;
  onPick: (hour: number) => void;
}) {
  const best = slots.find((s) => s.roles.includes("best"));
  // 비교 기준: 지금 → 내가 고른 시간 → (영업 시간 밖이면) 기준 시간
  const base =
    slots.find((s) => s.roles.includes("now")) ??
    slots.find((s) => s.roles.includes("picked")) ??
    slots.find((s) => s.roles.includes("base"));
  const score = (h: number) => explainFit(cafe, purpose, h, { stayMin }).score;
  const gain = best && base && best.hour !== base.hour ? score(best.hour) - score(base.hour) : 0;
  const baseWord = base?.roles.includes("now") ? "지금" : base ? `${base.hour}시` : "";

  // 차이만큼만 말한다 — 2~3점 차이로 "훨씬 좋다"고 하지 않는다
  const headline = !best ? (
    "오늘은 더 이상 머물 수 있는 시간이 없어요."
  ) : !base || best.hour === base.hour ? (
    `${baseWord || `${best.hour}시`}${baseWord === "지금" ? "이" : "가"} ${scope} 가장 좋아요.`
  ) : gain >= 5 ? (
    <>
      <b className="num font-semibold text-coffee-900">{best.hour}시</b>에 가면 더 좋아요{" "}
      <span className="num text-forest-600">(+{gain}점)</span>
    </>
  ) : (
    <>
      {baseWord}도 충분히 좋아요. <span className="num">{best.hour}시</span>가 조금 더 나아요.
    </>
  );

  return (
    <div>
      <p className="text-body text-coffee-700">{headline}</p>
      <div className={`mt-3 grid gap-2 ${slots.length === 3 ? "grid-cols-3" : slots.length === 2 ? "grid-cols-2" : "grid-cols-1"}`}>
        {slots.map((s) => {
          const ex = explainFit(cafe, purpose, s.hour, { stayMin });
          const p = hourlyAt(cafe, s.hour);
          const isBest = s.roles.includes("best");
          const active = s.hour === activeHour;
          return (
            <button
              key={s.hour}
              type="button"
              onClick={() => onPick(s.hour)}
              aria-pressed={active}
              className={`flex min-w-0 flex-col items-start rounded-2xl border p-3 text-left transition-colors ${
                active ? "border-coffee-800 bg-white ring-1 ring-coffee-800" : "border-cream-300 bg-white hover:border-coffee-300"
              }`}
            >
              <span className={`text-caption font-semibold ${isBest ? "text-forest-600" : "text-coffee-500"}`}>
                {s.roles.map((r) => ROLE_LABEL[r]).join(" · ")}
              </span>
              <span className="num mt-0.5 text-title text-coffee-900">{hm(s.hour)}</span>
              <span className={`num mt-1 text-label ${ex.score >= 85 && ex.open ? "text-forest-600" : "text-coffee-800"}`}>
                {ex.open ? `${ex.score}점` : "영업 외"}
              </span>
              {ex.open && (
                <span className="mt-0.5 truncate text-caption text-coffee-500">
                  {short(CROWD_LABEL[levelOf(p.crowd)])} · {short(NOISE_LABEL[levelOf(p.noise)])}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {best && !best.roles.includes("now") && (
        <Link
          href={`/cafe/${cafe.id}/plan?hour=${best.hour}`}
          className="mt-3 inline-flex items-center gap-1 text-label text-forest-600 underline-offset-4 hover:underline"
        >
          {best.hour}시로 작업 계획하기
          <ArrowRight size={15} aria-hidden />
        </Link>
      )}
    </div>
  );
}
