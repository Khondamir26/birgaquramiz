"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export default function Breadcrumbs({ items, className }: { items: BreadcrumbItem[], className?: string }) {
  if (!items.length) return null;

  return (
    <nav aria-label="Breadcrumb" className={cn("w-full", className)}>
      <ol className="flex flex-wrap items-center gap-1.5 text-[12px] md:text-[13px] font-medium text-slate-400">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
              {!isLast && item.href ? (
                <Link href={item.href} className="hover:text-slate-600 hover:underline transition-all">
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? "text-slate-500" : ""}>{item.label}</span>
              )}

              {!isLast && <span className="text-slate-300 mx-0.5">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}