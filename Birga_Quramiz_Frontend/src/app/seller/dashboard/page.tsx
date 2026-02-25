"use client";

import { useFetch } from "@/hooks/useFetch";
import { getSellerAnalytics } from "@/lib/api/seller";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

export default function SellerDashboardPage() {
  const { user, isAuthenticated, isInitialized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isInitialized) return;

    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    if (user && user.role !== "SELLER") {
      router.push("/");
    }
  }, [user, isAuthenticated, isInitialized, router]);

  const { data, loading, error } = useFetch(() => getSellerAnalytics());

  if (!isInitialized || loading || (isAuthenticated && !user)) {
    return (
      <div className="page-shell max-w-5xl">
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="surface-card h-28 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "SELLER") {
    return null;
  }

  if (error) {
    return (
      <div className="page-shell max-w-5xl">
        <div className="surface-card p-6 text-destructive">Failed to load analytics: {error}</div>
      </div>
    );
  }

  return (
    <div className="page-shell max-w-5xl space-y-6">
      <section className="surface-card p-6">
        <h1 className="section-title text-primary">Seller Panel</h1>
        <p className="mt-2 text-sm text-muted-foreground">Operational view of orders, revenue and fulfillment pipeline.</p>
      </section>

      {data && (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            <div className="surface-card p-5">
              <p className="text-sm text-muted-foreground">Total Orders</p>
              <p className="mt-1 text-3xl font-black text-primary">{data.totalOrders}</p>
            </div>
            <div className="surface-card p-5">
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="mt-1 text-3xl font-black text-primary">{data.totalRevenue.toLocaleString()} UZS</p>
            </div>
            <div className="surface-card p-5">
              <p className="text-sm text-muted-foreground">Delivered</p>
              <p className="mt-1 text-3xl font-black text-primary">{data.breakdown.DELIVERED}</p>
            </div>
          </section>

          <section className="surface-card p-6">
            <h2 className="text-lg font-bold text-primary">Order Status Breakdown</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {Object.entries(data.breakdown).map(([status, count]) => (
                <p key={status} className="flex justify-between rounded-lg border border-border/70 bg-white px-3 py-2 text-sm">
                  <span className="text-muted-foreground">{status}</span>
                  <span className="font-semibold text-primary">{count}</span>
                </p>
              ))}
            </div>
          </section>
        </>
      )}

      <div className="flex flex-wrap gap-3">
        <Link href="/seller/products" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90">
          Add products
        </Link>
        <Link href="/seller/orders" className="rounded-lg border border-border/80 bg-white px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-primary">
          Manage orders
        </Link>
      </div>
    </div>
  );
}