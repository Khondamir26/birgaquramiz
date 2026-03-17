"use client";

import type { Product } from "@/types";
import Link from "next/link";

type CategoryCardProps = {
  product: Product;
};

export default function CategoryCard({ product }: CategoryCardProps) {
  const category = product.category;
  if (!category) return null;

  return (
    <Link 
      href={`/catalog/category/${category.id}`}
      className="flex items-center gap-4 group w-full"
    >
      <div className="flex size-[48px] items-center justify-center rounded-xl bg-[#F6F6F9] group-hover:bg-[#EEF0F3] transition-colors shadow-sm overflow-hidden text-[#a0a0a0]">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
      </div>
      
      <div className="flex flex-col">
        <span className="text-[15px] font-bold text-[#242424] transition-colors">
          {category.name}
        </span>
        <span className="text-[14px] text-[#a0a0a0] font-medium">
          Все товары категории
        </span>
      </div>
    </Link>
  );
}
