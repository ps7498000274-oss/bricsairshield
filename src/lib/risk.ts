/**
 * Transparent weighted pollution-risk engine (prototype).
 *
 * Deliberately NOT a black-box ML model: with no labelled cross-border ground
 * truth available for a hackathon prototype, a transparent additive model is
 * more honest and fully explainable. Every factor reports its own contribution.
 */

import type { CityReading } from "@/data/brics";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface RiskFactor {
  label: string;
  detail: string;
  points: number;
  max: number;
}

export interface RiskResult {
  risk_score: number;
  risk_level: RiskLevel;
  factors: RiskFactor[];
  method: "transparent-weighted-v1";
}

export interface ImageEvidence {
  severity?: "none" | "low" | "medium" | "high" | "severe" | string;
  confidence?: number;
  pollution_detected?: boolean;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

const SEVERITY_WEIGHT: Record<string, number> = {
  none: 0,
  low: 0.25,
  medium: 0.55,
  high: 0.8,
  severe: 1,
  critical: 1,
};

export function computeRisk(
  r: Pick<
    CityReading,
    "pm25" | "pm10" | "aqi" | "temperature" | "humidity" | "wind_speed" | "pressure"
  >,
  image?: ImageEvidence | null,
): RiskResult {
  const factors: RiskFactor[] = [];

  // PM2.5 — dominant health driver (max 40)
  const pmPoints = clamp((r.pm25 / 150) * 40, 0, 40);
  factors.push({
    label: "PM2.5 concentration",
    detail: `${r.pm25} µg/m³ (WHO 24h guideline: 15 µg/m³)`,
    points: Math.round(pmPoints * 10) / 10,
    max: 40,
  });

  // PM10 (max 15)
  const pm10Points = clamp((r.pm10 / 250) * 15, 0, 15);
  factors.push({
    label: "PM10 concentration",
    detail: `${r.pm10} µg/m³ coarse particulate load`,
    points: Math.round(pm10Points * 10) / 10,
    max: 15,
  });

  // AQI band (max 15)
  const aqiPoints = clamp((r.aqi / 300) * 15, 0, 15);
  factors.push({
    label: "Air Quality Index band",
    detail: `AQI ${r.aqi} (EPA PM2.5 scale)`,
    points: Math.round(aqiPoints * 10) / 10,
    max: 15,
  });

  // Wind dispersion — low wind traps pollutants (max 12)
  const windPoints = clamp((1 - clamp(r.wind_speed / 6, 0, 1)) * 12, 0, 12);
  factors.push({
    label: "Atmospheric dispersion",
    detail: `Wind ${r.wind_speed} m/s — ${r.wind_speed < 2 ? "stagnant, traps pollutants" : r.wind_speed < 4 ? "limited dispersion" : "good dispersion"}`,
    points: Math.round(windPoints * 10) / 10,
    max: 12,
  });

  // Humidity + temperature interaction: secondary aerosol / smog formation (max 8)
  const humPoints = clamp(((r.humidity - 40) / 60) * 5, 0, 5);
  const tempPoints = r.temperature > 32 || r.temperature < 0 ? 3 : r.temperature > 28 ? 1.5 : 0;
  factors.push({
    label: "Meteorological amplification",
    detail: `${r.temperature}°C / ${r.humidity}% RH — ${r.temperature < 0 ? "cold-season inversion risk" : r.temperature > 32 ? "heat-driven secondary aerosol formation" : "neutral"}`,
    points: Math.round((humPoints + tempPoints) * 10) / 10,
    max: 8,
  });

  // Pressure — high pressure = subsidence inversion (max 5)
  const presPoints = clamp(((r.pressure - 1008) / 14) * 5, 0, 5);
  factors.push({
    label: "Pressure regime",
    detail: `${r.pressure} hPa — ${r.pressure > 1015 ? "high-pressure inversion likely" : "no strong inversion signal"}`,
    points: Math.round(presPoints * 10) / 10,
    max: 5,
  });

  // Visual AI evidence (max 5, only when an image was analyzed)
  if (image && image.pollution_detected) {
    const sev = SEVERITY_WEIGHT[String(image.severity ?? "").toLowerCase()] ?? 0.5;
    const conf = clamp(image.confidence ?? 0.5, 0, 1);
    const imgPoints = clamp(sev * conf * 5, 0, 5);
    factors.push({
      label: "AI visual evidence (Gemini)",
      detail: `Severity ${String(image.severity ?? "unknown")} at ${Math.round(conf * 100)}% model confidence`,
      points: Math.round(imgPoints * 10) / 10,
      max: 5,
    });
  }

  const score = clamp(
    Math.round(factors.reduce((a, f) => a + f.points, 0)),
    0,
    100,
  );

  return {
    risk_score: score,
    risk_level: levelFromScore(score),
    factors: factors.sort((a, b) => b.points - a.points),
    method: "transparent-weighted-v1",
  };
}

export function levelFromScore(score: number): RiskLevel {
  if (score >= 75) return "CRITICAL";
  if (score >= 55) return "HIGH";
  if (score >= 32) return "MEDIUM";
  return "LOW";
}

export const RISK_COLORS: Record<RiskLevel, string> = {
  LOW: "#22c55e",
  MEDIUM: "#eab308",
  HIGH: "#f97316",
  CRITICAL: "#ef4444",
};

export const ALERT_THRESHOLD = 75;
