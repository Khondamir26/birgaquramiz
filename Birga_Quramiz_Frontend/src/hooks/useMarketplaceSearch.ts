import { useEffect, useMemo, useState } from "react";
import { getProducts } from "@/lib/api/products";
import { expandSearchQuery } from "@/lib/search";
import type { IconKey } from "@/config/navigation";

export type MarketplaceShortcut = {
  id: string;
  label: string;
  href: string;
  section: string;
  iconKey: IconKey;
  image?: string; // Optional image for products
};

type UseMarketplaceSearchResult = {
  query: string;
  setQuery: (value: string) => void;
  isFocused: boolean;
  setFocused: (value: boolean) => void;
  results: MarketplaceShortcut[];
  showPanel: boolean;
  loading: boolean;
};

const DEFAULT_IDLE_RESULTS = 5;
const DEFAULT_FILTERED_RESULTS = 8; // More results since we include products

export function useMarketplaceSearch(shortcuts: MarketplaceShortcut[], debounceMs = 250): UseMarketplaceSearchResult {
  const [query, setQuery] = useState("");
  const [isFocused, setFocused] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [productResults, setProductResults] = useState<MarketplaceShortcut[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.trim().length >= 2) {
      setLoading(true);
    } else {
      setLoading(false);
      setProductResults([]);
    }

    const handle = window.setTimeout(() => {
      setDebouncedQuery(query.trim().toLowerCase());
    }, debounceMs);

    return () => window.clearTimeout(handle);
  }, [query, debounceMs]);

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setProductResults([]);
      return;
    }

    setLoading(true);
    const expandedQuery = expandSearchQuery(debouncedQuery);
    getProducts(1, 4, expandedQuery)
      .then((res) => {
        const products = res.data.map((p) => ({
          id: `product-${p.id}`,
          label: p.name,
          href: `/product/${p.id}`,
          section: "Products",
          iconKey: "package" as IconKey, // Default icon or we could use images
          image: p.imageUrl,
        }));
        setProductResults(products);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [debouncedQuery]);

  const results = useMemo(() => {
    // Only return products, as requested by the user to avoid flicker and distraction
    return productResults.slice(0, DEFAULT_FILTERED_RESULTS);
  }, [productResults]);

  const showPanel = (isFocused || debouncedQuery.length > 0) && query.trim().length >= 2;

  return {
    query,
    setQuery,
    isFocused,
    setFocused,
    results,
    showPanel,
    loading,
  };
}
