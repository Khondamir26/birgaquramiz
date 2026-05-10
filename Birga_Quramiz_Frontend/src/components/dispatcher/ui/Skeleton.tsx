import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: Parameters<typeof clsx>) {
  return twMerge(clsx(inputs));
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-slate-100", className)} />;
}

export function DriverRowSkeleton() {
  return (
    <div className="flex items-center gap-3 border-b border-slate-50 px-4 py-3">
      <Skeleton className="size-9 rounded-full" />
      <div className="flex-1">
        <Skeleton className="mb-1.5 h-3.5 w-28" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-5 w-14 rounded-full" />
    </div>
  );
}

export function OrderCardSkeleton() {
  return (
    <div className="border-b border-slate-50 px-4 py-3">
      <div className="flex gap-2.5">
        <Skeleton className="mt-0.5 size-7 rounded-lg" />
        <div className="flex-1">
          <div className="flex justify-between gap-2">
            <Skeleton className="h-3.5 w-1/2" />
            <Skeleton className="h-3.5 w-14" />
          </div>
          <Skeleton className="mt-2 h-3 w-3/4" />
          <Skeleton className="mt-1.5 h-3 w-1/3" />
          <div className="mt-2 flex gap-1.5">
            <Skeleton className="h-4 w-10 rounded-full" />
            <Skeleton className="h-4 w-16 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
