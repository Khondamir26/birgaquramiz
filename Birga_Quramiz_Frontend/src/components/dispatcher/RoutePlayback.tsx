"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { trackingApi } from "@/services/trackingApi";
import type { RoutePoint } from "@/services/trackingApi";
import { useTrackingStore } from "@/store/trackingStore";
import { format, parseISO } from "date-fns";
import {
  X,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Navigation,
  Gauge,
  Clock,
  MapPin,
  Route,
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: Parameters<typeof clsx>) {
  return twMerge(clsx(inputs));
}

/* eslint-disable @typescript-eslint/no-explicit-any */
declare const window: Window & { google?: any };

const SPEEDS = [1, 2, 5, 10] as const;
type Speed = typeof SPEEDS[number];

// Points per 500ms tick for each speed multiplier.
// History is buffered every ~30s, so 1pt/tick ≈ 15s of real time per second of playback.
const POINTS_PER_TICK: Record<Speed, number> = { 1: 1, 2: 2, 5: 5, 10: 10 };

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function haversineKm(a: RoutePoint, b: RoutePoint) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sin2 = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(sin2), Math.sqrt(1 - sin2));
}

function totalDistanceKm(points: RoutePoint[]) {
  let km = 0;
  for (let i = 1; i < points.length; i++) km += haversineKm(points[i - 1], points[i]);
  return km;
}

interface Props {
  driverId: string;
  onClose:  () => void;
}

export default function RoutePlayback({ driverId, onClose }: Props) {
  const { drivers } = useTrackingStore();
  const driver      = drivers[driverId];

  const [date,    setDate]    = useState(todayISO());
  const [idx,     setIdx]     = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed,   setSpeed]   = useState<Speed>(2);

  const mapDivRef  = useRef<HTMLDivElement>(null);
  const mapRef     = useRef<any>(null);
  const polylineRef= useRef<any>(null);
  const markerRef  = useRef<any>(null);
  const tickRef    = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch history for the selected date
  const from = `${date}T00:00:00.000Z`;
  const to   = `${date}T23:59:59.999Z`;

  const { data: points = [], isLoading } = useQuery({
    queryKey: ["route-history", driverId, date],
    queryFn:  () => trackingApi.getRouteHistory(driverId, from, to),
    staleTime: 60_000,
  });

  // ─── Map init ────────────────────────────────────────────────────────────────

  const initMap = useCallback(() => {
    if (!mapDivRef.current || mapRef.current) return;
    const gmaps = window.google;
    if (!gmaps?.maps) return;

    mapRef.current = new gmaps.maps.Map(mapDivRef.current, {
      center:           { lat: 41.2995, lng: 69.2401 },
      zoom:             12,
      disableDefaultUI: true,
      zoomControl:      true,
      gestureHandling:  "greedy",
      clickableIcons:   false,
      backgroundColor:  "#f8fafc",
      styles: [
        { featureType: "poi",     elementType: "labels",      stylers: [{ visibility: "off" }] },
        { featureType: "transit", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
      ],
    });
  }, []);

  useEffect(() => {
    // Small delay to let the modal DOM paint before measuring
    const t = setTimeout(initMap, 80);
    return () => clearTimeout(t);
  }, [initMap]);

  // ─── Draw route when points load ─────────────────────────────────────────────

  useEffect(() => {
    const map   = mapRef.current;
    const gmaps = window.google;
    if (!map || !gmaps?.maps || points.length === 0) return;

    // Clear previous
    polylineRef.current?.setMap(null);
    markerRef.current?.setMap(null);

    const path = points.map((p) => ({ lat: p.lat, lng: p.lng }));

    // Full route polyline
    polylineRef.current = new gmaps.maps.Polyline({
      path,
      geodesic:     true,
      strokeColor:  "#1B4D91",
      strokeOpacity: 0.7,
      strokeWeight: 4,
      map,
    });

    // Start marker (green)
    new gmaps.maps.Marker({
      position: path[0],
      map,
      icon: {
        path:        gmaps.maps.SymbolPath.CIRCLE,
        scale:       8,
        fillColor:   "#10b981",
        fillOpacity: 1,
        strokeColor: "white",
        strokeWeight: 2,
      },
      title: "Start",
      zIndex: 1,
    });

    // End marker (red)
    new gmaps.maps.Marker({
      position: path[path.length - 1],
      map,
      icon: {
        path:        gmaps.maps.SymbolPath.CIRCLE,
        scale:       8,
        fillColor:   "#ef4444",
        fillOpacity: 1,
        strokeColor: "white",
        strokeWeight: 2,
      },
      title: "End",
      zIndex: 1,
    });

    // Playhead marker
    const svg = `<svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
      <circle cx="14" cy="14" r="11" fill="#f59e0b" stroke="white" stroke-width="3"/>
      <circle cx="14" cy="14" r="4" fill="white"/>
    </svg>`;
    markerRef.current = new gmaps.maps.Marker({
      position: path[0],
      map,
      icon: {
        url:        `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
        scaledSize: new gmaps.maps.Size(28, 28),
        anchor:     new gmaps.maps.Point(14, 14),
      },
      zIndex: 999,
    });

    // Fit bounds to route
    const bounds = new gmaps.maps.LatLngBounds();
    path.forEach((p) => bounds.extend(p));
    map.fitBounds(bounds, 40);

    const timer = setTimeout(() => {
      setIdx(0);
      setPlaying(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [points]);

  // ─── Move marker when idx changes ────────────────────────────────────────────

  useEffect(() => {
    const pt = points[idx];
    if (!pt || !markerRef.current) return;
    markerRef.current.setPosition({ lat: pt.lat, lng: pt.lng });
  }, [idx, points]);

  // ─── Playback tick ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    if (!playing || points.length === 0) return;

    tickRef.current = setInterval(() => {
      setIdx((prev) => {
        const next = prev + POINTS_PER_TICK[speed];
        if (next >= points.length - 1) {
          setPlaying(false);
          return points.length - 1;
        }
        return next;
      });
    }, 500);

    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [playing, speed, points.length]);

  // ─── Keyboard ────────────────────────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === " ") { e.preventDefault(); setPlaying((p) => !p); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // ─── Cleanup on unmount ───────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      polylineRef.current?.setMap(null);
      markerRef.current?.setMap(null);
      mapRef.current = null;
    };
  }, []);

  // ─── Derived stats ────────────────────────────────────────────────────────────

  const current   = points[idx];
  const totalKm   = points.length > 1 ? totalDistanceKm(points) : 0;
  const topSpeed  = points.reduce((max, p) => Math.max(max, (p.speed ?? 0) * 3.6), 0);
  const progress  = points.length > 1 ? idx / (points.length - 1) : 0;

  const headingLabel = (h: number | null) => {
    if (h == null) return "—";
    const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    return dirs[Math.round(h / 45) % 8];
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]" onClick={onClose} aria-hidden />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal
        aria-label="Route Playback"
        className="fixed inset-4 z-50 flex flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 md:inset-x-16 md:inset-y-8"
      >
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#1B4D91]/10">
            <Route className="size-4 text-[#1B4D91]" />
          </div>
          <div className="flex-1">
            <h2 className="text-[13px] font-black text-slate-800">
              Route Playback — {driver?.name ?? "Driver"}
            </h2>
            <p className="text-[10px] text-slate-400">
              {points.length > 0
                ? `${points.length} points · ${totalKm.toFixed(1)} km · top ${Math.round(topSpeed)} km/h`
                : "Select a date to load route"}
            </p>
          </div>

          {/* Date picker */}
          <input
            type="date"
            value={date}
            max={todayISO()}
            onChange={(e) => {
              setDate(e.target.value);
              setPlaying(false);
              setIdx(0);
              polylineRef.current?.setMap(null);
              markerRef.current?.setMap(null);
              polylineRef.current = null;
              markerRef.current   = null;
            }}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-700 focus:border-[#1B4D91] focus:outline-none focus:ring-2 focus:ring-[#1B4D91]/20"
          />

          <button
            onClick={onClose}
            aria-label="Close route playback"
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Map */}
        <div className="relative flex-1 overflow-hidden bg-slate-100">
          <div ref={mapDivRef} className="h-full w-full" />

          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
              <div className="flex flex-col items-center gap-2">
                <div className="size-8 animate-spin rounded-full border-2 border-[#1B4D91] border-t-transparent" />
                <p className="text-[12px] font-semibold text-slate-500">Loading route…</p>
              </div>
            </div>
          )}

          {!isLoading && points.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-50">
              <MapPin className="size-10 text-slate-200" />
              <p className="text-[13px] font-semibold text-slate-400">No route data for this date</p>
              <p className="text-[11px] text-slate-300">The driver may not have been active</p>
            </div>
          )}
        </div>

        {/* Controls */}
        {points.length > 0 && (
          <div className="border-t border-slate-100 bg-white px-5 py-3">
            {/* Scrubber */}
            <div className="mb-2 flex items-center gap-2">
              <span className="w-14 shrink-0 text-right text-[9px] font-semibold tabular-nums text-slate-400">
                {current ? format(parseISO(current.createdAt), "HH:mm:ss") : "--:--:--"}
              </span>
              <input
                type="range"
                min={0}
                max={points.length - 1}
                value={idx}
                onChange={(e) => {
                  setIdx(Number(e.target.value));
                  setPlaying(false);
                }}
                className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-slate-200 accent-[#1B4D91]"
              />
              <span className="w-14 shrink-0 text-[9px] font-semibold tabular-nums text-slate-400">
                {points.at(-1) ? format(parseISO(points.at(-1)!.createdAt), "HH:mm:ss") : "--:--:--"}
              </span>
            </div>

            {/* Progress bar */}
            <div className="mb-3 h-0.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-[#1B4D91] transition-all duration-150"
                style={{ width: `${progress * 100}%` }}
              />
            </div>

            {/* Row: transport + speed + stats */}
            <div className="flex items-center gap-3">
              {/* Playback controls */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { setIdx(0); setPlaying(false); }}
                  className="flex size-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
                  title="Jump to start"
                >
                  <SkipBack className="size-4" />
                </button>
                <button
                  onClick={() => setPlaying((p) => !p)}
                  className="flex size-9 items-center justify-center rounded-xl bg-[#1B4D91] text-white shadow-sm transition hover:bg-[#163d73]"
                  title={playing ? "Pause (Space)" : "Play (Space)"}
                >
                  {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
                </button>
                <button
                  onClick={() => { setIdx(points.length - 1); setPlaying(false); }}
                  className="flex size-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
                  title="Jump to end"
                >
                  <SkipForward className="size-4" />
                </button>
              </div>

              {/* Speed selector */}
              <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-0.5">
                {SPEEDS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSpeed(s)}
                    className={cn(
                      "rounded-md px-2 py-0.5 text-[10px] font-black transition",
                      speed === s
                        ? "bg-white text-[#1B4D91] shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    {s}×
                  </button>
                ))}
              </div>

              {/* Live stats */}
              <div className="ml-auto flex items-center gap-3">
                <StatChip
                  icon={<Gauge className="size-3 text-slate-400" />}
                  label={current?.speed != null ? `${Math.round(current.speed * 3.6)} km/h` : "— km/h"}
                />
                <StatChip
                  icon={<Navigation className="size-3 text-slate-400" />}
                  label={headingLabel(current?.heading ?? null)}
                />
                <StatChip
                  icon={<Clock className="size-3 text-slate-400" />}
                  label={`${idx + 1} / ${points.length}`}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function StatChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1">
      {icon}
      <span className="text-[10px] font-bold tabular-nums text-slate-600">{label}</span>
    </div>
  );
}
