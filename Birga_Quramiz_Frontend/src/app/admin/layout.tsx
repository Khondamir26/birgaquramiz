"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

const nav = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/products", label: "Product Moderation" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/orders", label: "Orders" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isInitialized } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isAdminLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isAdminLoginPage || !isInitialized) return;

    if (!isAuthenticated) {
      router.push("/admin/login");
      return;
    }

    if (user && user.role !== "ADMIN") {
      router.push("/catalog");
    }
  }, [user, isAuthenticated, isInitialized, isAdminLoginPage, router]);

  if (isAdminLoginPage) {
    return <>{children}</>;
  }

  if (!isInitialized || (isAuthenticated && !user)) {
    return (
      <div className="page-shell max-w-6xl">
        <div className="surface-card h-20 animate-pulse" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="page-shell max-w-6xl space-y-5">
      <div className="surface-card flex flex-wrap gap-2 p-3">
        {nav.map((item) => (
          <Link key={item.href} href={item.href} className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-primary">
            {item.label}
          </Link>
        ))}
      </div>
      {children}
    </div>
  );
}