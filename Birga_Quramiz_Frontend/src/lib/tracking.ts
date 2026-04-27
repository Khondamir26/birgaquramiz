export interface DriverInfo {
  id: string;
  name: string;
  phone: string;
  rating?: number;
  vehicleType?: string;
  vehiclePlate?: string;
  deliveriesCompleted?: number;
  telegramUsername?: string;
}

export interface TrackingData {
  assignment: {
    id: string;
    status: string;
    driver: DriverInfo;
    podPhotoUrl?: string;
    destination?: { lat: number; lng: number; address?: string };
    createdAt?: string;
  } | null;
  location: {
    lat: number;
    lng: number;
    heading?: number;
    timestamp: number;
  } | null;
}

export interface DriverLocation {
  driverId: string;
  lat: number;
  lng: number;
  heading?: number;
  timestamp: number;
}

export type MilestoneKey = "ACCEPTED" | "PICKED_UP" | "NEAR" | "DELIVERED";

export const STATUS_LABELS: Record<string, string> = {
  PENDING:   "Назначаем курьера",
  ACCEPTED:  "Курьер забирает заказ",
  PICKED_UP: "В пути к вам",
  DELIVERED: "Доставлено!",
  CANCELLED: "Отменено",
};

export const STATUS_BG: Record<string, string> = {
  PENDING:   "bg-[#1B4D91]",
  ACCEPTED:  "bg-[#1B4D91]",
  PICKED_UP: "bg-[#1B4D91]",
  DELIVERED: "bg-emerald-600",
  CANCELLED: "bg-slate-500",
};

export const VEHICLE_LABELS: Record<string, string> = {
  CAR:        "Автомобиль",
  BIKE:       "Велосипед",
  SCOOTER:    "Самокат",
  MOTORCYCLE: "Мотоцикл",
  FOOT:       "Пеший курьер",
};

export const APPROACHING_THRESHOLD_M = 300;
export const ARRIVING_SOON_ETA = 5;
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export function haversineMeters(
  [lat1, lng1]: [number, number],
  [lat2, lng2]: [number, number]
): number {
  const R  = 6_371_000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const a  = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function fmtTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

export function relativeTime(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 10) return "только что";
  if (s < 60) return `${s}с назад`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}м назад`;
  return `${Math.floor(m / 60)}ч назад`;
}

export function initials(name: string): string {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}
