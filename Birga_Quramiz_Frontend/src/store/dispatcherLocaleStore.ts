import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DLocale, Translations } from "@/lib/i18n/dispatcher-translations";
import { TRANSLATIONS } from "@/lib/i18n/dispatcher-translations";

interface DispatcherLocaleStore {
  locale: DLocale;
  setLocale: (l: DLocale) => void;
  t: Translations;
}

export const useDispatcherLocaleStore = create<DispatcherLocaleStore>()(
  persist(
    (set) => ({
      locale: "ru" as DLocale,
      t: TRANSLATIONS.ru,
      setLocale: (locale) => set({ locale, t: TRANSLATIONS[locale] }),
    }),
    {
      name: "dispatcher-locale",
      // Only store locale — t contains functions which are not JSON-serializable
      partialize: (state) => ({ locale: state.locale }),
      // Rehydrate t from TRANSLATIONS after locale is restored from storage
      onRehydrateStorage: () => (state) => {
        if (state) state.t = TRANSLATIONS[state.locale];
      },
    }
  )
);

/** Shorthand hook — returns the translation object for the current locale */
export function useT() {
  return useDispatcherLocaleStore((s) => s.t);
}
