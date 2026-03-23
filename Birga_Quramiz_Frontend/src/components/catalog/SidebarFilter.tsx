"use client"

import { useState, useEffect } from "react"
import { X, Filter, ChevronDown, Check, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"

interface SidebarFilterProps {
    isOpen: boolean
    onClose: () => void
    currentMinPrice?: number
    currentMaxPrice?: number
    currentSortBy?: string
    onApplyFilters: (filters: { minPrice?: number; maxPrice?: number; sortBy?: string }) => void
}

const sortOptions = [
    { value: "newest", label: "Newest Arrivals" },
    { value: "price_asc", label: "Price: Low to High" },
    { value: "price_desc", label: "Price: High to Low" },
]

export default function SidebarFilter({
    isOpen,
    onClose,
    currentMinPrice,
    currentMaxPrice,
    currentSortBy,
    onApplyFilters,
}: SidebarFilterProps) {
    const [minPrice, setMinPrice] = useState<string>(currentMinPrice?.toString() ?? "")
    const [maxPrice, setMaxPrice] = useState<string>(currentMaxPrice?.toString() ?? "")
    const [sortBy, setSortBy] = useState<string>(currentSortBy ?? "newest")
    const [isSortOpen, setIsSortOpen] = useState(true)

    // Sync internal state if props change externally
    useEffect(() => {
        Promise.resolve().then(() => {
            setMinPrice(currentMinPrice?.toString() ?? "")
            setMaxPrice(currentMaxPrice?.toString() ?? "")
            setSortBy(currentSortBy ?? "newest")
        });
    }, [currentMinPrice, currentMaxPrice, currentSortBy])

    const handleApply = () => {
        onApplyFilters({
            minPrice: minPrice ? Number(minPrice) : undefined,
            maxPrice: maxPrice ? Number(maxPrice) : undefined,
            sortBy,
        })
        onClose()
    }

    const handleClear = () => {
        setMinPrice("")
        setMaxPrice("")
        setSortBy("newest")
        onApplyFilters({ minPrice: undefined, maxPrice: undefined, sortBy: "newest" })
    }

    return (
        <>
            {/* Mobile Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-[60] bg-[#1B4D91]/20 backdrop-blur-sm lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar Container */}
            <aside
                className={cn(
                    "fixed inset-y-0 right-0 z-[70] w-full max-w-[320px] bg-white shadow-2xl transition-transform duration-300 ease-in-out lg:sticky lg:top-24 lg:z-0 lg:w-[280px] lg:translate-x-0 lg:bg-white lg:rounded-3xl lg:shadow-sm lg:border lg:border-slate-200/60 lg:h-fit flex flex-col pt-10 px-6 lg:pt-6 lg:px-6 pb-10 min-h-screen lg:min-h-0",
                    isOpen ? "translate-x-0" : "translate-x-full"
                )}
            >
                {/* Mobile Header */}
                <div className="flex items-center justify-between mb-8 lg:hidden">
                    <div className="flex items-center gap-2 text-[#1B4D91]">
                        <Filter className="size-5" />
                        <h2 className="text-lg font-black tracking-tight">Filters</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex size-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                {/* Desktop Header */}
                <div className="hidden items-center justify-between mb-6 lg:flex border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-2 text-[#1B4D91]">
                        <Filter className="size-4.5" />
                        <h2 className="text-[17px] font-black tracking-tight">Filters</h2>
                    </div>
                    <button 
                        onClick={handleClear}
                        className="group flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-[#E31E24] transition-colors"
                    >
                        <RotateCcw className="size-3 group-hover:rotate-[-45deg] transition-transform" />
                        Reset
                    </button>
                </div>

                <div className="flex-1 space-y-8">
                    {/* Price Range */}
                    <div>
                        <h3 className="text-[13px] font-bold text-slate-800 mb-4 flex items-center gap-2">
                            Price Range 
                            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-black">(UZS)</span>
                        </h3>
                        <div className="grid grid-cols-2 gap-2 relative">
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">From</span>
                                <input
                                    type="number"
                                    value={minPrice}
                                    onChange={(e) => setMinPrice(e.target.value)}
                                    className="h-12 w-full rounded-xl border border-slate-200/60 bg-slate-50/50 pl-11 pr-3 text-[14px] font-bold text-[#1B4D91] focus:ring-4 focus:ring-[#1B4D91]/5 focus:border-[#1B4D91]/20 transition-all outline-none"
                                />
                            </div>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">To</span>
                                <input
                                    type="number"
                                    value={maxPrice}
                                    onChange={(e) => setMaxPrice(e.target.value)}
                                    className="h-12 w-full rounded-xl border border-slate-200/60 bg-slate-50/50 pl-9 pr-3 text-[14px] font-bold text-[#1B4D91] focus:ring-4 focus:ring-[#1B4D91]/5 focus:border-[#1B4D91]/20 transition-all outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Sort By */}
                    <div className="border-t border-slate-100 pt-6">
                        <button
                            onClick={() => setIsSortOpen(!isSortOpen)}
                            className="flex w-full items-center justify-between text-[13px] font-bold text-slate-800 mb-4"
                        >
                            <span>Sort By</span>
                            <ChevronDown className={cn("size-4 transition-transform text-slate-400", isSortOpen && "rotate-180")} />
                        </button>

                        <div className={cn("space-y-1.5 transition-all duration-300", isSortOpen ? "max-h-60 opacity-100" : "max-h-0 opacity-0 overflow-hidden")}>
                            {sortOptions.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => setSortBy(option.value)}
                                    className={cn(
                                        "flex w-full items-center justify-between rounded-xl px-4 py-3 text-[13px] transition-all group",
                                        sortBy === option.value
                                            ? "bg-navbar-gradient font-bold text-white shadow-md shadow-[#1B4D91]/20"
                                            : "font-semibold text-slate-600 hover:bg-slate-50 hover:text-[#1B4D91]"
                                    )}
                                >
                                    {option.label}
                                    {sortBy === option.value && <Check className="size-4" />}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-10 flex flex-col gap-3">
                    <button
                        onClick={handleApply}
                        className="w-full rounded-2xl bg-navbar-gradient py-4 text-[14px] font-black text-white shadow-lg shadow-[#1B4D91]/20 active:scale-[0.98] transition-all"
                    >
                        Apply Filters
                    </button>
                    <button
                        onClick={handleClear}
                        className="w-full rounded-2xl bg-slate-100 py-4 text-[13px] font-bold text-slate-500 hover:bg-slate-200 active:scale-[0.98] transition-all lg:hidden"
                    >
                        Clear All
                    </button>
                </div>
            </aside>
        </>
    )
}
