import type { LucideIcon } from "lucide-react";
import { Coffee } from "lucide-react";

export default function EmptyState({
  icon: Icon = Coffee,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center animate-fade-in">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-cream-200 text-coffee-400">
        <Icon size={24} strokeWidth={1.8} />
      </div>
      <p className="text-[15px] font-semibold text-coffee-700">{title}</p>
      {description && (
        <p className="max-w-xs text-[13px] leading-relaxed text-coffee-400">
          {description}
        </p>
      )}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
