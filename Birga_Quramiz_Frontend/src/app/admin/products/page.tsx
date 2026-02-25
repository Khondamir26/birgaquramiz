"use client";

import { useMemo, useState } from "react";
import { useFetch } from "@/hooks/useFetch";
import { getPendingProducts, approveProduct, rejectProduct } from "@/lib/api/products";
import { Button } from "@/components/ui/button";

export default function AdminProductsPage() {
  const { data, loading, error, refetch } = useFetch(() => getPendingProducts());
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const products = data ?? [];

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;

    return products.filter((product) =>
      [product.name, product.description]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [products, query]);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      await approveProduct(id);
      refetch();
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    try {
      await rejectProduct(id);
      refetch();
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="surface-card h-20 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return <p className="text-destructive">Failed to load products: {error}</p>;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="section-title text-primary">Product Moderation</h1>
        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-primary">{products.length} pending</span>
      </div>

      <div className="surface-card p-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search pending products"
          className="h-10 w-full rounded-lg border border-border/80 bg-white px-3 text-sm"
        />
      </div>

      {filteredProducts.length === 0 ? (
        <div className="surface-card p-10 text-center text-muted-foreground">No products pending moderation.</div>
      ) : (
        <div className="space-y-3">
          {filteredProducts.map((product) => (
            <article key={product.id} className="surface-card flex flex-wrap items-start justify-between gap-4 p-4">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-primary">{product.name}</p>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
                <p className="mt-2 text-sm font-medium text-primary">{product.price.toLocaleString()} UZS • Stock {product.stock}</p>
              </div>

              <div className="flex gap-2">
                <Button size="sm" disabled={actionLoading === product.id} onClick={() => handleApprove(product.id)}>
                  {actionLoading === product.id ? "Please wait..." : "Approve"}
                </Button>
                <Button size="sm" variant="destructive" disabled={actionLoading === product.id} onClick={() => handleReject(product.id)}>
                  {actionLoading === product.id ? "Please wait..." : "Reject"}
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
