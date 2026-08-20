import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { RISK_COLORS } from "@/lib/risk";
import type { ScoredCity } from "@/lib/airshield";

interface Props {
  cities: ScoredCity[];
  height?: number;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}

export default function PollutionMap({ cities, height = 460, selectedId, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [20, 40],
      zoom: 2,
      worldCopyJump: true,
      scrollWheelZoom: false,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 18,
    }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const layer = layerRef.current;
    const map = mapRef.current;
    if (!layer || !map) return;
    layer.clearLayers();

    for (const c of cities) {
      const color = RISK_COLORS[c.risk_level];
      // hotspot halo
      L.circleMarker([c.latitude, c.longitude], {
        radius: 9 + (c.risk_score / 100) * 22,
        color,
        weight: 0,
        fillColor: color,
        fillOpacity: 0.14,
      }).addTo(layer);

      const marker = L.circleMarker([c.latitude, c.longitude], {
        radius: 7,
        color: "#0b1220",
        weight: 1.5,
        fillColor: color,
        fillOpacity: 0.95,
      }).addTo(layer);

      marker.bindPopup(
        `<div style="min-width:220px;font-size:12px">
          <div style="font-weight:600;font-size:14px">${c.city}, ${c.country}</div>
          <div style="opacity:.7;margin-bottom:8px">${c.region}</div>
          <div style="display:inline-block;padding:2px 8px;border-radius:999px;background:${color}22;color:${color};font-weight:700;letter-spacing:.06em;font-size:10px">${c.risk_level} · ${c.risk_score}/100</div>
          <table style="margin-top:8px;width:100%;border-collapse:collapse">
            <tr><td style="opacity:.7">AQI</td><td style="text-align:right">${c.aqi}</td></tr>
            <tr><td style="opacity:.7">PM2.5</td><td style="text-align:right">${c.pm25} µg/m³</td></tr>
            <tr><td style="opacity:.7">PM10</td><td style="text-align:right">${c.pm10} µg/m³</td></tr>
            <tr><td style="opacity:.7">Temperature</td><td style="text-align:right">${c.temperature} °C</td></tr>
            <tr><td style="opacity:.7">Wind</td><td style="text-align:right">${c.wind_speed} m/s @ ${c.wind_direction}°</td></tr>
          </table>
          <div style="margin-top:8px;opacity:.6">Updated ${new Date(c.timestamp).toLocaleString()} · live Open-Meteo / CAMS</div>
        </div>`,
      );
      marker.on("click", () => onSelect?.(c.id));
    }

    if (cities.length) {
      const bounds = L.latLngBounds(cities.map((c) => [c.latitude, c.longitude] as [number, number]));
      map.fitBounds(bounds.pad(0.25), { animate: false });
    }
  }, [cities, onSelect]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedId) return;
    const target = cities.find((c) => c.id === selectedId);
    if (target) map.setView([target.latitude, target.longitude], 6, { animate: true });
  }, [selectedId, cities]);

  return <div ref={containerRef} style={{ height }} className="w-full rounded-md" />;
}
