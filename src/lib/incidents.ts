/**
 * Prototype incident store.
 *
 * Kept in browser localStorage so the demo needs zero paid infrastructure and
 * no personal data ever leaves the device. In a production deployment this
 * module is the single seam to swap for a Postgres/SQLite-backed API.
 */

import type { ImageAnalysis } from "@/lib/ai.server";
import type { RiskLevel } from "@/lib/risk";

export interface Incident {
  id: string;
  country_code: string;
  country: string;
  city: string;
  city_id: string;
  location: string;
  description: string;
  observed_at: string;
  created_at: string;
  risk_score: number;
  risk_level: RiskLevel;
  status: "AI Analysis Complete" | "Logged";
  analysis?: ImageAnalysis | null;
  analysis_source?: "gemini" | "fallback" | null;
  summary?: string | null;
  summary_source?: "gemini" | "fallback" | null;
  alert: boolean;
  thumbnail?: string | null;
}

const KEY = "airshield.incidents.v1";
const listeners = new Set<() => void>();

export function loadIncidents(): Incident[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Incident[]) : [];
  } catch {
    return [];
  }
}

export function saveIncident(incident: Incident) {
  const all = [incident, ...loadIncidents()].slice(0, 50);
  window.localStorage.setItem(KEY, JSON.stringify(all));
  listeners.forEach((l) => l());
}

export function clearIncidents() {
  window.localStorage.removeItem(KEY);
  listeners.forEach((l) => l());
}

export function subscribeIncidents(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function nextIncidentId(existing: Incident[]) {
  const year = new Date().getFullYear();
  const n = existing.length + 1;
  return `BA-${year}-${String(n).padStart(5, "0")}`;
}
