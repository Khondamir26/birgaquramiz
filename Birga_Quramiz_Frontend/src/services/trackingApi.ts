import { apiFetch } from "@/lib/api/client";
import type { DriverListItem, DriverRecommendation } from "@/types/tracking";

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
  id:          string;
  driverId:    string;
  type:        string;
  description: string;
  createdAt:   string;
  driver?:     { name: string; phone: string };
}

export const trackingApi = {
  getDrivers(): Promise<DriverListItem[]> {
    return apiFetch<DriverListItem[]>("/tracking/drivers");
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
};
