"use client";

import { useState, useEffect, useLayoutEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useLocale } from "next-intl";
import { usePathname } from "next/navigation";
import { getCategoryName } from "@/lib/categoryName";
import { Menu, X, ChevronRight } from "lucide-react";
import { getCategories } from "@/lib/api/products";
import type { Category } from "@/types";
import { CATEGORY_ICONS } from "@/lib/constants/categoryIcons";

export default function CatalogBurgerMenu() {
  const locale = useLocale();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeParentId, setActiveParentId] = useState<string | null>(null);
  const [panelTop, setPanelTop] = useState(97);
  const [mounted, setMounted] = useState(false);

  const updatePanelTop = useCallback(() => {
    const header = document.querySelector("header");
    if (header) {
      setPanelTop(Math.max(0, header.getBoundingClientRect().bottom));
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    updatePanelTop();
    window.addEventListener("resize", updatePanelTop);
    window.addEventListener("scroll", updatePanelTop, { passive: true });
    return () => {
      window.removeEventListener("resize", updatePanelTop);
      window.removeEventListener("scroll", updatePanelTop);
    };
  }, [updatePanelTop]);

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const close = () => { setOpen(false); setActiveParentId(null); };

  // Close on any navigation — clicking the logo bypasses the overlay and
  // leaves the menu open with overflow:hidden stuck on body
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    close();
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const parents = categories.filter((c) => !c.parentId);
  const children = categories.filter((c) => c.parentId === activeParentId);
  const activeParent = parents.find((p) => p.id === activeParentId);

  const hasRight = !!activeParentId;

  const portalContent = mounted ? createPortal(
    <>
      {/* ── Backdrop overlay ── */}
      <div
        onClick={close}
        style={{
          position: "fixed",
          inset: 0,
          top: panelTop,
          zIndex: 1998,
          background: "rgba(0,0,0,0.5)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.3s",
        }}
      />

      {/* ── Panel ── */}
      <div
        style={{
          position: "fixed",
          left: 0,
          top: panelTop,
          height: `calc(100dvh - ${panelTop}px)`,
          width: hasRight ? 620 : 270,
          zIndex: 1999,
          display: "flex",
          background: "#fff",
          boxShadow: "4px 0 40px rgba(15,35,80,0.18)",
          transform: open ? "translate(0)" : "translate(-105%)",
          transition: "transform 0.3s, width 0.2s",
          overflow: "hidden",
        }}
      >
        {/* ── Left column ── */}
        <div className="scrollbar-thin-wb w-[270px] shrink-0 overflow-y-auto bg-[#f8f9fb] py-2">
          {parents.length === 0 && (
            <div className="px-5 py-4 text-[13px] text-slate-400">Загрузка...</div>
          )}
          {parents.map((cat) => {
            const Icon = CATEGORY_ICONS[cat.code] ?? CATEGORY_ICONS.DEFAULT;
            const isActive = activeParentId === cat.id;
            return (
              <button
                key={cat.id}
                onMouseEnter={() => setActiveParentId(cat.id)}
                onClick={() => setActiveParentId(cat.id)}
                className={`group relative flex w-full items-center gap-3 px-4 py-[10px] text-left transition-colors ${
                  isActive
                    ? "bg-white text-[#1B4D91]"
                    : "text-[#242424] hover:bg-white hover:text-[#1B4D91]"
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-[#1B4D91]" />
                )}
                <span className={`flex shrink-0 items-center justify-center w-8 h-8 rounded-lg transition-colors ${
                  isActive
                    ? "bg-[#1B4D91]/10 text-[#1B4D91]"
                    : "bg-slate-100 text-slate-500 group-hover:bg-[#1B4D91]/10 group-hover:text-[#1B4D91]"
                }`}>
                  <Icon className="size-4" />
                </span>
                <span className="flex-1 text-[13px] font-semibold leading-snug">{getCategoryName(cat, locale)}</span>
                <ChevronRight className={`size-3.5 shrink-0 transition-colors ${
                  isActive ? "text-[#1B4D91]" : "text-slate-300 group-hover:text-[#1B4D91]"
                }`} />
              </button>
            );
          })}
        </div>

        {/* ── Right column — appears on hover ── */}
        <div
          className="scrollbar-thin-wb overflow-y-auto bg-white px-6 py-5"
          style={{
            width: 350,
            flexShrink: 0,
            opacity: hasRight ? 1 : 0,
            transition: "opacity 0.15s",
            pointerEvents: hasRight ? "auto" : "none",
          }}
        >
          {activeParent && (
            <>
              <Link
                href={`/catalog/category/${activeParent.slug ?? activeParent.id}`}
                onClick={close}
                className="mb-4 flex items-center gap-1.5 text-[16px] font-black text-[#1B4D91] hover:underline"
              >
                {getCategoryName(activeParent, locale)}
                <ChevronRight className="size-4 mt-0.5" />
              </Link>

              {children.length > 0 ? (
                <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                  {children.map((child) => (
                    <Link
                      key={child.id}
                      href={`/catalog/category/${child.slug ?? child.id}`}
                      onClick={close}
                      className="rounded-lg px-2 py-2.5 text-[13px] font-medium text-[#242424] transition hover:bg-slate-50 hover:text-[#1B4D91]"
                    >
                      {getCategoryName(child, locale)}
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-[13px] text-slate-400">Нет подкатегорий</p>
              )}

              {children.length > 0 && (
                <Link
                  href={`/catalog/category/${activeParent.slug ?? activeParent.id}`}
                  onClick={close}
                  className="mt-5 inline-flex items-center gap-1 text-[12px] font-bold text-[#1B4D91]/60 hover:text-[#1B4D91] transition-colors"
                >
                  Все товары раздела
                  <ChevronRight className="size-3" />
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </>,
    document.body
  ) : null;

  return (
    <>
      {/* ── Burger button — same height as search bar (56px) ── */}
      <button
        onClick={() => open ? close() : setOpen(true)}
        aria-label="Open catalog"
        aria-expanded={open}
        className="flex items-center justify-center h-[56px] w-[56px] shrink-0 rounded-full border-2 border-white/25 bg-white/15 text-white transition-colors hover:bg-white/25 active:scale-[0.95]"
      >
        {open
          ? <X className="size-6" strokeWidth={2} />
          : <Menu className="size-6" strokeWidth={2} />
        }
      </button>

      {portalContent}
    </>
  );
}
