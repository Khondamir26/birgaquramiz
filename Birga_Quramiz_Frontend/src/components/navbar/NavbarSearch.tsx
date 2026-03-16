"use client"

import { useRef } from "react"
import { Search, X } from "lucide-react"

import SearchPanel, { type SearchPanelItem } from "@/components/navbar/SearchPanel"

type NavbarSearchProps = {
  query: string
  setQuery: (value: string) => void
  isFocused: boolean
  setFocused: (value: boolean) => void
  results: SearchPanelItem[]
  showPanel: boolean
  onSelectResult: (item: SearchPanelItem) => void
  onSearch: () => void
  searchLabel: string
  loading?: boolean
}

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
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSelect = (item: SearchPanelItem) => {
    inputRef.current?.blur()
    onSelectResult(item)
  }

  const hasQuery = query.trim().length > 0

  return (
    <div className="relative min-w-0 flex-1">
      <form
        onSubmit={(event) => {
          event.preventDefault()
          if (!hasQuery) return
          inputRef.current?.blur()
          onSearch()
        }}
        className={`
          flex h-[56px] items-center rounded-full bg-white pl-5 pr-2
          border transition-all duration-200
          ${isFocused
            ? "border-white shadow-[0_18px_45px_rgba(11,36,103,0.28)]"
            : "border-white/30 shadow-[0_12px_28px_rgba(11,36,103,0.18)]"
          }
        `}
      >
        {/* LEFT ICON */}
        <Search className="mr-3 size-5 shrink-0 text-slate-400" />

        {/* INPUT */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => window.setTimeout(() => setFocused(false), 120)}
          placeholder={searchLabel + "..."}
          className="
            h-full min-w-0 flex-1 bg-transparent
            text-[15px] font-semibold text-slate-700
            outline-none
            placeholder:text-slate-400 placeholder:font-medium
          "
        />

        {/* RIGHT ACTIONS */}
        <div className="flex items-center gap-1">

          {/* CLEAR */}
          {hasQuery && (
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => setQuery("")}
              className="
                inline-flex h-9 w-9 items-center justify-center
                rounded-full text-slate-400
                transition
                hover:text-slate-600
              "
              aria-label="Clear search"
            >
              <X className="size-5" />
            </button>
          )}

          {/* SEARCH BUTTON (APPEARS ONLY WHEN TYPING) */}
          {/* {hasQuery && (
            <button
              type="submit"
              className="
                flex h-10 w-10 items-center justify-center
                rounded-2xl
                text-black
                transition
              "
              aria-label="Search"
            >
              <Search size={20} />
            </button>
          )} */}

        </div>
      </form>

      {showPanel && (
        <SearchPanel
          query={query}
          results={results}
          onPick={handleSelect}
          loading={loading}
        />
      )}
    </div>
  )
}