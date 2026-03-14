"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";




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
    <div className="mx-auto w-full">
      {children}
    </div>
  );
}