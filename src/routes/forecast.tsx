import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, Loader2, Sparkles, TrendingUp, Wind } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { AiNotice, Empty, Panel, StatCard } from "@/components/primitives";
import { getForecast } from "@/lib/forecast.functions";
import { explainForecast } from "@/lib/ai.functions";
import { cn } from "@/lib/utils";
import type { SpikeLevel } from "@/lib/forecast.server";

export const Route = createFileRoute("/forecast")({
  head: () => ({
    meta: [
      { title: "48-Hour AQI Spike Forecast — BRICS AirShield" },
      {
        name: "description",
        content:
          "Forecast air-quality spikes across BRICS economic corridors 24–48 hours ahead using CAMS hourly model data, with Gemini-written intervention briefs.",
      },
      { property: "og:title", content: "48-Hour AQI Spike Forecast — BRICS AirShield" },
      {
        property: "og:description",
        content:
          "Corridor-level pollution spike prediction and coordinated-action briefs for India, Brazil, Russia, China and South Africa.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ForecastPage,
});

const SPIKE_CLASS: Record<SpikeLevel, string> = {
  none: "border-risk-low/40 bg-risk-low/12 text-risk-low",
  watch: "border-risk-medium/40 bg-risk-medium/12 text-risk-medium",
  alert: "border-risk-high/40 bg-risk-high/12 text-risk-high",
  severe: "border-risk-critical/45 bg-risk-critical/15 text-risk-critical",
};

function SpikeBadge({ level }: { level: SpikeLevel }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider",
        SPIKE_CLASS[level],
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {level === "none" ? "stable" : level}
    </span>
  );
}

function hourLabel(iso: string) {
  if (!iso) return "";
  const d = new Date(`${iso.length <= 16 ? `${iso}:00Z` : iso}`);
  return d.toLocaleString(undefined, { weekday: "short", hour: "2-digit" });
}

function ForecastPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["forecast"],
    queryFn: () => getForecast(),
    staleTime: 30 * 60 * 1000,
    refetchInterval: 30 * 60 * 1000,
  });
  const askBrief = useServerFn(explainForecast);

  const corridors = data?.corridors ?? [];
  const [selected, setSelected] = useState<string | null>(null);
  const active = corridors.find((c) => c.id === selected) ?? corridors[0];

  const brief = useQuery({
    queryKey: ["forecast-brief", active?.id],
    queryFn: () => askBrief({ data: { corridorId: active!.id } }),
    enabled: false,
  });

  const spikes = useMemo(
    () => (data?.cities ?? []).filter((c) => c.spike !== "none").sort((a, b) => b.delta48 - a.delta48),
    [data],
  );

  const chart = (active?.hourly ?? []).map((h) => ({ ...h, label: hourLabel(h.time) }));

  return (
    <AppShell>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          48-hour spike forecast
        </h1>
        <p className="mt-1.5 max-w-3xl text-sm text-muted-foreground">
          Hourly CAMS forecast for all 26 cities, aggregated into shared-airshed economic corridors.
          A spike is flagged when the forecast peak rises materially above the current hour — the
          window in which authorities on both ends of a corridor can still act together.
        </p>
      </header>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading CAMS hourly forecast…
        </div>
      ) : !data ? (
        <Empty>Forecast unavailable right now.</Empty>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Corridors monitored"
              value={corridors.length}
              sub="Shared-airshed groupings"
              icon={<Wind className="size-5" />}
            />
            <StatCard
              label="Corridors with spikes"
              value={corridors.filter((c) => c.spike !== "none").length}
              sub="Watch level or higher"
              tone="warn"
              icon={<TrendingUp className="size-5" />}
            />
            <StatCard
              label="Cities flagged"
              value={spikes.length}
              sub="of 26 monitored cities"
              tone={spikes.length > 8 ? "danger" : "warn"}
              icon={<AlertTriangle className="size-5" />}
            />
            <StatCard
              label="Largest jump"
              value={spikes[0] ? `+${spikes[0].delta48}` : "—"}
              sub={spikes[0] ? `${spikes[0].city} → AQI ${spikes[0].peak48}` : "No spikes forecast"}
              tone="danger"
            />
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
            <Panel
              title={active ? active.name : "Corridor outlook"}
              description={active?.description}
              action={active ? <SpikeBadge level={active.spike} /> : undefined}
            >
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chart} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                    <defs>
                      <linearGradient id="aqiFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.45} />
                        <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0.03} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11 }}
                      interval={5}
                      stroke="var(--color-muted-foreground)"
                    />
                    <YAxis tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                    <Tooltip
                      contentStyle={{
                        background: "var(--color-card)",
                        border: "1px solid var(--color-border)",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <ReferenceLine y={100} stroke="var(--color-risk-medium)" strokeDasharray="4 4" />
                    <ReferenceLine y={150} stroke="var(--color-risk-high)" strokeDasharray="4 4" />
                    <Area
                      type="monotone"
                      dataKey="aqi"
                      name="Corridor avg US-AQI"
                      stroke="var(--color-primary)"
                      strokeWidth={2}
                      fill="url(#aqiFill)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {active ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-md border border-border px-3 py-2">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Now</p>
                    <p className="stat-value text-xl font-semibold">{active.currentAqi}</p>
                  </div>
                  <div className="rounded-md border border-border px-3 py-2">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      48h peak
                    </p>
                    <p className="stat-value text-xl font-semibold">{active.peak48}</p>
                  </div>
                  <div className="rounded-md border border-border px-3 py-2">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      Worst city
                    </p>
                    <p className="text-sm font-medium">{active.worstCity}</p>
                    <p className="text-[11px] text-muted-foreground">{hourLabel(active.peakAt)}</p>
                  </div>
                </div>
              ) : null}

              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => brief.refetch()}
                  disabled={!active || brief.isFetching}
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
                >
                  {brief.isFetching ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Sparkles className="size-4" />
                  )}
                  Gemini intervention brief
                </button>
                {brief.data ? (
                  <div className="mt-4">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                      {brief.data.data.text}
                    </p>
                    <AiNotice
                      generatedBy={brief.data.ai.generated_by}
                      provider={brief.data.ai.provider}
                      error={brief.data.ai.error}
                    />
                  </div>
                ) : null}
              </div>
            </Panel>

            <Panel title="Corridors" description="Ranked by forecast AQI jump over 48h">
              <ul className="space-y-2">
                {corridors.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(c.id)}
                      className={cn(
                        "w-full rounded-md border px-3 py-2.5 text-left transition-colors",
                        active?.id === c.id
                          ? "border-primary/50 bg-primary/8"
                          : "border-border hover:bg-secondary/60",
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium">{c.name}</span>
                        <SpikeBadge level={c.spike} />
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        AQI {c.currentAqi} → {c.peak48}{" "}
                        <span className={c.delta48 > 0 ? "text-risk-high" : "text-risk-low"}>
                          ({c.delta48 >= 0 ? "+" : ""}
                          {c.delta48})
                        </span>{" "}
                        · {c.cities.length} cities
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>

          <Panel
            className="mt-6"
            title="City spike watchlist"
            description="Cities whose forecast peak rises above the current hour within 48 hours"
          >
            {spikes.length === 0 ? (
              <Empty>No significant AQI spikes forecast in the next 48 hours.</Empty>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                      <th className="py-2 pr-3 font-medium">City</th>
                      <th className="py-2 pr-3 font-medium">Now</th>
                      <th className="py-2 pr-3 font-medium">24h peak</th>
                      <th className="py-2 pr-3 font-medium">48h peak</th>
                      <th className="py-2 pr-3 font-medium">Min wind</th>
                      <th className="py-2 pr-3 font-medium">Status</th>
                      <th className="py-2 font-medium">Why</th>
                    </tr>
                  </thead>
                  <tbody>
                    {spikes.map((c) => (
                      <tr key={c.id} className="border-b border-border/60 last:border-0">
                        <td className="py-2 pr-3">
                          <span className="font-medium">{c.city}</span>
                          <span className="ml-1.5 text-xs text-muted-foreground">{c.country}</span>
                        </td>
                        <td className="py-2 pr-3 tabular-nums">{c.currentAqi}</td>
                        <td className="py-2 pr-3 tabular-nums">{c.peak24}</td>
                        <td className="py-2 pr-3 tabular-nums font-semibold">{c.peak48}</td>
                        <td className="py-2 pr-3 tabular-nums">{c.minWind} m/s</td>
                        <td className="py-2 pr-3">
                          <SpikeBadge level={c.spike} />
                        </td>
                        <td className="py-2 text-xs text-muted-foreground">{c.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
              Source: Open-Meteo Air Quality API (Copernicus CAMS global model), hourly US-AQI and
              PM2.5, refreshed every 30 minutes.{" "}
              {data.live
                ? "Live forecast feed."
                : `Upstream feed unavailable (${data.error ?? "unknown error"}) — showing a labelled synthetic profile.`}{" "}
              Modelled prediction only, not an official government advisory.
            </p>
          </Panel>
        </>
      )}
    </AppShell>
  );
}
