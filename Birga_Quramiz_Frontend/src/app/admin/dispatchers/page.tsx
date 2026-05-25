"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminPage } from "@/components/admin/AdminPage";
import { getAdminDispatchers, type AdminDispatcherListItem } from "@/lib/api/admin";
import { cn } from "@/lib/utils";
import {
  Headset, Search, ChevronLeft, ChevronRight, Package,
} from "lucide-react";

const PAGE_SIZE = 20;

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86_400_000);
  if (d > 0) return `${d}d ago`;
  const h = Math.floor(diff / 3_600_000);
  if (h > 0) return `${h}h ago`;
  return `${Math.floor(diff / 60_000)}m ago`;
}

export default function AdminDispatchersPage() {
  const [dispatchers, setDispatchers] = useState<AdminDispatcherListItem[]>([]);
  const [meta, setMeta]   = useState<{ total: number; totalPages: number; page: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [page, setPage]   = useState(1);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await getAdminDispatchers({ page, limit: PAGE_SIZE, q: query.trim() || undefined });
        if (!cancelled) {
          setDispatchers(res.data);
          setMeta(res.meta);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load dispatchers");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    return () => { cancelled = true; };
  }, [page, query]);

  return (
    <AdminPage>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Operations</p>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-black text-slate-900">
            <Headset className="size-6 text-[#1B4D91]" />
            Dispatchers
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Staff who assign orders to drivers and manage deliveries.
          </p>
        </div>
        {meta && (
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600">
            {meta.total} dispatcher{meta.total !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-300" />
        <input
          value={query}
          onChange={(e) => { setPage(1); setQuery(e.target.value); }}
          placeholder="Search by name or phone…"
          className="w-full h-11 pl-10 pr-4 rounded-2xl border border-slate-200 bg-white text-[13px] font-medium text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-[#1B4D91] focus:ring-2 focus:ring-[#1B4D91]/10 transition-all"
        />
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="hidden grid-cols-[1fr_160px_140px] gap-4 border-b border-slate-100 bg-slate-50 px-5 py-3 text-[11px] font-black uppercase tracking-[0.16em] text-slate-400 lg:grid">
          <span>Dispatcher</span>
          <span>Joined</span>
          <span className="text-right">Assignments</span>
        </div>

        {loading ? (
          <div className="divide-y divide-slate-100">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-[68px] animate-pulse px-5 py-3">
                <div className="h-full rounded-lg bg-slate-50" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-6 text-sm font-semibold text-red-600">{error}</div>
        ) : dispatchers.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Headset className="size-8 text-slate-300" />
            <p className="text-sm font-bold text-slate-600">No dispatchers found.</p>
            <p className="text-xs text-slate-400">
              Assign the DISPATCHER role to users from the Users page.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {dispatchers.map((d) => (
              <Link
                key={d.id}
                href={`/admin/dispatchers/${d.id}`}
                className={cn(
                  "grid gap-3 px-4 py-4 transition-colors hover:bg-slate-50",
                  "lg:grid-cols-[1fr_160px_140px] lg:items-center lg:px-5"
                )}
              >
                {/* Name + phone */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#1B4D91]/10 text-[#1B4D91] font-black text-[13px]">
                    {d.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-slate-800 truncate">{d.name}</p>
                    <p className="text-[11px] font-mono text-slate-400">{d.phone ?? "—"}</p>
                  </div>
                </div>

                {/* Joined */}
                <p className="text-[12px] text-slate-500 hidden lg:block">
                  {new Date(d.createdAt).toLocaleDateString("ru-RU", { day: "2-digit", month: "short", year: "numeric" })}
                  <span className="ml-1.5 text-slate-300 text-[11px]">{timeAgo(d.createdAt)}</span>
                </p>

                {/* Total assignments */}
                <div className="hidden lg:flex items-center justify-end gap-1.5">
                  <Package className="size-3.5 text-slate-300" />
                  <span className="text-[13px] font-black text-slate-700 tabular-nums">
                    {d._count.dispatched}
                  </span>
                  <span className="text-[11px] text-slate-400">total</span>
                </div>

              </Link>
            ))}
          </div>
        )}
      </section>

      {!loading && !error && (meta?.totalPages ?? 1) > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-slate-500">
            Page {meta?.page ?? page} of {meta?.totalPages ?? 1}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={(meta?.page ?? page) <= 1}
              className="inline-flex h-10 items-center gap-1 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 disabled:opacity-40"
            >
              <ChevronLeft className="size-4" /> Prev
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              disabled={Boolean(meta && meta.page >= meta.totalPages)}
              className="inline-flex h-10 items-center gap-1 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 disabled:opacity-40"
            >
              Next <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}
    </AdminPage>
  );
}
