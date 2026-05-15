"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { io, type Socket } from "socket.io-client";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:5000";

const REST_INTERVAL_MS    = 8_000;
const SOCKET_TIMEOUT_MS   = 6_000;

export type AssignmentStatus = "ACCEPTED" | "PICKED_UP" | "DELIVERED" | "CANCELLED";

export interface DriverLocation {
  lat:       number;
  lng:       number;
  heading?:  number;
  speed?:    number;
  timestamp: number;
}

export interface OrderTrackingState {
  status:            AssignmentStatus | null;
  driverInitials:    string;
  driverFirstName:   string;
  deliveryAddress:   string;
  driverLocation:    DriverLocation | null;
  destinationCoords: { lat: number; lng: number } | null;
  eta:               { etaMinutes: number; fallback: boolean } | null;
  /** Keys: "ACCEPTED" | "PICKED_UP" | "DELIVERED" → ISO timestamp string */
  stageMilestones:   Partial<Record<string, string>>;
  /** Proof-of-delivery photo URL — set after DELIVERED */
  podPhotoUrl:       string | null;
  /** true = customer has already submitted a rating for this delivery */
  hasRating:         boolean;
  lastUpdated:       number;
  /** true = driver just crossed 800m threshold — show "arriving" banner */
  isDriverArriving:  boolean;
  /** true = socket connected and receiving live data */
  isLive:            boolean;
  isLoading:         boolean;
  notFound:          boolean;
  error:             string | null;
}

const INITIAL_STATE: OrderTrackingState = {
  status:            null,
  driverInitials:    "",
  driverFirstName:   "",
  deliveryAddress:   "",
  driverLocation:    null,
  destinationCoords: null,
  eta:               null,
  stageMilestones:   {},
  podPhotoUrl:       null,
  hasRating:         false,
  lastUpdated:       0,
  isDriverArriving:  false,
  isLive:            false,
  isLoading:         true,
  notFound:          false,
  error:             null,
};

export function useOrderTracking(orderId: string): OrderTrackingState {
  const [state, setState]    = useState<OrderTrackingState>(INITIAL_STATE);
  const socketRef            = useRef<Socket | null>(null);
  const pollRef              = useRef<ReturnType<typeof setInterval> | null>(null);
  const socketAlive          = useRef(false);
  const destroyed            = useRef(false);

  const fetchRest = useCallback(async () => {
    if (destroyed.current) return;
    try {
      const res = await fetch(`${API_URL}/tracking/public/${orderId}`, {
        cache: "no-store",
      });
      if (res.status === 404) {
        setState((s) => ({ ...s, notFound: true, isLoading: false }));
        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
        return;
      }
      if (!res.ok) throw new Error("server_error");
      const data = await res.json();
      if (!destroyed.current) {
        setState((s) => ({
          ...s,
          ...data,
          lastUpdated: Date.now(),
          isLoading:   false,
          error:       null,
        }));
        // Stop polling if delivered
        if (data.status === "DELIVERED" && pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
      }
    } catch {
      if (!destroyed.current) {
        setState((s) => ({
          ...s,
          isLoading: false,
          error:     s.status ? null : "Не удалось загрузить данные. Попробуйте позже.",
        }));
      }
    }
  }, [orderId]);

  const startPolling = useCallback(() => {
    if (!pollRef.current && !destroyed.current) {
      fetchRest();
      pollRef.current = setInterval(fetchRest, REST_INTERVAL_MS);
    }
  }, [fetchRest]);

  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  useEffect(() => {
    destroyed.current = false;

    // Always do one REST fetch immediately for initial state
    fetchRest();

    // Attempt socket connection (works for logged-in customers via cookie)
    const socket = io(`${API_URL}/tracking`, {
      withCredentials:      true,
      transports:           ["websocket"],
      reconnection:         true,
      reconnectionAttempts: 4,
      reconnectionDelay:    3_000,
      timeout:              SOCKET_TIMEOUT_MS,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      if (destroyed.current) return;
      socketAlive.current = true;
      setState((s) => ({ ...s, isLive: true }));
      socket.emit("client.order.subscribe", { orderId });
      stopPolling(); // socket is alive — no need to poll
    });

    socket.on("connect_error", () => {
      if (destroyed.current) return;
      socketAlive.current = false;
      setState((s) => ({ ...s, isLive: false }));
      startPolling();
    });

    socket.on("disconnect", () => {
      if (destroyed.current) return;
      socketAlive.current = false;
      setState((s) => ({ ...s, isLive: false }));
      startPolling();
    });

    // Driver moved
    socket.on("order.driver.location", (p: DriverLocation & { driverId: string }) => {
      if (destroyed.current) return;
      setState((s) => ({
        ...s,
        driverLocation: {
          lat:       p.lat,
          lng:       p.lng,
          heading:   p.heading,
          speed:     p.speed,
          timestamp: p.timestamp,
        },
        lastUpdated: Date.now(),
      }));
    });

    // Assignment status changed (ACCEPTED → PICKED_UP etc.)
    socket.on("assignment.status.changed", (p: { status: AssignmentStatus }) => {
      if (destroyed.current) return;
      setState((s) => ({
        ...s,
        status:      p.status,
        lastUpdated: Date.now(),
        // Record milestone timestamp locally when we receive the status change
        stageMilestones: {
          ...s.stageMilestones,
          ...(p.status === "ACCEPTED"  ? { ACCEPTED:  new Date().toISOString() } : {}),
          ...(p.status === "PICKED_UP" ? { PICKED_UP: new Date().toISOString() } : {}),
        },
      }));
    });

    // Delivery completed
    socket.on("order.delivered", () => {
      if (destroyed.current) return;
      setState((s) => ({
        ...s,
        status:          "DELIVERED",
        lastUpdated:     Date.now(),
        driverLocation:  null,
        eta:             null,
        isLive:          false,
        stageMilestones: { ...s.stageMilestones, DELIVERED: new Date().toISOString() },
      }));
      socket.disconnect();
      stopPolling();
    });

    // Driver crossed 800m threshold
    socket.on("order.driver.arriving", () => {
      if (destroyed.current) return;
      setState((s) => ({ ...s, isDriverArriving: true }));
    });

    // ETA recalculated
    socket.on("order.eta.updated", (p: { etaMinutes: number }) => {
      if (destroyed.current) return;
      setState((s) => ({
        ...s,
        eta:         { etaMinutes: p.etaMinutes, fallback: false },
        lastUpdated: Date.now(),
      }));
    });

    // If socket hasn't connected after timeout, start polling as fallback
    const connectTimeout = setTimeout(() => {
      if (!socketAlive.current && !destroyed.current) startPolling();
    }, SOCKET_TIMEOUT_MS + 500);

    return () => {
      destroyed.current = true;
      clearTimeout(connectTimeout);
      socket.removeAllListeners();
      socket.disconnect();
      stopPolling();
    };
  }, [orderId, fetchRest, startPolling, stopPolling]);

  return state;
}
