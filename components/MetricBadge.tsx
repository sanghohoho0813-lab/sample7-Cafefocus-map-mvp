export default function MetricBadge({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "green" | "neutral" | "amber";
}) {
  const cls =
    tone === "green"
      ? "bg-forest-50 text-forest-700 border-forest-100"
      : tone === "amber"
        ? "bg-amber2-400/10 text-amber2-500 border-amber2-400/20"
        : "bg-cream-100 text-coffee-500 border-cream-200";
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-md border px-2 py-1 text-[11px] font-medium ${cls}`}
    >
      {label}
    </span>
  );
}
