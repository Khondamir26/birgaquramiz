"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { DriverStatus } from "@/types/tracking";
import type { DriverLocation } from "@/types/tracking";
import type { ExtendedDriver } from "@/store/trackingStore";
import { Maximize2, AlertTriangle, MapPin } from "lucide-react";

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global { interface Window { google?: any; } }


const DEFAULT_CENTER = { lat: 41.2995, lng: 69.2401 };

const MAP_STYLES = [
  { featureType: "poi",     elementType: "labels",        stylers: [{ visibility: "off" }] },
  { featureType: "transit", elementType: "labels.icon",   stylers: [{ visibility: "off" }] },
  { featureType: "road",    elementType: "geometry.fill", stylers: [{ lightness: 5 }] },
];

type LoadState = "idle" | "loading" | "ready" | "error";

interface Props {
  drivers:          ExtendedDriver[];
  locations:        Record<string, DriverLocation>;
  selectedDriverId: string | null;
  onSelectDriver:   (id: string) => void;
}

function buildMarkerIcon(gmaps: any, driver: ExtendedDriver, isSelected: boolean): object {
  const hasAlerts = driver.alerts.length > 0;
  let color: string;
  let label: string;
  let size:  number;

  if (isSelected) {
    color = "#f59e0b";
    label = hasAlerts ? `!${driver.alerts.length}` : driver.etaMinutes != null ? `${driver.etaMinutes}m` : "✓";
    size  = 48;
  } else if (hasAlerts) {
    color = "#ef4444"; label = `!${driver.alerts.length}`; size = 42;
  } else if (driver.status === DriverStatus.ON_DELIVERY) {
    color = "#1B4D91"; label = driver.etaMinutes != null ? `${driver.etaMinutes}m` : "▲"; size = 40;
  } else if (driver.status === DriverStatus.ONLINE) {
    color = "#10b981"; label = "●"; size = 34;
  } else {
    color = "#94a3b8"; label = "●"; size = 30;
  }

  const cx       = size / 2;
  const r        = cx - 3;
  const fontSize = label.length > 3 ? 7 : label.length > 2 ? 9 : label.length > 1 ? 11 : 14;

  const svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    ${isSelected ? `<circle cx="${cx}" cy="${cx}" r="${cx - 1}" fill="${color}28" stroke="${color}" stroke-width="2" stroke-dasharray="3 2"/>` : ""}
    <circle cx="${cx}" cy="${cx}" r="${r}" fill="${color}" stroke="white" stroke-width="3" filter="url(#sh)"/>
    <defs><filter id="sh" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="1.5" stdDeviation="2" flood-color="${color}" flood-opacity="0.35"/>
    </filter></defs>
    <text x="${cx}" y="${cx + 0.5}" text-anchor="middle" dominant-baseline="middle"
          font-family="-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif"
          font-size="${fontSize}" font-weight="900" fill="white">${label}</text>
  </svg>`;

  return {
    url:        `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new gmaps.maps.Size(size, size),
    anchor:     new gmaps.maps.Point(cx, cx),
  };
}

function buildBalloon(driver: ExtendedDriver): string {
  const statusLabel =
    driver.status === DriverStatus.ON_DELIVERY ? "On Delivery" :
    driver.status === DriverStatus.ONLINE       ? "Available"   : "Offline";

  const colors: Record<string, { bg: string; text: string }> = {
    ON_DELIVERY: { bg: "#dbeafe", text: "#1e40af" },
    ONLINE:      { bg: "#d1fae5", text: "#065f46" },
    OFFLINE:     { bg: "#f1f5f9", text: "#64748b" },
  };
  const { bg, text } = colors[driver.status] ?? colors.OFFLINE;

  const eta = driver.etaMinutes != null
    ? `<span style="margin-left:6px;font-size:11px;font-weight:800;color:#1B4D91">ETA ${driver.etaMinutes}m</span>`
    : "";

  const alerts = driver.alerts.length
    ? `<div style="margin-top:6px;padding:4px 8px;border-radius:7px;background:#fef2f2;font-size:10px;font-weight:700;color:#ef4444;line-height:1.4">⚠ ${driver.alerts.map((a) => a.message).join(" · ")}</div>`
    : "";

  const deliveries = driver.assignmentsToday > 0
    ? `<div style="margin-top:4px;font-size:10px;color:#94a3b8">${driver.assignmentsToday} deliveries today</div>`
    : "";

  return `
    <div style="min-width:180px;padding:4px 0 2px;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif">
      <div style="font-size:14px;font-weight:800;color:#1e293b">${driver.name}</div>
      <div style="font-size:11px;color:#64748b;margin-top:2px">${driver.phone}</div>
      <div style="margin-top:6px;display:flex;align-items:center;flex-wrap:wrap;gap:4px">
        <span style="display:inline-block;padding:2px 8px;border-radius:99px;background:${bg};color:${text};font-size:10px;font-weight:700">${statusLabel}</span>
        ${eta}
      </div>
      ${deliveries}
      ${alerts}
    </div>`;
}

function MapLoadingOverlay() {
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <div className="relative flex size-12 items-center justify-center">
          <div className="absolute inset-0 animate-ping rounded-full bg-[#1B4D91]/20" />
          <MapPin className="size-6 text-[#1B4D91]" />
        </div>
        <p className="text-[13px] font-semibold text-slate-500">Loading map…</p>
      </div>
    </div>
  );
}

function MapErrorOverlay({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3 px-6 text-center">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-red-50">
          <AlertTriangle className="size-6 text-red-500" />
        </div>
        <p className="text-[14px] font-bold text-slate-700">Map failed to load</p>
        <p className="text-[12px] text-slate-400">
          Check that{" "}
          <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[11px]">
            NEXT_PUBLIC_GOOGLE_MAPS_KEY
          </code>{" "}
          is set correctly
        </p>
        <button
          onClick={onRetry}
          className="mt-1 rounded-xl bg-[#1B4D91] px-4 py-2 text-[12px] font-bold text-white transition hover:bg-[#163b92]"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

interface AnimState { fromLat: number; fromLng: number; toLat: number; toLng: number; startMs: number }
const ANIM_MS = 600; // marker glide duration

function easeOut(t: number) { return 1 - (1 - t) * (1 - t); }

export default function MapView({ drivers, locations, selectedDriverId, onSelectDriver }: Props) {
  const containerRef  = useRef<HTMLDivElement>(null);
  const mapRef        = useRef<any>(null);
  const markersRef    = useRef<Map<string, any>>(new Map());
  const infoWindowRef = useRef<any>(null);
  const scriptLoadRef = useRef(false);
  const animStateRef  = useRef<Map<string, AnimState>>(new Map());
  const animRafRef    = useRef<number | null>(null);

  const [loadState, setLoadState] = useState<LoadState>("idle");

  const initMap = useCallback(() => {
    if (!containerRef.current || mapRef.current) return;
    const gmaps = window.google;
    if (!gmaps?.maps) return;

    mapRef.current = new gmaps.maps.Map(containerRef.current, {
      center:           DEFAULT_CENTER,
      zoom:             12,
      styles:           MAP_STYLES,
      disableDefaultUI: true,
      zoomControl:      true,
      gestureHandling:  "greedy",
      clickableIcons:   false,
      backgroundColor:  "#f8fafc",
    });

    infoWindowRef.current = new gmaps.maps.InfoWindow({ maxWidth: 260 });
    setLoadState("ready");
  }, []);

  const loadScript = useCallback(() => {
    if (typeof window === "undefined") return;
    if (window.google?.maps) { initMap(); return; }

    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? "";
    if (!key) { setLoadState("error"); return; }
    if (scriptLoadRef.current) return;

    scriptLoadRef.current = true;
    setLoadState("loading");

    const script   = document.createElement("script");
    script.src     = `https://maps.googleapis.com/maps/api/js?key=${key}`;
    script.async   = true;
    script.defer   = true;
    script.onload  = initMap;
    script.onerror = () => { scriptLoadRef.current = false; setLoadState("error"); };
    document.head.appendChild(script);
  }, [initMap]);

  useEffect(() => {
    loadScript();
    return () => {
      mapRef.current = null;
      if (animRafRef.current) cancelAnimationFrame(animRafRef.current);
    };
  }, [loadScript]);

  const handleRetry = () => {
    scriptLoadRef.current = false;
    mapRef.current = null;
    setLoadState("idle");
    loadScript();
  };

  // Animation loop — runs while any marker is still mid-glide
  const runAnimLoop = useCallback(() => {
    animRafRef.current = null;
    const now    = Date.now();
    let   active = false;

    for (const [driverId, anim] of animStateRef.current) {
      const marker = markersRef.current.get(driverId);
      if (!marker) { animStateRef.current.delete(driverId); continue; }

      const elapsed = now - anim.startMs;
      if (elapsed >= ANIM_MS) {
        marker.setPosition({ lat: anim.toLat, lng: anim.toLng });
        animStateRef.current.delete(driverId);
      } else {
        const t = easeOut(elapsed / ANIM_MS);
        marker.setPosition({
          lat: anim.fromLat + (anim.toLat - anim.fromLat) * t,
          lng: anim.fromLng + (anim.toLng - anim.fromLng) * t,
        });
        active = true;
      }
    }

    if (active) {
      animRafRef.current = requestAnimationFrame(runAnimLoop);
    }
  }, []);

  // Sync markers
  useEffect(() => {
    const map   = mapRef.current;
    const gmaps = window.google;
    if (!map || !gmaps?.maps) return;

    const activeIds = new Set(drivers.map((d) => d.id));

    markersRef.current.forEach((marker, id) => {
      if (!activeIds.has(id)) {
        marker.setMap(null);
        markersRef.current.delete(id);
        animStateRef.current.delete(id);
      }
    });

    drivers.forEach((driver) => {
      const loc        = locations[driver.id] ?? driver.lastLocation;
      const isSelected = driver.id === selectedDriverId;
      const icon       = buildMarkerIcon(gmaps, driver, isSelected);
      const zIndex     = isSelected ? 999 : driver.alerts.length > 0 ? 100 : 1;

      if (markersRef.current.has(driver.id)) {
        const marker = markersRef.current.get(driver.id)!;
        marker.setIcon(icon);
        marker.setZIndex(zIndex);

        if (loc) {
          const cur = marker.getPosition();
          if (cur) {
            // Start smooth glide to new position
            animStateRef.current.set(driver.id, {
              fromLat: cur.lat(), fromLng: cur.lng(),
              toLat: loc.lat,     toLng: loc.lng,
              startMs: Date.now(),
            });
            if (!animRafRef.current) {
              animRafRef.current = requestAnimationFrame(runAnimLoop);
            }
          } else {
            marker.setPosition({ lat: loc.lat, lng: loc.lng });
          }
        }
      } else if (loc) {
        const marker = new gmaps.maps.Marker({ position: { lat: loc.lat, lng: loc.lng }, map, icon, title: driver.name, zIndex });
        marker.addListener("click", () => {
          infoWindowRef.current?.close();
          infoWindowRef.current?.setContent(buildBalloon(driver));
          infoWindowRef.current?.open({ anchor: marker, map });
          onSelectDriver(driver.id);
        });
        markersRef.current.set(driver.id, marker);
      }
    });
  }, [drivers, locations, selectedDriverId, onSelectDriver, runAnimLoop]);

  // Pan to selected driver
  useEffect(() => {
    const map = mapRef.current;
    if (!selectedDriverId || !map) return;
    const loc = locations[selectedDriverId] ?? drivers.find((d) => d.id === selectedDriverId)?.lastLocation;
    if (loc) { map.panTo({ lat: loc.lat, lng: loc.lng }); map.setZoom(15); }
  }, [selectedDriverId, locations, drivers]);

  const fitAll = useCallback(() => {
    const map   = mapRef.current;
    const gmaps = window.google;
    if (!map || !gmaps?.maps) return;

    const bounds = new gmaps.maps.LatLngBounds();
    let count = 0;
    drivers.forEach((driver) => {
      const loc = locations[driver.id] ?? driver.lastLocation;
      if (loc) { bounds.extend({ lat: loc.lat, lng: loc.lng }); count++; }
    });

    if (count === 0) { map.setCenter(DEFAULT_CENTER); map.setZoom(11); return; }
    if (count === 1) {
      const pt = drivers.map((d) => locations[d.id] ?? d.lastLocation).find(Boolean);
      if (pt) { map.panTo({ lat: pt.lat, lng: pt.lng }); map.setZoom(14); }
      return;
    }
    map.fitBounds(bounds, 64);
  }, [drivers, locations]);

  const onlineCount = drivers.filter((d) => d.status !== DriverStatus.OFFLINE).length;
  const alertCount  = drivers.reduce((s, d) => s + d.alerts.length, 0);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />

      {loadState === "loading" && <MapLoadingOverlay />}
      {loadState === "error"   && <MapErrorOverlay onRetry={handleRetry} />}

      {loadState === "ready" && (
        <>
          <div className="absolute right-3 top-3 z-10 flex flex-col gap-2">
            <button
              onClick={fitAll}
              title="Show all drivers"
              className="flex size-9 items-center justify-center rounded-xl border border-slate-100 bg-white shadow-md text-slate-600 transition hover:bg-slate-50 active:scale-95"
            >
              <Maximize2 className="size-4" />
            </button>
          </div>

          {alertCount > 0 && (
            <div className="absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 shadow-sm">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-red-500" />
              </span>
              <span className="text-[11px] font-black text-red-600">
                {alertCount} alert{alertCount !== 1 ? "s" : ""}
              </span>
            </div>
          )}

          <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-1.5 rounded-xl border border-slate-100 bg-white/95 px-3 py-2.5 shadow-sm backdrop-blur-sm">
            <p className="mb-0.5 text-[8px] font-black uppercase tracking-[0.14em] text-slate-400">
              {onlineCount} active
            </p>
            {[
              { color: "#10b981", label: "Available"   },
              { color: "#1B4D91", label: "On Delivery" },
              { color: "#ef4444", label: "Alert"       },
              { color: "#f59e0b", label: "Selected"    },
              { color: "#94a3b8", label: "Offline"     },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-2">
                <span className="size-2.5 shrink-0 rounded-full" style={{ background: color }} />
                <span className="text-[11px] font-semibold text-slate-600">{label}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
