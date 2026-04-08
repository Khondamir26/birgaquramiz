"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { io, type Socket } from "socket.io-client";
import { MapPin, Phone, User, Truck, CheckCircle, Clock } from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface TrackingData {
  assignment: {
    id: string;
    status: string;
    driver: {
      id: string;
      name: string;
      phone: string;
    };
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

type AssignmentStatus = {
  assignmentId: string;
  orderId: string;
  status: string;
};

// ─── Yandex Maps global types ──────────────────────────────────────────────────
declare global {
  interface Window {
    ymaps: {
      ready: (cb: () => void) => void;
      Map: new (el: HTMLElement, state: object, opts?: object) => {
        geoObjects: {
          add: (obj: object) => void;
          remove: (obj: object) => void;
        };
        setCenter: (coords: [number, number], zoom?: number) => void;
        destroy: () => void;
      };
      Placemark: new (
        coords: [number, number],
        props: object,
        opts: object
      ) => {
        geometry: { setCoordinates: (c: [number, number]) => void };
      };
    };
  }
}

// ─── Status config ─────────────────────────────────────────────────────────────

const STATUS_STEPS = ["ACCEPTED", "PICKED_UP", "DELIVERED"];

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Назначаем курьера",
  ACCEPTED: "Курьер забирает заказ",
  PICKED_UP: "В пути к вам",
  DELIVERED: "Доставлено",
  CANCELLED: "Отменено",
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

// ─── Component ─────────────────────────────────────────────────────────────────

export default function OrderTrackingPage() {
  const { id: orderId } = useParams<{ id: string }>();

  const [data, setData] = useState<TrackingData | null>(null);
  const [driverLoc, setDriverLoc] = useState<DriverLocation | null>(null);
  const [assignmentStatus, setAssignmentStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<InstanceType<typeof window.ymaps.Map> | null>(null);
  const markerRef = useRef<InstanceType<typeof window.ymaps.Placemark> | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const ymapsReadyRef = useRef(false);

  // ── Load initial data ──────────────────────────────────────────────────────
  const loadTracking = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/tracking/orders/${orderId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Not found");
      const json: TrackingData = await res.json();
      setData(json);
      if (json.location) setDriverLoc({ ...json.location, driverId: json.assignment?.driver.id ?? "" });
      if (json.assignment) setAssignmentStatus(json.assignment.status);
    } catch {
      setError("Не удалось загрузить данные о доставке");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadTracking();
  }, [loadTracking]);

  // ── WebSocket ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!data?.assignment) return;

    // Get JWT from cookie (cookie-based auth — pass via auth handshake)
    const socket = io(`${API_URL}/tracking`, {
      transports: ["websocket"],
      withCredentials: true,
      // Token from cookie — backend also reads cookies via handshake headers
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("client:subscribe_order", { orderId });
    });

    socket.on("server:location_update", (loc: DriverLocation) => {
      if (loc.driverId === data.assignment?.driver.id) {
        setDriverLoc(loc);
      }
    });

    socket.on("server:assignment_status", (payload: AssignmentStatus) => {
      if (payload.orderId === orderId) {
        setAssignmentStatus(payload.status);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [data?.assignment, orderId]);

  // ── Yandex Maps ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.ymaps) { ymapsReadyRef.current = true; return; }

    const apiKey = process.env.NEXT_PUBLIC_YANDEX_MAPS_KEY ?? "";
    const script = document.createElement("script");
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${apiKey}&lang=ru_RU`;
    script.async = true;
    script.onload = () => { ymapsReadyRef.current = true; };
    document.head.appendChild(script);
  }, []);

  // Init map when container is ready
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const tryInit = () => {
      if (!window.ymaps || !mapRef.current) {
        setTimeout(tryInit, 400);
        return;
      }
      window.ymaps.ready(() => {
        if (!mapRef.current || mapInstanceRef.current) return;
        mapInstanceRef.current = new window.ymaps.Map(
          mapRef.current,
          { center: [41.2995, 69.2401], zoom: 12 },
          { suppressMapOpenError: true }
        );
      });
    };

    tryInit();

    return () => {
      mapInstanceRef.current?.destroy();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update driver marker on location change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !window.ymaps || !driverLoc) return;

    if (markerRef.current) {
      markerRef.current.geometry.setCoordinates([driverLoc.lat, driverLoc.lng]);
    } else {
      const marker = new window.ymaps.Placemark(
        [driverLoc.lat, driverLoc.lng],
        {
          hintContent: data?.assignment?.driver.name ?? "Курьер",
          balloonContent: `Ваш курьер: ${data?.assignment?.driver.name}`,
        },
        { preset: "islands#blueDeliveryCircleIcon" }
      );
      map.geoObjects.add(marker);
      markerRef.current = marker;
    }

    map.setCenter([driverLoc.lat, driverLoc.lng]);
  }, [driverLoc, data?.assignment?.driver.name]);

  // ── Render ─────────────────────────────────────────────────────────────────

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

  const { assignment } = data;
  const currentStatus = assignmentStatus ?? assignment.status;
  const currentStepIndex = STATUS_STEPS.indexOf(currentStatus);
  const isDelivered = currentStatus === "DELIVERED";
  const isCancelled = currentStatus === "CANCELLED";

  return (
    <div className="min-h-screen bg-[#F0F2F5] pb-20 pt-6 md:pt-10">
      <div className="max-w-[860px] mx-auto px-4 md:px-6 flex flex-col gap-5">

        {/* ── Header ── */}
        <div className="rounded-3xl bg-[#1B4D91] px-7 py-8 md:px-10 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 size-48 rounded-full bg-white/5 blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <div className="mb-1 flex items-center gap-2 text-white/50 text-[11px] font-black uppercase tracking-[0.16em]">
              <Truck className="size-3.5" />
              Отслеживание заказа
            </div>
            <h1 className="text-[22px] md:text-[26px] font-black text-white leading-tight">
              {STATUS_LABELS[currentStatus] ?? currentStatus}
            </h1>
          </div>
        </div>

        {/* ── Progress steps ── */}
        {!isCancelled && (
          <div className="rounded-3xl bg-white border border-slate-100 shadow-sm px-7 py-6">
            <div className="flex items-center justify-between">
              {STATUS_STEPS.map((step, i) => {
                const done = i <= currentStepIndex;
                const active = i === currentStepIndex;
                return (
                  <div key={step} className="flex flex-1 flex-col items-center gap-1.5">
                    <div
                      className={`flex size-9 items-center justify-center rounded-full transition-all ${
                        done
                          ? "bg-[#1B4D91] shadow-[0_0_0_4px_rgba(27,77,145,0.12)]"
                          : "bg-slate-100"
                      }`}
                    >
                      <CheckCircle
                        className={`size-4 ${done ? "text-white" : "text-slate-300"}`}
                      />
                    </div>
                    <span
                      className={`text-center text-[11px] font-semibold leading-tight ${
                        active ? "text-[#1B4D91]" : done ? "text-slate-600" : "text-slate-300"
                      }`}
                    >
                      {STATUS_LABELS[step]}
                    </span>
                    {i < STATUS_STEPS.length - 1 && (
                      <div
                        className={`absolute top-4 h-0.5 w-full translate-x-1/2 ${
                          i < currentStepIndex ? "bg-[#1B4D91]" : "bg-slate-100"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Map ── */}
        <div className="rounded-3xl overflow-hidden border border-slate-100 shadow-sm" style={{ height: 320 }}>
          {driverLoc ? (
            <div ref={mapRef} className="h-full w-full" />
          ) : (
            <div className="flex h-full items-center justify-center bg-slate-50">
              <div className="flex flex-col items-center gap-3 text-center">
                <MapPin className="size-8 text-slate-200" />
                <p className="text-[13px] text-slate-400">
                  {isDelivered
                    ? "Заказ доставлен"
                    : "Ожидание координат курьера…"}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Driver info ── */}
        <div className="rounded-3xl bg-white border border-slate-100 shadow-sm px-7 py-6">
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400 mb-4">
            Ваш курьер
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex size-12 items-center justify-center rounded-full bg-[#1B4D91]/8">
                <User className="size-6 text-[#1B4D91]" />
              </div>
              <div>
                <p className="text-[15px] font-bold text-slate-800">
                  {assignment.driver.name}
                </p>
                <p className="text-[13px] text-slate-500">{assignment.driver.phone}</p>
              </div>
            </div>

            <a
              href={`tel:${assignment.driver.phone}`}
              className="flex items-center gap-2 rounded-xl bg-[#1B4D91] px-4 py-2.5 text-[13px] font-bold text-white transition hover:bg-[#163b92]"
            >
              <Phone className="size-4" />
              Позвонить
            </a>
          </div>
        </div>

        {/* ── Last update ── */}
        {driverLoc && (
          <div className="flex items-center gap-2 justify-center text-[12px] text-slate-400">
            <Clock className="size-3.5" />
            <span>
              Обновлено{" "}
              {new Date(driverLoc.timestamp).toLocaleTimeString("ru-RU", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
