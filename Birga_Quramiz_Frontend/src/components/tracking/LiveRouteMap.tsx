"use client";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface Window { google?: any }
}

import { useEffect, useRef } from "react";

const MAPS_KEY        = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? "";
const ROUTE_THROTTLE  = 60_000; // re-request directions at most once per minute

interface LatLng { lat: number; lng: number }

interface Props {
  driverLocation:    LatLng;
  destinationCoords: LatLng;
  className?:        string;
}

function loadScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.maps)           return Promise.resolve();
  return new Promise((resolve) => {
    if (document.getElementById("gmaps-live")) {
      const tid = setInterval(() => {
        if (window.google?.maps) { clearInterval(tid); resolve(); }
      }, 100);
      return;
    }
    const s  = document.createElement("script");
    s.id     = "gmaps-live";
    s.src    = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}`;
    s.async  = true;
    s.onload = () => resolve();
    document.head.appendChild(s);
  });
}

export default function LiveRouteMap({ driverLocation, destinationCoords, className }: Props) {
  const containerRef    = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef          = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const driverMarkerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const serviceRef      = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rendererRef     = useRef<any>(null);
  const lastFetchRef    = useRef<number>(0);

  // Keep refs fresh so init-effect callbacks always see current coords
  const driverRef = useRef(driverLocation);
  const destRef   = useRef(destinationCoords);
  driverRef.current = driverLocation;
  destRef.current   = destinationCoords;

  function requestRoute(force = false) {
    if (!serviceRef.current || !rendererRef.current) return;
    const now = Date.now();
    if (!force && now - lastFetchRef.current < ROUTE_THROTTLE) return;
    lastFetchRef.current = now;
    serviceRef.current.route(
      {
        origin:      { lat: driverRef.current.lat,  lng: driverRef.current.lng },
        destination: { lat: destRef.current.lat,    lng: destRef.current.lng },
        travelMode:  "DRIVING",
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (result: any, status: string) => {
        if (status === "OK" && result && rendererRef.current) {
          rendererRef.current.setDirections(result);
        }
      }
    );
  }

  // ── Mount map once ───────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    loadScript().then(() => {
      if (cancelled || !containerRef.current || mapRef.current) return;
      const gm = window.google.maps;

      const map = new gm.Map(containerRef.current, {
        center:          { lat: driverRef.current.lat, lng: driverRef.current.lng },
        zoom:            14,
        disableDefaultUI: true,
        gestureHandling: "cooperative",
        clickableIcons:  false,
        styles: [
          { featureType: "poi",     stylers: [{ visibility: "off" }] },
          { featureType: "transit", stylers: [{ visibility: "off" }] },
        ],
      });
      mapRef.current = map;

      serviceRef.current  = new gm.DirectionsService();
      rendererRef.current = new gm.DirectionsRenderer({
        map,
        suppressMarkers:  true,
        polylineOptions: {
          strokeColor:   "#1B4D91",
          strokeWeight:  4,
          strokeOpacity: 0.75,
        },
      });

      // Driver marker — blue circle
      driverMarkerRef.current = new gm.Marker({
        position: { lat: driverRef.current.lat, lng: driverRef.current.lng },
        map,
        title: "Курьер",
        icon: {
          path:        gm.SymbolPath.CIRCLE,
          scale:       9,
          fillColor:   "#1B4D91",
          fillOpacity: 1,
          strokeColor: "#fff",
          strokeWeight: 2.5,
        },
        zIndex: 10,
      });

      // Destination marker — red circle
      new gm.Marker({
        position: { lat: destRef.current.lat, lng: destRef.current.lng },
        map,
        title: "Адрес доставки",
        icon: {
          path:        gm.SymbolPath.CIRCLE,
          scale:       9,
          fillColor:   "#E31E24",
          fillOpacity: 1,
          strokeColor: "#fff",
          strokeWeight: 2.5,
        },
        zIndex: 9,
      });

      // Fit both markers in view
      const bounds = new gm.LatLngBounds();
      bounds.extend({ lat: driverRef.current.lat, lng: driverRef.current.lng });
      bounds.extend({ lat: destRef.current.lat,   lng: destRef.current.lng });
      map.fitBounds(bounds, 40);

      requestRoute(true);
    });
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Track driver movement ────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !driverMarkerRef.current) return;
    driverMarkerRef.current.setPosition({ lat: driverLocation.lat, lng: driverLocation.lng });
    requestRoute();
  }, [driverLocation.lat, driverLocation.lng]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={containerRef}
      className={className ?? "h-[200px] w-full"}
    />
  );
}
