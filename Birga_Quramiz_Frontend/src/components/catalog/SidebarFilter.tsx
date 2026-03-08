"use client"

import { useState, useEffect } from "react"
import { X, Filter, ChevronDown, Check } from "lucide-react"
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
        setMinPrice(currentMinPrice?.toString() ?? "")
        setMaxPrice(currentMaxPrice?.toString() ?? "")
        setSortBy(currentSortBy ?? "newest")
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
                    className="fixed inset-0 z-[60] bg-[#1B4D91]/20 backdrop-blur-sm md:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar Container */}
            <div
                className={cn(
                    "fixed inset-y-0 right-0 z-[70] w-full max-w-[320px] bg-white shadow-2xl transition-transform duration-300 ease-in-out md:static md:w-64 md:translate-x-0 md:bg-transparent md:shadow-none md:z-0 flex flex-col pt-10 px-5 md:pt-0 pb-10 min-h-screen border-l border-slate-200 md:border-none",
                    isOpen ? "translate-x-0" : "translate-x-full"
                )}
            >
                <div className="flex items-center justify-between mb-8 md:hidden">
                    <div className="flex items-center gap-2 text-[#1B4D91]">
                        <Filter className="size-5" />
                        <h2 className="text-lg font-black">Filters</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex size-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                {/* Desktop Header */}
                <div className="hidden items-center gap-2 text-[#1B4D91] mb-6 md:flex">
                    <Filter className="size-5" />
                    <h2 className="text-lg font-black">Filters</h2>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 pb-24 md:pb-0 space-y-8">
                    {/* Price Range */}
                    <div>
                        <h3 className="text-sm font-bold text-slate-700 mb-4">Price Range (UZS)</h3>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                placeholder="Min"
                                value={minPrice}
                                onChange={(e) => setMinPrice(e.target.value)}
                                className="h-11 w-full rounded-xl border-none bg-slate-100 px-3 text-sm font-semibold text-[#1B4D91] focus:ring-2 focus:ring-[#1B4D91]/20 transition-all"
                            />
                            <span className="text-slate-400 font-bold">-</span>
                            <input
                                type="number"
                                placeholder="Max"
                                value={maxPrice}
                                onChange={(e) => setMaxPrice(e.target.value)}
                                className="h-11 w-full rounded-xl border-none bg-slate-100 px-3 text-sm font-semibold text-[#1B4D91] focus:ring-2 focus:ring-[#1B4D91]/20 transition-all"
                            />
                        </div>
                    </div>

                    {/* Sort By */}
                    <div className="border-t border-slate-100 pt-6">
                        <button
                            onClick={() => setIsSortOpen(!isSortOpen)}
                            className="flex w-full items-center justify-between text-sm font-bold text-slate-700 mb-4"
                        >
                            <span>Sort By</span>
                            <ChevronDown className={cn("size-4 transition-transform", isSortOpen && "rotate-180")} />
                        </button>

                        {isSortOpen && (
                            <div className="space-y-2">
                                {sortOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => setSortBy(option.value)}
                                        className={cn(
                                            "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-all",
                                            sortBy === option.value
                                                ? "bg-[#1B4D91]/5 font-bold text-[#1B4D91]"
                                                : "font-semibold text-slate-500 hover:bg-slate-50"
                                        )}
                                    >
                                        {option.label}
                                        {sortBy === option.value && <Check className="size-4" />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-8 flex gap-3 pb-8 md:pb-0">
                    <button
                        onClick={handleClear}
                        className="flex-1 rounded-xl bg-slate-100 py-3.5 text-sm font-bold text-slate-500 hover:bg-slate-200 active:scale-[0.98] transition-all"
                    >
                        Clear
                    </button>
                    <button
                        onClick={handleApply}
                        className="flex-[2] rounded-xl bg-[#E31E24] py-3.5 text-sm font-bold text-white hover:bg-[#C91A20] shadow-lg shadow-[#E31E24]/20 active:scale-[0.98] transition-all"
                    >
                        Apply Filters
                    </button>
                </div>
            </div>
        </>
    )
}
