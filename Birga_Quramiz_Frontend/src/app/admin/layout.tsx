"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { PageLoader } from "@/components/ui/FullPageLoader";




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
    <div className="mx-auto w-full">
      {children}
    </div>
  );
}