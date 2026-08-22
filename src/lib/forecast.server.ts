/**
 * 24–48h air-quality spike forecast (server-only).
 *
 * Source: Open-Meteo Air Quality API (Copernicus CAMS global model) hourly
 * PM2.5 / PM10 / US-AQI forecast — free, keyless. Wind and boundary-layer-style
 * ventilation come from the Open-Meteo Forecast API.
 *
 * The spike logic is local and transparent: we compare the current hour with
 * the worst hour in the next 24h and 48h windows and classify the jump.
 */

import { getReadings } from "@/data/brics";
import { CORRIDORS, type Corridor } from "@/data/corridors";

const AQ_URL = "https://air-quality-api.open-meteo.com/v1/air-quality";
const WX_URL = "https://api.open-meteo.com/v1/forecast";
const TTL = 30 * 60 * 1000;

export type SpikeLevel = "none" | "watch" | "alert" | "severe";

export interface HourPoint {
  time: string;
  aqi: number;
  pm25: number;
}

export interface CityForecast {
  id: string;
  city: string;
  country: string;
  country_code: string;
  currentAqi: number;
  peak24: number;
  peak24At: string;
  peak48: number;
  peak48At: string;
  delta24: number;
  delta48: number;
  minWind: number;
  spike: SpikeLevel;
  reason: string;
  hourly: HourPoint[];
}

export interface CorridorForecast extends Corridor {
  cityIds: string[];
  currentAqi: number;
  peak48: number;
  delta48: number;
  peakAt: string;
  spike: SpikeLevel;
  worstCity: string;
  hourly: Array<{ time: string; aqi: number }>;
}

export interface ForecastPayload {
  generatedAt: string;
  live: boolean;
  error?: string;
  cities: CityForecast[];
  corridors: CorridorForecast[];
}

interface HourlyAq {
  hourly?: { time?: string[]; pm2_5?: Array<number | null>; us_aqi?: Array<number | null> };
}
interface HourlyWx {
  hourly?: { time?: string[]; wind_speed_10m?: Array<number | null> };
}

const RANK: Record<SpikeLevel, number> = { none: 0, watch: 1, alert: 2, severe: 3 };

let cache: { at: number; value: ForecastPayload } | null = null;

function classify(delta: number, peak: number, minWind: number): [SpikeLevel, string] {
  if (peak >= 200 && delta >= 25) {
    return ["severe", `AQI climbs ${delta} points to ${peak} (very unhealthy band).`];
  }
  if (delta >= 40 || (peak >= 150 && delta >= 20)) {
    return [
      "alert",
      `AQI rises ${delta} points to ${peak}${minWind < 2 ? ", with stagnant winds below 2 m/s trapping emissions" : ""}.`,
    ];
  }
  if (delta >= 20 || (peak >= 100 && delta >= 10)) {
    return ["watch", `Moderate deterioration of ${delta} AQI points, peaking near ${peak}.`];
  }
  return ["none", `No significant deterioration forecast; peak stays near ${peak}.`];
}

function worst(values: number[], times: string[], upto: number): [number, string] {
  let best = -1;
  let at = times[0] ?? "";
  for (let i = 0; i < Math.min(upto, values.length); i++) {
    const v = values[i];
    if (typeof v === "number" && v > best) {
      best = v;
      at = times[i] ?? at;
    }
  }
  return [Math.round(Math.max(best, 0)), at];
}

async function getJson<T>(url: string): Promise<T[] | null> {
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`Open-Meteo forecast ${res.status}: ${await res.text()}`);
    return null;
  }
  const json = (await res.json()) as T | T[];
  return Array.isArray(json) ? json : [json];
}

export async function fetchForecast(): Promise<ForecastPayload> {
  if (cache && Date.now() - cache.at < TTL) return cache.value;

  const base = getReadings();
  const lat = base.map((r) => r.latitude).join(",");
  const lon = base.map((r) => r.longitude).join(",");

  let cities: CityForecast[] = [];
  let live = true;
  let error: string | undefined;

  try {
    const [aq, wx] = await Promise.all([
      getJson<HourlyAq>(
        `${AQ_URL}?latitude=${lat}&longitude=${lon}&hourly=pm2_5,us_aqi&forecast_days=3&timezone=UTC`,
      ),
      getJson<HourlyWx>(
        `${WX_URL}?latitude=${lat}&longitude=${lon}&hourly=wind_speed_10m&forecast_days=3&wind_speed_unit=ms&timezone=UTC`,
      ),
    ]);
    if (!aq || aq.length !== base.length) throw new Error("Upstream forecast unavailable");

    const nowIso = new Date().toISOString().slice(0, 13);

    cities = base.map((r, i) => {
      const h = aq[i]?.hourly;
      const times = h?.time ?? [];
      const aqis = (h?.us_aqi ?? []).map((v) => (typeof v === "number" ? v : 0));
      const pms = (h?.pm2_5 ?? []).map((v) => (typeof v === "number" ? v : 0));
      const winds = (wx?.[i]?.hourly?.wind_speed_10m ?? []).map((v) =>
        typeof v === "number" ? v : 99,
      );

      // start at the current hour
      let start = times.findIndex((t) => t.slice(0, 13) >= nowIso);
      if (start < 0) start = 0;

      const t = times.slice(start, start + 49);
      const a = aqis.slice(start, start + 49);
      const p = pms.slice(start, start + 49);
      const w = winds.slice(start, start + 49);

      const currentAqi = Math.round(a[0] ?? r.aqi);
      const [peak24, peak24At] = worst(a, t, 25);
      const [peak48, peak48At] = worst(a, t, 49);
      const delta24 = peak24 - currentAqi;
      const delta48 = peak48 - currentAqi;
      const minWind = w.length ? Math.round(Math.min(...w.slice(0, 49)) * 10) / 10 : r.wind_speed;
      const [spike, reason] = classify(Math.max(delta24, delta48), Math.max(peak24, peak48), minWind);

      return {
        id: r.id,
        city: r.city,
        country: r.country,
        country_code: r.country_code,
        currentAqi,
        peak24,
        peak24At,
        peak48,
        peak48At,
        delta24,
        delta48,
        minWind,
        spike,
        reason,
        hourly: t.map((time, k) => ({
          time,
          aqi: Math.round(a[k] ?? 0),
          pm25: Math.round((p[k] ?? 0) * 10) / 10,
        })),
      } satisfies CityForecast;
    });
  } catch (e) {
    live = false;
    error = e instanceof Error ? e.message : "Unknown error";
    console.error("Forecast fetch failed", e);
    cities = base.map((r) => {
      const hourly = Array.from({ length: 49 }, (_, k) => {
        const wave = 1 + 0.22 * Math.sin((k + r.city.length) / 4.2);
        return {
          time: new Date(Date.now() + k * 3600_000).toISOString().slice(0, 16),
          aqi: Math.round(r.aqi * wave),
          pm25: Math.round(r.pm25 * wave * 10) / 10,
        };
      });
      const a = hourly.map((x) => x.aqi);
      const t = hourly.map((x) => x.time);
      const [peak24, peak24At] = worst(a, t, 25);
      const [peak48, peak48At] = worst(a, t, 49);
      const [spike, reason] = classify(peak48 - r.aqi, peak48, r.wind_speed);
      return {
        id: r.id,
        city: r.city,
        country: r.country,
        country_code: r.country_code,
        currentAqi: r.aqi,
        peak24,
        peak24At,
        peak48,
        peak48At,
        delta24: peak24 - r.aqi,
        delta48: peak48 - r.aqi,
        minWind: r.wind_speed,
        spike,
        reason,
        hourly,
      } satisfies CityForecast;
    });
  }

  const byName = new Map(cities.map((c) => [c.city, c]));
  const corridors: CorridorForecast[] = CORRIDORS.map((c) => {
    const rows = c.cities.map((n) => byName.get(n)).filter((x): x is CityForecast => !!x);
    const avg = (f: (r: CityForecast) => number) =>
      rows.length ? Math.round(rows.reduce((a, r) => a + f(r), 0) / rows.length) : 0;
    const currentAqi = avg((r) => r.currentAqi);
    const worstRow = rows.reduce<CityForecast | null>(
      (a, r) => (!a || r.peak48 > a.peak48 ? r : a),
      null,
    );
    const peak48 = avg((r) => r.peak48);
    const delta48 = peak48 - currentAqi;
    const minWind = rows.length ? Math.min(...rows.map((r) => r.minWind)) : 5;
    const [spike, reason] = classify(delta48, worstRow?.peak48 ?? peak48, minWind);
    const len = Math.max(0, ...rows.map((r) => r.hourly.length));
    const hourly = Array.from({ length: len }, (_, k) => ({
      time: rows[0]?.hourly[k]?.time ?? "",
      aqi: Math.round(
        rows.reduce((a, r) => a + (r.hourly[k]?.aqi ?? 0), 0) / Math.max(1, rows.length),
      ),
    }));
    return {
      ...c,
      cityIds: rows.map((r) => r.id),
      currentAqi,
      peak48,
      delta48,
      peakAt: worstRow?.peak48At ?? "",
      spike,
      worstCity: worstRow?.city ?? "—",
      hourly,
      description: `${c.description} ${reason}`,
    } satisfies CorridorForecast;
  }).sort((a, b) => RANK[b.spike] - RANK[a.spike] || b.delta48 - a.delta48 || b.peak48 - a.peak48);

  const value: ForecastPayload = {
    generatedAt: new Date().toISOString(),
    live,
    ...(error ? { error } : {}),
    cities,
    corridors,
  };
  cache = { at: Date.now(), value };
  return value;
}
