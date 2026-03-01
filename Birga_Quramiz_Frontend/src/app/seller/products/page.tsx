"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createProduct,
  deleteMySellerProduct,
  getMySellerProducts,
  setMySellerProductVisibility,
  updateMySellerProduct,
} from "@/lib/api/products";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { resolveImageUrl } from "@/lib/image";
import { useTranslations } from "next-intl";
import type { Product } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ProductFormState = {
  name: string;
  description: string;
  price: string;
  stock: string;
};

const initialForm: ProductFormState = {
  name: "",
  description: "",
  price: "",
  stock: "",
};

export default function SellerProductsPage() {
  const t = useTranslations("SellerProducts");
  const { user, isAuthenticated, isInitialized } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState<ProductFormState>(initialForm);
  const [createImageFile, setCreateImageFile] = useState<File | null>(null);
  const [createPreview, setCreatePreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState("");
  const [actionProductId, setActionProductId] = useState<string | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Filtering and Sorting States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("NEWEST");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingForm, setEditingForm] = useState<ProductFormState>(initialForm);
  const [editingImageFile, setEditingImageFile] = useState<File | null>(null);
  const [editingPreview, setEditingPreview] = useState("");
  const [editingLoading, setEditingLoading] = useState(false);

  const editingProduct = useMemo(
    () => products.find((p) => p.id === editingId) || null,
    [products, editingId],
  );

  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }

    // Filter
    if (statusFilter !== "ALL") {
      result = result.filter((p) => p.status === statusFilter);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "PRICE_ASC":
          return a.price - b.price;
        case "PRICE_DESC":
          return b.price - a.price;
        // Basic fallback for dates if present, else reverse order for "NEWEST"
        case "OLDEST":
          return "createdAt" in a && "createdAt" in b
            ? new Date((a as { createdAt: string }).createdAt).getTime() - new Date((b as { createdAt: string }).createdAt).getTime()
            : a.id.localeCompare(b.id);
        case "NEWEST":
        default:
          return "createdAt" in a && "createdAt" in b
            ? new Date((b as { createdAt: string }).createdAt).getTime() - new Date((a as { createdAt: string }).createdAt).getTime()
            : b.id.localeCompare(a.id);
      }
    });

    return result;
  }, [products, searchQuery, statusFilter, sortBy]);

  const loadProducts = async () => {
    setProductsLoading(true);
    setProductsError("");
    try {
      const data = await getMySellerProducts();
      setProducts(data);
    } catch (err: unknown) {
      setProductsError(err instanceof Error ? err.message : "Failed to load products");
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    if (!isInitialized) return;

    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    if (user && user.role !== "SELLER") {
      router.push("/");
      return;
    }

    void loadProducts();
  }, [user, isAuthenticated, isInitialized, router]);

  const handleCreateImage = (file: File | null) => {
    if (!file) return;
    if (createPreview) {
      URL.revokeObjectURL(createPreview);
    }

    setCreateImageFile(file);
    setCreatePreview(URL.createObjectURL(file));
  };

  const handleEditImage = (file: File | null) => {
    if (!file) return;
    if (editingPreview) {
      URL.revokeObjectURL(editingPreview);
    }

    setEditingImageFile(file);
    setEditingPreview(URL.createObjectURL(file));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!createImageFile) {
      setError("Product image is required");
      return;
    }

    setLoading(true);

    try {
      await createProduct({
        name: form.name,
        description: form.description,
        price: Number(form.price),
        stock: Number(form.stock),
        image: createImageFile,
      });

      setSuccess(t("submitting")); // A bit of a hack to show submitting text, though success isn't exactly the right state, but preserving logic
      setForm(initialForm);
      setCreateImageFile(null);
      if (createPreview) {
        URL.revokeObjectURL(createPreview);
        setCreatePreview("");
      }
      setIsCreateModalOpen(false); // Close modal on success
      await loadProducts();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (product: Product) => {
    if (editingPreview) {
      URL.revokeObjectURL(editingPreview);
      setEditingPreview("");
    }

    setEditingImageFile(null);
    setEditingId(product.id);
    setEditingForm({
      name: product.name,
      description: product.description,
      price: String(product.price),
      stock: String(product.stock),
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    setEditingLoading(true);
    setError("");
    setSuccess("");

    try {
      await updateMySellerProduct(editingId, {
        name: editingForm.name,
        description: editingForm.description,
        price: Number(editingForm.price),
        stock: Number(editingForm.stock),
        image: editingImageFile ?? undefined,
      });

      setSuccess(t("saving")); // Also using the saving string
      setEditingId(null);
      setEditingImageFile(null);
      if (editingPreview) {
        URL.revokeObjectURL(editingPreview);
        setEditingPreview("");
      }
      await loadProducts();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update product");
    } finally {
      setEditingLoading(false);
    }
  };

  const handleToggleVisibility = async (product: Product) => {
    const activeNow = product.status === "APPROVED";
    setActionProductId(product.id);
    setError("");
    setSuccess("");

    try {
      await setMySellerProductVisibility(product.id, !activeNow);
      setSuccess(
        activeNow
          ? "Product deactivated."
          : "Product sent for activation review.",
      );
      await loadProducts();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update visibility");
    } finally {
      setActionProductId(null);
    }
  };

  const handleDelete = async (product: Product) => {
    const ok = window.confirm(`Delete product "${product.name}"?`);
    if (!ok) return;

    setActionProductId(product.id);
    setError("");
    setSuccess("");

    try {
      await deleteMySellerProduct(product.id);
      setSuccess("Product deleted.");
      await loadProducts();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete product");
    } finally {
      setActionProductId(null);
    }
  };

  if (!isInitialized || (isAuthenticated && !user)) {
    return (
      <div className="page-shell max-w-6xl">
        <div className="surface-card h-48 animate-pulse rounded-[32px]" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "SELLER") {
    return null;
  }

  return (
    <div className="page-shell max-w-7xl space-y-4 md:space-y-6 pb-24 md:pb-32 px-2 md:px-0">

      {/* Premium Header */}
      <section className="surface-card rounded-2xl md:rounded-[32px] p-4 md:p-8 shadow-[0_4px_30px_rgb(0,0,0,0.03)] border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#1B4D91]/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 relative z-10 w-full md:w-auto">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 md:w-14 md:h-14 bg-[#1B4D91] rounded-full flex items-center justify-center shadow-lg shadow-[#1B4D91]/20 shrink-0">
              <svg className="w-6 h-6 md:w-7 md:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
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
            onClick={() => setIsCreateModalOpen(true)}
            className="h-10 md:h-14 px-4 md:px-8 flex items-center justify-center rounded-full bg-[#E31E24] text-white font-bold shadow-lg shadow-[#E31E24]/20 hover:bg-[#C91A20] transition-colors whitespace-nowrap flex-1 sm:flex-none text-sm md:text-base"
          >
            <span className="text-lg md:text-xl leading-none font-normal mr-1.5 md:mr-2">+</span> {t("addProduct")}
          </button>
        </div>
      </section>

      {error && <div className="bg-red-50 border border-red-100 text-[#E31E24] px-6 py-4 rounded-2xl text-[15px] font-bold">{error}</div>}
      {success && <div className="bg-green-50 border border-green-100 text-green-700 px-6 py-4 rounded-2xl text-[15px] font-bold">{success}</div>}

      {/* TOOLBAR */}
      <section className="flex flex-col md:flex-row gap-3 md:gap-4 mt-4 md:mt-6">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="h-4 w-4 md:h-5 md:w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
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
                <SelectItem value="ALL" className="rounded-xl px-4 py-3 cursor-pointer font-medium focus:bg-slate-100">{t("statusAll")}</SelectItem>
                <SelectItem value="APPROVED" className="rounded-xl px-4 py-3 cursor-pointer font-medium focus:bg-slate-100">{t("statusApproved")}</SelectItem>
                <SelectItem value="PENDING" className="rounded-xl px-4 py-3 cursor-pointer font-medium focus:bg-slate-100">{t("statusPending")}</SelectItem>
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
                <SelectItem value="NEWEST" className="rounded-xl px-4 py-3 cursor-pointer font-medium focus:bg-slate-100">{t("sortNewest")}</SelectItem>
                <SelectItem value="OLDEST" className="rounded-xl px-4 py-3 cursor-pointer font-medium focus:bg-slate-100">{t("sortOldest")}</SelectItem>
                <SelectItem value="PRICE_DESC" className="rounded-xl px-4 py-3 cursor-pointer font-medium focus:bg-slate-100">{t("sortPriceDesc")}</SelectItem>
                <SelectItem value="PRICE_ASC" className="rounded-xl px-4 py-3 cursor-pointer font-medium focus:bg-slate-100">{t("sortPriceAsc")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* FULL WIDTH PRODUCT LIST */}
      <section className="space-y-4 relative pb-24 lg:pb-0 mt-6">

        {productsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
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
              <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
            <p className="text-xl font-black text-slate-800">{t("noProductsFound")}</p>
            <p className="text-[15px] font-medium text-slate-500 mt-2 max-w-sm mx-auto text-center">
              {products.length === 0
                ? t("noProductsText")
                : t("noProductsSearchText")}
            </p>
            {products.length === 0 && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-8 h-12 px-8 rounded-full bg-[#E31E24] text-white font-bold hover:bg-[#C91A20] transition-colors shadow-lg shadow-[#E31E24]/20"
              >
                {t("addFirstProduct")}
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6 text-left">
            {filteredAndSortedProducts.map((product) => {
              const active = product.status === "APPROVED";
              const rejected = product.status === "REJECTED";
              const actionBusy = actionProductId === product.id;

              return (
                <article key={product.id} className="surface-card rounded-2xl md:rounded-[32px] p-3 md:p-5 shadow-[0_4px_30px_rgb(0,0,0,0.03)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] transition-all border border-slate-100 flex flex-col h-[320px] md:h-[480px] bg-white group overflow-hidden">

                  {/* Top Header: Image & Quick Info */}
                  <div className="flex flex-col md:flex-col gap-3 md:gap-4 shrink-0">
                    {/* Fixed Size Thumbnail Container */}
                    <div className="w-full relative shrink-0">
                      <div className="aspect-[4/3] md:aspect-[16/10] w-full rounded-xl md:rounded-[24px] bg-slate-50 border border-slate-100 overflow-hidden relative">
                        {product.imageUrl ? (
                          <img src={resolveImageUrl(product.imageUrl)} alt={product.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-slate-100 text-[10px] md:text-sm font-bold text-slate-400">{t("noPhoto")}</div>
                        )}

                        {/* Status Overlay */}
                        <div className="absolute top-2 left-2 md:top-3 md:left-3 z-10">
                          <div className={`inline-flex items-center px-2 py-1 md:px-3 md:py-1.5 rounded-full text-[9px] md:text-[11px] font-black uppercase tracking-wider shadow-sm ${active ? "bg-green-100/90 text-green-700 backdrop-blur-md" : rejected ? "bg-red-100/90 text-red-700 backdrop-blur-md" : "bg-amber-100/90 text-amber-700 backdrop-blur-md"}`}>
                            {product.status}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Core Info - Strict Height Constraints */}
                    <div className="flex-1 w-full flex flex-col px-0.5">
                      {/* Name - Exactly 2 lines */}
                      <div className="h-10 md:h-[48px] overflow-hidden mb-1">
                        <p className="font-bold md:font-extrabold text-[13px] md:text-[17px] text-slate-800 leading-tight md:leading-tight line-clamp-2" title={product.name}>{product.name}</p>
                      </div>

                      {/* Price - 1 line */}
                      <p className="font-black text-[#E31E24] text-[15px] md:text-xl truncate">{product.price.toLocaleString()} <span className="text-[9px] md:text-[12px] opacity-80">{t("currencyUzs")}</span></p>
                    </div>
                  </div>

                  {/* Middle Section (Desktop Detailed Text) */}
                  <div className="hidden md:flex flex-col mt-3 px-0.5 shrink-0">
                    {/* Description - Exactly 2 lines */}
                    <div className="h-10 overflow-hidden">
                      <p className="text-[13px] text-slate-500 font-medium line-clamp-2 leading-tight">{product.description}</p>
                    </div>
                    {/* Desktop Stock */}
                    <p className="text-[13px] text-slate-500 font-bold mt-2 truncate">{t("inStock")} <span className="text-slate-800">{product.stock} {t("inStockUnit")}</span></p>
                  </div>

                  {/* Mobile tight stock indicator (Bottom-aligned) */}
                  <div className="md:hidden mt-auto px-0.5">
                    <p className="text-[11px] text-slate-500 font-bold truncate">{t("inStock")} <span className="text-slate-800">{product.stock} {t("inStockUnit")}</span></p>
                  </div>

                  {/* Actions (Pushed to bottom using auto margins) */}
                  <div className="mt-2 md:mt-0 md:pt-4 pt-2 border-t border-slate-100 flex flex-wrap gap-1.5 md:gap-2 shrink-0 md:mt-auto">
                    <button
                      onClick={() => openEdit(product)}
                      disabled={actionBusy}
                      className="h-8 md:h-10 px-2 md:px-4 rounded-full bg-slate-100 text-slate-700 font-bold text-[11px] md:text-[13px] hover:bg-slate-200 transition-colors disabled:opacity-50 flex-1 min-w-[30%]"
                    >
                      {t("edit")}
                    </button>
                    <button
                      onClick={() => void handleToggleVisibility(product)}
                      disabled={actionBusy}
                      className={`h-8 md:h-10 px-2 md:px-4 rounded-full font-bold text-[11px] md:text-[13px] transition-colors disabled:opacity-50 flex-1 min-w-[30%] ${active ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                    >
                      {actionBusy ? "..." : active ? t("hide") : t("activate")}
                    </button>
                    <button
                      onClick={() => void handleDelete(product)}
                      disabled={actionBusy}
                      className="h-8 md:h-10 w-8 md:px-4 md:w-auto flex items-center justify-center rounded-full bg-red-50 text-[#E31E24] font-bold text-[11px] md:text-[13px] hover:bg-red-100 transition-colors disabled:opacity-50 flex-none"
                      title={t("delete")}
                    >
                      <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>

                </article>
              );
            })}
          </div>
        )
        }
      </section >

      {/* CREATE PRODUCT MODAL */}
      {
        isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200 overflow-y-auto">
            <form onSubmit={handleCreate} className="surface-card w-full max-w-lg rounded-[32px] p-6 md:p-8 shadow-[0_20px_60px_rgb(0,0,0,0.15)] border-0 relative my-auto animate-in zoom-in-95 duration-200 mt-20 mb-10">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="absolute top-6 right-6 w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>

              <h2 className="text-2xl font-black text-[#1B4D91] mb-6 pr-12 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-[#1B4D91]/10 text-[#1B4D91] flex items-center justify-center text-[18px]">+</span>
                {t("newProductTitle")}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">{t("productName")}</label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    required
                    className="h-14 w-full rounded-2xl border-2 border-slate-100 bg-slate-50/50 px-4 text-[15px] font-medium transition-colors focus:bg-white focus:border-[#1B4D91] focus:outline-none focus:ring-4 focus:ring-[#1B4D91]/10"
                    placeholder={t("productNamePlaceholder")}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">{t("description")}</label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    required
                    rows={4}
                    className="w-full resize-none rounded-2xl border-2 border-slate-100 bg-slate-50/50 p-4 text-[15px] font-medium transition-colors focus:bg-white focus:border-[#1B4D91] focus:outline-none focus:ring-4 focus:ring-[#1B4D91]/10"
                    placeholder={t("descriptionPlaceholder")}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">{t("price")}</label>
                    <input
                      name="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.price}
                      onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                      required
                      className="h-14 w-full rounded-2xl border-2 border-slate-100 bg-slate-50/50 px-4 text-[15px] font-medium transition-colors focus:bg-white focus:border-[#1B4D91] focus:outline-none focus:ring-4 focus:ring-[#1B4D91]/10"
                      placeholder={t("pricePlaceholder")}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">{t("stockAmount")}</label>
                    <input
                      name="stock"
                      type="number"
                      min="0"
                      value={form.stock}
                      onChange={(e) => setForm((p) => ({ ...p, stock: e.target.value }))}
                      required
                      className="h-14 w-full rounded-2xl border-2 border-slate-100 bg-slate-50/50 px-4 text-[15px] font-medium transition-colors focus:bg-white focus:border-[#1B4D91] focus:outline-none focus:ring-4 focus:ring-[#1B4D91]/10"
                      placeholder={t("stockPlaceholder")}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">{t("photo")}</label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleCreateImage(e.target.files?.[0] || null)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      required
                    />
                    <div className={`h-14 w-full rounded-2xl border-2 border-dashed flex items-center justify-center text-[15px] font-medium transition-colors ${createImageFile ? 'border-[#1B4D91] bg-[#1B4D91]/5 text-[#1B4D91]' : 'border-slate-300 bg-slate-50/50 text-slate-500 hover:bg-slate-100'}`}>
                      {createImageFile ? createImageFile.name : t("chooseFile")}
                    </div>
                  </div>
                </div>

                {createPreview && (
                  <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-sm mt-4">
                    <img src={createPreview} alt="New product preview" className="w-full aspect-[4/3] object-cover" />
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !createImageFile}
                className="h-14 w-full rounded-full bg-[#E31E24] text-white font-bold text-[16px] shadow-lg shadow-[#E31E24]/20 hover:bg-[#C91A20] transition-colors disabled:opacity-50 mt-8"
              >
                {loading ? t("submitting") : t("addProduct")}
              </button>
            </form>
          </div>
        )
      }

      {/* FIXED OVERLAY MODAL FOR EDITING */}
      {
        editingProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
            <form onSubmit={handleSaveEdit} className="surface-card w-full max-w-lg rounded-[32px] p-6 md:p-8 shadow-[0_20px_60px_rgb(0,0,0,0.15)] border-0 relative my-auto">

              <button
                type="button"
                onClick={() => setEditingId(null)}
                className="absolute top-6 right-6 w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>

              <h2 className="text-2xl font-black text-[#1B4D91] mb-6 pr-12">{t("editProductTitle")}</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">{t("productName")}</label>
                  <input
                    value={editingForm.name}
                    onChange={(e) => setEditingForm((p) => ({ ...p, name: e.target.value }))}
                    className="h-14 w-full rounded-2xl border-2 border-slate-100 bg-slate-50/50 px-4 text-[15px] font-medium transition-colors focus:bg-white focus:border-[#1B4D91] focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">{t("description")}</label>
                  <textarea
                    value={editingForm.description}
                    onChange={(e) => setEditingForm((p) => ({ ...p, description: e.target.value }))}
                    rows={3}
                    className="w-full resize-none rounded-2xl border-2 border-slate-100 bg-slate-50/50 p-4 text-[15px] font-medium transition-colors focus:bg-white focus:border-[#1B4D91] focus:outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">{t("price")}</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editingForm.price}
                      onChange={(e) => setEditingForm((p) => ({ ...p, price: e.target.value }))}
                      className="h-14 w-full rounded-2xl border-2 border-slate-100 bg-slate-50/50 px-4 text-[15px] font-medium transition-colors focus:bg-white focus:border-[#1B4D91] focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">{t("stockAmount")}</label>
                    <input
                      type="number"
                      min="0"
                      value={editingForm.stock}
                      onChange={(e) => setEditingForm((p) => ({ ...p, stock: e.target.value }))}
                      className="h-14 w-full rounded-2xl border-2 border-slate-100 bg-slate-50/50 px-4 text-[15px] font-medium transition-colors focus:bg-white focus:border-[#1B4D91] focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">{t("newPhotoOptional")}</label>
                  <div className="relative mb-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleEditImage(e.target.files?.[0] || null)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className={`h-14 w-full rounded-2xl border-2 border-dashed flex items-center justify-center text-[15px] font-medium transition-colors ${editingImageFile ? 'border-[#1B4D91] bg-[#1B4D91]/5 text-[#1B4D91]' : 'border-slate-300 bg-slate-50/50 text-slate-500 hover:bg-slate-100'}`}>
                      {editingImageFile ? editingImageFile.name : t("chooseNewPhoto")}
                    </div>
                  </div>

                  {(editingPreview || editingProduct.imageUrl) && (
                    <div className="rounded-2xl overflow-hidden border border-slate-100 aspect-[16/9] relative">
                      <img
                        src={editingPreview || resolveImageUrl(editingProduct.imageUrl)}
                        alt="Edit preview"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={editingLoading}
                className="h-14 w-full rounded-full bg-[#1B4D91] text-white font-bold text-[16px] shadow-lg shadow-[#1B4D91]/20 hover:bg-[#153a70] transition-colors disabled:opacity-50 mt-8"
              >
                {editingLoading ? t("saving") : t("saveChanges")}
              </button>
            </form>
          </div>
        )
      }
    </div >
  );
}
