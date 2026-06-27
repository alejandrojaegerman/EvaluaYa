/// <reference types="google.maps" />
import { useEffect, useRef, useState } from "react";

import { useLang } from "@/lib/i18n";
import { RISK_HEX } from "@/lib/risk";

export type RiskKey = "red" | "orange" | "yellow" | "green";

export type MapBubble = {
  /** stable id */
  id: string;
  lat: number;
  lng: number;
  /** "municipio" when resolved to a municipality, "estado" otherwise */
  level: "municipio" | "estado";
  /** primary label shown in the info window (municipio or estado name) */
  name: string;
  /** estado name, used for navigation */
  stateName: string;
  /** estado slug for routing */
  stateSlug: string;
  total: number;
  green: number;
  yellow: number;
  orange: number;
  red: number;
  dominant: RiskKey;
};

function hex(level: RiskKey): string {
  const [r, g, b] = RISK_HEX[level];
  return `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
}

const VENEZUELA_CENTER = { lat: 8.0, lng: -66.0 };

// Module-level singleton so the Maps JS API is only fetched once.
let mapsPromise: Promise<typeof google.maps> | null = null;

function loadGoogleMaps(): Promise<typeof google.maps> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("no-window"));
  }
  if (window.google?.maps) return Promise.resolve(window.google.maps);
  if (mapsPromise) return mapsPromise;

  const key = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY as
    | string
    | undefined;
  if (!key) return Promise.reject(new Error("no-key"));

  const channel = import.meta.env
    .VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID as string | undefined;

  mapsPromise = new Promise((resolve, reject) => {
    const cbName = "__evaluayaInitMap__";
    (window as unknown as Record<string, unknown>)[cbName] = () => {
      if (window.google?.maps) resolve(window.google.maps);
      else reject(new Error("maps-missing"));
    };
    const script = document.createElement("script");
    const params = new URLSearchParams({
      key,
      loading: "async",
      callback: cbName,
    });
    if (channel) params.set("channel", channel);
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.async = true;
    script.onerror = () => reject(new Error("script-error"));
    document.head.appendChild(script);
  });
  return mapsPromise;
}

type Props = {
  bubbles: MapBubble[];
  onSelectState: (slug: string) => void;
  /** rendered instead of the map when Google Maps can't load */
  fallback: React.ReactNode;
};

export function DamageMap({ bubbles, onSelectState, fallback }: Props) {
  const { t, lang } = useLang();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const overlaysRef = useRef<google.maps.Circle[]>([]);
  const infoRef = useRef<google.maps.InfoWindow | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );

  // Initialize the map once.
  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !containerRef.current) return;
        mapRef.current = new maps.Map(containerRef.current, {
          center: VENEZUELA_CENTER,
          zoom: 6,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          clickableIcons: false,
          gestureHandling: "greedy",
        });
        infoRef.current = new maps.InfoWindow();
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Draw / redraw bubbles whenever data or readiness changes.
  useEffect(() => {
    const maps = window.google?.maps;
    const map = mapRef.current;
    if (status !== "ready" || !maps || !map || bubbles.length === 0) return;

    // clear previous overlays
    for (const c of overlaysRef.current) c.setMap(null);
    overlaysRef.current = [];

    const maxTotal = Math.max(1, ...bubbles.map((b) => b.total));
    const bounds = new maps.LatLngBounds();

    for (const b of bubbles) {
      const color = hex(b.dominant);
      // radius in meters; scaled by share of the max, with a sane floor/ceiling
      const radius = 8000 + (b.total / maxTotal) * 55000;
      const circle = new maps.Circle({
        map,
        center: { lat: b.lat, lng: b.lng },
        radius,
        strokeColor: color,
        strokeOpacity: 0.9,
        strokeWeight: 1.5,
        fillColor: color,
        fillOpacity: 0.45,
        clickable: true,
      });

      const riskLabel =
        b.dominant === "red"
          ? t("map.high")
          : b.dominant === "yellow"
            ? t("map.moderate")
            : t("map.low");

      const html = `
        <div style="font-family:system-ui,sans-serif;min-width:160px;line-height:1.4">
          <div style="font-weight:700;font-size:14px;margin-bottom:2px">${escapeHtml(
            b.name,
          )}</div>
          ${
            b.level === "estado"
              ? `<div style="font-size:11px;color:#6b7280;margin-bottom:4px">${escapeHtml(
                  t("map.atState"),
                )}</div>`
              : `<div style="font-size:11px;color:#6b7280;margin-bottom:4px">${escapeHtml(
                  b.stateName,
                )}</div>`
          }
          <div style="font-size:12px;margin-bottom:2px">
            <span style="display:inline-block;width:8px;height:8px;border-radius:9999px;background:${color};margin-right:5px"></span>
            ${escapeHtml(riskLabel)}
          </div>
          <div style="font-size:12px;color:#374151">
            <strong>${b.total}</strong> ${escapeHtml(t("map.reports"))}
            &nbsp;·&nbsp;
            <span style="color:${hex("red")}">${b.red}</span> /
            <span style="color:${hex("yellow")}">${b.yellow}</span> /
            <span style="color:${hex("green")}">${b.green}</span>
          </div>
          <button data-zone="${escapeHtml(
            b.stateSlug,
          )}" style="margin-top:8px;font-size:12px;font-weight:600;color:#0f3443;background:none;border:none;padding:0;cursor:pointer;text-decoration:underline">
            ${escapeHtml(t("map.viewZone"))} →
          </button>
        </div>`;

      circle.addListener("click", () => {
        const info = infoRef.current;
        if (!info) return;
        info.setContent(html);
        info.setPosition({ lat: b.lat, lng: b.lng });
        info.open(map);
        // wire the "view zone" button after the info window renders
        maps.event.addListenerOnce(info, "domready", () => {
          const btn = document.querySelector<HTMLButtonElement>(
            `button[data-zone="${b.stateSlug}"]`,
          );
          btn?.addEventListener("click", () => onSelectState(b.stateSlug));
        });
      });

      overlaysRef.current.push(circle);
      bounds.extend({ lat: b.lat, lng: b.lng });
    }

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, 48);
      // don't over-zoom when there's a single point
      const listener = maps.event.addListenerOnce(map, "idle", () => {
        if ((map.getZoom() ?? 6) > 9) map.setZoom(9);
      });
      void listener;
    }
    // re-run when language changes so info windows use the new locale text
  }, [status, bubbles, onSelectState, t, lang]);

  if (status === "error") {
    return (
      <div>
        <p className="mb-2 text-xs text-muted-foreground">
          {t("map.mapUnavailable")}
        </p>
        {fallback}
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="h-[340px] w-full overflow-hidden rounded-xl border border-border bg-muted/40"
        role="application"
        aria-label={t("map.geoTitle")}
      />
      {status === "loading" && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">{t("map.mapLoading")}</p>
        </div>
      )}
    </div>
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
