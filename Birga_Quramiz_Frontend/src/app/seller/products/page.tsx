"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/useAuth";
import { useProductManagement } from "@/hooks/useProductManagement";
import { getCategories } from "@/lib/api/products";
import { getBrands } from "@/lib/api/brands";
import { resolveImageUrl } from "@/lib/image";
import ProductFrame from "@/components/ui/ProductFrame";
import ProductFormModal from "@/components/seller/ProductFormModal";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Category, Brand, Product } from "@/types";

export default function SellerProductsPage() {
  const t = useTranslations("SellerProducts");
  const router = useRouter();
  const { user, isAuthenticated, isInitialized } = useAuth();

  const {
    products, productsLoading, productsError,
    actionProductId, deleteConfirmProduct, setDeleteConfirmProduct,
    loadProducts, handleToggleVisibility, handleDelete, handleConfirmDelete,
  } = useProductManagement();

  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  // Modal state
  const [createOpen, setCreateOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  // Toolbar state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("NEWEST");
  const [viewMode, setViewMode] = useState<"3col" | "4col">("4col");

  useEffect(() => {
    if (!isInitialized) return;
    if (!isAuthenticated) { router.push("/login"); return; }
    if (user && user.role !== "SELLER") { router.push("/"); return; }
    void loadProducts();
    getCategories().then(setCategories).catch(() => {});
    getBrands().then(setBrands).catch(() => {});
  }, [user, isAuthenticated, isInitialized, router, loadProducts]);

  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q),
      );
    }
    if (statusFilter !== "ALL") result = result.filter((p) => p.status === statusFilter);
    result.sort((a, b) => {
      switch (sortBy) {
        case "PRICE_ASC":  return a.price - b.price;
        case "PRICE_DESC": return b.price - a.price;
        case "OLDEST":
          return "createdAt" in a && "createdAt" in b
            ? new Date((a as { createdAt: string }).createdAt).getTime() - new Date((b as { createdAt: string }).createdAt).getTime()
            : a.id.localeCompare(b.id);
        default:
          return "createdAt" in a && "createdAt" in b
            ? new Date((b as { createdAt: string }).createdAt).getTime() - new Date((a as { createdAt: string }).createdAt).getTime()
            : b.id.localeCompare(a.id);
      }
    });
    return result;
  }, [products, searchQuery, statusFilter, sortBy]);

  if (!isInitialized || (isAuthenticated && !user)) {
    return (
      <div className="page-shell max-w-6xl">
        <div className="surface-card h-48 animate-pulse rounded-[32px]" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "SELLER") return null;

  return (
    <div className="page-shell max-w-[1488px] space-y-4 md:space-y-6 pb-24 md:pb-32 px-2 md:px-0">

      {/* Header */}
      <section className="surface-card rounded-2xl md:rounded-[32px] p-4 md:p-8 shadow-[0_4px_30px_rgb(0,0,0,0.03)] border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#1B4D91]/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 relative z-10 w-full md:w-auto">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 md:w-14 md:h-14 bg-[#1B4D91] rounded-full flex items-center justify-center shadow-lg shadow-[#1B4D91]/20 shrink-0">
              <svg className="w-6 h-6 md:w-7 md:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl md:text-3xl font-black text-[#1B4D91]">{t("title")}</h1>
              <p className="text-xs md:text-sm font-medium text-slate-500 mt-0.5 md:mt-1">{t("subtitle")}</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 relative z-10 w-full md:w-auto justify-end">
          <Link
            href="/seller/dashboard"
            className="h-10 md:h-12 inline-flex items-center justify-center rounded-full bg-slate-100 px-4 md:px-6 font-bold text-slate-700 hover:bg-slate-200 transition-colors whitespace-nowrap text-sm md:text-base flex-1 sm:flex-none"
          >
            {t("dashboard")}
          </Link>
          <button
            onClick={() => setCreateOpen(true)}
            className="h-10 md:h-14 px-4 md:px-8 flex items-center justify-center rounded-full bg-[#E31E24] text-white font-bold shadow-lg shadow-[#E31E24]/20 hover:bg-[#C91A20] transition-colors whitespace-nowrap flex-1 sm:flex-none text-sm md:text-base"
          >
            <span className="text-lg md:text-xl leading-none font-normal mr-1.5 md:mr-2">+</span>
            {t("addProduct")}
          </button>
        </div>
      </section>

      {/* Status strip */}
      {products.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-0.5 hide-scrollbar mt-1">
          {([
            { key: "ALL",      label: t("statsTotal"),    count: products.length,                                              color: "#1B4D91" },
            { key: "APPROVED", label: t("statsActive"),   count: products.filter((p) => p.status === "APPROVED").length,      color: "#10b981" },
            { key: "PENDING",  label: t("statsPending"),  count: products.filter((p) => p.status === "PENDING").length,       color: "#f59e0b" },
            { key: "REJECTED", label: t("statsRejected"), count: products.filter((p) => p.status === "REJECTED").length,      color: "#ef4444" },
          ] as const).map((stat) => (
            <button
              key={stat.key}
              onClick={() => setStatusFilter(stat.key)}
              className={`flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2.5 text-[12px] font-black transition-all border ${
                statusFilter === stat.key ? "text-white shadow-sm border-transparent" : "bg-white border-slate-100 text-slate-500 hover:border-slate-200"
              }`}
              style={statusFilter === stat.key ? { backgroundColor: stat.color, borderColor: stat.color } : {}}
            >
              <span className="text-[16px] font-black leading-none" style={{ color: statusFilter === stat.key ? "white" : stat.color }}>
                {stat.count}
              </span>
              {stat.label}
            </button>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <section className="flex flex-col md:flex-row gap-3 md:gap-4 mt-4 md:mt-6">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="h-4 w-4 md:h-5 md:w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            className="h-12 md:h-14 w-full rounded-xl md:rounded-2xl border-2 border-slate-100 bg-white pl-10 md:pl-12 pr-4 text-sm md:text-[15px] font-medium transition-colors focus:border-[#1B4D91] focus:outline-none shadow-[0_2px_10px_rgb(0,0,0,0.02)]"
            placeholder={t("searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 md:gap-3 w-full md:w-auto">
          <div className="w-1/2 md:w-[180px]">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-14 rounded-2xl border-2 border-slate-100 bg-white px-5 text-[15px] font-bold text-slate-700 shadow-[0_2px_10px_rgb(0,0,0,0.02)] focus:ring-0 focus:border-[#1B4D91] outline-none">
                <SelectValue placeholder={t("status")} />
              </SelectTrigger>
              <SelectContent className="rounded-3xl border-slate-100 shadow-xl p-2 bg-white/95 backdrop-blur-xl">
                <SelectItem value="ALL"      className="rounded-xl px-4 py-3 cursor-pointer font-medium focus:bg-slate-100">{t("statusAll")}</SelectItem>
                <SelectItem value="APPROVED" className="rounded-xl px-4 py-3 cursor-pointer font-medium focus:bg-slate-100">{t("statusApproved")}</SelectItem>
                <SelectItem value="PENDING"  className="rounded-xl px-4 py-3 cursor-pointer font-medium focus:bg-slate-100">{t("statusPending")}</SelectItem>
                <SelectItem value="REJECTED" className="rounded-xl px-4 py-3 cursor-pointer font-medium focus:bg-slate-100">{t("statusRejected")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-1/2 md:w-[200px]">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-14 rounded-2xl border-2 border-slate-100 bg-white px-5 text-[15px] font-bold text-slate-700 shadow-[0_2px_10px_rgb(0,0,0,0.02)] focus:ring-0 focus:border-[#1B4D91] outline-none">
                <SelectValue placeholder={t("sortBy")} />
              </SelectTrigger>
              <SelectContent className="rounded-3xl border-slate-100 shadow-xl p-2 bg-white/95 backdrop-blur-xl">
                <SelectItem value="NEWEST"     className="rounded-xl px-4 py-3 cursor-pointer font-medium focus:bg-slate-100">{t("sortNewest")}</SelectItem>
                <SelectItem value="OLDEST"     className="rounded-xl px-4 py-3 cursor-pointer font-medium focus:bg-slate-100">{t("sortOldest")}</SelectItem>
                <SelectItem value="PRICE_DESC" className="rounded-xl px-4 py-3 cursor-pointer font-medium focus:bg-slate-100">{t("sortPriceDesc")}</SelectItem>
                <SelectItem value="PRICE_ASC"  className="rounded-xl px-4 py-3 cursor-pointer font-medium focus:bg-slate-100">{t("sortPriceAsc")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="hidden md:flex items-center gap-1 bg-white border-2 border-slate-100 rounded-2xl px-2 h-14 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
            <button onClick={() => setViewMode("3col")} className="p-2 rounded-xl transition-colors" aria-label="3 columns">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className={viewMode === "3col" ? "text-[#1B4D91]" : "text-[#bbb]"}>
                <rect x="2"  y="2"  width="6" height="9" rx="1.5" fill="currentColor"/>
                <rect x="9"  y="2"  width="6" height="9" rx="1.5" fill="currentColor"/>
                <rect x="16" y="2"  width="6" height="9" rx="1.5" fill="currentColor"/>
                <rect x="2"  y="13" width="6" height="9" rx="1.5" fill="currentColor"/>
                <rect x="9"  y="13" width="6" height="9" rx="1.5" fill="currentColor"/>
                <rect x="16" y="13" width="6" height="9" rx="1.5" fill="currentColor"/>
              </svg>
            </button>
            <button onClick={() => setViewMode("4col")} className="p-2 rounded-xl transition-colors" aria-label="4+ columns">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className={viewMode === "4col" ? "text-[#1B4D91]" : "text-[#bbb]"}>
                <rect x="1"  y="2"  width="5" height="9" rx="1.5" fill="currentColor"/>
                <rect x="7"  y="2"  width="5" height="9" rx="1.5" fill="currentColor"/>
                <rect x="13" y="2"  width="5" height="9" rx="1.5" fill="currentColor"/>
                <rect x="19" y="2"  width="4" height="9" rx="1.5" fill="currentColor"/>
                <rect x="1"  y="13" width="5" height="9" rx="1.5" fill="currentColor"/>
                <rect x="7"  y="13" width="5" height="9" rx="1.5" fill="currentColor"/>
                <rect x="13" y="13" width="5" height="9" rx="1.5" fill="currentColor"/>
                <rect x="19" y="13" width="4" height="9" rx="1.5" fill="currentColor"/>
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* Product grid */}
      <section className="space-y-4 relative pb-24 lg:pb-0 mt-6">
        {productsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 animate-pulse rounded-[32px] bg-white border border-slate-100 shadow-[0_4px_30px_rgb(0,0,0,0.03)]" />
            ))}
          </div>
        ) : productsError ? (
          <div className="surface-card rounded-[32px] p-8 text-center border-slate-100">
            <p className="font-bold text-[#E31E24] mb-2">{t("errorTitle")}</p>
            <p className="text-sm text-[#E31E24]/80">{productsError}</p>
          </div>
        ) : filteredAndSortedProducts.length === 0 ? (
          <div className="surface-card rounded-[32px] p-16 text-center border-slate-100 flex flex-col items-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-xl font-black text-slate-800">{t("noProductsFound")}</p>
            <p className="text-[15px] font-medium text-slate-500 mt-2 max-w-sm mx-auto text-center">
              {products.length === 0 ? t("noProductsText") : t("noProductsSearchText")}
            </p>
            {products.length === 0 && (
              <button
                onClick={() => setCreateOpen(true)}
                className="mt-8 h-12 px-8 rounded-full bg-[#E31E24] text-white font-bold hover:bg-[#C91A20] transition-colors shadow-lg shadow-[#E31E24]/20"
              >
                {t("addFirstProduct")}
              </button>
            )}
          </div>
        ) : (
          <div className={`grid gap-3 md:gap-4 ${viewMode === "3col" ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"}`}>
            {filteredAndSortedProducts.map((product) => {
              const active = product.status === "APPROVED";
              const rejected = product.status === "REJECTED";
              const actionBusy = actionProductId === product.id;
              return (
                <article
                  key={product.id}
                  onClick={() => router.push(`/seller/products/${product.id}`)}
                  className="bg-white rounded-2xl flex flex-col overflow-hidden cursor-pointer w-full shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                >
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#f5f5f5] rounded-2xl">
                    <span className={`absolute top-2 left-2 z-10 inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider backdrop-blur-md shadow-sm ${active ? "bg-green-100/90 text-green-700" : rejected ? "bg-red-100/90 text-red-700" : "bg-amber-100/90 text-amber-700"}`}>
                      {product.status}
                    </span>
                    {product.imageUrl ? (
                      <ProductFrame src={resolveImageUrl(product.imageUrl)} alt={product.name} loading="lazy" className="absolute inset-0" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-100 text-[11px] font-bold text-slate-400">{t("noPhoto")}</div>
                    )}
                  </div>
                  <div className="pb-3 pt-2.5 px-2.5 flex flex-col flex-grow">
                    <h3 className="text-[14px] text-black line-clamp-2 mb-1">{product.name}</h3>
                    <div className="mb-1.5 flex items-baseline gap-1">
                      <span className="text-[16px] font-bold text-black tracking-tight">{product.price.toLocaleString("ru-RU")}</span>
                      <span className="text-[12px] text-black">UZS</span>
                    </div>
                    <p className="text-[12px] text-slate-400 mb-2">
                      {t("inStock")} <span className="text-slate-600 font-medium">{product.stock} {t("inStockUnit")}</span>
                    </p>
                    <div className="mt-auto flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditProduct(product); }}
                        disabled={actionBusy}
                        className="flex-1 py-2.5 rounded-2xl bg-slate-100 text-slate-700 font-semibold text-[12px] md:text-[13px] hover:bg-slate-200 transition-colors disabled:opacity-50"
                      >
                        {t("edit")}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); void handleToggleVisibility(product); }}
                        disabled={actionBusy}
                        className={`flex-1 py-2.5 rounded-2xl font-semibold text-[12px] md:text-[13px] transition-colors disabled:opacity-50 ${active ? "bg-amber-50 text-amber-600 hover:bg-amber-100" : "bg-green-50 text-green-600 hover:bg-green-100"}`}
                      >
                        {actionBusy ? "..." : active ? t("hide") : t("activate")}
                      </button>
                      {!active && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(product); }}
                          disabled={actionBusy}
                          className="w-9 flex items-center justify-center rounded-2xl bg-red-50 text-[#E31E24] hover:bg-red-100 transition-colors disabled:opacity-50 shrink-0"
                          title={t("delete")}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Create modal */}
      {createOpen && (
        <ProductFormModal
          categories={categories}
          brands={brands}
          onSuccess={async () => { setCreateOpen(false); await loadProducts(); }}
          onClose={() => setCreateOpen(false)}
        />
      )}

      {/* Edit modal */}
      {editProduct && (
        <ProductFormModal
          product={editProduct}
          categories={categories}
          brands={brands}
          onSuccess={async () => { setEditProduct(null); await loadProducts(); }}
          onClose={() => setEditProduct(null)}
        />
      )}

      {/* Delete confirmation */}
      <Dialog open={!!deleteConfirmProduct} onOpenChange={(open) => { if (!open) setDeleteConfirmProduct(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("deleteDialogTitle")}</DialogTitle>
            <DialogDescription>{t("deleteDialogDesc")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmProduct(null)} className="rounded-xl">
              {t("cancel")}
            </Button>
            <Button variant="destructive" onClick={() => void handleConfirmDelete()} className="rounded-xl gap-1.5">
              {t("confirmDelete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
