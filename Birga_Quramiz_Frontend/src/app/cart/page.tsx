"use client";

import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cartStore";
import { useFavoritesStore } from "@/store/favoritesStore";
import { useTranslations } from "next-intl";
import { resolveImageUrl } from "@/lib/image";
import { 
  ShoppingBag, 
  Trash2, 
  Minus, 
  Plus, 
  Heart,
  Info,
  Check,
  ChevronRight
} from "lucide-react";
import Link from "next/link";
import EmptyState from "@/components/ui/EmptyState";
import { useState, useEffect, startTransition } from "react";
import Image from "next/image";

export default function CartPage() {
  const router = useRouter();
  const { items, removeItem, increment, decrement, clearCart } = useCartStore();
  const { toggleFavorite, isFavorite } = useFavoritesStore();
  const t = useTranslations("Cart");

  const [selectedItems, setSelectedItems] = useState<string[]>(items.map(i => i.id));

  // Keep selectedItems in sync: add newly added items, remove deleted ones
  useEffect(() => {
    const itemIds = new Set(items.map(i => i.id));
    startTransition(() => {
      setSelectedItems(prev => {
        const pruned = prev.filter(id => itemIds.has(id));
        const newIds = items.map(i => i.id).filter(id => !prev.includes(id));
        return [...pruned, ...newIds];
      });
    });
  }, [items]);

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const toggleSelectAll = () => {
    if (selectedItems.length === items.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(items.map(i => i.id));
    }
  };

  const toggleItemSelection = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  if (items.length === 0) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title={t("emptyTitle")}
        description={t("emptyText")}
        buttonText={t("goMarketplace")}
        buttonHref="/catalog"
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F2F5] pb-32 md:pb-20 pt-6 md:pt-10">
      <div className="max-w-[1440px] mx-auto px-4 md:px-10">
        <h1 className="text-[24px] md:text-[32px] font-bold text-black mb-6 md:mb-8 flex items-baseline gap-2">
          {t("title")}
          <span className="text-slate-400 text-[18px] md:text-[20px] font-normal">{itemCount}</span>
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_390px] gap-6 md:gap-8 items-start">
          {/* --- Left Column: Items --- */}
          <div className="flex flex-col gap-4">
            {/* Select All Card */}
            <div className="bg-white rounded-[24px] md:rounded-[24px] p-3 md:p-3 flex items-center justify-between shadow-sm border border-slate-100">
               <div className="flex items-center gap-3">
                  <label className="relative flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="peer sr-only"
                      checked={selectedItems.length === items.length}
                      onChange={toggleSelectAll}
                    />
                    <div className="size-5 rounded-md border-2 border-slate-200 peer-checked:bg-[#275fdb] peer-checked:border-[#275fdb] transition-all flex items-center justify-center">
                      <Check className="size-3 text-white" strokeWidth={3} />
                    </div>
                    <span className="ml-2 md:ml-2.5 text-[14px] md:text-[16px] font-semibold text-slate-900">{t("selectAll")}</span>
                  </label>
               </div>
               <button 
                onClick={clearCart}
                className="size-8 md:size-9 flex items-center justify-center rounded-lg md:rounded-xl  text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
               >
                 <Trash2 className="size-4" />
               </button>
            </div>

            {/* List Container Card */}
            <div className="bg-white rounded-[24px] overflow-hidden shadow-sm border border-slate-100">
              <div className="p-4 flex flex-col gap-4">
                {/* Header Section */}
                <div className="bg-[#F2F4F7] px-5 py-3 rounded-[16px]">
                  <h2 className="text-[16px] md:text-[17px] font-bold text-black">{t("availableForOrder")}</h2>
                </div>

                {/* Items List */}
                <div className="flex flex-col gap-2">
                  {items.map((item, index) => (
                    <div 
                      key={item.id}
                      className={`flex flex-col md:flex-row md:items-center gap-4 md:gap-6 p-4 md:p-6 ${index !== items.length - 1 ? 'border-b border-slate-50' : ''}`}
                    >
                      <div className="flex items-center gap-6 flex-1">
                        {/* Image with Checkbox Overlay (Top-Left) */}
                        <div className="shrink-0 relative">
                          <Link href={`/catalog/product/${item.id}`}>
                            <div className="size-20 md:size-24 flex items-center justify-center p-1 mt-1">
                            <Image 
                                src={resolveImageUrl(item.image)} 
                                alt={item.name} 
                                width={100}
                                height={100}
                                className="h-full w-full object-contain" 
                              />
                            </div>
                          </Link>
                          
                          <label className="absolute -top-1 -left-1 flex items-center cursor-pointer z-10">
                            <input 
                              type="checkbox" 
                              className="peer sr-only"
                              checked={selectedItems.includes(item.id)}
                              onChange={() => toggleItemSelection(item.id)}
                            />
                            <div className="size-5 rounded-md border-2 border-slate-100 bg-white peer-checked:bg-[#275fdb] peer-checked:border-[#275fdb] transition-all flex items-center justify-center shadow-sm">
                              <Check className="size-3 text-white" strokeWidth={5} />
                            </div>
                          </label>
                        </div>

                        {/* Details Area */}
                        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                          <Link href={`/catalog/product/${item.id}`}>
                            <h3 className="text-[16px] md:text-[18px] font-bold text-black leading-tight line-clamp-2 md:line-clamp-1">
                              {item.name}
                            </h3>
                          </Link>
                          
                          {item.stock !== undefined && (
                            <div className="inline-flex px-3 py-1 rounded-[8px] bg-[#FFF7ED] w-fit">
                              <p className="text-[12px] font-bold text-[#ff8a00]">
                                {t("piecesLeft", { count: item.stock ?? 0 })}
                              </p>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-3 mt-0.5">
                            <button
                              onClick={() => toggleFavorite({
                                id: item.id,
                                sku: item.sku,
                                slug: item.id,
                                sellerId: '',
                                name: item.name,
                                description: '',
                                imageUrl: item.image,
                                images: [item.image],
                                price: item.price,
                                stock: item.stock ?? 0,
                                status: 'APPROVED',
                                createdAt: '',
                                brand: item.brandName ? { id: '', name: item.brandName, slug: '', logoUrl: '', featured: false, createdAt: '' } : null,
                                seller: item.sellerCompany ? { id: '', userId: '', company: item.sellerCompany, verified: false } : undefined,
                              })}
                              className={`size-10 flex items-center justify-center rounded-[12px] bg-[#F8FAFC] transition-all ${isFavorite(item.id) ? 'text-[#E31E24]' : 'text-slate-400 hover:text-[#E31E24]'} hover:bg-slate-50`}
                            >
                              <Heart className={`size-5 ${isFavorite(item.id) ? 'fill-current' : ''}`} />
                            </button>
                            <button 
                              onClick={() => removeItem(item.id)}
                              className="size-10 flex items-center justify-center rounded-[12px] bg-[#F8FAFC] text-slate-400 hover:text-red-500 hover:bg-slate-50 transition-all"
                            >
                              <Trash2 className="size-5" />
                            </button>
                          </div>
                        </div>

                        {/* Price Area */}
                        <div className="hidden md:flex flex-col items-center justify-center min-w-[200px]">
                          <p className="text-[20px] font-bold text-black tracking-tight">
                            {item.price.toLocaleString("ru-RU")} UZS
                          </p>
                        </div>

                        {/* Qty Selector (Far Right) */}
                        <div className="hidden md:block shrink-0 px-2 pl-4">
                          <div className="flex items-center bg-[#F1F5F9]/70 rounded-[14px] p-1 border border-slate-100">
                            <button
                              disabled={item.quantity <= 1}
                              onClick={() => item.quantity > 1 && decrement(item.id)}
                              className={`size-9 flex items-center justify-center rounded-[10px] transition-all ${
                                item.quantity <= 1 
                                  ? "text-slate-300 opacity-50" 
                                  : "text-slate-400 hover:text-[#275fdb]"
                              }`}
                            >
                              <Minus className="size-4" strokeWidth={3} />
                            </button>
                            <span className="w-10 text-center text-[16px] font-black text-black tabular-nums">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => increment(item.id)}
                              className="size-9 flex items-center justify-center rounded-[10px] text-slate-400 hover:text-[#275fdb] transition-all"
                            >
                              <Plus className="size-4" strokeWidth={3} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Mobile Layout Adjustment */}
                      <div className="md:hidden flex items-center justify-between gap-4 pt-1 ml-9">
                        <p className="text-[18px] font-black text-black">
                          {item.price.toLocaleString("ru-RU")} <span className="text-[12px] text-slate-300">UZS</span>
                        </p>
                        <div className="flex items-center bg-[#F1F5F9]/70 rounded-[12px] p-1 border border-slate-100">
                            <button
                              disabled={item.quantity <= 1}
                              onClick={() => item.quantity > 1 && decrement(item.id)}
                              className={`size-8 flex items-center justify-center rounded-lg transition-all ${
                                item.quantity <= 1 
                                  ? "text-slate-300 cursor-not-allowed opacity-50" 
                                  : "text-slate-400"
                              }`}
                            >
                              <Minus className="size-4" strokeWidth={3} />
                            </button>
                            <span className="w-8 text-center text-[15px] font-black text-black">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => increment(item.id)}
                              className="size-8 flex items-center justify-center rounded-lg text-slate-400"
                            >
                              <Plus className="size-4" strokeWidth={3} />
                            </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* --- Right Column: Summary --- */}
          <aside className="hidden lg:block sticky top-10">
            <div className="bg-white rounded-[24px] p-8 shadow-sm border border-slate-100">
              {/* Primary Action at the Top */}
              <button
                onClick={() => router.push("/checkout")}
                className="w-full flex items-center justify-center h-16 rounded-full bg-[#275fdb] hover:bg-[#1B4D91] text-[16px] font-bold text-white shadow-xl shadow-[#275fdb]/20 transition-all mb-6 group"
              >
                <span>{t("proceed")}</span>
                <ChevronRight className="size-5 ml-1 group-hover:translate-x-1 transition-transform" />
              </button>

              <p className="text-[12px] font-medium text-slate-400 leading-relaxed mb-8">
                {t("deliveryAtCheckout")}
              </p>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="text-[18px] font-black text-black">{t("yourCart")}</h3>
                    <span className="text-[13px] text-slate-400 font-semibold">{t("productsCount", { count: itemCount })}</span>
                  </div>
                  <div className="flex justify-between items-baseline text-[14px]">
                    <span className="font-semibold text-slate-400">{t("items")} ({itemCount})</span>
                    <span className="font-black text-black">{total.toLocaleString("ru-RU")} UZS</span>
                  </div>
                </div>

                <div className="h-px bg-slate-100 w-full" />

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[18px] font-black text-black">{t("totalCost")}</span>
                    <Info className="size-4 text-slate-300" />
                  </div>
                  <p className="text-[22px] font-black text-black">
                    {total.toLocaleString("ru-RU")} UZS
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* --- Optimized Mobile Floating Bottom Bar --- */}
      <div className="fixed bottom-[72px] left-0 right-0 z-40 lg:hidden">
        <div className="mx-4 mb-4 rounded-[32px] bg-white/95 backdrop-blur-xl border border-slate-200/50 shadow-[0_12px_48px_rgba(0,0,0,0.18)] px-5 py-4 flex items-center justify-between">
            <div className="flex flex-col">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#275fdb] mb-0.5">{t("totalCost")}</p>
              <p className="text-[20px] font-black text-black leading-none">
                {total.toLocaleString("ru-RU")}
                <span className="text-[12px] ml-1 text-slate-300 uppercase">UZS</span>
              </p>
            </div>
            <button
              onClick={() => router.push("/checkout")}
              className="h-14 px-8 rounded-full bg-[#275fdb] flex items-center justify-center gap-2 text-[15px] font-black text-white shadow-lg shadow-[#275fdb]/25 active:scale-95 transition-all"
            >
              <span>{t("checkout")}</span>
              <ChevronRight className="size-4" strokeWidth={3} />
            </button>
        </div>
      </div>
    </div>
  );
}

