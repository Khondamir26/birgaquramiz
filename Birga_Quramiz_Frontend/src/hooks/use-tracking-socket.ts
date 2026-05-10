"use client";

import { useEffect, useRef } from "react";
import { useTrackingStore } from "@/store/trackingStore";
import { getSocket, disconnectSocket as _disconnect } from "@/lib/tracking/socket";
import { trackingApi } from "@/services/trackingApi";
import type { DriverLocation } from "@/types/tracking";
import {
  DriverStatus,
  MAP_DRIVER_LOCATION,
  MAP_DRIVER_STATUS,
  MAP_DRIVER_SIGNAL_LOST,
  MAP_DRIVER_SIGNAL_RESTORED,
  DRIVER_STUCK,
  ORDER_DELAYED,
  ETA_UPDATED,
  ASSIGNMENT_STATUS_CHANGED,
  SYNC_STATE,
  CLIENT_SYNC_REQUEST,
} from "@/types/tracking";

class Backoff {
  private attempt = 0;
  private readonly base = 1_000;
  private readonly cap  = 30_000;

  next(): number {
    const delay  = Math.min(this.base * 2 ** this.attempt, this.cap);
    const jitter = Math.random() * 400;
    this.attempt++;
    return delay + jitter;
  }

  reset() { this.attempt = 0; }
}

export function useTrackingSocket() {
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backoff        = useRef(new Backoff());

  const {
    setDrivers,
    updateLocation,
    updateDriverStatus,
    updateETA,
    addAlert,
    clearAlert,
    setConnected,
    setReconnecting,
  } = useTrackingStore();

  useEffect(() => {
    const socket = getSocket();

    socket.on("connect", async () => {
      backoff.current.reset();
      setConnected(true);
      try {
        const drivers = await trackingApi.getDrivers();
        setDrivers(drivers);
      } catch (err) {
        console.warn("[tracking] REST sync failed on connect", err);
      }
      socket.emit(CLIENT_SYNC_REQUEST);
    });

    socket.on("disconnect", (reason) => {
      setConnected(false);
      if (reason === "io server disconnect") { socket.connect(); return; }
      setReconnecting(true);
      const delay = backoff.current.next();
      reconnectTimer.current = setTimeout(() => socket.connect(), delay);
    });

    socket.on("connect_error", () => {
      setReconnecting(true);
      const delay = backoff.current.next();
      reconnectTimer.current = setTimeout(() => socket.connect(), delay);
    });

    socket.on(SYNC_STATE, (payload: { drivers: Parameters<typeof setDrivers>[0] }) => {
      setDrivers(payload.drivers);
    });

    socket.on(MAP_DRIVER_LOCATION, (payload: DriverLocation) => {
      updateLocation(payload);
    });

    socket.on(MAP_DRIVER_STATUS, (payload: { driverId: string; status: DriverStatus }) => {
      updateDriverStatus(payload.driverId, payload.status);
    });

    socket.on(MAP_DRIVER_SIGNAL_LOST, (payload: { driverId: string; lastSeenAt: number }) => {
      addAlert(payload.driverId, { type: "signal_lost", message: "Signal lost", since: payload.lastSeenAt });
    });

    socket.on(MAP_DRIVER_SIGNAL_RESTORED, (payload: { driverId: string }) => {
      clearAlert(payload.driverId, "signal_lost");
    });

    socket.on(DRIVER_STUCK, (payload: { driverId: string; orderId: string; minutesIdle: number }) => {
      addAlert(payload.driverId, { type: "stuck", message: `Idle for ${payload.minutesIdle} min`, since: Date.now() });
    });

    socket.on(ORDER_DELAYED, (payload: { orderId: string; minutesWaiting: number }) => {
      window.dispatchEvent(new CustomEvent("birga:order_delayed", { detail: payload }));
    });

    socket.on(ETA_UPDATED, (payload: { orderId: string; driverId: string; etaMinutes: number }) => {
      updateETA(payload.driverId, payload.etaMinutes);
    });

    socket.on(ASSIGNMENT_STATUS_CHANGED, (payload: { assignmentId: string; orderId: string; driverId: string; status: string }) => {
      window.dispatchEvent(new CustomEvent("birga:assignment_status", { detail: payload }));
    });

    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
      socket.off(SYNC_STATE);
      socket.off(MAP_DRIVER_LOCATION);
      socket.off(MAP_DRIVER_STATUS);
      socket.off(MAP_DRIVER_SIGNAL_LOST);
      socket.off(MAP_DRIVER_SIGNAL_RESTORED);
      socket.off(DRIVER_STUCK);
      socket.off(ORDER_DELAYED);
      socket.off(ETA_UPDATED);
      socket.off(ASSIGNMENT_STATUS_CHANGED);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
