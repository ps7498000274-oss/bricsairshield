import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Sparkles } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { CountryFilter } from "@/components/CountryFilter";
import { MapPanel } from "@/components/MapPanel";
import { AiNotice, Empty, Panel, RiskBadge } from "@/components/primitives";
import { useCities } from "@/lib/airshield";
import { ALERT_THRESHOLD, computeRisk } from "@/lib/risk";
import { explainRisk } from "@/lib/ai.functions";
import type { AiEnvelope } from "@/lib/ai.server";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/live")({
  head: () => ({
    meta: [
      { title: "Live Intelligence — BRICS AirShield" },
      {
        name: "description",
        content:
          "Inspect city-level pollution indicators, transparent risk factor contributions and Gemini-generated explanations across BRICS nations.",
      },
      { property: "og:title", content: "Live Intelligence — BRICS AirShield" },
      {
        property: "og:description",
        content: "City-level pollution risk breakdown with AI explanations.",
      },
    ],
  }),
  component: LivePage,
});

function LivePage() {
  const cities = useCities();
  const [country, setCountry] = useState("ALL");
  const [selectedId, setSelectedId] = useState(cities[0]?.id ?? "");
  const [ai, setAi] = useState<AiEnvelope<{ text: string }> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(
    () => (country === "ALL" ? cities : cities.filter((c) => c.country_code === country)),
    [cities, country],
  );
  const selected = cities.find((c) => c.id === selectedId) ?? filtered[0] ?? cities[0];
  const risk = selected ? computeRisk(selected) : null;

  async function explain() {
    if (!selected) return;
    setLoading(true);
    setError(null);
    setAi(null);
    try {
      setAi(await explainRisk({ data: { cityId: selected.id } }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "AI service unavailable.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Live intelligence</h1>
        <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
          Select a location to inspect its environmental conditions, the transparent factor
          breakdown behind its prototype risk estimate, and a Gemini explanation.
        </p>
        <div className="mt-4">
          <CountryFilter value={country} onChange={setCountry} />
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[300px_1fr]">
        <Panel title="Locations" description={`${filtered.length} monitored`} bodyClassName="p-2">
          <ul className="max-h-[560px] overflow-y-auto">
            {filtered
              .slice()
              .sort((a, b) => b.risk_score - a.risk_score)
              .map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(c.id)}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 rounded-md px-3 py-2.5 text-left transition-colors",
                      selected?.id === c.id ? "bg-secondary" : "hover:bg-secondary/60",
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{c.city}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {c.country} · AQI {c.aqi}
                      </span>
                    </span>
                    <RiskBadge level={c.risk_level} score={c.risk_score} />
                  </button>
                </li>
              ))}
          </ul>
        </Panel>

        <div className="grid gap-6">
          {selected && risk ? (
            <>
              <Panel bodyClassName="p-0">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border p-5">
                  <div>
                    <h2 className="text-xl font-semibold tracking-tight">
                      {selected.city}, {selected.country}
                    </h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {selected.region} · {selected.latitude.toFixed(3)},{" "}
                      {selected.longitude.toFixed(3)} · updated{" "}
                      {new Date(selected.timestamp).toLocaleString()} · simulated demo data
                    </p>
                  </div>
                  <div className="text-right">
                    <RiskBadge level={risk.risk_level} />
                    <p className="stat-value mt-1 text-3xl font-semibold">{risk.risk_score}/100</p>
                    <p className="text-[11px] text-muted-foreground">Prototype risk estimate</p>
                  </div>
                </div>

                {risk.risk_score >= ALERT_THRESHOLD ? (
                  <p className="border-b border-border bg-risk-critical/10 px-5 py-2.5 text-xs text-risk-critical">
                    <strong>High-risk pollution event detected.</strong> Alert threshold (
                    {ALERT_THRESHOLD}/100) exceeded — recommend field verification before escalation.
                  </p>
                ) : null}

                <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-4">
                  {[
                    ["AQI", selected.aqi, ""],
                    ["PM2.5", selected.pm25, "µg/m³"],
                    ["PM10", selected.pm10, "µg/m³"],
                    ["Temperature", selected.temperature, "°C"],
                    ["Humidity", selected.humidity, "%"],
                    ["Wind speed", selected.wind_speed, "m/s"],
                    ["Wind direction", selected.wind_direction, "°"],
                    ["Pressure", selected.pressure, "hPa"],
                  ].map(([label, value, unit]) => (
                    <div key={String(label)} className="bg-card px-5 py-4">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {label}
                      </p>
                      <p className="stat-value mt-1 text-lg font-semibold">
                        {value}
                        <span className="ml-1 text-xs font-normal text-muted-foreground">
                          {unit}
                        </span>
                      </p>
                    </div>
                  ))}
                </div>
              </Panel>

              <div className="grid gap-6 lg:grid-cols-2">
                <Panel
                  title="Risk factor contributions"
                  description="Transparent weighted model — every point is traceable"
                >
                  <ul className="space-y-3.5">
                    {risk.factors.map((f) => (
                      <li key={f.label}>
                        <div className="flex items-baseline justify-between gap-3 text-sm">
                          <span className="font-medium">{f.label}</span>
                          <span className="tabular-nums text-muted-foreground">
                            {f.points}/{f.max}
                          </span>
                        </div>
                        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${(f.points / f.max) * 100}%` }}
                          />
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{f.detail}</p>
                      </li>
                    ))}
                  </ul>
                </Panel>

                <div className="grid gap-6">
                  <Panel
                    title="Gemini explanation"
                    action={
                      <button
                        type="button"
                        onClick={explain}
                        disabled={loading}
                        className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                      >
                        <Sparkles className="size-3.5" />
                        {loading ? "Analysing…" : "Explain risk"}
                      </button>
                    }
                  >
                    {error ? (
                      <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                        {error}
                      </p>
                    ) : loading ? (
                      <div className="space-y-2">
                        {[0, 1, 2, 3].map((i) => (
                          <div key={i} className="h-3 animate-pulse rounded bg-secondary" />
                        ))}
                      </div>
                    ) : ai ? (
                      <>
                        <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                          {ai.data.text}
                        </p>
                        <AiNotice
                          generatedBy={ai.ai.generated_by}
                          provider={ai.ai.provider}
                          error={ai.ai.error}
                        />
                      </>
                    ) : (
                      <Empty>
                        Ask Google Gemini why {selected.city} carries a {risk.risk_level} risk
                        estimate.
                      </Empty>
                    )}
                  </Panel>

                  <Panel
                    title="Recommended action"
                    description="Prototype guidance — not an official directive"
                  >
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {risk.risk_score >= 75
                        ? "Prioritise field verification within 24h, cross-check against the nearest reference-grade monitor, and issue a public advisory for sensitive groups."
                        : risk.risk_score >= 55
                          ? "Schedule inspection of nearby industrial and combustion sources, and monitor for a further drop in wind speed."
                          : risk.risk_score >= 32
                            ? "Continue routine monitoring; review again if dispersion conditions weaken."
                            : "No action required beyond routine monitoring."}
                    </p>
                    <Link
                      to="/report"
                      className="mt-4 inline-flex rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-secondary"
                    >
                      File an incident for this location
                    </Link>
                  </Panel>
                </div>
              </div>

              <Panel title="Hotspot map" bodyClassName="p-3">
                <MapPanel
                  cities={filtered}
                  height={420}
                  selectedId={selected.id}
                  onSelect={setSelectedId}
                />
              </Panel>
            </>
          ) : (
            <Empty>No locations for this filter.</Empty>
          )}
        </div>
      </div>
    </AppShell>
  );
}
