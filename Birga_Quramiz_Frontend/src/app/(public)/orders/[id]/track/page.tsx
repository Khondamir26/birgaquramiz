"use client";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ymaps: any;
  }
}

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { io, type Socket } from "socket.io-client";
import { Truck, Navigation, Clock } from "lucide-react";
import {
  type TrackingData, type DriverLocation, type MilestoneKey,
  STATUS_LABELS, STATUS_BG, APPROACHING_THRESHOLD_M, ARRIVING_SOON_ETA,
  API_URL, haversineMeters, relativeTime,
} from "@/lib/tracking";
import {
  LiveDot, EtaChip, ProgressStepper, MilestonesTimeline,
  DriverCard, ArrivingSoonBanner, ApproachingBanner, DeliveredCelebration,
} from "@/components/tracking/TrackingUI";

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
      const res = await fetch(`${API_URL}/tracking/orders/${orderId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Not found");
      const json: TrackingData = await res.json();
      setData(json);

      if (json.location) {
        setDriverLoc({ ...json.location, driverId: json.assignment?.driver.id ?? "" });
      }

      if (json.assignment) {
        const st = json.assignment.status;
        setAssignmentStatus(st);
        const order: MilestoneKey[] = ["ACCEPTED", "PICKED_UP", "DELIVERED"];
        const idx = order.indexOf(st as MilestoneKey);
        if (idx >= 0) order.slice(0, idx + 1).forEach((k) => addMilestone(k));
        if (st === "DELIVERED" || st === "CANCELLED") isFinalRef.current = true;
      }
    } catch {
      setError("Не удалось загрузить данные о доставке");
    } finally {
      setLoading(false);
    }
  }, [orderId, addMilestone]);

  useEffect(() => { loadTracking(); }, [loadTracking]);

  // ── ETA polling ──────────────────────────────────────────────────────────────
  const fetchEta = useCallback(async (assignmentId: string) => {
    if (isFinalRef.current) return;
    try {
      const res = await fetch(`${API_URL}/tracking/eta/${assignmentId}`, { credentials: "include" });
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
    etaIntervalRef.current = setInterval(() => fetchEta(data!.assignment!.id), 60_000);
    return () => { if (etaIntervalRef.current) clearInterval(etaIntervalRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.assignment?.id, assignmentStatus, fetchEta]);

  // ── Stop when final ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (assignmentStatus !== "DELIVERED" && assignmentStatus !== "CANCELLED") return;
    isFinalRef.current = true;
    if (etaIntervalRef.current) clearInterval(etaIntervalRef.current);
    if (routePulseRef.current)  clearInterval(routePulseRef.current);
    socketRef.current?.disconnect();
    setIsConnected(false);
  }, [assignmentStatus]);

  // ── Relative time tick ───────────────────────────────────────────────────────
  useEffect(() => {
    if (isFinalRef.current) return;
    const t = setInterval(() => setTick((n) => n + 1), 10_000);
    return () => clearInterval(t);
  }, []);
  void tick;

  // ── WebSocket ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!data?.assignment || isFinalRef.current) return;
    const socket = io(`${API_URL}/tracking`, { transports: ["websocket"], withCredentials: true });
    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit("client.order.subscribe", { orderId });
    });
    socket.on("disconnect", () => setIsConnected(false));
    socket.on("order.driver.location", (loc: DriverLocation) => {
      if (isFinalRef.current) return;
      if (loc.driverId === data.assignment?.driver.id) setDriverLoc(loc);
    });
    socket.on("assignment.status.changed", (payload: { orderId: string; status: string }) => {
      if (payload.orderId !== orderId) return;
      const st = payload.status;
      setAssignmentStatus(st);
      if (st === "ACCEPTED")  addMilestone("ACCEPTED");
      if (st === "PICKED_UP") addMilestone("PICKED_UP");
      if (st === "DELIVERED") { addMilestone("DELIVERED"); setEtaMinutes(null); setTimeout(loadTracking, 1_500); }
    });
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
      if (!window.ymaps || !mapRef.current) { setTimeout(tryInit, 400); return; }
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
        { hintContent: "Адрес доставки", balloonContent: dest.address ?? "Адрес доставки" },
        { preset: "islands#redHomeCircleIcon" }
      );
      map.geoObjects.add(m);
      destMarkerRef.current = m;
    }
  }, [data?.assignment?.destination]);

  // ── Driver marker + route polyline ───────────────────────────────────────────
  useEffect(() => {
    const map  = mapInstanceRef.current;
    const dest = data?.assignment?.destination;
    if (!map || !window.ymaps || !driverLoc) return;

    if (markerRef.current) {
      markerRef.current.geometry.setCoordinates([driverLoc.lat, driverLoc.lng]);
    } else {
      const m = new window.ymaps.Placemark(
        [driverLoc.lat, driverLoc.lng],
        { hintContent: data?.assignment?.driver.name ?? "Курьер", balloonContent: `Ваш курьер: ${data?.assignment?.driver.name}` },
        { preset: "islands#blueDeliveryCircleIcon" }
      );
      map.geoObjects.add(m);
      markerRef.current = m;
    }

    if (dest) {
      const coords: [number, number][] = [[driverLoc.lat, driverLoc.lng], [dest.lat, dest.lng]];
      if (routeLineRef.current) {
        routeLineRef.current.geometry.setCoordinates(coords);
      } else {
        const line = new window.ymaps.Polyline(coords, {}, {
          strokeColor: "#1B4D91", strokeWidth: 3, strokeOpacity: 0.65, strokeStyle: "dash",
        });
        map.geoObjects.add(line);
        routeLineRef.current = line;
        let high = false;
        routePulseRef.current = setInterval(() => {
          if (!routeLineRef.current) return;
          high = !high;
          routeLineRef.current.options.set("strokeOpacity", high ? 0.85 : 0.45);
        }, 1_400);
      }
    }

    map.setCenter([driverLoc.lat, driverLoc.lng], undefined, { duration: 600, timingFunction: "ease-in-out" });
  }, [driverLoc, data?.assignment?.driver.name, data?.assignment?.destination]);

  // ── Approaching detection ────────────────────────────────────────────────────
  const dest        = data?.assignment?.destination;
  const distanceM   = driverLoc && dest ? haversineMeters([driverLoc.lat, driverLoc.lng], [dest.lat, dest.lng]) : null;
  const isApproaching = distanceM !== null && distanceM < APPROACHING_THRESHOLD_M;

  useEffect(() => {
    if (!isApproaching || !mapInstanceRef.current) return;
    mapInstanceRef.current.setZoom(16, { duration: 800 });
    addMilestone("NEAR");
  }, [isApproaching, addMilestone]);

  // ── Early returns ─────────────────────────────────────────────────────────────
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
          <p className="text-[16px] font-bold text-slate-500">{error ?? "Отслеживание недоступно"}</p>
          <p className="text-[13px] text-slate-400">Заказ ещё не назначен курьеру или уже доставлен</p>
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

        {/* Header */}
        <div className={`rounded-3xl px-7 py-8 md:px-10 relative overflow-hidden transition-colors duration-700 ${STATUS_BG[currentStatus] ?? "bg-[#1B4D91]"}`}>
          <div className="pointer-events-none absolute -right-10 -top-10 size-48 rounded-full bg-white/5 blur-3xl" />
          <div className="pointer-events-none absolute -left-8 -bottom-8 size-32 rounded-full bg-white/5 blur-2xl" />
          <div className="relative z-10 flex items-start justify-between gap-4">
            <div>
              <div className="mb-1 flex items-center gap-2 text-white/50 text-[11px] font-black uppercase tracking-[0.16em]">
                <Truck className="size-3.5" /> Отслеживание заказа
              </div>
              <h1 className="text-[22px] md:text-[26px] font-black text-white leading-tight">
                {STATUS_LABELS[currentStatus] ?? currentStatus}
              </h1>
              <p className="mt-1 text-[12px] text-white/60">№{String(orderId).slice(-8).toUpperCase()}</p>
            </div>
            {!isDelivered && !isCancelled && (
              <div className="shrink-0">
                <EtaChip minutes={etaMinutes} approaching={isApproaching} />
              </div>
            )}
          </div>
        </div>

        {isApproaching && !isDelivered && <ApproachingBanner distanceM={distanceM!} />}
        {isArrivingSoon && !isApproaching  && <ArrivingSoonBanner />}
        {!isCancelled && !isDelivered && <ProgressStepper currentStatus={currentStatus} />}

        {isDelivered ? (
          <DeliveredCelebration
            driverName={assignment.driver.name}
            podPhotoUrl={assignment.podPhotoUrl}
            deliveredAt={milestones["DELIVERED"] ?? null}
          />
        ) : (
          <>
            {/* Map */}
            <div
              className={`rounded-3xl overflow-hidden border shadow-sm relative transition-all duration-500 ${isApproaching ? "border-emerald-200 shadow-emerald-100 shadow-md" : "border-slate-100"}`}
              style={{ height: isApproaching ? 380 : 320 }}
            >
              <div ref={mapRef} className={`h-full w-full transition-opacity duration-500 ${driverLoc ? "opacity-100" : "opacity-0"}`} />
              {!driverLoc && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <Navigation className="size-8 text-slate-200" />
                    <p className="text-[13px] text-slate-400">Ожидание координат курьера…</p>
                  </div>
                </div>
              )}
              {driverLoc && (
                <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-xl bg-white/92 backdrop-blur-sm px-3 py-1.5 shadow-sm border border-slate-100/80">
                  <LiveDot stale={isStale} />
                  <span className="text-[10px] text-slate-400">{relativeTime(driverLoc.timestamp)}</span>
                </div>
              )}
            </div>

            <MilestonesTimeline milestones={milestones} currentStatus={currentStatus} isNear={isApproaching || isArrivingSoon} />
          </>
        )}

        <DriverCard driver={assignment.driver} isConnected={isConnected} />

        {driverLoc && !isDelivered && (
          <div className="flex items-center gap-2 justify-center">
            <Clock className="size-3.5 text-slate-400" />
            <span className="text-[11px] text-slate-400">
              Координаты обновлены:{" "}
              <span className={isStale ? "text-amber-500 font-semibold" : ""}>{relativeTime(driverLoc.timestamp)}</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
