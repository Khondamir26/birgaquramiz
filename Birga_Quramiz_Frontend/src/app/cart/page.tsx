"use client";

import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cartStore";
import { useTranslations } from "next-intl";
import { resolveImageUrl } from "@/lib/image";
import { ShoppingBag, Trash2, Minus, Plus, ArrowRight } from "lucide-react";
import Link from "next/link";

// -- Brand colours -------------------------------------------------------------
// Primary Blue #1B4D91 | Accent Red #E31E24
// -----------------------------------------------------------------------------

export default function CartPage() {
  const router = useRouter();
  const { items, removeItem, increment, decrement } = useCartStore();
  const t = useTranslations("Cart");

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  /* -- Empty State -- */
  if (items.length === 0) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-8 text-center pt-12 md:pt-0">
        <div className="relative mb-8 md:mb-10">
          <div className="flex size-28 md:size-40 items-center justify-center rounded-full bg-[#1B4D91]/5">
            <ShoppingBag className="size-14 md:size-20 text-[#1B4D91]/15" />
          </div>
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-[#1B4D91]">{t("emptyTitle")}</h1>
        <p className="mt-2 md:mt-3 max-w-[220px] md:max-w-xs text-[13px] md:text-[15px] font-medium text-slate-400">{t("emptyText")}</p>
        <button
          onClick={() => router.push("/catalog")}
          className="mt-10 h-13 md:h-14 w-full max-w-xs md:max-w-sm rounded-2xl bg-[#1B4D91] hover:bg-[#143d75] text-[14px] md:text-[15px] font-black text-white shadow-lg shadow-[#1B4D91]/20 active:scale-[0.97] transition-all"
        >
          {t("goMarketplace")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f6fa] pb-48 md:pb-16 md:page-shell w-full relative">

      {/* -- Top Header -- */}
      <div className="sticky top-0 z-30 bg-white md:bg-transparent px-5 pt-6 pb-4 shadow-sm md:static md:shadow-none md:px-0 md:pt-10 w-full max-w-4xl mx-auto md:flex md:items-center md:justify-between">
        <div className="flex md:flex-col items-end md:items-start justify-between md:justify-start w-full md:w-auto">
          <div>
            <h1 className="text-xl md:text-3xl font-black text-[#1B4D91]">{t("title")}</h1>
            <p className="text-[12px] md:text-[14px] font-medium text-slate-400 mt-0.5 md:mt-1">
              {itemCount} {itemCount === 1 ? "�����" : itemCount < 5 ? "������" : "�������"}
            </p>
          </div>
          <button
            onClick={() => useCartStore.getState().clearCart()}
            className="md:hidden rounded-xl border border-[#E31E24]/20 px-4 py-2 text-[11px] font-black uppercase tracking-wide text-[#E31E24] active:bg-[#E31E24]/5 transition-colors"
          >
            ��������
          </button>
        </div>

        {/* Desktop Clear Button */}
        <button
          onClick={() => useCartStore.getState().clearCart()}
          className="hidden md:flex rounded-full border border-[#E31E24]/30 px-6 py-2.5 text-[12px] font-black uppercase tracking-wider text-[#E31E24] hover:bg-[#E31E24]/5 transition-colors"
        >
          ��������
        </button>
      </div>

      {/* -- Layout -- */}
      <div className="px-4 pt-4 md:px-0 md:w-full md:max-w-4xl md:mx-auto flex flex-col gap-6 md:mt-4">

        {/* Items list */}
        <section className="flex flex-col gap-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-start md:items-center gap-4 md:gap-8 rounded-3xl md:rounded-[32px] bg-white p-4 md:p-6 md:pl-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-slate-100 transition-all hover:bg-slate-50/50"
            >
              {/* Image */}
              <Link href={`/catalog/product/${item.id}`} className="shrink-0">
                <div className="size-24 md:size-[140px] overflow-hidden rounded-2xl md:rounded-[24px] bg-slate-50 border border-slate-100/60 flex items-center justify-center p-2">
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={resolveImageUrl(item.image)} alt={item.name} className="h-full w-full object-contain p-1" />
                  ) : (
                    <ShoppingBag className="size-8 text-slate-200" />
                  )}
                </div>
              </Link>

              {/* Info */}
              <div className="flex flex-1 flex-col gap-2 min-w-0 self-stretch justify-center py-1 md:py-4">
                <div>
                  <p className="line-clamp-2 text-[14px] md:text-[18px] font-bold leading-snug text-[#1B4D91] hover:underline md:mb-1">{item.name}</p>
                  <p className="text-[15px] md:text-[22px] font-black text-[#1B4D91]">
                    {(item.price * item.quantity).toLocaleString("ru-RU")}{" "}
                    <span className="text-[12px] md:text-[14px] font-semibold text-slate-400">���</span>
                  </p>
                </div>

                {/* Qty + delete row */}
                <div className="flex items-center gap-4 mt-2 md:mt-4">
                  <div className="flex items-center h-10 md:h-[48px] md:w-[140px] rounded-xl md:rounded-full border-2 md:border border-[#1B4D91]/15 md:border-slate-200 md:bg-white bg-[#f4f6fa] overflow-hidden">
                    <button
                      onClick={() => decrement(item.id)}
                      className="flex size-10 md:h-full md:flex-1 items-center justify-center text-[#1B4D91] font-black hover:bg-[#1B4D91]/5 transition-colors text-lg"
                    >
                      <Minus className="size-3.5 md:size-4" />
                    </button>
                    <span className="min-w-[32px] md:w-12 text-center text-[14px] md:text-[16px] font-black text-[#1B4D91] tabular-nums">{item.quantity}</span>
                    <button
                      onClick={() => increment(item.id)}
                      className="flex size-10 md:h-full md:flex-1 items-center justify-center text-[#1B4D91] font-black hover:bg-[#1B4D91]/5 transition-colors text-lg"
                    >
                      <Plus className="size-4" />
                    </button>
                  </div>

                  <button
                    onClick={() => removeItem(item.id)}
                    className="flex size-10 items-center justify-center rounded-xl md:rounded-full text-slate-300 hover:text-[#E31E24] hover:bg-red-50 transition-colors md:ml-2"
                  >
                    <Trash2 className="size-4 md:size-[18px]" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* -- Desktop order summary -- */}
        <aside className="hidden md:flex flex-col rounded-[32px] bg-white border border-slate-100 shadow-[0_4px_30px_rgb(0,0,0,0.03)] p-8 md:p-10 space-y-6 w-full">
          <h2 className="text-[22px] font-black text-[#1B4D91]">{t("summary")}</h2>

          <div className="space-y-4 text-[14px] font-semibold text-slate-500 w-full mb-4">
            <div className="flex justify-between w-full">
              <span>{t("items")}</span>
              <span className="text-[#1B4D91] font-bold">{itemCount}</span>
            </div>
            <div className="flex justify-between w-full">
              <span>{t("delivery")}</span>
              <span className="text-[#1B4D91] font-bold">Selected during checkout</span>
            </div>
          </div>

          <div className="w-full">
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">�������� �����</p>
            <p className="text-[36px] font-black text-[#E31E24] leading-none mb-6">
              {total.toLocaleString("ru-RU")} <span className="text-[18px] text-[#1B4D91] ml-2">UZS</span>
            </p>

            <button
              onClick={() => router.push("/checkout")}
              className="flex w-full items-center justify-center gap-2 h-14 rounded-full bg-[#E31E24] hover:bg-[#C91A20] text-[15px] font-black text-white shadow-lg shadow-[#E31E24]/20 active:scale-95 transition-all mb-4"
            >
              Proceed to checkout <ArrowRight className="size-5" />
            </button>
            <Link
              href="/catalog"
              className="flex w-full items-center justify-center h-14 rounded-full border border-slate-200 hover:bg-slate-50 text-[14px] font-bold text-[#1B4D91] transition-colors"
            >
              Continue shopping
            </Link>
          </div>
        </aside>
      </div>

      {/* -- Mobile sticky checkout bar -- */}
      <div className="fixed bottom-[72px] left-0 right-0 z-40 border-t border-slate-100 bg-white/96 backdrop-blur-md px-5 py-4 md:hidden shadow-[0_-4px_20px_rgba(27,77,145,0.06)]">
        <div className="flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{t("summary")}</p>
            <p className="text-[18px] font-black text-[#1B4D91] truncate">{total.toLocaleString("ru-RU")} UZS</p>
          </div>
          <button
            onClick={() => router.push("/checkout")}
            className="flex flex-[1.1] items-center justify-center gap-2 h-13 rounded-2xl bg-[#E31E24] text-[13px] font-black text-white shadow-lg shadow-[#E31E24]/20 active:scale-[0.97] transition-transform"
          >
            {t("proceed")} <ArrowRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

