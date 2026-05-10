import { type ReactNode } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: Parameters<typeof clsx>) {
  return twMerge(clsx(inputs));
}

interface EmptyStateProps {
  icon:         ReactNode;
  title:        string;
  description?: string;
  action?:      ReactNode;
  className?:   string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center gap-2 px-4 py-10 text-center", className)}>
      <div className="mb-1 flex size-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
        {icon}
      </div>
      <p className="text-[13px] font-semibold text-slate-500">{title}</p>
      {description && (
        <p className="max-w-[200px] text-[11px] leading-relaxed text-slate-400">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
