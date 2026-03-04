"use client";

import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useFetch } from "@/hooks/useFetch";
import { getCategoryById, getProducts } from "@/lib/api/products";
import type { Category, Product } from "@/types";
import Breadcrumbs from "@/components/navigation/Breadcrumbs";
import ProductCard from "@/components/product/ProductCard";

export default function CatalogCategoryPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const tNav = useTranslations("Navbar");

  const categoryId = String(id ?? "");

  const {
    data: category,
    loading: categoryLoading,
    error: categoryError,
  } = useFetch<Category>(() => getCategoryById(categoryId));

  const {
    data: productsResponse,
    loading: productsLoading,
    error: productsError,
  } = useFetch(() => getProducts(1, 48, undefined, categoryId));

  if (!categoryId) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 text-center">
        <p className="text-base font-bold text-slate-500">Category not found</p>
      </div>
    );
  }

  if (categoryLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-6 space-y-5">
        <div className="h-5 w-64 rounded bg-slate-100 animate-pulse" />
        <div className="h-9 w-56 rounded bg-slate-100 animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} className="h-[260px] rounded-2xl bg-white animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!category || categoryError) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 text-center">
        <p className="text-base font-bold text-slate-500">
          {categoryError?.toLowerCase().includes("not found") ? "Category not found" : categoryError}
        </p>
        <button
          onClick={() => router.push("/catalog")}
          className="mt-4 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700"
        >
          {tNav("catalog")}
        </button>
      </div>
    );
  }

  const products: Product[] = productsResponse?.data ?? [];

  const breadcrumbItems = [
    { label: tNav("home"), href: "/" },
    { label: tNav("catalog"), href: "/catalog" },
    ...(category.parent ? [{ label: category.parent.name, href: `/catalog/category/${category.parent.id}` }] : []),
    { label: category.name },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f6fa] md:pb-12">
      <div className="mx-auto w-full md:max-w-7xl px-4 md:px-6 pt-3 md:pt-5 pb-10">
        <Breadcrumbs items={breadcrumbItems} />

        <div className="mt-4 md:mt-6 mb-4 md:mb-6">
          <h1 className="text-2xl md:text-3xl font-black text-[#1B4D91]">{category.name}</h1>
          {category.parent ? (
            <p className="mt-1 text-sm font-medium text-slate-500">Parent category: {category.parent.name}</p>
          ) : null}
        </div>

        {productsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div key={idx} className="h-[260px] rounded-2xl bg-white animate-pulse" />
            ))}
          </div>
        ) : productsError ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
            {productsError}
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-10 text-center">
            <p className="text-sm font-bold text-slate-600">No products in this category yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}