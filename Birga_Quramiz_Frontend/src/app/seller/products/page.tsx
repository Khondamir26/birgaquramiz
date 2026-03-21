"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createProduct,
  deleteMySellerProduct,
  getMySellerProducts,
  setMySellerProductVisibility,
  updateMySellerProduct,
  getCategories,
} from "@/lib/api/products";
import { getBrands } from "@/lib/api/brands";
import { useAuth } from "@/hooks/useAuth";
import type { Category, Brand } from "@/types";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { resolveImageUrl } from "@/lib/image";
import { useTranslations, useLocale } from "next-intl";
import { getCategoryName } from "@/lib/categoryName";
import { toast } from "sonner";
import type { Product } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { z } from "zod";

type ProductFormState = {
  name: string;
  description: string;
  price: string;
  stock: string;
  categoryId: string | null;
  brandId: string | null;
  specifications: { key: string; value: string }[];
};

const initialForm: ProductFormState = {
  name: "",
  description: "",
  price: "",
  stock: "",
  categoryId: null,
  brandId: null,
  specifications: [{ key: "", value: "" }],
};

const CATEGORY_SPEC_TEMPLATES: Record<string, string[]> = {
  MIX: ["Вес (кг)", "Тип", "Расход (кг/м²)", "Толщина слоя (мм)", "Время схватывания (ч)", "Температура применения (°C)", "Срок годности"],
  BLK: ["Марка прочности", "Морозостойкость", "Водопоглощение (%)", "Размер (мм)", "Вес (кг)", "Количество в поддоне"],
  ROF: ["Тип", "Ширина (мм)", "Длина рулона (м)", "Вес (кг/м²)", "Срок службы (лет)"],
  INS: ["Толщина (мм)", "Плотность (кг/м³)", "Размер листа (мм)", "Теплопроводность (Вт/м·К)"],
  DRW: ["Тип", "Толщина (мм)", "Размер листа (мм)", "Влагостойкость"],
  PNT: ["Объём (л)", "Степень глянца", "Расход (г/м²)", "Время высыхания (ч)", "Назначение"],
  MTL: ["Толщина (мм)", "Ширина (мм)", "Длина (м)", "Марка стали", "Вес (кг)"],
  FAS: ["Материал", "Размер", "Покрытие", "Количество в упаковке (шт)"],
  TOL: ["Тип инструмента", "Вес (кг)", "Питание", "Гарантия (мес)"],
  PLM: ["Диаметр (мм)", "Длина (м)", "Давление (бар)", "Материал", "Рабочая температура (°C)"],
  ELC: ["Мощность (Вт)", "Напряжение (В)", "Степень защиты (IP)", "Материал", "Длина (м)"],
  FLR: ["Размер (мм)", "Толщина (мм)", "Назначение", "Поверхность", "Страна производитель"],
  WOD: ["Порода дерева", "Влажность (%)", "Сорт", "Размер (мм)"],
  VNT: ["Производительность (м³/ч)", "Диаметр (мм)", "Мощность (Вт)", "Уровень шума (дБ)"],
  DOR: ["Материал", "Размер (мм)", "Цвет", "Открывание", "Замок"],
  RPR: ["Объём/Вес", "Расход", "Время высыхания (ч)", "Назначение"],
  MSH: ["Ячейка (мм)", "Диаметр проволоки (мм)", "Ширина рулона (м)", "Длина (м)"],
  HTG: ["Тип", "Мощность (кВт)", "Объём теплоносителя (л)", "КПД (%)", "Топливо"],
  FPR: ["Расход (г/м²)", "Группа огнезащиты", "Разбавитель", "Время высыхания (ч)"],
  PMP: ["Мощность (Вт)", "Напор (м)", "Производительность (л/ч)", "Диаметр патрубка (мм)"],
  FIN: ["Размер (мм)", "Толщина (мм)", "Поверхность", "Страна", "Цвет"],
  MCH: ["Мощность (Вт)", "Обороты (об/мин)", "Напряжение (В)", "Вес (кг)", "Гарантия (мес)"],
  DRN: ["Диаметр (мм)", "Длина (м)", "Материал", "Давление (бар)"],
  GEN: ["Вес", "Размер", "Материал"],
};

const createProductSchema = z.object({
  name: z.string().min(1, "Product name is required").max(100),
  description: z.string().min(1, "Description is required").max(2000),
  price: z.coerce.number().min(0, "Price must be 0 or higher"),
  stock: z.coerce.number().int().min(0, "Stock must be 0 or higher"),
  categoryId: z.string().min(1, "Category is required"),
  brandId: z.string().optional().nullable(),
});

export default function SellerProductsPage() {
  const t = useTranslations("SellerProducts");
  const locale = useLocale();
  const { user, isAuthenticated, isInitialized } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState<ProductFormState>(initialForm);
  const [createImageFiles, setCreateImageFiles] = useState<File[]>([]);
  const [createPreviews, setCreatePreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState("");
  const [actionProductId, setActionProductId] = useState<string | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [modalError, setModalError] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  // Filtering and Sorting States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("NEWEST");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingForm, setEditingForm] = useState<ProductFormState>(initialForm);
  const [editingKeepImages, setEditingKeepImages] = useState<string[]>([]);
  const [editingNewImages, setEditingNewImages] = useState<File[]>([]);
  const [editingNewPreviews, setEditingNewPreviews] = useState<string[]>([]);
  const [editingLoading, setEditingLoading] = useState(false);

  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState<Product | null>(null);

  const editingProduct = useMemo(
    () => products.find((p) => p.id === editingId) || null,
    [products, editingId],
  );

  const groupedCategories = useMemo(() => {
    const parents = categories.filter((c) => !c.parentId);
    return parents.map((parent) => ({
      parent,
      children: categories.filter((c) => c.parentId === parent.id),
    }));
  }, [categories]);

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
    getCategories().then(setCategories).catch(() => { });
    getBrands().then(setBrands).catch(() => { });
  }, [user, isAuthenticated, isInitialized, router]);

  const MAX_IMAGES = 5;

  const handleAddCreateImages = (files: FileList | null) => {
    if (!files) return;
    const remaining = MAX_IMAGES - createImageFiles.length;
    const newFiles = Array.from(files).slice(0, remaining);
    const newPreviews = newFiles.map((f) => URL.createObjectURL(f));
    setCreateImageFiles((prev) => [...prev, ...newFiles]);
    setCreatePreviews((prev) => [...prev, ...newPreviews]);
  };

  const handleRemoveCreateImage = (idx: number) => {
    URL.revokeObjectURL(createPreviews[idx]);
    setCreateImageFiles((prev) => prev.filter((_, i) => i !== idx));
    setCreatePreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAddEditImages = (files: FileList | null) => {
    if (!files) return;
    const total = editingKeepImages.length + editingNewImages.length;
    const remaining = MAX_IMAGES - total;
    const newFiles = Array.from(files).slice(0, remaining);
    const newPreviews = newFiles.map((f) => URL.createObjectURL(f));
    setEditingNewImages((prev) => [...prev, ...newFiles]);
    setEditingNewPreviews((prev) => [...prev, ...newPreviews]);
  };

  const handleRemoveKeepImage = (idx: number) => {
    setEditingKeepImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleRemoveNewEditImage = (idx: number) => {
    URL.revokeObjectURL(editingNewPreviews[idx]);
    setEditingNewImages((prev) => prev.filter((_, i) => i !== idx));
    setEditingNewPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError("");

    if (createImageFiles.length === 0) {
      setModalError(t("imageRequired"));
      return;
    }

    setLoading(true);

    const parsed = createProductSchema.safeParse({
      name: form.name,
      description: form.description,
      price: form.price,
      stock: form.stock,
      categoryId: form.categoryId ?? "",
      brandId: form.brandId ?? null,
    });

    if (!parsed.success) {
      setModalError(parsed.error.issues[0]?.message ?? "Invalid form data");
      setLoading(false);
      return;
    }

    try {
      await createProduct({
        name: form.name,
        description: form.description,
        price: Number(form.price),
        stock: Number(form.stock),
        categoryId: parsed.data.categoryId,
        brandId: parsed.data.brandId ?? undefined,
        images: createImageFiles,
        specifications: form.specifications.reduce((acc, curr) => {
          if (curr.key.trim() && curr.value.trim()) {
            acc[curr.key.trim()] = curr.value.trim();
          }
          return acc;
        }, {} as Record<string, string>),
      });

      toast.success(t("productCreated"));
      setForm(initialForm);
      createPreviews.forEach((p) => URL.revokeObjectURL(p));
      setCreateImageFiles([]);
      setCreatePreviews([]);
      setModalError("");
      setIsCreateModalOpen(false);
      await loadProducts();
    } catch (err: unknown) {
      setModalError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (product: Product) => {
    editingNewPreviews.forEach((p) => URL.revokeObjectURL(p));
    setEditingNewImages([]);
    setEditingNewPreviews([]);
    const existingImages = product.images && product.images.length > 0
      ? product.images
      : product.imageUrl ? [product.imageUrl] : [];
    setEditingKeepImages(existingImages);
    setEditingId(product.id);
    setEditingForm({
        name: product.name,
        description: product.description,
        price: String(product.price),
        stock: String(product.stock),
        categoryId: product.categoryId ?? null,
        brandId: product.brandId ?? null,
        specifications: product.specifications 
          ? Object.entries(product.specifications).map(([key, value]) => ({ key, value }))
          : [{ key: "", value: "" }],
      });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    setEditingLoading(true);
    setModalError("");

    try {
      const totalImages = editingKeepImages.length + editingNewImages.length;
      if (totalImages === 0) {
        setModalError(t("imageRequired"));
        setEditingLoading(false);
        return;
      }

      await updateMySellerProduct(editingId, {
        name: editingForm.name,
        description: editingForm.description,
        price: Number(editingForm.price),
        stock: Number(editingForm.stock),
        categoryId: editingForm.categoryId ?? undefined,
        brandId: editingForm.brandId ?? undefined,
        keepImages: editingKeepImages,
        newImages: editingNewImages,
        specifications: editingForm.specifications.reduce((acc, curr) => {
          if (curr.key.trim() && curr.value.trim()) {
            acc[curr.key.trim()] = curr.value.trim();
          }
          return acc;
        }, {} as Record<string, string>),
      });

      toast.success(t("productUpdated"));
      setEditingId(null);
      editingNewPreviews.forEach((p) => URL.revokeObjectURL(p));
      setEditingNewImages([]);
      setEditingNewPreviews([]);
      setEditingKeepImages([]);
      setModalError("");
      await loadProducts();
    } catch (err: unknown) {
      setModalError(err instanceof Error ? err.message : "Failed to update product");
    } finally {
      setEditingLoading(false);
    }
  };

  const handleToggleVisibility = async (product: Product) => {
    const activeNow = product.status === "APPROVED";
    setActionProductId(product.id);

    try {
      await setMySellerProductVisibility(product.id, !activeNow);
      toast.success(activeNow ? t("deactivated") : t("activated"));
      await loadProducts();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update visibility");
    } finally {
      setActionProductId(null);
    }
  };

  const handleDelete = (product: Product) => {
    setDeleteConfirmProduct(product);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmProduct) return;
    const product = deleteConfirmProduct;
    setDeleteConfirmProduct(null);
    setActionProductId(product.id);

    try {
      await deleteMySellerProduct(product.id);
      toast.success(t("productDeleted"));
      await loadProducts();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete product");
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

  const addSpecRow = (isEditing: boolean) => {
    if (isEditing) {
      setEditingForm(prev => ({
        ...prev,
        specifications: [...prev.specifications, { key: "", value: "" }]
      }));
    } else {
      setForm(prev => ({
        ...prev,
        specifications: [...prev.specifications, { key: "", value: "" }]
      }));
    }
  };

  const removeSpecRow = (index: number, isEditing: boolean) => {
    if (isEditing) {
      setEditingForm(prev => ({
        ...prev,
        specifications: prev.specifications.filter((_, i) => i !== index)
      }));
    } else {
      setForm(prev => ({
        ...prev,
        specifications: prev.specifications.filter((_, i) => i !== index)
      }));
    }
  };

  const updateSpecRow = (index: number, field: 'key' | 'value', value: string, isEditing: boolean) => {
    if (isEditing) {
      setEditingForm(prev => ({
        ...prev,
        specifications: prev.specifications.map((spec, i) => 
          i === index ? { ...spec, [field]: value } : spec
        )
      }));
    } else {
      setForm(prev => ({
        ...prev,
        specifications: prev.specifications.map((spec, i) => 
          i === index ? { ...spec, [field]: value } : spec
        )
      }));
    }
  };

  return (
    <div className="page-shell max-w-[1440px] space-y-4 md:space-y-6 pb-24 md:pb-32 px-2 md:px-0">

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


      {/* STATUS STRIP */}
      {products.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-0.5 hide-scrollbar mt-1">
          {([
            { key: "ALL", label: t("statsTotal"), count: products.length, color: "#1B4D91" },
            { key: "APPROVED", label: t("statsActive"), count: products.filter((p) => p.status === "APPROVED").length, color: "#10b981" },
            { key: "PENDING", label: t("statsPending"), count: products.filter((p) => p.status === "PENDING").length, color: "#f59e0b" },
            { key: "REJECTED", label: t("statsRejected"), count: products.filter((p) => p.status === "REJECTED").length, color: "#ef4444" },
          ]).map((stat) => (
            <button
              key={stat.key}
              onClick={() => setStatusFilter(stat.key)}
              className={`flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2.5 text-[12px] font-black transition-all border ${
                statusFilter === stat.key
                  ? "text-white shadow-sm border-transparent"
                  : "bg-white border-slate-100 text-slate-500 hover:border-slate-200"
              }`}
              style={statusFilter === stat.key ? { backgroundColor: stat.color, borderColor: stat.color } : {}}
            >
              <span
                className="text-[16px] font-black leading-none"
                style={{ color: statusFilter === stat.key ? "white" : stat.color }}
              >
                {stat.count}
              </span>
              {stat.label}
            </button>
          ))}
        </div>
      )}

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
                <article key={product.id} onClick={() => router.push(`/seller/products/${product.id}`)} className="surface-card rounded-2xl md:rounded-[32px] p-3 md:p-5 shadow-[0_4px_30px_rgb(0,0,0,0.03)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] transition-all border border-slate-100 flex flex-col h-[320px] md:h-[480px] bg-white group overflow-hidden cursor-pointer">

                  {/* Top Header: Image & Quick Info */}
                  <div className="flex flex-col md:flex-col gap-3 md:gap-4 shrink-0">
                    {/* Fixed Size Thumbnail Container */}
                    <div className="w-full relative shrink-0">
                      <div className="aspect-[4/3] md:aspect-[16/10] w-full rounded-xl md:rounded-[24px] bg-slate-50 border border-slate-100 overflow-hidden relative">
                        {product.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
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
                      {/* SKU */}
                      {product.sku && (
                        <p className="text-[10px] md:text-[11px] font-semibold text-slate-400 mb-0.5">Art: {product.sku}</p>
                      )}
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
                      onClick={(e) => { e.stopPropagation(); openEdit(product); }}
                      disabled={actionBusy}
                      className="h-8 md:h-10 px-2 md:px-4 rounded-full bg-slate-100 text-slate-700 font-bold text-[11px] md:text-[13px] hover:bg-slate-200 transition-colors disabled:opacity-50 flex-1 min-w-[30%]"
                    >
                      {t("edit")}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); void handleToggleVisibility(product); }}
                      disabled={actionBusy}
                      className={`h-8 md:h-10 px-2 md:px-4 rounded-full font-bold text-[11px] md:text-[13px] transition-colors disabled:opacity-50 flex-1 min-w-[30%] ${active ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                    >
                      {actionBusy ? "..." : active ? t("hide") : t("activate")}
                    </button>
                    {/* Delete — only for PENDING/REJECTED */}
                    {!active && (
                      <button
                        onClick={(e) => { e.stopPropagation(); void handleDelete(product); }}
                        disabled={actionBusy}
                        className="h-8 md:h-10 w-8 md:px-4 md:w-auto flex items-center justify-center rounded-full bg-red-50 text-[#E31E24] font-bold text-[11px] md:text-[13px] hover:bg-red-100 transition-colors disabled:opacity-50 flex-none"
                        title={t("delete")}
                      >
                        <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    )}
                  </div>

                </article>
              );
            })}
          </div>
        )
        }
      </section >

      {/* CREATE PRODUCT MODAL */}
      {isCreateModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-2 lg:p-6 animate-in fade-in duration-300"
          onMouseDown={(e) => { if(e.target === e.currentTarget) { setIsCreateModalOpen(false); setModalError(""); } }}
        >
          <form
            onSubmit={handleCreate}
            className="w-full max-w-[1400px] max-h-[98vh] rounded-[40px] shadow-[0_40px_120px_rgb(0,0,0,0.3)] flex flex-col relative animate-in zoom-in-95 duration-300 overflow-hidden bg-white text-left"
          >
            {/* Modal Header (Sticky) */}
            <div className="shrink-0 p-6 md:p-8 border-b border-slate-100 flex items-center justify-between bg-white relative z-20">
              <h2 className="text-2xl font-black text-[#1B4D91] flex items-center gap-3">
                <span className="w-10 h-10 rounded-full bg-[#1B4D91]/10 text-[#1B4D91] flex items-center justify-center text-[22px] font-normal">+</span>
                {t("newProductTitle")}
              </h2>
              <button
                type="button"
                onClick={() => { setIsCreateModalOpen(false); setModalError(""); }}
                className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition-all border border-slate-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 md:p-12 space-y-10 hide-scrollbar bg-slate-50/20">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

                {/* Left Column: Basic Info */}
                <div className="lg:col-span-6 space-y-8">
                  <div className="space-y-2">
                    <label className="text-[14px] font-black text-slate-500 uppercase tracking-widest ml-1">{t("productName")}</label>
                    <input
                      name="name"
                      value={form.name}
                      onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                      required
                      className="h-16 w-full rounded-2xl border-2 border-slate-100 bg-white px-6 text-[16px] font-bold transition-all focus:border-[#1B4D91] focus:ring-4 focus:ring-[#1B4D91]/5 focus:outline-none shadow-sm"
                      placeholder={t("productNamePlaceholder")}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[14px] font-black text-slate-500 uppercase tracking-widest ml-1">{t("description")}</label>
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                      required
                      rows={6}
                      className="w-full resize-none rounded-2xl border-2 border-slate-100 bg-white p-6 text-[16px] font-medium transition-all focus:border-[#1B4D91] focus:ring-4 focus:ring-[#1B4D91]/5 focus:outline-none shadow-sm"
                      placeholder={t("descriptionPlaceholder")}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[14px] font-black text-slate-500 uppercase tracking-widest ml-1">{t("price")}</label>
                      <input
                        name="price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.price}
                        onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                        required
                        className="h-16 w-full rounded-2xl border-2 border-slate-100 bg-white px-6 text-[18px] font-black transition-all focus:border-[#E31E24] focus:ring-4 focus:ring-[#E31E24]/5 focus:outline-none shadow-sm text-[#E31E24]"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[14px] font-black text-slate-500 uppercase tracking-widest ml-1">{t("stockAmount")}</label>
                      <input
                        name="stock"
                        type="number"
                        min="0"
                        value={form.stock}
                        onChange={(e) => setForm((p) => ({ ...p, stock: e.target.value }))}
                        required
                        className="h-16 w-full rounded-2xl border-2 border-slate-100 bg-white px-6 text-[16px] font-bold transition-all focus:border-[#1B4D91] focus:ring-4 focus:ring-[#1B4D91]/5 focus:outline-none shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[14px] font-black text-slate-500 uppercase tracking-widest ml-1">{t("category")}</label>
                    <div className="relative">
                      <select
                        value={form.categoryId ?? ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          const category = categories.find(c => c.id === val);
                          const parentCode = category?.parentId
                            ? categories.find(c => c.id === category.parentId)?.code
                            : category?.code;
                          const template = parentCode ? CATEGORY_SPEC_TEMPLATES[parentCode] : null;
                          setForm((p) => ({
                            ...p,
                            categoryId: val || null,
                            specifications: template && p.specifications.every(s => !s.value.trim())
                              ? template.map(k => ({ key: k, value: "" }))
                              : p.specifications
                          }));
                        }}
                        required
                        className="h-16 w-full rounded-2xl border-2 border-slate-100 bg-white px-6 text-[16px] font-bold transition-all focus:border-[#1B4D91] appearance-none shadow-sm"
                      >
                        <option value="">{t("categoryPlaceholder")}</option>
                        {groupedCategories.map(({ parent, children }) =>
                          children.length > 0 ? (
                            <optgroup key={parent.id} label={getCategoryName(parent, locale)}>
                              {children.map((child) => (
                                <option key={child.id} value={child.id}>{getCategoryName(child, locale)}</option>
                              ))}
                            </optgroup>
                          ) : (
                            <option key={parent.id} value={parent.id}>{getCategoryName(parent, locale)}</option>
                          )
                        )}
                      </select>
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[14px] font-black text-slate-500 uppercase tracking-widest ml-1">{t("brand")}</label>
                    <div className="relative">
                      <select
                        value={form.brandId ?? ""}
                        onChange={(e) => setForm((p) => ({ ...p, brandId: e.target.value || null }))}
                        className="h-16 w-full rounded-2xl border-2 border-slate-100 bg-white px-6 text-[16px] font-bold transition-all focus:border-[#1B4D91] appearance-none shadow-sm"
                      >
                        <option value="">{t("brandPlaceholder")}</option>
                        {brands.map((brand) => (
                          <option key={brand.id} value={brand.id}>{brand.name}</option>
                        ))}
                      </select>
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Photos & Specs */}
                <div className="lg:col-span-6 space-y-10">
                  {/* Photo Upload */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between ml-1">
                      <label className="text-[14px] font-black text-slate-500 uppercase tracking-widest">{t("photo")}</label>
                      <span className={`text-[12px] font-bold ${createImageFiles.length >= MAX_IMAGES ? 'text-amber-500' : 'text-slate-400'}`}>
                        {createImageFiles.length}/{MAX_IMAGES}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 ml-1">{t("photoHint")}</p>
                    <div className="grid grid-cols-3 gap-3">
                      {createPreviews.map((src, idx) => (
                        <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border-2 border-[#1B4D91]/20 bg-white shadow-sm group/img">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={src} alt="" className="w-full h-full object-cover" />
                          {idx === 0 && (
                            <span className="absolute top-1.5 left-1.5 bg-[#1B4D91] text-white text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md">Main</span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveCreateImage(idx)}
                            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity hover:bg-red-500"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      ))}
                      {createImageFiles.length < MAX_IMAGES && (
                        <label className="relative aspect-square rounded-2xl border-2 border-dashed border-slate-200 bg-white hover:border-[#1B4D91] hover:bg-[#1B4D91]/5 transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:text-[#1B4D91]">
                          <input type="file" accept="image/*" multiple className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleAddCreateImages(e.target.files)} />
                          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>
                          <span className="text-[11px] font-bold uppercase tracking-wider">{t("chooseFile")}</span>
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Specifications section */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between px-1">
                      <label className="text-[14px] font-black text-slate-500 uppercase tracking-widest ml-1">{t("specifications")}</label>
                      <button
                        type="button"
                        onClick={() => addSpecRow(false)}
                        className="text-xs font-black text-[#1B4D91] hover:text-[#E31E24] transition-colors flex items-center gap-1 uppercase tracking-widest"
                      >
                        <span className="text-xl leading-none">+</span> {t("specAdd")}
                      </button>
                    </div>
                    <div className="space-y-4">
                      {form.specifications.map((spec, idx) => (
                        <div key={idx} className="flex gap-3 animate-in slide-in-from-top-1 duration-200">
                          <input
                            placeholder={t("specKeyPlaceholder")}
                            value={spec.key}
                            onChange={(e) => updateSpecRow(idx, 'key', e.target.value, false)}
                            className="min-w-0 flex-[2] h-12 rounded-xl border-2 border-slate-100 bg-white px-4 text-[14px] font-bold transition-all focus:border-[#1B4D91] focus:outline-none"
                          />
                          <input
                            placeholder={t("specValuePlaceholder")}
                            value={spec.value}
                            onChange={(e) => updateSpecRow(idx, 'value', e.target.value, false)}
                            className="min-w-0 flex-[3] h-12 rounded-xl border-2 border-slate-100 bg-white px-4 text-[14px] font-medium transition-all focus:border-[#1B4D91] focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => removeSpecRow(idx, false)}
                            className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer (Sticky) */}
            <div className="shrink-0 px-8 md:px-10 pt-4 pb-8 md:pb-10 border-t border-slate-100 bg-white flex flex-col gap-3 relative z-20">
              {modalError && (
                <div className="rounded-2xl bg-red-50 border border-red-100 px-5 py-3 text-[14px] font-bold text-[#E31E24]">
                  {modalError}
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setForm(initialForm);
                    createPreviews.forEach((p) => URL.revokeObjectURL(p));
                    setCreateImageFiles([]);
                    setCreatePreviews([]);
                    setModalError("");
                  }}
                  className="h-16 px-10 rounded-full bg-slate-100 text-slate-500 font-black text-sm uppercase tracking-widest whitespace-nowrap hover:bg-slate-200 transition-all hover:text-slate-800"
                >
                  {t("clearDraft")}
                </button>
                <button
                  type="submit"
                  disabled={loading || createImageFiles.length === 0}
                  className="h-16 w-full rounded-full bg-[#E31E24] text-white font-black text-[18px] uppercase tracking-[0.15em] shadow-[0_12px_30px_rgb(227,30,36,0.3)] hover:bg-[#C91A20] hover:-translate-y-0.5 transition-all active:translate-y-0 disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none"
                >
                  {loading ? t("uploading") : t("addProduct")}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* FIXED OVERLAY MODAL FOR EDITING */}
      {editingProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-2 lg:p-6"
          onMouseDown={(e) => { if(e.target === e.currentTarget) { setEditingId(null); setModalError(""); } }}
        >
          <form
            onSubmit={handleSaveEdit}
            className="w-full max-w-[1400px] max-h-[98vh] rounded-[40px] shadow-[0_40px_120px_rgb(0,0,0,0.3)] flex flex-col relative animate-in zoom-in-95 duration-300 overflow-hidden bg-white text-left"
          >
            {/* Header */}
            <div className="shrink-0 p-6 md:p-8 border-b border-slate-100 flex items-center justify-between bg-white z-20">
              <div>
                <h2 className="text-2xl font-black text-[#1B4D91] flex items-center gap-3">
                  <svg className="w-8 h-8 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  {t("editProductTitle")}
                </h2>
                {(() => {
                  const selectedCat = categories.find(c => c.id === editingForm.categoryId);
                  const categoryChanged = editingForm.categoryId && editingForm.categoryId !== editingProduct.categoryId;
                  if (categoryChanged && selectedCat) {
                    return (
                      <p className="text-[13px] font-semibold text-amber-500 mt-1 ml-11">
                        SKU: {selectedCat.code}-XXXXXX <span className="font-normal text-slate-400">(будет присвоен новый артикул)</span>
                      </p>
                    );
                  }
                  if (editingProduct.sku) {
                    return <p className="text-[13px] font-medium text-slate-400 mt-1 ml-11">SKU: {editingProduct.sku}</p>;
                  }
                  return null;
                })()}
              </div>
              <button
                type="button"
                onClick={() => { setEditingId(null); setModalError(""); }}
                className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all border border-slate-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 md:p-12 space-y-10 hide-scrollbar bg-slate-50/20">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Left Column */}
                <div className="lg:col-span-6 space-y-8">
                  <div className="space-y-2">
                    <label className="text-[14px] font-black text-slate-500 uppercase tracking-widest ml-1">{t("productName")}</label>
                    <input
                      value={editingForm.name}
                      onChange={(e) => setEditingForm((p) => ({ ...p, name: e.target.value }))}
                      className="h-16 w-full rounded-2xl border-2 border-slate-100 bg-white px-6 text-[16px] font-bold transition-all focus:border-[#1B4D91] focus:ring-4 focus:ring-[#1B4D91]/5 focus:outline-none shadow-sm"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[14px] font-black text-slate-500 uppercase tracking-widest ml-1">{t("description")}</label>
                    <textarea
                      value={editingForm.description}
                      onChange={(e) => setEditingForm((p) => ({ ...p, description: e.target.value }))}
                      rows={6}
                      className="w-full resize-none rounded-2xl border-2 border-slate-100 bg-white p-6 text-[16px] font-medium transition-all focus:border-[#1B4D91] focus:ring-4 focus:ring-[#1B4D91]/5 focus:outline-none shadow-sm"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[14px] font-black text-slate-500 uppercase tracking-widest ml-1">{t("category")}</label>
                    <div className="relative">
                      <select
                        value={editingForm.categoryId ?? ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          const category = categories.find(c => c.id === val);
                          const parentCode = category?.parentId
                            ? categories.find(c => c.id === category.parentId)?.code
                            : category?.code;
                          const template = parentCode ? CATEGORY_SPEC_TEMPLATES[parentCode] : null;
                          setEditingForm((p) => ({
                            ...p,
                            categoryId: val || null,
                            specifications: template && p.specifications.every(s => !s.value.trim())
                              ? template.map(k => ({ key: k, value: "" }))
                              : p.specifications
                          }));
                        }}
                        className="h-16 w-full rounded-2xl border-2 border-slate-100 bg-white px-6 text-[16px] font-bold transition-all focus:border-[#1B4D91] appearance-none shadow-sm"
                        required
                      >
                        <option value="">{t("categoryPlaceholder")}</option>
                        {groupedCategories.map(({ parent, children }) =>
                          children.length > 0 ? (
                            <optgroup key={parent.id} label={getCategoryName(parent, locale)}>
                              {children.map((child) => (
                                <option key={child.id} value={child.id}>{getCategoryName(child, locale)}</option>
                              ))}
                            </optgroup>
                          ) : (
                            <option key={parent.id} value={parent.id}>{getCategoryName(parent, locale)}</option>
                          )
                        )}
                      </select>
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[14px] font-black text-slate-500 uppercase tracking-widest ml-1">{t("price")}</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editingForm.price}
                        onChange={(e) => setEditingForm((p) => ({ ...p, price: e.target.value }))}
                        className="h-16 w-full rounded-2xl border-2 border-slate-100 bg-white px-6 text-[18px] font-black transition-all focus:border-[#E31E24] text-[#E31E24] shadow-sm"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[14px] font-black text-slate-500 uppercase tracking-widest ml-1">{t("stockAmount")}</label>
                      <input
                        type="number"
                        min="0"
                        value={editingForm.stock}
                        onChange={(e) => setEditingForm((p) => ({ ...p, stock: e.target.value }))}
                        className="h-16 w-full rounded-2xl border-2 border-slate-100 bg-white px-6 text-[16px] font-bold transition-all focus:border-[#1B4D91] shadow-sm"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[14px] font-black text-slate-500 uppercase tracking-widest ml-1">{t("brand")}</label>
                    <div className="relative">
                      <select
                        value={editingForm.brandId ?? ""}
                        onChange={(e) => setEditingForm((p) => ({ ...p, brandId: e.target.value || null }))}
                        className="h-16 w-full rounded-2xl border-2 border-slate-100 bg-white px-6 text-[16px] font-bold transition-all focus:border-[#1B4D91] appearance-none shadow-sm"
                      >
                        <option value="">{t("brandPlaceholder")}</option>
                        {brands.map((brand) => (
                          <option key={brand.id} value={brand.id}>{brand.name}</option>
                        ))}
                      </select>
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="lg:col-span-6 space-y-10">
                  {/* Photo Edit */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between ml-1">
                      <label className="text-[14px] font-black text-slate-500 uppercase tracking-widest">{t("photo")}</label>
                      <span className={`text-[12px] font-bold ${editingKeepImages.length + editingNewImages.length >= MAX_IMAGES ? 'text-amber-500' : 'text-slate-400'}`}>
                        {editingKeepImages.length + editingNewImages.length}/{MAX_IMAGES}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 ml-1">{t("photoHint")}</p>
                    <div className="grid grid-cols-3 gap-3">
                      {editingKeepImages.map((url, idx) => (
                        <div key={`keep-${idx}`} className="relative aspect-square rounded-2xl overflow-hidden border-2 border-[#1B4D91]/20 bg-white shadow-sm group/img">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={resolveImageUrl(url)} alt="" className="w-full h-full object-cover" />
                          {idx === 0 && editingNewImages.length === 0 && (
                            <span className="absolute top-1.5 left-1.5 bg-[#1B4D91] text-white text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md">Main</span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveKeepImage(idx)}
                            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity hover:bg-red-500"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      ))}
                      {editingNewPreviews.map((src, idx) => (
                        <div key={`new-${idx}`} className="relative aspect-square rounded-2xl overflow-hidden border-2 border-emerald-200 bg-white shadow-sm group/img">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={src} alt="" className="w-full h-full object-cover" />
                          <span className="absolute top-1.5 left-1.5 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md">New</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveNewEditImage(idx)}
                            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity hover:bg-red-500"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      ))}
                      {editingKeepImages.length + editingNewImages.length < MAX_IMAGES && (
                        <label className="relative aspect-square rounded-2xl border-2 border-dashed border-slate-200 bg-white hover:border-[#1B4D91] hover:bg-[#1B4D91]/5 transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:text-[#1B4D91]">
                          <input type="file" accept="image/*" multiple className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleAddEditImages(e.target.files)} />
                          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>
                          <span className="text-[11px] font-bold uppercase tracking-wider">{t("changePhoto")}</span>
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Specs Edit */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between px-1">
                      <label className="text-[14px] font-black text-slate-500 uppercase tracking-widest ml-1">{t("specifications")}</label>
                      <button
                        type="button"
                        onClick={() => addSpecRow(true)}
                        className="text-xs font-black text-[#1B4D91] hover:text-[#E31E24] transition-colors flex items-center gap-1 uppercase tracking-widest"
                      >
                        <span className="text-xl leading-none">+</span> {t("specAdd")}
                      </button>
                    </div>
                    <div className="space-y-4">
                      {editingForm.specifications.map((spec, idx) => (
                        <div key={idx} className="flex gap-3 animate-in slide-in-from-top-1 duration-200">
                          <input
                            placeholder={t("specKeyPlaceholder")}
                            value={spec.key}
                            onChange={(e) => updateSpecRow(idx, 'key', e.target.value, true)}
                            className="min-w-0 flex-[2] h-12 rounded-xl border-2 border-slate-100 bg-white px-4 text-[14px] font-bold transition-all focus:border-[#1B4D91] focus:outline-none"
                          />
                          <input
                            placeholder={t("specValuePlaceholder")}
                            value={spec.value}
                            onChange={(e) => updateSpecRow(idx, 'value', e.target.value, true)}
                            className="min-w-0 flex-[3] h-12 rounded-xl border-2 border-slate-100 bg-white px-4 text-[14px] font-medium transition-all focus:border-[#1B4D91] focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => removeSpecRow(idx, true)}
                            className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 px-8 md:px-10 pt-4 pb-8 md:pb-10 border-t border-slate-100 bg-white flex flex-col gap-3 relative z-20">
              {modalError && (
                <div className="rounded-2xl bg-red-50 border border-red-100 px-5 py-3 text-[14px] font-bold text-[#E31E24]">
                  {modalError}
                </div>
              )}
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => { setEditingId(null); setModalError(""); }}
                  className="h-16 px-10 rounded-full bg-slate-100 text-slate-500 font-black text-sm uppercase tracking-widest whitespace-nowrap hover:bg-slate-200 transition-all hover:text-slate-800"
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  disabled={editingLoading}
                  className="h-16 px-12 rounded-full bg-[#1B4D91] text-white font-black text-[18px] uppercase tracking-[0.15em] shadow-[0_12px_30px_rgb(27,77,145,0.3)] hover:bg-[#153a70] hover:-translate-y-0.5 transition-all active:translate-y-0 disabled:opacity-50"
                >
                  {editingLoading ? t("saving") : t("saveChanges")}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
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
