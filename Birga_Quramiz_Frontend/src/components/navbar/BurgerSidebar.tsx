"use client";

import { useEffect } from "react";
import Link from "next/link";
import { X } from "lucide-react";

import { navbarIconMap } from "@/components/navbar/iconMap";
import type { IconKey } from "@/config/navigation";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

type SidebarNavItem = {
  id: string;
  href: string;
  label: string;
  iconKey: IconKey;
};

type SidebarAccountItem = {
  id: string;
  href: string;
  label: string;
};

type BurgerSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  navLinks: SidebarNavItem[];
  actions: SidebarNavItem[];
  accountMenu: SidebarAccountItem[];
  isAuthenticated: boolean;
  userName?: string;
  onLogout: () => void;
  logoutLabel: string;
};

export default function BurgerSidebar({
  isOpen,
  onClose,
  navLinks,
  actions,
  accountMenu,
  isAuthenticated,
  userName,
  onLogout,
  logoutLabel,
}: BurgerSidebarProps) {
  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) return undefined;

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [isOpen, onClose]);

  return (
    <>
      {isOpen ? (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={onClose}
          className="fixed inset-0 z-[999] bg-black/40"
        />
      ) : null}

      <aside
        className={
          isOpen
            ? "fixed top-0 left-0 z-[1000] h-screen w-[85%] max-w-[320px] translate-x-0 bg-white shadow-[0_24px_60px_rgba(15,35,70,0.28)] transition-transform duration-300 ease-in-out md:w-[320px]"
            : "fixed top-0 left-0 z-[1000] h-screen w-[85%] max-w-[320px] -translate-x-full bg-white shadow-[0_24px_60px_rgba(15,35,70,0.28)] transition-transform duration-300 ease-in-out md:w-[320px]"
        }
      >
        <div className="flex h-full flex-col overflow-y-auto">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-4">
            <h2 className="text-[16px] font-black uppercase tracking-[0.12em] text-[#1B4D91]">Catalog</h2>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50"
              aria-label="Close menu"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="border-b border-slate-200 px-3 py-3">
            <p className="mb-2 px-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#2154cb]/70">Navigation</p>
            <div className="space-y-1">
              {navLinks.map((item) => {
                const Icon = navbarIconMap[item.iconKey];
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={onClose}
                    className="flex items-center gap-3 rounded-2xl px-3 py-3 text-[14px] font-bold text-slate-700 transition hover:bg-slate-100"
                  >
                    <Icon className="size-4 text-slate-500" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="border-b border-slate-200 px-3 py-3">
            <p className="mb-2 px-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#2154cb]/70">Actions</p>
            <div className="space-y-1">
              {actions.map((item) => {
                const Icon = navbarIconMap[item.iconKey];
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={onClose}
                    className="flex items-center gap-3 rounded-2xl px-3 py-3 text-[14px] font-bold text-slate-700 transition hover:bg-slate-100"
                  >
                    <Icon className="size-4 text-slate-500" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="px-3 py-3">
            <p className="mb-2 px-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#2154cb]/70">Account</p>
            <div className="space-y-1">
              {isAuthenticated && userName ? (
                <p className="px-3 py-2 text-[13px] font-bold text-slate-500">{userName}</p>
              ) : null}

              {accountMenu.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-2xl px-3 py-3 text-[14px] font-bold text-slate-700 transition hover:bg-slate-100"
                >
                  <span>{item.label}</span>
                </Link>
              ))}

              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onLogout();
                  }}
                  className="mt-2 w-full rounded-2xl border border-red-200 bg-red-50 px-3 py-3 text-left text-[14px] font-bold text-red-700 transition hover:bg-red-100"
                >
                  {logoutLabel}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
