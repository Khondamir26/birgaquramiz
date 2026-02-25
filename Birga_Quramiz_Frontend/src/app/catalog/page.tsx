"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { getProducts } from "@/lib/api/products";
import ProductCard from "@/components/product/ProductCard";
import { Button } from "@/components/ui/button";
import type { PaginatedResponse, Product } from "@/types";
import { useTranslations } from "next-intl";

const chips = ["cement", "blocks", "steel", "roof", "tile", "insulation"];

export default function CatalogPage() {
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");

  const [data, setData] = useState<PaginatedResponse<Product> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const t = useTranslations("Catalog");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    getProducts(page, 12, search)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : t("loadFailed"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page, search, t]);

  const products = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="page-shell space-y-6">
      <section className="surface-card p-5 md:p-6">
        <h1 className="section-title text-[#0f3154]">{t("title")}</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600 md:text-base">{t("subtitle")}</p>

        <form
          className="mt-4 flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            setSearch(query.trim());
          }}
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-3.5 size-4 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="h-11 w-full rounded-xl border border-border/80 bg-white pl-10 pr-3 text-sm"
            />
          </div>
          <Button type="submit" className="h-11 bg-[#0f3154] hover:bg-[#184a7d]">{t("search")}</Button>
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          {chips.map((chip) => (
            <button
              key={chip}
              onClick={() => {
                setQuery(chip);
                setSearch(chip);
                setPage(1);
              }}
              className="rounded-full border border-border/80 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-[#0f3154]/30 hover:text-[#0f3154]"
            >
              {chip}
            </button>
          ))}
        </div>
      </section>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="surface-card h-64 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="surface-card p-6">
          <p className="text-sm font-medium text-destructive">{t("loadFailed")}: {error}</p>
        </div>
      ) : products.length === 0 ? (
        <div className="surface-card p-10 text-center text-muted-foreground">{t("empty")}</div>
      ) : (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </section>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            {t("previous")}
          </Button>
          <span className="rounded-lg border border-border/70 bg-white px-4 py-2 text-sm font-medium text-slate-600">
            {t("pageOf", { page, totalPages: meta.totalPages })}
          </span>
          <Button variant="outline" disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}>
            {t("next")}
          </Button>
        </div>
      )}
    </div>
  );
}
