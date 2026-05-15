/**
 * Inline copy of @birga-tracking/shared-types.
 * Kept here so the main platform has no cross-repo workspace dependency.
 */

// ─── Enums ────────────────────────────────────────────────────────────────────

export enum DriverStatus {
  OFFLINE     = "OFFLINE",
  ONLINE      = "ONLINE",
  ON_DELIVERY = "ON_DELIVERY",
}

export enum AssignmentStatus {
  PENDING   = "PENDING",
  ACCEPTED  = "ACCEPTED",
  PICKED_UP = "PICKED_UP",
  DELIVERED = "DELIVERED",
  CANCELLED = "CANCELLED",
}

// ─── Location ─────────────────────────────────────────────────────────────────

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface DriverLocation extends Coordinates {
  driverId:  string;
  heading?:  number;
  speed?:    number;
  accuracy?: number;
  timestamp: number;
}

// ─── Driver ───────────────────────────────────────────────────────────────────

export interface Driver {
  id:     string;
  name:   string;
  phone:  string;
  status: DriverStatus;
  lastLocation?: Coordinates & { heading?: number; timestamp: number };
  activeAssignmentId?: string;
}

export interface DriverListItem extends Driver {
  assignmentsToday:    number;
  minutesStuck?:       number;
  signalLost?:         boolean;
  etaMinutes?:         number;
  activeAssignmentId?: string;
  activeOrderId?:      string;
}

export interface DriverRecommendation {
  driverId:    string;
  name:        string;
  phone:       string;
  distanceKm:  number;
  etaMinutes:  number;
  currentLoad: number;
  score:       number;
}

// ─── Socket event constants ───────────────────────────────────────────────────

export const CLIENT_SYNC_REQUEST        = "client.sync.request";
export const SYNC_STATE                 = "sync.state";

export const MAP_DRIVER_LOCATION        = "map.driver.location";
export const MAP_DRIVER_STATUS          = "map.driver.status";
export const MAP_DRIVER_SIGNAL_LOST     = "map.driver.signal_lost";
export const MAP_DRIVER_SIGNAL_RESTORED = "map.driver.signal_restored";

export const DRIVER_STUCK               = "driver.stuck.detected";
export const ORDER_DELAYED              = "order.delayed";
export const ORDER_CREATED              = "order.created";
export const ORDER_UNASSIGNED           = "order.unassigned";
export const ETA_UPDATED                = "order.eta.updated";
export const ASSIGNMENT_STATUS_CHANGED  = "assignment.status.changed";

/** Server → Dispatcher: driver reported a delivery problem */
export const DRIVER_ISSUE_REPORTED      = "driver.issue.reported";
