"use client";

import { useEffect, useState } from "react";
import { getProducts } from "@/lib/api/products";
import { expandSearchQuery } from "@/lib/search";
import type { PaginatedResponse, Product } from "@/types";

export interface CatalogFilters {
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  categoryId?: string;
  brandId?: string;
}

export type CategoryOption = { id: string; name: string; nameEn?: string | null; nameUz?: string | null };
export type BrandOption = { id: string; name: string };

interface UseCatalogDataResult {
  data: PaginatedResponse<Product> | null;
  loading: boolean;
  isFetching: boolean;
  isLoadingMore: boolean;
  error: string;
  desktopProducts: Product[];
  availableCategories: CategoryOption[];
  availableBrands: BrandOption[];
  basePriceRange: { min: number; max: number };
}

export function useCatalogData(
  page: number,
  search: string,
  filters: CatalogFilters,
): UseCatalogDataResult {
  const [data, setData] = useState<PaginatedResponse<Product> | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [desktopProducts, setDesktopProducts] = useState<Product[]>([]);
  const [availableCategories, setAvailableCategories] = useState<CategoryOption[]>([]);
  const [availableBrands, setAvailableBrands] = useState<BrandOption[]>([]);
  const [basePriceRange, setBasePriceRange] = useState({ min: 0, max: 0 });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (page === 1) { if (!data) setLoading(true); else setIsFetching(true); }
      else setIsLoadingMore(true);

      const expandedSearch = expandSearchQuery(search);
      try {
        const res = await getProducts(
          page, 20, expandedSearch,
          filters.categoryId, filters.minPrice, filters.maxPrice,
          filters.sortBy, filters.brandId,
        );
        if (!cancelled) {
          setError("");
          setData(res);
          setDesktopProducts(prev => page === 1 ? res.data : [...prev, ...res.data]);
          if (!filters.categoryId && !filters.brandId && !filters.minPrice && !filters.maxPrice && res.data.length > 0) {
            const prices = res.data.map((p: { price: number }) => p.price);
            setBasePriceRange({ min: Math.min(...prices), max: Math.max(...prices) });
            const catMap = new Map<string, CategoryOption>();
            const brandMap = new Map<string, BrandOption>();
            for (const p of res.data) {
              if (p.category) catMap.set(p.category.id, { id: p.category.id, name: p.category.name, nameEn: p.category.nameEn, nameUz: p.category.nameUz });
              if (p.brand) brandMap.set(p.brand.id, { id: p.brand.id, name: p.brand.name });
            }
            setAvailableCategories(Array.from(catMap.values()));
            setAvailableBrands(Array.from(brandMap.values()));
          }
        }
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : "error");
      } finally {
        if (!cancelled) { setLoading(false); setIsFetching(false); setIsLoadingMore(false); }
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [page, search, filters]); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, isFetching, isLoadingMore, error, desktopProducts, availableCategories, availableBrands, basePriceRange };
}
