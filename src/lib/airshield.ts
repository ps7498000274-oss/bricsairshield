import { useEffect, useMemo, useState, useSyncExternalStore } from "react";

import { COUNTRIES, getReadings, type CityReading, type CountryCode } from "@/data/brics";
import { computeRisk, levelFromScore, type RiskLevel } from "@/lib/risk";
import { loadIncidents, subscribeIncidents, type Incident } from "@/lib/incidents";

export interface ScoredCity extends CityReading {
  risk_score: number;
  risk_level: RiskLevel;
}

/** Hourly-bucketed so SSR output and the first client render match exactly. */
export function useCities(): ScoredCity[] {
  return useMemo(() => {
    const bucket = Math.floor(Date.now() / 3_600_000) * 3_600_000;
    return getReadings(bucket).map((r) => {
      const risk = computeRisk(r);
      return { ...r, risk_score: risk.risk_score, risk_level: risk.risk_level };
    });
  }, []);
}

export function useIncidents(): Incident[] {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const raw = useSyncExternalStore(
    (cb) => subscribeIncidents(cb),
    () => window.localStorage.getItem("airshield.incidents.v1") ?? "",
    () => "",
  );
  return useMemo(() => (hydrated && raw ? loadIncidents() : []), [hydrated, raw]);
}

export interface CountryStats {
  code: CountryCode;
  name: string;
  flag: string;
  cities: number;
  avgAqi: number;
  avgPm25: number;
  avgPm10: number;
  avgRisk: number;
  highRisk: number;
  level: RiskLevel;
}

export function countryStats(cities: ScoredCity[]): CountryStats[] {
  return COUNTRIES.map((c) => {
    const rows = cities.filter((r) => r.country_code === c.code);
    const avg = (f: (r: ScoredCity) => number) =>
      rows.length ? rows.reduce((a, r) => a + f(r), 0) / rows.length : 0;
    const avgRisk = Math.round(avg((r) => r.risk_score));
    return {
      code: c.code,
      name: c.name,
      flag: c.flag,
      cities: rows.length,
      avgAqi: Math.round(avg((r) => r.aqi)),
      avgPm25: Math.round(avg((r) => r.pm25)),
      avgPm10: Math.round(avg((r) => r.pm10)),
      avgRisk,
      highRisk: rows.filter((r) => r.risk_score >= 55).length,
      level: levelFromScore(avgRisk),
    };
  }).sort((a, b) => b.avgRisk - a.avgRisk);
}

/** Deterministic 14-day synthetic history derived from the current demo values. */
export function trendSeries(cities: ScoredCity[], days = 14) {
  const out: Array<Record<string, number | string>> = [];
  for (let d = days - 1; d >= 0; d--) {
    const date = new Date(Date.now() - d * 86_400_000);
    const row: Record<string, number | string> = {
      date: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    };
    for (const c of COUNTRIES) {
      const rows = cities.filter((r) => r.country_code === c.code);
      if (!rows.length) continue;
      const base = rows.reduce((a, r) => a + r.aqi, 0) / rows.length;
      const wave = Math.sin((d + c.code.charCodeAt(0)) / 2.4) * base * 0.13;
      const drift = ((c.code.charCodeAt(1) % 5) - 2) * d * 0.35;
      row[c.name] = Math.max(8, Math.round(base + wave + drift));
    }
    out.push(row);
  }
  return out;
}

export function fmtTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const COUNTRY_OPTIONS = [{ code: "ALL", name: "All BRICS", flag: "🌐" }, ...COUNTRIES];
