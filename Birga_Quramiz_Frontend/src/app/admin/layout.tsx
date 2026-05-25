"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { PageLoader } from "@/components/ui/FullPageLoader";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTrackingProvider } from "./tracking-provider";

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

  if (!isInitialized || (isAuthenticated && !user) || !isAuthenticated || user?.role !== "ADMIN") {
    return <PageLoader />;
  }

  return (
    <AdminTrackingProvider>
      <div className="flex min-h-screen bg-[#f5f7fb]">
        <AdminSidebar />
        <div className="flex-1 min-w-0 flex flex-col">
          {children}
        </div>
      </div>
    </AdminTrackingProvider>
  );
}
