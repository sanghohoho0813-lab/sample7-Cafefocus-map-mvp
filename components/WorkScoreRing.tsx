"use client";

import { useEffect, useState } from "react";
import { scoreRingColor } from "@/lib/scoring";

export default function WorkScoreRing({
  score,
  size = 64,
  label = "작업점수",
  animate = true,
}: {
  score: number;
  size?: number;
  label?: string;
  animate?: boolean;
}) {
  const [progress, setProgress] = useState(animate ? 0 : score);
  const [display, setDisplay] = useState(animate ? 0 : score);

  useEffect(() => {
    if (!animate) {
      setProgress(score);
      setDisplay(score);
      return;
    }
    const raf = requestAnimationFrame(() => setProgress(score));
    const start = performance.now();
    const dur = 700;
    let frame: number;
    const tick = (t: number) => {
      const p = Math.min((t - start) / dur, 1);
      setDisplay(Math.round(score * (1 - Math.pow(1 - p, 3))));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(frame);
    };
  }, [score, animate]);

  const stroke = Math.max(3, size / 16);
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const color = scoreRingColor(score);

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#EDE5D8"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - progress / 100)}
          style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.22,1,0.36,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span
          className="font-bold text-coffee-800"
          style={{ fontSize: size * 0.3 }}
        >
          {display}
        </span>
        {size >= 56 && (
          <span
            className="mt-0.5 text-coffee-400"
            style={{ fontSize: Math.max(size * 0.13, 9) }}
          >
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
