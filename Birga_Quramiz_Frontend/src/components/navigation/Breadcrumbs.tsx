"use client";

import Link from "next/link";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export default function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  if (!items.length) return null;

  return (
    <nav aria-label="Breadcrumb" className="w-full">
      <ol className="flex flex-wrap items-center gap-1.5 text-[12px] md:text-[13px] font-semibold text-slate-500">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
              {!isLast && item.href ? (
                <Link href={item.href} className="hover:text-[#1B4D91] transition-colors">
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? "text-slate-700" : ""}>{item.label}</span>
              )}

              {!isLast && <span className="text-slate-400">&gt;</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}