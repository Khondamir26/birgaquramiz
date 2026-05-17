"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { TrackingProviders } from "./providers";
import { PageLoader } from "@/components/ui/FullPageLoader";

export default function DispatcherLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { isInitialized, isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (!isInitialized) return;
    if (!isAuthenticated) {
      router.replace("/login?from=/dispatcher");
      return;
    }
    if (user?.role !== "DISPATCHER" && user?.role !== "ADMIN") {
      router.replace("/");
    }
  }, [isInitialized, isAuthenticated, user, router]);

  if (!isInitialized) return <PageLoader />;
  if (!isAuthenticated) return <PageLoader />;
  if (user?.role !== "DISPATCHER" && user?.role !== "ADMIN") return <PageLoader />;

  return (
    <TrackingProviders>
      <div className="fixed inset-0 z-50 bg-white">
        {children}
      </div>
    </TrackingProviders>
  );
}
