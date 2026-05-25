import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function AdminPage({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col pb-10">
      <div className={cn("mx-auto flex w-full max-w-[1440px] flex-col gap-5 px-4 pt-4 md:px-7 md:pt-7", className)}>
        {children}
      </div>
    </div>
  );
}
