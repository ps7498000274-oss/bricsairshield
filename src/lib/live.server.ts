/**
 * Live environmental data (server-only).
 *
 * Sources — both free, keyless, non-commercial-friendly:
 *  • Open-Meteo Air Quality API (CAMS global model): PM2.5, PM10, US AQI
 *  • Open-Meteo Forecast API: temperature, humidity, wind, pressure
 *
 * Values replace the demo seeds. If the upstream call fails we fall back to
 * the deterministic demo dataset so the prototype never breaks.
 */

import { aqiFromPm25, getReadings, type CityReading } from "@/data/brics";

const AQ_URL = "https://air-quality-api.open-meteo.com/v1/air-quality";
const WX_URL = "https://api.open-meteo.com/v1/forecast";
const TTL = 10 * 60 * 1000;

interface CurrentAq {
  current?: {
    time?: string;
    pm2_5?: number;
    pm10?: number;
    us_aqi?: number;
  };
}
interface CurrentWx {
  current?: {
    temperature_2m?: number;
    relative_humidity_2m?: number;
    wind_speed_10m?: number;
    wind_direction_10m?: number;
    surface_pressure?: number;
  };
}

let cache: { at: number; value: CityReading[] } | null = null;

async function getJson<T>(url: string): Promise<T[] | null> {
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`Open-Meteo ${res.status}: ${await res.text()}`);
    return null;
  }
  const json = (await res.json()) as T | T[];
  return Array.isArray(json) ? json : [json];
}

export async function fetchLiveReadings(): Promise<{
  readings: CityReading[];
  live: boolean;
  error?: string;
}> {
  if (cache && Date.now() - cache.at < TTL) return { readings: cache.value, live: true };

  const base = getReadings();
  const lat = base.map((r) => r.latitude).join(",");
  const lon = base.map((r) => r.longitude).join(",");

  try {
    const [aq, wx] = await Promise.all([
      getJson<CurrentAq>(
        `${AQ_URL}?latitude=${lat}&longitude=${lon}&current=pm2_5,pm10,us_aqi&timezone=UTC`,
      ),
      getJson<CurrentWx>(
        `${WX_URL}?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,surface_pressure&wind_speed_unit=ms&timezone=UTC`,
      ),
    ]);
    if (!aq || !wx || aq.length !== base.length) {
      return { readings: base, live: false, error: "Upstream data unavailable" };
    }

    const readings = base.map((r, i) => {
      const a = aq[i]?.current;
      const w = wx[i]?.current;
      const pm25 = typeof a?.pm2_5 === "number" ? Math.round(a.pm2_5 * 10) / 10 : r.pm25;
      const pm10 = typeof a?.pm10 === "number" ? Math.round(a.pm10 * 10) / 10 : r.pm10;
      return {
        ...r,
        pm25,
        pm10,
        aqi: typeof a?.us_aqi === "number" ? Math.round(a.us_aqi) : aqiFromPm25(pm25),
        temperature: typeof w?.temperature_2m === "number" ? w.temperature_2m : r.temperature,
        humidity:
          typeof w?.relative_humidity_2m === "number" ? w.relative_humidity_2m : r.humidity,
        wind_speed:
          typeof w?.wind_speed_10m === "number"
            ? Math.round(w.wind_speed_10m * 10) / 10
            : r.wind_speed,
        wind_direction:
          typeof w?.wind_direction_10m === "number" ? w.wind_direction_10m : r.wind_direction,
        pressure:
          typeof w?.surface_pressure === "number"
            ? Math.round(w.surface_pressure)
            : r.pressure,
        timestamp: a?.time ? `${a.time}:00Z`.replace(/(:\d\d):00Z$/, "$1:00Z") : r.timestamp,
        source: "live" as const,
      } satisfies CityReading;
    });

    cache = { at: Date.now(), value: readings };
    return { readings, live: true };
  } catch (e) {
    console.error("Live data fetch failed", e);
    return {
      readings: base,
      live: false,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}
