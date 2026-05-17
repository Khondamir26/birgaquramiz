import { apiFetch } from "@/lib/api/client";
import type { DriverListItem, DriverRecommendation, DriverStatus } from "@/types/tracking";
import type { Order } from "@/types";

export interface DriverDetail {
  id:          string;
  name:        string;
  phone:       string;
  photo:       string | null;
  status:      DriverStatus;
  lastSeenAt:  string | null;
  lastLat:     number | null;
  lastLng:     number | null;
  memberSince: string;
  activeAssignment: {
    id:        string;
    status:    string;
    createdAt: string;
    order: {
      id:              string;
      customerName:    string;
      customerPhone:   string;
      deliveryAddress: string | null;
      total:           number;
    };
  } | null;
  stats: {
    assignmentsToday: number;
    totalDelivered:   number;
    fraudCount:       number;
  };
}

export interface AssignableOrder {
  id:              string;
  customerName:    string;
  customerPhone:   string;
  deliveryAddress: string | null;
  total:           number;
  status:          string;
  createdAt:       string;
  _count:          { items: number };
}

export interface ETAResponse {
  eta: {
    durationSeconds: number;
    distanceMeters:  number;
    etaMinutes:      number;
    arrivalTime:     string;
  } | null;
  reason?: string;
}

export interface FraudFlag {
  id:       string;
  driverId: string;
  reason:   string;
  createdAt: string;
  driver?:  { name: string; phone: string | null };
}

export interface AssignmentEvent {
  id:           string;
  assignmentId: string;
  event:        string;
  note:         string | null;
  createdAt:    string;
}

export interface AssignmentHistoryItem {
  id:        string;
  status:    string;
  createdAt: string;
  updatedAt: string;
  order: {
    id:              string;
    customerName:    string;
    deliveryAddress: string | null;
    total:           number;
  };
  _count: { events: number };
}

export interface DriverStats {
  period:              "30d";
  total30:             number;
  delivered30:         number;
  cancelled30:         number;
  acceptanceRate:      number | null;
  cancellationRate:    number | null;
  avgDeliveryMinutes:  number | null;
  issueCount:          number;
  issueRate:           number | null;
  allTime: {
    total:     number;
    delivered: number;
    cancelled: number;
  };
}

export interface DriverRatingSummary {
  count:        number;
  average:      number | null;
  distribution: Record<string, number>;
  topTags:      { tag: string; count: number }[];
}

export interface RoutePoint {
  lat:       number;
  lng:       number;
  heading:   number | null;
  speed:     number | null;
  createdAt: string;
}

export const trackingApi = {
  getDrivers(): Promise<DriverListItem[]> {
    return apiFetch<DriverListItem[]>("/tracking/drivers");
  },

  getDriverDetail(driverId: string): Promise<DriverDetail> {
    return apiFetch<DriverDetail>(`/tracking/drivers/${driverId}/detail`);
  },

  getAssignableOrders(): Promise<AssignableOrder[]> {
    return apiFetch<AssignableOrder[]>("/tracking/orders/assignable");
  },

  createAssignment(orderId: string, driverId: string, note?: string): Promise<unknown> {
    return apiFetch("/tracking/assignments", {
      method: "POST",
      body:   JSON.stringify({ orderId, driverId, note: note || undefined }),
    });
  },

  recommendDrivers(orderId: string): Promise<DriverRecommendation[]> {
    return apiFetch<DriverRecommendation[]>(`/tracking/orders/${orderId}/recommend-drivers`);
  },

  getOrderETA(orderId: string): Promise<ETAResponse> {
    return apiFetch<ETAResponse>(`/tracking/orders/${orderId}/eta`);
  },

  getFraudFlags(): Promise<FraudFlag[]> {
    return apiFetch<FraudFlag[]>("/tracking/fraud-events").catch(() => [] as FraudFlag[]);
  },

  getMapsUsage(): Promise<Record<string, number>> {
    return apiFetch<Record<string, number>>("/tracking/admin/maps-usage");
  },

  getAssignmentEvents(assignmentId: string): Promise<AssignmentEvent[]> {
    return apiFetch<AssignmentEvent[]>(`/tracking/assignments/${assignmentId}/events`);
  },

  getDriverAssignmentHistory(driverId: string, limit = 10, cursor?: string): Promise<AssignmentHistoryItem[]> {
    const params = new URLSearchParams({ limit: String(limit) });
    if (cursor) params.set("cursor", cursor);
    return apiFetch<AssignmentHistoryItem[]>(`/tracking/drivers/${driverId}/assignments?${params}`);
  },

  getDriverStats(driverId: string): Promise<DriverStats> {
    return apiFetch<DriverStats>(`/tracking/drivers/${driverId}/stats`);
  },

  getRouteHistory(driverId: string, from: string, to: string): Promise<RoutePoint[]> {
    const params = new URLSearchParams({ from, to });
    return apiFetch<RoutePoint[]>(`/tracking/drivers/${driverId}/history?${params}`);
  },

  getOrderDetail(orderId: string): Promise<Order> {
    return apiFetch<Order>(`/tracking/orders/${orderId}/detail`);
  },

  dismissFraudFlag(id: string): Promise<void> {
    return apiFetch<void>(`/tracking/fraud-events/${id}`, { method: "DELETE" });
  },

  clearAllFraudFlags(): Promise<void> {
    return apiFetch<void>("/tracking/fraud-events", { method: "DELETE" });
  },

  getDriverRatingSummary(driverId: string): Promise<DriverRatingSummary> {
    return apiFetch<DriverRatingSummary>(`/tracking/drivers/${driverId}/rating-summary`);
  },

  submitRating(
    orderId: string,
    body: { rating: number; comment?: string; tags: string[] },
  ): Promise<{ success: boolean }> {
    return apiFetch(`/tracking/public/${orderId}/rating`, {
      method: "POST",
      body:   JSON.stringify(body),
    });
  },
};
