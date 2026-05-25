"use client";

import { useTrackingSocket } from "@/hooks/use-tracking-socket";

export function AdminTrackingProvider({ children }: { children: React.ReactNode }) {
  useTrackingSocket();
  return <>{children}</>;
}
