"use client";

import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useFetch } from "@/hooks/useFetch";
import ProductDetailsPage from "@/components/product/ProductDetailsPage";
import { Product } from "@/types";
import { getProductById } from "@/lib/api/products";

export default function CatalogProductRoute() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const t = useTranslations("ProductDetail");

  const { data: product, loading, error } = useFetch<Product>(() => getProductById(String(id ?? "")));

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50">
        <div className="aspect-square w-full bg-white animate-pulse" />
        <div className="px-5 pt-5 space-y-3">
          <div className="h-5 w-2/3 rounded-xl bg-slate-100 animate-pulse" />
          <div className="h-7 w-1/2 rounded-xl bg-slate-100 animate-pulse" />
          <div className="h-4 w-full rounded-xl bg-slate-100 animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 px-8 text-center">
        <p className="text-base font-bold text-slate-400">{error || t("notFound")}</p>
        <button
          onClick={() => router.back()}
          className="rounded-2xl border-2 border-[#1B4D91]/20 px-6 py-3 text-[13px] font-black text-[#1B4D91]"
        >
          {t("back")}
        </button>
      </div>
    );
  }

  return <ProductDetailsPage product={product} />;
}
