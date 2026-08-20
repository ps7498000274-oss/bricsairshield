import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AppShell } from "@/components/AppShell";
import { Panel, RiskBadge } from "@/components/primitives";
import { countryStats, trendSeries, useCities, useIncidents } from "@/lib/airshield";

export const Route = createFileRoute("/countries")({
  head: () => ({
    meta: [
      { title: "Country Comparison — BRICS AirShield" },
      {
        name: "description",
        content:
          "Compare average AQI, PM2.5, PM10, high-risk locations and risk trends across India, Brazil, Russia, China and South Africa.",
      },
      { property: "og:title", content: "Country Comparison — BRICS AirShield" },
      {
        property: "og:description",
        content: "Cross-border pollution metrics compared across the five BRICS founding nations.",
      },
    ],
  }),
  component: CountriesPage,
});

function CountriesPage() {
  const cities = useCities();
  const incidents = useIncidents();
  const stats = useMemo(() => countryStats(cities), [cities]);
  const trends = useMemo(() => trendSeries(cities, 21), [cities]);
  const radar = stats.map((s) => ({ country: s.name, risk: s.avgRisk, aqi: s.avgAqi }));

  return (
    <AppShell>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Country comparison</h1>
        <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
          The same schema, risk engine and AI layer applied identically to every country — adding a
          sixth nation only requires appending its cities to the dataset.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((s) => (
          <div key={s.code} className="panel p-5">
            <p className="text-2xl">{s.flag}</p>
            <p className="mt-1 text-sm font-semibold">{s.name}</p>
            <p className="stat-value mt-3 text-3xl font-semibold">{s.avgRisk}</p>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Avg risk /100
            </p>
            <RiskBadge level={s.level} className="mt-2" />
            <dl className="mt-4 space-y-1 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <dt>Avg AQI</dt>
                <dd className="tabular-nums text-foreground">{s.avgAqi}</dd>
              </div>
              <div className="flex justify-between">
                <dt>PM2.5</dt>
                <dd className="tabular-nums text-foreground">{s.avgPm25} µg/m³</dd>
              </div>
              <div className="flex justify-between">
                <dt>PM10</dt>
                <dd className="tabular-nums text-foreground">{s.avgPm10} µg/m³</dd>
              </div>
              <div className="flex justify-between">
                <dt>High-risk cities</dt>
                <dd className="tabular-nums text-foreground">
                  {s.highRisk}/{s.cities}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt>Incidents</dt>
                <dd className="tabular-nums text-foreground">
                  {incidents.filter((i) => i.country_code === s.code).length}
                </dd>
              </div>
            </dl>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title="Particulate load by country" description="Average PM2.5 and PM10 (µg/m³)">
          <div className="h-[300px]">
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
                <Bar dataKey="avgPm25" name="PM2.5" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="avgPm10" name="PM10" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Risk profile" description="Average prototype risk score vs AQI">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radar} outerRadius="72%">
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis
                  dataKey="country"
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                />
                <Radar
                  name="Avg risk"
                  dataKey="risk"
                  stroke="var(--chart-3)"
                  fill="var(--chart-3)"
                  fillOpacity={0.35}
                />
                <Radar
                  name="Avg AQI"
                  dataKey="aqi"
                  stroke="var(--chart-1)"
                  fill="var(--chart-1)"
                  fillOpacity={0.2}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: "var(--surface-raised)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <Panel
        className="mt-6"
        title="21-day AQI trend by country"
        description="Modelled 14-day trend derived from current live readings — not an official time series"
      >
        <div className="h-[320px]">
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

      <Panel className="mt-6" title="All monitored locations">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="pb-2 font-medium">City</th>
                <th className="pb-2 font-medium">Country</th>
                <th className="pb-2 font-medium">Region</th>
                <th className="pb-2 text-right font-medium">AQI</th>
                <th className="pb-2 text-right font-medium">PM2.5</th>
                <th className="pb-2 text-right font-medium">PM10</th>
                <th className="pb-2 text-right font-medium">Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[...cities]
                .sort((a, b) => b.risk_score - a.risk_score)
                .map((c) => (
                  <tr key={c.id}>
                    <td className="py-2 font-medium">{c.city}</td>
                    <td className="py-2 text-muted-foreground">{c.country}</td>
                    <td className="py-2 text-muted-foreground">{c.region}</td>
                    <td className="py-2 text-right tabular-nums">{c.aqi}</td>
                    <td className="py-2 text-right tabular-nums">{c.pm25}</td>
                    <td className="py-2 text-right tabular-nums">{c.pm10}</td>
                    <td className="py-2 text-right">
                      <RiskBadge level={c.risk_level} score={c.risk_score} />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </AppShell>
  );
}
