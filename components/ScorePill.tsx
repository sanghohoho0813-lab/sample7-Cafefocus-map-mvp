/**
 * 적합도 숫자 표기. 색은 의미가 있을 때만 쓴다:
 * 85점 이상은 보조 강조색(초록), 그 외는 중립, 영업 외는 흐리게.
 */
export default function ScorePill({
  score,
  muted = false,
  size = "sm",
}: {
  score: number;
  muted?: boolean;
  size?: "sm" | "lg";
}) {
  const tone = muted
    ? "bg-cream-200 text-coffee-400"
    : score >= 85
      ? "bg-forest-600 text-white"
      : "bg-cream-200 text-coffee-800";

  if (size === "lg") {
    return (
      <span
        className={`num inline-flex flex-col items-center justify-center rounded-2xl px-3.5 py-2 ${tone}`}
        aria-label={`적합도 ${score}점`}
      >
        <span className="text-score">{score}</span>
        <span className="mt-1 text-caption font-semibold opacity-80">적합도</span>
      </span>
    );
  }

  return (
    <span
      className={`num inline-flex h-7 shrink-0 items-center gap-1 rounded-lg px-2 text-label ${tone}`}
      aria-label={`적합도 ${score}점`}
    >
      <span className="font-bold">{score}</span>
      <span className="text-[12px] font-medium opacity-80">적합</span>
    </span>
  );
}
