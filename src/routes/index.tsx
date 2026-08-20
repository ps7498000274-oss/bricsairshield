import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bell,
  Globe2,
  MapPin,
  Sparkles,
  Wind,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AppShell } from "@/components/AppShell";
import { CountryFilter } from "@/components/CountryFilter";
import { MapPanel } from "@/components/MapPanel";
import { AiNotice, Empty, Panel, RiskBadge, StatCard } from "@/components/primitives";
import { countryStats, fmtTime, trendSeries, useCities, useIncidents } from "@/lib/airshield";
import { ALERT_THRESHOLD, RISK_COLORS } from "@/lib/risk";
import { explainRisk } from "@/lib/ai.functions";
import type { AiEnvelope } from "@/lib/ai.server";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BRICS AirShield — Cross-Border Air Pollution Intelligence" },
      {
        name: "description",
        content:
          "AI-powered prototype that detects, predicts and explains air-pollution hotspots across India, Brazil, Russia, China and South Africa using Google Gemini.",
      },
      { property: "og:title", content: "BRICS AirShield — Cross-Border Air Pollution Intelligence" },
      {
        property: "og:description",
        content:
          "Detect. Predict. Explain. Coordinate. A Google Gemini-powered climate intelligence prototype for BRICS nations.",
      },
    ],
  }),
  component: Overview,
});

function Overview() {
  const cities = useCities();
  const incidents = useIncidents();
  const [country, setCountry] = useState("ALL");
  const [insight, setInsight] = useState<AiEnvelope<{ text: string }> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(
    () => (country === "ALL" ? cities : cities.filter((c) => c.country_code === country)),
    [cities, country],
  );
  const stats = useMemo(() => countryStats(cities), [cities]);
  const trends = useMemo(() => trendSeries(cities), [cities]);

  const avgRisk = Math.round(filtered.reduce((a, c) => a + c.risk_score, 0) / (filtered.length || 1));
  const hotspots = filtered.filter((c) => c.risk_score >= 55);
  const critical = filtered.filter((c) => c.risk_score >= ALERT_THRESHOLD);
  const ranked = [...filtered].sort((a, b) => b.risk_score - a.risk_score);
  const worst = ranked[0];

  async function generateInsight() {
    if (!worst) return;
    setLoading(true);
    setError(null);
    try {
      const res = await explainRisk({ data: { cityId: worst.id } });
      setInsight(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not reach the AI service.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <section className="mb-8">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-primary">
          Cross-border climate intelligence
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          BRICS pollution overview
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Detect. Predict. Explain. Coordinate. One AI architecture monitoring{" "}
          {cities.length} cities across five BRICS nations — with transparent risk scoring and
          Google Gemini analysis of citizen evidence.
        </p>
        <div className="mt-5">
          <CountryFilter value={country} onChange={setCountry} />
        </div>
      </section>

      {critical.length > 0 ? (
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border border-risk-critical/40 bg-risk-critical/10 px-4 py-3 text-sm text-risk-critical">
          <Bell className="size-4 shrink-0" />
          <span>
            <strong>High-risk pollution event detected.</strong> {critical.length} location
            {critical.length > 1 ? "s" : ""} above the alert threshold ({ALERT_THRESHOLD}/100):{" "}
            {critical
              .slice(0, 4)
              .map((c) => c.city)
              .join(", ")}
            {critical.length > 4 ? "…" : ""}
          </span>
          <Link to="/live" className="ml-auto inline-flex items-center gap-1 font-medium hover:underline">
            Investigate <ArrowRight className="size-3.5" />
          </Link>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Global risk index"
          value={`${avgRisk}/100`}
          sub={`Average prototype risk across ${filtered.length} monitored cities`}
          icon={<Activity className="size-5" />}
          tone={avgRisk >= 55 ? "warn" : "default"}
        />
        <StatCard
          label="High-risk hotspots"
          value={hotspots.length}
          sub={`${critical.length} above alert threshold`}
          icon={<AlertTriangle className="size-5" />}
          tone={hotspots.length ? "danger" : "good"}
        />
        <StatCard
          label="Active incidents"
          value={incidents.length}
          sub="Citizen reports analysed in this session"
          icon={<MapPin className="size-5" />}
        />
        <StatCard
          label="Countries monitored"
          value={country === "ALL" ? 5 : 1}
          sub="Architecture is country-agnostic and extensible"
          icon={<Globe2 className="size-5" />}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.55fr_1fr]">
        <Panel
          title="Global pollution hotspot map"
          description="Marker colour = prototype risk level · halo size = risk score · OpenStreetMap tiles"
          bodyClassName="p-3"
        >
          <MapPanel cities={filtered} height={470} />
        </Panel>

        <div className="grid gap-6">
          <Panel
            title="AI insight"
            description={worst ? `Gemini explanation for ${worst.city}` : "No data"}
            action={
              <button
                type="button"
                onClick={generateInsight}
                disabled={loading || !worst}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                <Sparkles className="size-3.5" />
                {loading ? "Analysing…" : insight ? "Regenerate" : "Generate"}
              </button>
            }
          >
            {error ? (
              <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {error}
              </p>
            ) : null}
            {loading ? (
              <div className="space-y-2">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-3 animate-pulse rounded bg-secondary" />
                ))}
              </div>
            ) : insight ? (
              <>
                <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                  {insight.data.text}
                </p>
                <AiNotice
                  generatedBy={insight.ai.generated_by}
                  provider={insight.ai.provider}
                  error={insight.ai.error}
                />
              </>
            ) : (
              <Empty>
                Generate a Google Gemini explanation of the current worst-performing location
                {worst ? `: ${worst.city}, ${worst.country}` : ""}.
              </Empty>
            )}
          </Panel>

          <Panel title="High-risk locations" description="Ranked by prototype risk score">
            <ul className="divide-y divide-border">
              {ranked.slice(0, 6).map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {c.city}
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        {c.country}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      AQI {c.aqi} · PM2.5 {c.pm25} · wind {c.wind_speed} m/s
                    </p>
                  </div>
                  <RiskBadge level={c.risk_level} score={c.risk_score} />
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel
          title="Country risk comparison"
          description="Average prototype risk score and AQI per country"
        >
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats} margin={{ left: -18, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <Tooltip
                  contentStyle={{
                    background: "var(--surface-raised)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="avgRisk" name="Avg risk" fill={RISK_COLORS.HIGH} radius={[4, 4, 0, 0]} />
                <Bar dataKey="avgAqi" name="Avg AQI" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel
          title="14-day AQI trend"
          description="Modelled 14-day trend derived from current live readings"
        >
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends} margin={{ left: -18, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <Tooltip
                  contentStyle={{
                    background: "var(--surface-raised)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {["India", "Brazil", "Russia", "China", "South Africa"].map((n, i) => (
                  <Line
                    key={n}
                    type="monotone"
                    dataKey={n}
                    stroke={`var(--chart-${i + 1})`}
                    strokeWidth={2}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel
          title="Recent incidents"
          description="Citizen reports created in this browser (prototype storage)"
          action={
            <Link to="/report" className="text-xs font-medium text-primary hover:underline">
              Report an incident
            </Link>
          }
        >
          {incidents.length === 0 ? (
            <Empty>
              No incidents yet. Upload pollution evidence on the{" "}
              <Link to="/report" className="text-primary hover:underline">
                report page
              </Link>{" "}
              to run the full detect → analyse → score → alert flow.
            </Empty>
          ) : (
            <ul className="divide-y divide-border">
              {incidents.slice(0, 5).map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      <span className="font-mono text-xs text-primary">#{i.id}</span> · {i.city},{" "}
                      {i.country}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {i.location} · {fmtTime(i.created_at)} · {i.status}
                    </p>
                  </div>
                  <RiskBadge level={i.risk_level} score={i.risk_score} />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Environmental conditions"
          description="Dispersion-relevant meteorology for the top hotspots"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="pb-2 font-medium">City</th>
                  <th className="pb-2 text-right font-medium">Temp</th>
                  <th className="pb-2 text-right font-medium">Humidity</th>
                  <th className="pb-2 text-right font-medium">Wind</th>
                  <th className="pb-2 text-right font-medium">Pressure</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {ranked.slice(0, 6).map((c) => (
                  <tr key={c.id}>
                    <td className="py-2 pr-3">
                      <span className="font-medium">{c.city}</span>
                      <span className="ml-1.5 text-xs text-muted-foreground">{c.country}</span>
                    </td>
                    <td className="py-2 text-right tabular-nums">{c.temperature}°C</td>
                    <td className="py-2 text-right tabular-nums">{c.humidity}%</td>
                    <td className="py-2 text-right tabular-nums">
                      <Wind className="mr-1 inline size-3 text-muted-foreground" />
                      {c.wind_speed} m/s
                    </td>
                    <td className="py-2 text-right tabular-nums">{c.pressure} hPa</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
