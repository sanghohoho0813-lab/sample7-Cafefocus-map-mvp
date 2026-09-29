import type { LucideIcon } from "lucide-react";
import { Coffee } from "lucide-react";

export default function EmptyState({
  icon: Icon = Coffee,
  title,
  description,
  action,
  compact = false,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2.5 px-6 text-center animate-fade-in ${
        compact ? "py-8" : "py-14"
      }`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cream-200 text-coffee-400">
        <Icon size={22} strokeWidth={1.9} />
      </div>
      <p className="text-title text-coffee-800">{title}</p>
      {description && <p className="max-w-xs text-meta text-coffee-400">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
