"use client";

import { useEffect, useState } from "react";
import { getAdminUsers } from "@/lib/api/admin";
import type { PaginatedResponse, Role, User } from "@/types";

const PAGE_SIZE = 20;

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [meta, setMeta] = useState<PaginatedResponse<User>["meta"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const [role, setRole] = useState<"ALL" | Role>("ALL");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await getAdminUsers({
          page,
          limit: PAGE_SIZE,
          role: role === "ALL" ? undefined : role,
          q: query.trim() || undefined,
        });

        if (cancelled) return;

        setUsers(res.data);
        setMeta(res.meta);
      } catch (err: unknown) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load users");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [page, role, query]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="section-title text-primary">Users</h1>
        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-primary">
          {meta?.total ?? users.length} total
        </span>
      </div>

      <div className="surface-card grid gap-3 p-4 md:grid-cols-[1fr,200px]">
        <input
          value={query}
          onChange={(e) => {
            setPage(1);
            setQuery(e.target.value);
          }}
          placeholder="Search by name or phone"
          className="h-10 rounded-lg border border-border/80 bg-white px-3 text-sm"
        />

        <select
          value={role}
          onChange={(e) => {
            setPage(1);
            setRole(e.target.value as "ALL" | Role);
          }}
          className="h-10 rounded-lg border border-border/80 bg-white px-3 text-sm"
        >
          <option value="ALL">All roles</option>
          <option value="USER">User</option>
          <option value="SELLER">Seller</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="surface-card h-16 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <p className="text-destructive">Failed to load users: {error}</p>
      ) : (
        <>
          <div className="surface-card overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-secondary/60 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-t border-border/70">
                    <td className="px-4 py-3 font-medium text-primary">{user.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{user.phone}</td>
                    <td className="px-4 py-3 text-muted-foreground">{user.role}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString("ru-RU")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-sm">
            <p className="text-muted-foreground">
              Page {meta?.page ?? page} of {meta?.totalPages ?? 1}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={(meta?.page ?? page) <= 1}
                className="rounded-lg border border-border/80 bg-white px-3 py-1.5 text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                disabled={Boolean(meta && meta.page >= meta.totalPages)}
                className="rounded-lg border border-border/80 bg-white px-3 py-1.5 text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
