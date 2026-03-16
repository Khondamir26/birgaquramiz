"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useFetch } from "@/hooks/useFetch";
import { getPendingProducts, approveProduct, rejectProduct } from "@/lib/api/products";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { Search, CheckCircle, XCircle, Package, Clock } from "lucide-react";

export default function AdminProductsPage() {
  const t = useTranslations("AdminProducts");
  const router = useRouter();
  const { data, loading, error, refetch } = useFetch(() => getPendingProducts());
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const products = useMemo(() => data ?? [], [data]);

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;

    return products.filter((product) =>
      [product.name, product.description]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [products, query]);

  const handleApprove = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setActionLoading(id);
    try {
      await approveProduct(id);
      refetch();
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setActionLoading(id);
    try {
      await rejectProduct(id);
      refetch();
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-[#f4f6fa] pb-28 md:pb-12">
        <div className="mx-auto w-full md:max-w-[1440px]">
          <div className="mx-auto flex flex-col gap-6 px-4 md:px-6 max-w-md md:max-w-none pt-4 md:pt-6">
            <div className="h-24 animate-pulse rounded-3xl bg-white" />
            <div className="h-16 animate-pulse rounded-2xl bg-white" />
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-32 animate-pulse rounded-3xl bg-white" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-[#f4f6fa] pb-28 md:pb-12">
        <div className="mx-auto w-full md:max-w-[1440px]">
          <div className="mx-auto px-4 md:px-6 max-w-md md:max-w-none pt-4 md:pt-6">
            <div className="rounded-3xl border border-[#E31E24]/20 bg-[#E31E24]/5 p-6 text-[13px] font-semibold text-[#E31E24]">
              {error}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f6fa] pb-28 md:pb-12">
      <div className="mx-auto w-full md:max-w-[1440px]">
        <div className="mx-auto flex flex-col gap-5 px-4 md:px-6 max-w-md md:max-w-none pt-4 md:pt-6">

          {/* -- Header -- */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#1B4D91]/10 text-[#1B4D91]">
                <Package className="size-5" />
              </div>
              <h1 className="text-xl md:text-2xl font-black text-[#1B4D91]">{t("title") || "Product Moderation"}</h1>
            </div>

            <div className="flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1.5 text-orange-700">
              <Clock className="size-3.5 mt-0.5" />
              <span className="text-[11px] md:text-xs font-bold whitespace-nowrap">
                {t("pendingCount", { count: products.length }) || `${products.length} pending`}
              </span>
            </div>
          </div>

          {/* -- Search -- */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("searchPlaceholder") || "Search pending products..."}
              className="h-12 w-full rounded-2xl border-none bg-white pl-11 pr-4 text-sm font-medium text-slate-700 shadow-sm outline-none ring-1 ring-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-[#1B4D91] transition-all"
            />
          </div>

          {/* -- Products List -- */}
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white/50 py-16 text-center">
              <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <CheckCircle className="size-6" />
              </div>
              <p className="text-sm font-bold text-slate-600">{t("noProducts") || "No products pending moderation."}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProducts.map((product) => (
                <article
                  key={product.id}
                  onClick={() => router.push(`/admin/products/${product.id}`)}
                  className="group flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-3xl bg-white border border-slate-100 p-5 shadow-sm transition-all hover:shadow-md cursor-pointer"
                >
                  <div className="min-w-0 flex-1">
                    {product.sku && (
                      <p className="text-[11px] font-semibold text-slate-400 mb-0.5">Art: {product.sku}</p>
                    )}
                    <p className="text-base font-black text-[#1B4D91] truncate leading-tight">{product.name}</p>
                    <p className="mt-1.5 line-clamp-2 text-[13px] text-slate-500 leading-relaxed max-w-2xl">{product.description}</p>

                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <span className="rounded-lg bg-green-50 px-2.5 py-1 text-[11px] font-bold text-green-700">
                        {t("price")}: {product.price.toLocaleString()} UZS
                      </span>
                      <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700">
                        {t("stock")}: {product.stock}
                      </span>
                    </div>
                  </div>

                  <div className="flex w-full md:w-auto items-center gap-2 pt-2 md:pt-0 border-t border-slate-100 md:border-0">
                    <Button
                      disabled={actionLoading === product.id}
                      onClick={(e) => handleApprove(e, product.id)}
                      className="flex-1 md:flex-none h-10 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-[13px] gap-1.5 transition-all shadow-sm"
                    >
                      <CheckCircle className="size-4" />
                      {actionLoading === product.id ? t("pleaseWait") : t("approveBtn")}
                    </Button>
                    <Button
                      variant="destructive"
                      disabled={actionLoading === product.id}
                      onClick={(e) => handleReject(e, product.id)}
                      className="flex-1 md:flex-none h-10 rounded-xl hover:bg-red-700 font-bold text-[13px] gap-1.5 transition-all shadow-sm"
                    >
                      <XCircle className="size-4" />
                      {actionLoading === product.id ? t("pleaseWait") : t("rejectBtn")}
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
