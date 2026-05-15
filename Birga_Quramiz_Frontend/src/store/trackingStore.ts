import { create } from "zustand";
import type { StateCreator } from "zustand";
import type { DriverListItem, DriverLocation } from "@/types/tracking";
import { DriverStatus } from "@/types/tracking";

export type AlertType = "stuck" | "signal_lost" | "delayed" | "issue";

export interface DriverAlert {
  type:    AlertType;
  message: string;
  since:   number;
}

export interface ExtendedDriver extends DriverListItem {
  liveLocation?: DriverLocation;
  alerts:        DriverAlert[];
  etaMinutes?:   number;
}

interface TrackingState {
  drivers:          Record<string, ExtendedDriver>;
  locations:        Record<string, DriverLocation>;
  selectedDriverId: string | null;
  isConnected:      boolean;
  isReconnecting:   boolean;
  lastSyncAt:       number | null;

  setDrivers:             (drivers: DriverListItem[]) => void;
  updateLocation:         (loc: DriverLocation) => void;
  batchUpdateLocations:   (locs: DriverLocation[]) => void;
  updateDriverStatus:     (driverId: string, status: DriverStatus) => void;
  updateETA:           (driverId: string, etaMinutes: number) => void;
  addAlert:            (driverId: string, alert: DriverAlert) => void;
  clearAlert:          (driverId: string, type: AlertType) => void;
  selectDriver:        (id: string | null) => void;
  setConnected:        (connected: boolean) => void;
  setReconnecting:     (reconnecting: boolean) => void;
  getAvailableDrivers: () => ExtendedDriver[];
  getOnDeliveryDrivers:() => ExtendedDriver[];
}

const creator: StateCreator<TrackingState> = (set, get) => ({
  drivers:          {},
  locations:        {},
  selectedDriverId: null,
  isConnected:      false,
  isReconnecting:   false,
  lastSyncAt:       null,

  setDrivers: (driverList) =>
    set((state) => {
      const next: Record<string, ExtendedDriver> = {};
      for (const d of driverList) {
        const existing = state.drivers[d.id];
        next[d.id] = {
          ...d,
          liveLocation: existing?.liveLocation,
          alerts:       existing?.alerts ?? [],
          etaMinutes:   existing?.etaMinutes,
        };
      }
      return { drivers: next, lastSyncAt: Date.now() };
    }),

  updateLocation: (loc) =>
    set((state) => {
      const driver = state.drivers[loc.driverId];
      if (!driver) return state;
      return {
        locations: { ...state.locations, [loc.driverId]: loc },
        drivers: {
          ...state.drivers,
          [loc.driverId]: {
            ...driver,
            liveLocation: loc,
            lastLocation: { lat: loc.lat, lng: loc.lng, heading: loc.heading, timestamp: loc.timestamp },
            alerts: driver.alerts.filter((a) => a.type !== "signal_lost"),
          },
        },
      };
    }),

  batchUpdateLocations: (locs) =>
    set((state) => {
      if (!locs.length) return state;
      const nextLocations = { ...state.locations };
      const nextDrivers   = { ...state.drivers };
      for (const loc of locs) {
        const driver = state.drivers[loc.driverId];
        if (!driver) continue;
        nextLocations[loc.driverId] = loc;
        nextDrivers[loc.driverId]   = {
          ...driver,
          liveLocation: loc,
          lastLocation: { lat: loc.lat, lng: loc.lng, heading: loc.heading, timestamp: loc.timestamp },
          alerts: driver.alerts.filter((a) => a.type !== "signal_lost"),
        };
      }
      return { locations: nextLocations, drivers: nextDrivers };
    }),

  updateDriverStatus: (driverId, status) =>
    set((state) => {
      const driver = state.drivers[driverId];
      if (!driver) return state;
      return { drivers: { ...state.drivers, [driverId]: { ...driver, status } } };
    }),

  updateETA: (driverId, etaMinutes) =>
    set((state) => {
      const driver = state.drivers[driverId];
      if (!driver) return state;
      return { drivers: { ...state.drivers, [driverId]: { ...driver, etaMinutes } } };
    }),

  addAlert: (driverId, alert) =>
    set((state) => {
      const driver = state.drivers[driverId];
      if (!driver) return state;
      const deduped = driver.alerts.filter((a) => a.type !== alert.type);
      return { drivers: { ...state.drivers, [driverId]: { ...driver, alerts: [...deduped, alert] } } };
    }),

  clearAlert: (driverId, type) =>
    set((state) => {
      const driver = state.drivers[driverId];
      if (!driver) return state;
      return { drivers: { ...state.drivers, [driverId]: { ...driver, alerts: driver.alerts.filter((a) => a.type !== type) } } };
    }),

  selectDriver:    (id) => set({ selectedDriverId: id }),

  setConnected:    (connected) =>
    set({ isConnected: connected, isReconnecting: connected ? false : true }),

  setReconnecting: (reconnecting) => set({ isReconnecting: reconnecting }),

  getAvailableDrivers: () =>
    Object.values(get().drivers).filter((d) => d.status === DriverStatus.ONLINE),

  getOnDeliveryDrivers: () =>
    Object.values(get().drivers).filter((d) => d.status === DriverStatus.ON_DELIVERY),
});

export const useTrackingStore = create<TrackingState>()(creator);
