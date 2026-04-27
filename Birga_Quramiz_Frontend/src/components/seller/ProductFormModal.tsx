"use client";

import { useState, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { z } from "zod";
import { toast } from "sonner";
import { createProduct, updateMySellerProduct } from "@/lib/api/products";
import { resolveImageUrl } from "@/lib/image";
import { getCategoryName } from "@/lib/categoryName";
import type { Category, Brand, Product } from "@/types";

// ── Types ──────────────────────────────────────────────────────────────────────
type Spec = { key: string; value: string };

type FormState = {
  name: string;
  description: string;
  price: string;
  stock: string;
  categoryId: string | null;
  brandId: string | null;
  specifications: Spec[];
};

const EMPTY_FORM: FormState = {
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

const schema = z.object({
  name: z.string().min(1, "Product name is required").max(100),
  description: z.string().min(1, "Description is required").max(2000),
  price: z.coerce.number().min(0, "Price must be 0 or higher"),
  stock: z.coerce.number().int().min(0, "Stock must be 0 or higher"),
  categoryId: z.string().min(1, "Category is required"),
  brandId: z.string().optional().nullable(),
});

const MAX_IMAGES = 5;

// ── Props ──────────────────────────────────────────────────────────────────────
interface ProductFormModalProps {
  product?: Product;
  categories: Category[];
  brands: Brand[];
  onSuccess: () => void;
  onClose: () => void;
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function ProductFormModal({
  product,
  categories,
  brands,
  onSuccess,
  onClose,
}: ProductFormModalProps) {
  const t = useTranslations("SellerProducts");
  const locale = useLocale();
  const isEdit = !!product;

  const initialForm: FormState = isEdit
    ? {
        name: product.name,
        description: product.description,
        price: String(product.price),
        stock: String(product.stock),
        categoryId: product.categoryId ?? null,
        brandId: product.brandId ?? null,
        specifications: product.specifications
          ? Object.entries(product.specifications).map(([key, value]) => ({ key, value }))
          : [{ key: "", value: "" }],
      }
    : EMPTY_FORM;

  const [form, setForm] = useState<FormState>(initialForm);
  const [keepImages, setKeepImages] = useState<string[]>(() => {
    if (!isEdit) return [];
    return product.images && product.images.length > 0
      ? product.images
      : product.imageUrl ? [product.imageUrl] : [];
  });
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const totalImages = keepImages.length + newImageFiles.length;

  const groupedCategories = useMemo(() => {
    const parents = categories.filter((c) => !c.parentId);
    return parents.map((parent) => ({
      parent,
      children: categories.filter((c) => c.parentId === parent.id),
    }));
  }, [categories]);

  // ── Image handlers ─────────────────────────────────────────────────────────
  const handleAddImages = (files: FileList | null) => {
    if (!files) return;
    const slots = MAX_IMAGES - totalImages;
    const added = Array.from(files).slice(0, slots);
    const previews = added.map((f) => URL.createObjectURL(f));
    setNewImageFiles((prev) => [...prev, ...added]);
    setNewPreviews((prev) => [...prev, ...previews]);
  };

  const handleRemoveKeep = (idx: number) =>
    setKeepImages((prev) => prev.filter((_, i) => i !== idx));

  const handleRemoveNew = (idx: number) => {
    URL.revokeObjectURL(newPreviews[idx]);
    setNewImageFiles((prev) => prev.filter((_, i) => i !== idx));
    setNewPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  // ── Spec helpers ───────────────────────────────────────────────────────────
  const addSpec = () =>
    setForm((p) => ({ ...p, specifications: [...p.specifications, { key: "", value: "" }] }));

  const removeSpec = (i: number) =>
    setForm((p) => ({ ...p, specifications: p.specifications.filter((_, j) => j !== i) }));

  const updateSpec = (i: number, field: "key" | "value", val: string) =>
    setForm((p) => ({
      ...p,
      specifications: p.specifications.map((s, j) => (j === i ? { ...s, [field]: val } : s)),
    }));

  const handleCategoryChange = (val: string) => {
    const cat = categories.find((c) => c.id === val);
    const parentCode = cat?.parentId
      ? categories.find((c) => c.id === cat.parentId)?.code
      : cat?.code;
    const template = parentCode ? CATEGORY_SPEC_TEMPLATES[parentCode] : null;
    setForm((p) => ({
      ...p,
      categoryId: val || null,
      specifications:
        template && p.specifications.every((s) => !s.value.trim())
          ? template.map((k) => ({ key: k, value: "" }))
          : p.specifications,
    }));
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isEdit && newImageFiles.length === 0) {
      setError(t("imageRequired"));
      return;
    }
    if (isEdit && totalImages === 0) {
      setError(t("imageRequired"));
      return;
    }

    const parsed = schema.safeParse({
      name: form.name,
      description: form.description,
      price: form.price,
      stock: form.stock,
      categoryId: form.categoryId ?? "",
      brandId: form.brandId ?? null,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid form data");
      return;
    }

    const specs = form.specifications.reduce<Record<string, string>>((acc, { key, value }) => {
      if (key.trim() && value.trim()) acc[key.trim()] = value.trim();
      return acc;
    }, {});

    setLoading(true);
    try {
      if (isEdit) {
        await updateMySellerProduct(product.id, {
          name: form.name,
          description: form.description,
          price: Number(form.price),
          stock: Number(form.stock),
          categoryId: form.categoryId ?? undefined,
          brandId: form.brandId ?? undefined,
          keepImages,
          newImages: newImageFiles,
          specifications: specs,
        });
        toast.success(t("productUpdated"));
      } else {
        await createProduct({
          name: form.name,
          description: form.description,
          price: Number(form.price),
          stock: Number(form.stock),
          categoryId: parsed.data.categoryId,
          brandId: parsed.data.brandId ?? undefined,
          images: newImageFiles,
          specifications: specs,
        });
        toast.success(t("productCreated"));
      }
      newPreviews.forEach((p) => URL.revokeObjectURL(p));
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setForm(EMPTY_FORM);
    newPreviews.forEach((p) => URL.revokeObjectURL(p));
    setNewImageFiles([]);
    setNewPreviews([]);
    setError("");
  };

  // ── SKU info (edit only) ───────────────────────────────────────────────────
  const selectedCat = categories.find((c) => c.id === form.categoryId);
  const categoryChanged = isEdit && form.categoryId && form.categoryId !== product.categoryId;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-2 lg:p-6 animate-in fade-in duration-300"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-[1400px] max-h-[98vh] rounded-[40px] shadow-[0_40px_120px_rgb(0,0,0,0.3)] flex flex-col relative animate-in zoom-in-95 duration-300 overflow-hidden bg-white text-left"
      >
        {/* Header */}
        <div className="shrink-0 p-6 md:p-8 border-b border-slate-100 flex items-center justify-between bg-white relative z-20">
          <div>
            <h2 className="text-2xl font-black text-[#1B4D91] flex items-center gap-3">
              {isEdit ? (
                <svg className="w-8 h-8 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              ) : (
                <span className="w-10 h-10 rounded-full bg-[#1B4D91]/10 text-[#1B4D91] flex items-center justify-center text-[22px] font-normal">+</span>
              )}
              {isEdit ? t("editProductTitle") : t("newProductTitle")}
            </h2>
            {isEdit && categoryChanged && selectedCat && (
              <p className="text-[13px] font-semibold text-amber-500 mt-1 ml-11">
                SKU: {selectedCat.code}-XXXXXX <span className="font-normal text-slate-400">(будет присвоен новый артикул)</span>
              </p>
            )}
            {isEdit && !categoryChanged && product.sku && (
              <p className="text-[13px] font-medium text-slate-400 mt-1 ml-11">SKU: {product.sku}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition-all border border-slate-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-12 space-y-10 hide-scrollbar bg-slate-50/20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

            {/* Left: Basic info */}
            <div className="lg:col-span-6 space-y-8">
              <div className="space-y-2">
                <label className="text-[14px] font-black text-slate-500 uppercase tracking-widest ml-1">{t("productName")}</label>
                <input
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
                    type="number" min="0" step="0.01"
                    value={form.price}
                    onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                    required
                    className="h-16 w-full rounded-2xl border-2 border-slate-100 bg-white px-6 text-[18px] font-black transition-all focus:border-[#E31E24] focus:ring-4 focus:ring-[#E31E24]/5 focus:outline-none shadow-sm text-[#E31E24]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[14px] font-black text-slate-500 uppercase tracking-widest ml-1">{t("stockAmount")}</label>
                  <input
                    type="number" min="0"
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
                    onChange={(e) => handleCategoryChange(e.target.value)}
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

            {/* Right: Photos & Specs */}
            <div className="lg:col-span-6 space-y-10">
              {/* Photo upload */}
              <div className="space-y-3">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-[14px] font-black text-slate-500 uppercase tracking-widest">{t("photo")}</label>
                  <span className={`text-[12px] font-bold ${totalImages >= MAX_IMAGES ? "text-amber-500" : "text-slate-400"}`}>
                    {totalImages}/{MAX_IMAGES}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 ml-1">{t("photoHint")}</p>
                <div className="grid grid-cols-3 gap-3">
                  {keepImages.map((url, idx) => (
                    <div key={`keep-${idx}`} className="relative aspect-square rounded-2xl overflow-hidden border-2 border-[#1B4D91]/20 bg-white shadow-sm group/img">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={resolveImageUrl(url)} alt="" className="w-full h-full object-cover" />
                      {idx === 0 && newImageFiles.length === 0 && (
                        <span className="absolute top-1.5 left-1.5 bg-[#1B4D91] text-white text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md">Main</span>
                      )}
                      <button type="button" onClick={() => handleRemoveKeep(idx)}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity hover:bg-red-500">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ))}
                  {newPreviews.map((src, idx) => (
                    <div key={`new-${idx}`} className="relative aspect-square rounded-2xl overflow-hidden border-2 border-emerald-200 bg-white shadow-sm group/img">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" className="w-full h-full object-cover" />
                      {!isEdit && idx === 0 && (
                        <span className="absolute top-1.5 left-1.5 bg-[#1B4D91] text-white text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md">Main</span>
                      )}
                      {isEdit && (
                        <span className="absolute top-1.5 left-1.5 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md">New</span>
                      )}
                      <button type="button" onClick={() => handleRemoveNew(idx)}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity hover:bg-red-500">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ))}
                  {totalImages < MAX_IMAGES && (
                    <label className="relative aspect-square rounded-2xl border-2 border-dashed border-slate-200 bg-white hover:border-[#1B4D91] hover:bg-[#1B4D91]/5 transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:text-[#1B4D91]">
                      <input type="file" accept="image/*" multiple className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleAddImages(e.target.files)} />
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>
                      <span className="text-[11px] font-bold uppercase tracking-wider">{isEdit ? t("changePhoto") : t("chooseFile")}</span>
                    </label>
                  )}
                </div>
              </div>

              {/* Specifications */}
              <div className="space-y-6">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[14px] font-black text-slate-500 uppercase tracking-widest ml-1">{t("specifications")}</label>
                  <button type="button" onClick={addSpec}
                    className="text-xs font-black text-[#1B4D91] hover:text-[#E31E24] transition-colors flex items-center gap-1 uppercase tracking-widest">
                    <span className="text-xl leading-none">+</span> {t("specAdd")}
                  </button>
                </div>
                <div className="space-y-4">
                  {form.specifications.map((spec, idx) => (
                    <div key={idx} className="flex gap-3 animate-in slide-in-from-top-1 duration-200">
                      <input
                        placeholder={t("specKeyPlaceholder")}
                        value={spec.key}
                        onChange={(e) => updateSpec(idx, "key", e.target.value)}
                        className="min-w-0 flex-[2] h-12 rounded-xl border-2 border-slate-100 bg-white px-4 text-[14px] font-bold transition-all focus:border-[#1B4D91] focus:outline-none"
                      />
                      <input
                        placeholder={t("specValuePlaceholder")}
                        value={spec.value}
                        onChange={(e) => updateSpec(idx, "value", e.target.value)}
                        className="min-w-0 flex-[3] h-12 rounded-xl border-2 border-slate-100 bg-white px-4 text-[14px] font-medium transition-all focus:border-[#1B4D91] focus:outline-none"
                      />
                      <button type="button" onClick={() => removeSpec(idx)}
                        className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
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
          {error && (
            <div className="rounded-2xl bg-red-50 border border-red-100 px-5 py-3 text-[14px] font-bold text-[#E31E24]">
              {error}
            </div>
          )}
          <div className={`flex gap-4 ${isEdit ? "justify-end" : "flex-col sm:flex-row"}`}>
            {isEdit ? (
              <>
                <button type="button" onClick={onClose}
                  className="h-16 px-10 rounded-full bg-slate-100 text-slate-500 font-black text-sm uppercase tracking-widest whitespace-nowrap hover:bg-slate-200 transition-all hover:text-slate-800">
                  {t("cancel")}
                </button>
                <button type="submit" disabled={loading}
                  className="h-16 px-12 rounded-full bg-[#1B4D91] text-white font-black text-[18px] uppercase tracking-[0.15em] shadow-[0_12px_30px_rgb(27,77,145,0.3)] hover:bg-[#153a70] hover:-translate-y-0.5 transition-all active:translate-y-0 disabled:opacity-50">
                  {loading ? t("saving") : t("saveChanges")}
                </button>
              </>
            ) : (
              <>
                <button type="button" onClick={handleClear}
                  className="h-16 px-10 rounded-full bg-slate-100 text-slate-500 font-black text-sm uppercase tracking-widest whitespace-nowrap hover:bg-slate-200 transition-all hover:text-slate-800">
                  {t("clearDraft")}
                </button>
                <button type="submit" disabled={loading || newImageFiles.length === 0}
                  className="h-16 w-full rounded-full bg-[#E31E24] text-white font-black text-[18px] uppercase tracking-[0.15em] shadow-[0_12px_30px_rgb(227,30,36,0.3)] hover:bg-[#C91A20] hover:-translate-y-0.5 transition-all active:translate-y-0 disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none">
                  {loading ? t("uploading") : t("addProduct")}
                </button>
              </>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
