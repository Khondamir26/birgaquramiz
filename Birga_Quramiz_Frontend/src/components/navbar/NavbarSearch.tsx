import { useRef } from "react";
import { Search, X } from "lucide-react";

import SearchPanel, { type SearchPanelItem } from "@/components/navbar/SearchPanel";

type NavbarSearchProps = {
  query: string;
  setQuery: (value: string) => void;
  isFocused: boolean;
  setFocused: (value: boolean) => void;
  results: SearchPanelItem[];
  showPanel: boolean;
  onSelectResult: (item: SearchPanelItem) => void;
  onSearch: () => void;
  searchLabel: string;
  loading?: boolean;
};

export default function NavbarSearch({
  query,
  setQuery,
  isFocused,
  setFocused,
  results,
  showPanel,
  onSelectResult,
  onSearch,
  searchLabel,
  loading,
}: NavbarSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSelect = (item: SearchPanelItem) => {
    inputRef.current?.blur();
    onSelectResult(item);
  };

  return (
    <div className="relative min-w-0 flex-1">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          inputRef.current?.blur();
          onSearch();
        }}
        className={
          isFocused
            ? "flex h-[58px] items-center rounded-full border border-white/80 bg-white pl-5 pr-2 shadow-[0_16px_40px_rgba(11,36,103,0.28)] transition-all duration-200"
            : "flex h-[58px] items-center rounded-full border border-white/25 bg-white pl-5 pr-2 shadow-[0_12px_32px_rgba(11,36,103,0.2)] transition-all duration-200"
        }
      >
        <Search className="mr-3 size-5 shrink-0 text-slate-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => window.setTimeout(() => setFocused(false), 120)}
          placeholder={searchLabel + "..."}
          className="h-full min-w-0 flex-1 bg-transparent text-[16px] font-bold text-slate-700 outline-none placeholder:font-medium placeholder:text-slate-400"
        />

        <div className="flex items-center gap-2">
          {query && (
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => setQuery("")}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              aria-label="Clear search"
            >
              <X className="size-5" />
            </button>
          )}

          <button
            type="submit"
            className="flex h-[46px] items-center rounded-full bg-navbar-gradient px-7 text-[13px] font-black uppercase tracking-wider text-white transition-all hover:shadow-lg hover:shadow-[#1B4D91]/30 active:scale-95 shadow-[0_8px_20px_rgba(27,77,145,0.25)]"
          >
            {searchLabel}
          </button>
        </div>
      </form>

      {showPanel ? <SearchPanel query={query} results={results} onPick={handleSelect} loading={loading} /> : null}
    </div>
  );
}
