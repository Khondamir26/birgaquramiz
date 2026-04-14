"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { io, type Socket } from "socket.io-client";
import {
  Phone,
  User,
  Truck,
  CheckCircle,
  Clock,
  Package,
  Navigation,
  Wifi,
  WifiOff,
  Timer,
  Star,
  MessageCircle,
  Award,
  Car,
  ShieldCheck,
  Image as ImageIcon,
  MapPin,
  Sparkles,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface DriverInfo {
  id: string;
  name: string;
  phone: string;
  rating?: number;
  vehicleType?: string;
  vehiclePlate?: string;
  deliveriesCompleted?: number;
  telegramUsername?: string;
}

interface TrackingData {
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

interface DriverLocation {
  driverId: string;
  lat: number;
  lng: number;
  heading?: number;
  timestamp: number;
}

// ─── Yandex Maps types ──────────────────────────────────────────────────────────

declare global {
  interface Window {
    ymaps: {
      ready: (cb: () => void) => void;
      Map: new (
        el: HTMLElement,
        state: object,
        opts?: object
      ) => {
        geoObjects: { add: (o: object) => void; remove: (o: object) => void };
        setCenter: (c: [number, number], zoom?: number, opts?: object) => void;
        setZoom: (z: number, opts?: object) => void;
        destroy: () => void;
      };
      Placemark: new (
        c: [number, number],
        p: object,
        o: object
      ) => {
        geometry: { setCoordinates: (c: [number, number]) => void };
        options: { set: (k: string, v: unknown) => void };
      };
      Polyline: new (
        c: [number, number][],
        p: object,
        o: object
      ) => {
        geometry: { setCoordinates: (c: [number, number][]) => void };
        options: { set: (k: string, v: unknown) => void };
      };
    };
  }
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  PENDING:   "Назначаем курьера",
  ACCEPTED:  "Курьер забирает заказ",
  PICKED_UP: "В пути к вам",
  DELIVERED: "Доставлено!",
  CANCELLED: "Отменено",
};

const STATUS_BG: Record<string, string> = {
  PENDING:   "bg-[#1B4D91]",
  ACCEPTED:  "bg-[#1B4D91]",
  PICKED_UP: "bg-[#1B4D91]",
  DELIVERED: "bg-emerald-600",
  CANCELLED: "bg-slate-500",
};

const VEHICLE_LABELS: Record<string, string> = {
  CAR:        "Автомобиль",
  BIKE:       "Велосипед",
  SCOOTER:    "Самокат",
  MOTORCYCLE: "Мотоцикл",
  FOOT:       "Пеший курьер",
};

// Status keys used in the 3-step progress bar
const PROGRESS_STEPS = [
  { key: "ACCEPTED",  label: "Назначен",  icon: <User className="size-3.5" /> },
  { key: "PICKED_UP", label: "Забрал",    icon: <Package className="size-3.5" /> },
  { key: "DELIVERED", label: "Доставлено", icon: <CheckCircle className="size-3.5" /> },
];

// Milestone timeline (5 steps incl. synthetic ones)
const MILESTONE_KEYS = ["ACCEPTED", "PICKED_UP", "NEAR", "DELIVERED"] as const;
type MilestoneKey = (typeof MILESTONE_KEYS)[number];

const MILESTONE_CFG: Record<MilestoneKey, { label: string; icon: React.ReactNode }> = {
  ACCEPTED:  { label: "Курьер назначен",    icon: <User className="size-3.5" /> },
  PICKED_UP: { label: "Заказ забран",       icon: <Package className="size-3.5" /> },
  NEAR:      { label: "Курьер рядом",       icon: <Navigation className="size-3.5" /> },
  DELIVERED: { label: "Доставлено",         icon: <CheckCircle className="size-3.5" /> },
};

const APPROACHING_THRESHOLD_M = 300;
const ARRIVING_SOON_ETA = 5; // minutes
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

// ─── Helpers ───────────────────────────────────────────────────────────────────

function haversineMeters(
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

function fmtTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function relativeTime(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 10) return "только что";
  if (s < 60) return `${s}с назад`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}м назад`;
  return `${Math.floor(m / 60)}ч назад`;
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  const rounded = Math.round(rating * 2) / 2; // round to nearest 0.5
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`size-3 ${
            n <= rounded
              ? "fill-amber-400 text-amber-400"
              : "fill-slate-100 text-slate-200"
          }`}
        />
      ))}
      <span className="ml-1 text-[11px] font-bold text-slate-600">
        {rating.toFixed(1)}
      </span>
    </div>
  );
}

function LiveDot({ stale }: { stale: boolean }) {
  if (stale)
    return (
      <span className="flex items-center gap-1 text-amber-500 text-[11px] font-semibold">
        <WifiOff className="size-3" />
        Нет обновлений
      </span>
    );
  return (
    <span className="flex items-center gap-1.5 text-emerald-600 text-[11px] font-semibold">
      <span className="relative flex size-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
      </span>
      В сети
    </span>
  );
}

function ArrivingSoonBanner() {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-4 shadow-sm">
      <div className="relative flex shrink-0 size-4">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60" />
        <span className="relative inline-flex size-4 rounded-full bg-amber-500 items-center justify-center">
          <Truck className="size-2.5 text-white" />
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-black text-amber-900">
          Курьер скоро прибудет!
        </p>
        <p className="text-[11px] text-amber-700">Будьте готовы принять заказ</p>
      </div>
    </div>
  );
}

function ApproachingBanner({ distanceM }: { distanceM: number }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 px-5 py-4 shadow-sm">
      <div className="relative flex shrink-0 size-4">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
        <span className="relative inline-flex size-4 rounded-full bg-emerald-500 items-center justify-center">
          <MapPin className="size-2.5 text-white" />
        </span>
      </div>
      <div>
        <p className="text-[14px] font-black text-emerald-900">Курьер рядом!</p>
        <p className="text-[11px] text-emerald-700">
          До вас около {Math.round(distanceM)} м
        </p>
      </div>
    </div>
  );
}

function EtaChip({
  minutes,
  approaching,
}: {
  minutes: number | null;
  approaching: boolean;
}) {
  if (minutes === null) return null;
  return (
    <div
      className={`flex items-center gap-2 rounded-2xl border px-4 py-2.5 transition-all duration-500 ${
        approaching
          ? "border-emerald-200 bg-emerald-50 shadow-md shadow-emerald-100"
          : "border-white/20 bg-white/10"
      }`}
    >
      <Timer
        className={`size-4 ${approaching ? "text-emerald-600" : "text-white/80"}`}
      />
      <div>
        <p
          className={`text-[10px] font-bold uppercase tracking-wider ${
            approaching ? "text-emerald-600/70" : "text-white/60"
          }`}
        >
          Прибудет через
        </p>
        <p
          className={`text-[18px] font-black leading-none ${
            approaching ? "text-emerald-700" : "text-white"
          }`}
        >
          {minutes} мин
        </p>
      </div>
    </div>
  );
}

function ProgressStepper({
  currentStatus,
}: {
  currentStatus: string;
}) {
  const currentIndex = PROGRESS_STEPS.findIndex((s) => s.key === currentStatus);
  const effectiveIndex = currentIndex === -1 ? -1 : currentIndex;

  return (
    <div className="rounded-3xl bg-white border border-slate-100 shadow-sm px-7 py-6">
      <div className="flex items-center">
        {PROGRESS_STEPS.map((step, i) => {
          const done   = i <= effectiveIndex;
          const active = i === effectiveIndex;
          return (
            <div key={step.key} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1.5 flex-none">
                <div
                  className={`flex size-10 items-center justify-center rounded-full transition-all duration-500 ${
                    active
                      ? "bg-[#1B4D91] shadow-[0_0_0_5px_rgba(27,77,145,0.15)] scale-110"
                      : done
                      ? "bg-[#1B4D91]"
                      : "bg-slate-100"
                  }`}
                >
                  <span className={done ? "text-white" : "text-slate-300"}>
                    {step.icon}
                  </span>
                </div>
              </div>
              {i < PROGRESS_STEPS.length - 1 && (
                <div className="mx-1 h-0.5 flex-1 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-[#1B4D91] transition-all duration-700"
                    style={{ width: i < effectiveIndex ? "100%" : "0%" }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex">
        {PROGRESS_STEPS.map((step, i) => {
          const done   = i <= effectiveIndex;
          const active = i === effectiveIndex;
          return (
            <div
              key={step.key}
              className={`flex-1 pr-2 last:pr-0 ${
                i === PROGRESS_STEPS.length - 1
                  ? "text-right"
                  : i === 0
                  ? "text-left"
                  : "text-center"
              }`}
            >
              <span
                className={`text-[11px] font-semibold ${
                  active
                    ? "text-[#1B4D91]"
                    : done
                    ? "text-slate-600"
                    : "text-slate-300"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MilestonesTimeline({
  milestones,
  currentStatus,
  isNear,
}: {
  milestones: Partial<Record<MilestoneKey, number>>;
  currentStatus: string;
  isNear: boolean;
}) {
  const steps: MilestoneKey[] = ["ACCEPTED", "PICKED_UP", "NEAR", "DELIVERED"];
  const statusOrder = ["ACCEPTED", "PICKED_UP", "DELIVERED"];
  const currentIdx = statusOrder.indexOf(currentStatus);

  return (
    <div className="rounded-3xl bg-white border border-slate-100 shadow-sm px-7 py-5">
      <p className="mb-4 text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
        История доставки
      </p>
      <div className="flex flex-col gap-0">
        {steps.map((key, i) => {
          const cfg      = MILESTONE_CFG[key];
          const ts       = milestones[key];
          const isLast   = i === steps.length - 1;

          // Determine if this milestone is done
          let done = false;
          if (key === "DELIVERED") {
            done = currentStatus === "DELIVERED";
          } else if (key === "NEAR") {
            done = isNear || currentStatus === "DELIVERED";
          } else {
            done = currentIdx >= statusOrder.indexOf(key);
          }

          const isActive = (() => {
            if (key === "DELIVERED") return currentStatus === "DELIVERED";
            if (key === "NEAR") return isNear && currentStatus !== "DELIVERED";
            if (key === "PICKED_UP") return currentStatus === "PICKED_UP" && !isNear;
            if (key === "ACCEPTED") return currentStatus === "ACCEPTED";
            return false;
          })();

          return (
            <div key={key} className="flex gap-4">
              {/* Left: dot + connector */}
              <div className="flex flex-col items-center">
                <div
                  className={`flex size-8 shrink-0 items-center justify-center rounded-full transition-all duration-500 ${
                    isActive
                      ? "bg-[#1B4D91] shadow-[0_0_0_4px_rgba(27,77,145,0.12)] scale-110"
                      : done
                      ? "bg-[#1B4D91]"
                      : "bg-slate-100"
                  }`}
                >
                  <span className={done ? "text-white" : "text-slate-300"}>
                    {cfg.icon}
                  </span>
                </div>
                {!isLast && (
                  <div
                    className={`mt-0.5 w-0.5 flex-1 rounded-full transition-colors duration-700 ${
                      done ? "bg-[#1B4D91]" : "bg-slate-100"
                    }`}
                    style={{ minHeight: 28 }}
                  />
                )}
              </div>

              {/* Right: label + time */}
              <div className={`flex flex-1 items-start justify-between pb-5 ${isLast ? "pb-0" : ""}`}>
                <p
                  className={`text-[13px] font-semibold ${
                    isActive
                      ? "text-[#1B4D91]"
                      : done
                      ? "text-slate-700"
                      : "text-slate-300"
                  }`}
                >
                  {cfg.label}
                </p>
                {ts ? (
                  <span className="shrink-0 text-[11px] text-slate-400 tabular-nums">
                    {fmtTime(ts)}
                  </span>
                ) : done ? (
                  <span className="shrink-0 text-[11px] text-slate-300">сегодня</span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DriverCard({
  driver,
  isConnected,
}: {
  driver: DriverInfo;
  isConnected: boolean;
}) {
  const telegramHref = driver.telegramUsername
    ? `https://t.me/${driver.telegramUsername.replace("@", "")}`
    : driver.phone
    ? `tg://resolve?phone=${driver.phone.replace(/\D/g, "")}`
    : null;

  return (
    <div className="rounded-3xl bg-white border border-slate-100 shadow-sm overflow-hidden">
      {/* Trust header */}
      <div className="flex items-center gap-2 border-b border-slate-50 bg-slate-50/70 px-7 py-3">
        <ShieldCheck className="size-3.5 text-[#1B4D91]" />
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1B4D91]">
          Проверенный курьер
        </p>
      </div>

      <div className="px-7 py-5">
        <div className="flex items-start gap-4">
          {/* Avatar ring */}
          <div className="relative shrink-0">
            <div className="flex size-14 items-center justify-center rounded-full bg-[#1B4D91]/8 text-[17px] font-black text-[#1B4D91]">
              {initials(driver.name)}
            </div>
            {isConnected && (
              <span className="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full border-2 border-white bg-emerald-500">
                <Wifi className="size-2 text-white" />
              </span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-[16px] font-black text-slate-800 leading-tight">
              {driver.name}
            </p>

            {/* Rating */}
            {driver.rating != null && (
              <div className="mt-1">
                <StarRating rating={driver.rating} />
              </div>
            )}

            {/* Chips row */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {driver.vehicleType && (
                <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">
                  <Car className="size-3" />
                  {VEHICLE_LABELS[driver.vehicleType] ?? driver.vehicleType}
                </span>
              )}
              {driver.vehiclePlate && (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {driver.vehiclePlate}
                </span>
              )}
              {driver.deliveriesCompleted != null && driver.deliveriesCompleted >= 10 && (
                <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">
                  <Award className="size-3 text-amber-500" />
                  {driver.deliveriesCompleted}+ доставок
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Contact buttons */}
        <div className="mt-5 flex gap-2.5">
          <a
            href={`tel:${driver.phone}`}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#1B4D91] py-3 text-[13px] font-bold text-white transition hover:bg-[#163b92] active:scale-[0.97]"
          >
            <Phone className="size-4" />
            Позвонить
          </a>
          {telegramHref && (
            <a
              href={telegramHref}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#229ED9] py-3 text-[13px] font-bold text-white transition hover:bg-[#1a8fca] active:scale-[0.97]"
            >
              <MessageCircle className="size-4" />
              Telegram
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function PodPhoto({ url }: { url: string }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="rounded-3xl bg-white border border-emerald-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-7 py-4 border-b border-emerald-50">
        <ImageIcon className="size-4 text-emerald-600" />
        <p className="text-[11px] font-black uppercase tracking-[0.14em] text-emerald-600">
          Фото подтверждения
        </p>
      </div>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="block w-full text-left"
        aria-label={expanded ? "Свернуть" : "Развернуть"}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt="Подтверждение доставки"
          className={`w-full object-cover transition-all duration-300 ${
            expanded ? "max-h-[500px]" : "max-h-52"
          }`}
        />
      </button>
      <p className="px-7 py-3 text-[11px] text-slate-400">
        Нажмите на фото, чтобы {expanded ? "свернуть" : "развернуть"}
      </p>
    </div>
  );
}

function DeliveredCelebration({
  driverName,
  podPhotoUrl,
  deliveredAt,
}: {
  driverName: string;
  podPhotoUrl?: string;
  deliveredAt: number | null;
}) {
  return (
    <>
      {/* Big celebration card */}
      <div className="rounded-3xl bg-gradient-to-b from-emerald-500 to-emerald-600 px-7 py-10 text-center relative overflow-hidden shadow-lg shadow-emerald-200">
        {/* Background circles */}
        <div className="pointer-events-none absolute -left-12 -top-12 size-40 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -right-8 -bottom-8 size-32 rounded-full bg-white/10" />

        {/* Animated check */}
        <div className="relative mx-auto mb-5 flex size-20 items-center justify-center">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/30" />
          <div className="relative flex size-20 items-center justify-center rounded-full bg-white shadow-lg">
            <CheckCircle className="size-10 text-emerald-500" />
          </div>
        </div>

        <p className="text-[28px] font-black text-white leading-tight">
          Доставлено!
        </p>
        <p className="mt-2 text-[14px] text-white/80">
          {driverName} доставил ваш заказ
        </p>
        {deliveredAt && (
          <p className="mt-1 text-[12px] text-white/60">
            в {fmtTime(deliveredAt)}
          </p>
        )}

        <div className="mt-6 flex items-center justify-center gap-2 rounded-2xl bg-white/15 px-4 py-2.5">
          <Sparkles className="size-4 text-white/80" />
          <p className="text-[13px] font-semibold text-white">
            Спасибо, что выбрали нас!
          </p>
        </div>
      </div>

      {/* POD photo */}
      {podPhotoUrl && <PodPhoto url={podPhotoUrl} />}

      {/* Summary card */}
      <div className="flex items-center gap-4 rounded-3xl bg-white border border-slate-100 shadow-sm px-7 py-5">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-50">
          <CheckCircle className="size-5 text-emerald-500" />
        </div>
        <div>
          <p className="text-[14px] font-bold text-slate-800">Заказ выполнен</p>
          <p className="text-[12px] text-slate-500">
            Курьер: {driverName}
            {deliveredAt ? ` · ${fmtTime(deliveredAt)}` : ""}
          </p>
        </div>
      </div>
    </>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────────

export default function OrderTrackingPage() {
  const { id: orderId } = useParams<{ id: string }>();

  const [data,             setData]             = useState<TrackingData | null>(null);
  const [driverLoc,        setDriverLoc]        = useState<DriverLocation | null>(null);
  const [assignmentStatus, setAssignmentStatus] = useState<string | null>(null);
  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState<string | null>(null);
  const [isConnected,      setIsConnected]      = useState(false);
  const [etaMinutes,       setEtaMinutes]       = useState<number | null>(null);
  const [milestones,       setMilestones]       = useState<Partial<Record<MilestoneKey, number>>>({});
  const [tick,             setTick]             = useState(0);

  const mapRef         = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<InstanceType<typeof window.ymaps.Map> | null>(null);
  const markerRef      = useRef<InstanceType<typeof window.ymaps.Placemark> | null>(null);
  const destMarkerRef  = useRef<InstanceType<typeof window.ymaps.Placemark> | null>(null);
  const routeLineRef   = useRef<InstanceType<typeof window.ymaps.Polyline> | null>(null);
  const socketRef      = useRef<Socket | null>(null);
  const etaIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const routePulseRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const mapReadyRef    = useRef(false);
  const isFinalRef     = useRef(false);

  const addMilestone = useCallback((key: MilestoneKey, ts = Date.now()) => {
    setMilestones((prev) => ({ ...prev, [key]: prev[key] ?? ts }));
  }, []);

  // ── Load initial data ────────────────────────────────────────────────────────
  const loadTracking = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/tracking/orders/${orderId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Not found");
      const json: TrackingData = await res.json();
      setData(json);

      if (json.location) {
        setDriverLoc({
          ...json.location,
          driverId: json.assignment?.driver.id ?? "",
        });
      }

      if (json.assignment) {
        const st = json.assignment.status;
        setAssignmentStatus(st);

        // Pre-fill milestones for steps already completed on page load
        const order: MilestoneKey[] = ["ACCEPTED", "PICKED_UP", "DELIVERED"];
        const idx = order.indexOf(st as MilestoneKey);
        if (idx >= 0) {
          // All steps up to and including current are "done".
          // We only know approximate times — use a rough spread.
          order.slice(0, idx + 1).forEach((k) => addMilestone(k));
        }

        if (st === "DELIVERED" || st === "CANCELLED") isFinalRef.current = true;
      }
    } catch {
      setError("Не удалось загрузить данные о доставке");
    } finally {
      setLoading(false);
    }
  }, [orderId, addMilestone]);

  useEffect(() => {
    loadTracking();
  }, [loadTracking]);

  // ── ETA polling ──────────────────────────────────────────────────────────────
  const fetchEta = useCallback(async (assignmentId: string) => {
    if (isFinalRef.current) return;
    try {
      const res = await fetch(`${API_URL}/tracking/eta/${assignmentId}`, {
        credentials: "include",
      });
      if (!res.ok) return;
      const json: { etaMinutes: number } = await res.json();
      setEtaMinutes(json.etaMinutes);
    } catch { /* supplemental */ }
  }, []);

  useEffect(() => {
    if (!data?.assignment?.id) return;
    const status = assignmentStatus ?? data.assignment.status;
    if (status === "DELIVERED" || status === "CANCELLED") return;

    fetchEta(data.assignment.id);
    etaIntervalRef.current = setInterval(
      () => fetchEta(data!.assignment!.id),
      60_000
    );
    return () => {
      if (etaIntervalRef.current) clearInterval(etaIntervalRef.current);
    };
  }, [data?.assignment?.id, assignmentStatus, fetchEta]);

  // ── Stop everything when order is final ──────────────────────────────────────
  useEffect(() => {
    if (assignmentStatus !== "DELIVERED" && assignmentStatus !== "CANCELLED") return;
    isFinalRef.current = true;
    if (etaIntervalRef.current) clearInterval(etaIntervalRef.current);
    if (routePulseRef.current) clearInterval(routePulseRef.current);
    socketRef.current?.disconnect();
    setIsConnected(false);
  }, [assignmentStatus]);

  // ── Relative time tick ───────────────────────────────────────────────────────
  useEffect(() => {
    if (isFinalRef.current) return;
    const t = setInterval(() => setTick((n) => n + 1), 10_000);
    return () => clearInterval(t);
  }, []);

  void tick; // used implicitly to keep relative timestamps fresh

  // ── WebSocket ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!data?.assignment || isFinalRef.current) return;

    const socket = io(`${API_URL}/tracking`, {
      transports: ["websocket"],
      withCredentials: true,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit("client.order.subscribe", { orderId });
    });

    socket.on("disconnect", () => setIsConnected(false));

    socket.on("order.driver.location", (loc: DriverLocation) => {
      if (isFinalRef.current) return;
      if (loc.driverId === data.assignment?.driver.id) {
        setDriverLoc(loc);
      }
    });

    socket.on(
      "assignment.status.changed",
      (payload: { orderId: string; status: string }) => {
        if (payload.orderId !== orderId) return;
        const st = payload.status;
        setAssignmentStatus(st);
        if (st === "PICKED_UP") addMilestone("PICKED_UP");
        if (st === "DELIVERED") {
          addMilestone("DELIVERED");
          setEtaMinutes(null);
          setTimeout(loadTracking, 1_500);
        }
      }
    );

    socket.on("order.delivered", () => {
      setAssignmentStatus("DELIVERED");
      addMilestone("DELIVERED");
      setEtaMinutes(null);
      setTimeout(loadTracking, 1_500);
    });

    return () => { socket.disconnect(); };
  }, [data?.assignment, orderId, addMilestone, loadTracking]);

  // ── Yandex Maps script ───────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined" || window.ymaps) return;
    const apiKey = process.env.NEXT_PUBLIC_YANDEX_MAPS_KEY ?? "";
    const script = document.createElement("script");
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${apiKey}&lang=ru_RU`;
    script.async = true;
    document.head.appendChild(script);
  }, []);

  // ── Init map ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || mapReadyRef.current) return;

    const tryInit = () => {
      if (!window.ymaps || !mapRef.current) {
        setTimeout(tryInit, 400);
        return;
      }
      window.ymaps.ready(() => {
        if (!mapRef.current || mapReadyRef.current) return;
        mapReadyRef.current = true;
        mapInstanceRef.current = new window.ymaps.Map(
          mapRef.current,
          { center: [41.2995, 69.2401], zoom: 13 },
          { suppressMapOpenError: true }
        );
      });
    };

    tryInit();

    return () => {
      if (routePulseRef.current) clearInterval(routePulseRef.current);
      mapInstanceRef.current?.destroy();
      mapInstanceRef.current = null;
      mapReadyRef.current = false;
    };
  }, []);

  // ── Destination marker ───────────────────────────────────────────────────────
  useEffect(() => {
    const map  = mapInstanceRef.current;
    const dest = data?.assignment?.destination;
    if (!map || !window.ymaps || !dest) return;

    if (!destMarkerRef.current) {
      const m = new window.ymaps.Placemark(
        [dest.lat, dest.lng],
        {
          hintContent: "Адрес доставки",
          balloonContent: dest.address ?? "Адрес доставки",
        },
        { preset: "islands#redHomeCircleIcon" }
      );
      map.geoObjects.add(m);
      destMarkerRef.current = m;
    }
  }, [data?.assignment?.destination]);

  // ── Driver marker + route polyline + smooth pan ──────────────────────────────
  useEffect(() => {
    const map  = mapInstanceRef.current;
    const dest = data?.assignment?.destination;
    if (!map || !window.ymaps || !driverLoc) return;

    // Driver marker
    if (markerRef.current) {
      markerRef.current.geometry.setCoordinates([driverLoc.lat, driverLoc.lng]);
    } else {
      const m = new window.ymaps.Placemark(
        [driverLoc.lat, driverLoc.lng],
        {
          hintContent: data?.assignment?.driver.name ?? "Курьер",
          balloonContent: `Ваш курьер: ${data?.assignment?.driver.name}`,
        },
        { preset: "islands#blueDeliveryCircleIcon" }
      );
      map.geoObjects.add(m);
      markerRef.current = m;
    }

    // Route polyline between driver and destination
    if (dest) {
      const coords: [number, number][] = [
        [driverLoc.lat, driverLoc.lng],
        [dest.lat, dest.lng],
      ];

      if (routeLineRef.current) {
        routeLineRef.current.geometry.setCoordinates(coords);
      } else {
        const line = new window.ymaps.Polyline(
          coords,
          {},
          {
            strokeColor: "#1B4D91",
            strokeWidth: 3,
            strokeOpacity: 0.65,
            strokeStyle: "dash",
          }
        );
        map.geoObjects.add(line);
        routeLineRef.current = line;

        // Gentle breathing animation on the route line
        let high = false;
        routePulseRef.current = setInterval(() => {
          if (!routeLineRef.current) return;
          high = !high;
          routeLineRef.current.options.set("strokeOpacity", high ? 0.85 : 0.45);
        }, 1_400);
      }
    }

    // Smooth re-center toward driver
    map.setCenter([driverLoc.lat, driverLoc.lng], undefined, {
      duration: 600,
      timingFunction: "ease-in-out",
    });
  }, [driverLoc, data?.assignment?.driver.name, data?.assignment?.destination]);

  // ── Zoom into approaching mode ────────────────────────────────────────────────
  const dest        = data?.assignment?.destination;
  const distanceM   = driverLoc && dest
    ? haversineMeters(
        [driverLoc.lat, driverLoc.lng],
        [dest.lat, dest.lng]
      )
    : null;
  const isApproaching = distanceM !== null && distanceM < APPROACHING_THRESHOLD_M;

  useEffect(() => {
    if (!isApproaching || !mapInstanceRef.current) return;
    mapInstanceRef.current.setZoom(16, { duration: 800 });
    addMilestone("NEAR");
  }, [isApproaching, addMilestone]);

  // ── Derived state ─────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="size-10 animate-spin rounded-full border-4 border-[#1B4D91]/20 border-t-[#1B4D91]" />
          <p className="text-[14px] text-slate-500">Загрузка данных о доставке…</p>
        </div>
      </div>
    );
  }

  if (error || !data?.assignment) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center px-6">
          <Truck className="size-12 text-slate-200" />
          <p className="text-[16px] font-bold text-slate-500">
            {error ?? "Отслеживание недоступно"}
          </p>
          <p className="text-[13px] text-slate-400">
            Заказ ещё не назначен курьеру или уже доставлен
          </p>
        </div>
      </div>
    );
  }

  const { assignment }  = data;
  const currentStatus   = assignmentStatus ?? assignment.status;
  const isDelivered     = currentStatus === "DELIVERED";
  const isCancelled     = currentStatus === "CANCELLED";
  const isStale         = driverLoc ? Date.now() - driverLoc.timestamp > 120_000 : false;
  const isArrivingSoon  = !isDelivered && etaMinutes !== null && etaMinutes <= ARRIVING_SOON_ETA;

  return (
    <div className="min-h-screen bg-[#F0F2F5] pb-20 pt-6 md:pt-10">
      <div className="max-w-[860px] mx-auto px-4 md:px-6 flex flex-col gap-5">

        {/* ── Header ── */}
        <div
          className={`rounded-3xl px-7 py-8 md:px-10 relative overflow-hidden transition-colors duration-700 ${
            STATUS_BG[currentStatus] ?? "bg-[#1B4D91]"
          }`}
        >
          <div className="pointer-events-none absolute -right-10 -top-10 size-48 rounded-full bg-white/5 blur-3xl" />
          <div className="pointer-events-none absolute -left-8 -bottom-8 size-32 rounded-full bg-white/5 blur-2xl" />

          <div className="relative z-10 flex items-start justify-between gap-4">
            <div>
              <div className="mb-1 flex items-center gap-2 text-white/50 text-[11px] font-black uppercase tracking-[0.16em]">
                <Truck className="size-3.5" />
                Отслеживание заказа
              </div>
              <h1 className="text-[22px] md:text-[26px] font-black text-white leading-tight">
                {STATUS_LABELS[currentStatus] ?? currentStatus}
              </h1>
              <p className="mt-1 text-[12px] text-white/60">
                №{String(orderId).slice(-8).toUpperCase()}
              </p>
            </div>

            {!isDelivered && !isCancelled && (
              <div className="shrink-0">
                <EtaChip minutes={etaMinutes} approaching={isApproaching} />
              </div>
            )}
          </div>
        </div>

        {/* ── Smart banners ── */}
        {isApproaching && !isDelivered && (
          <ApproachingBanner distanceM={distanceM!} />
        )}
        {isArrivingSoon && !isApproaching && (
          <ArrivingSoonBanner />
        )}

        {/* ── Progress stepper ── */}
        {!isCancelled && !isDelivered && (
          <ProgressStepper currentStatus={currentStatus} />
        )}

        {/* ── Delivery celebration (replaces stepper + map when delivered) ── */}
        {isDelivered ? (
          <DeliveredCelebration
            driverName={assignment.driver.name}
            podPhotoUrl={assignment.podPhotoUrl}
            deliveredAt={milestones["DELIVERED"] ?? null}
          />
        ) : (
          <>
            {/* ── Map ── */}
            <div
              className={`rounded-3xl overflow-hidden border shadow-sm relative transition-all duration-500 ${
                isApproaching
                  ? "border-emerald-200 shadow-emerald-100 shadow-md"
                  : "border-slate-100"
              }`}
              style={{ height: isApproaching ? 380 : 320 }}
            >
              <div
                ref={mapRef}
                className={`h-full w-full transition-opacity duration-500 ${
                  driverLoc ? "opacity-100" : "opacity-0"
                }`}
              />
              {!driverLoc && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <Navigation className="size-8 text-slate-200" />
                    <p className="text-[13px] text-slate-400">
                      Ожидание координат курьера…
                    </p>
                  </div>
                </div>
              )}

              {/* Live / stale indicator */}
              {driverLoc && (
                <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-xl bg-white/92 backdrop-blur-sm px-3 py-1.5 shadow-sm border border-slate-100/80">
                  <LiveDot stale={isStale} />
                  <span className="text-[10px] text-slate-400">
                    {relativeTime(driverLoc.timestamp)}
                  </span>
                </div>
              )}
            </div>

            {/* ── Milestones timeline ── */}
            <MilestonesTimeline
              milestones={milestones}
              currentStatus={currentStatus}
              isNear={isApproaching || isArrivingSoon}
            />
          </>
        )}

        {/* ── Driver card (always visible) ── */}
        <DriverCard driver={assignment.driver} isConnected={isConnected} />

        {/* ── Location freshness footer ── */}
        {driverLoc && !isDelivered && (
          <div className="flex items-center gap-2 justify-center">
            <Clock className="size-3.5 text-slate-400" />
            <span className="text-[11px] text-slate-400">
              Координаты обновлены:{" "}
              <span className={isStale ? "text-amber-500 font-semibold" : ""}>
                {relativeTime(driverLoc.timestamp)}
              </span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
