import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/AppShell";
import { Panel } from "@/components/primitives";

export const Route = createFileRoute("/methodology")({
  head: () => ({
    meta: [
      { title: "Data & Methodology — BRICS AirShield" },
      {
        name: "description",
        content:
          "How BRICS AirShield sources data, uses Google Gemini, calculates prototype risk scores, and where the limitations lie.",
      },
      { property: "og:title", content: "Data & Methodology — BRICS AirShield" },
      {
        property: "og:description",
        content: "Transparent documentation of data sources, AI usage, risk scoring and limitations.",
      },
    ],
  }),
  component: MethodologyPage,
});

const WEIGHTS = [
  ["PM2.5 concentration", "40", "Linear to 150 µg/m³; dominant health driver (WHO 24h guideline 15 µg/m³)."],
  ["PM10 concentration", "15", "Linear to 250 µg/m³; coarse particulate load."],
  ["AQI band", "15", "US-EPA PM2.5 breakpoints, linear to AQI 300."],
  ["Atmospheric dispersion", "12", "Inverse of wind speed, saturating at 6 m/s."],
  ["Meteorological amplification", "8", "Humidity above 40% RH plus temperature extremes."],
  ["Pressure regime", "5", "High pressure (>1008 hPa) as a subsidence-inversion proxy."],
  ["AI visual evidence", "5", "Gemini severity × confidence, only when an image was analysed."],
];

function MethodologyPage() {
  return (
    <AppShell>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Data &amp; methodology</h1>
        <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
          BRICS AirShield is a hackathon prototype. This page states exactly what is real, what is
          simulated, and what the system cannot do.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="1. Data sources">
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="font-medium">Environmental readings — SIMULATED DEMO DATA</dt>
              <dd className="mt-1 text-muted-foreground">
                26 cities across five BRICS nations. Baselines were chosen to match publicly
                reported typical magnitudes for each city, then varied deterministically per hour so
                the interface behaves like a live feed. These are <strong>not</strong> live
                government sensor readings and must never be cited as such.
              </dd>
            </div>
            <div>
              <dt className="font-medium">AQI computation — REAL METHOD</dt>
              <dd className="mt-1 text-muted-foreground">
                AQI is computed from PM2.5 using the published US-EPA breakpoint table, not invented.
              </dd>
            </div>
            <div>
              <dt className="font-medium">Citizen evidence — REAL USER INPUT</dt>
              <dd className="mt-1 text-muted-foreground">
                Photographs you upload are genuine input and are analysed by Google Gemini in real
                time.
              </dd>
            </div>
            <div>
              <dt className="font-medium">Production path</dt>
              <dd className="mt-1 text-muted-foreground">
                In deployment the demo layer is replaced by open feeds — OpenAQ, national CPCB/CETESB
                /MEE-style portals and the free Open-Meteo weather API — without changing the schema
                or the AI layer.
              </dd>
            </div>
          </dl>
        </Panel>

        <Panel title="2. AI architecture (Google Gemini)">
          <p className="text-sm text-muted-foreground">
            All AI work runs server-side. The API key is read from a server environment variable and
            is never present in browser code or network payloads.
          </p>
          <ul className="mt-4 space-y-3 text-sm">
            {[
              ["Image analysis", "Gemini 2.5 Flash multimodal call returning strict JSON: detection flag, pollution type, severity, confidence, visual indicators, possible sources, environmental risk and recommended action."],
              ["Risk explanation", "Gemini receives the city's readings and the full factor breakdown, then explains the drivers in plain language for an official."],
              ["Climate Copilot", "Gemini answers questions grounded in a structured context block (per-country aggregates, top hotspots, optional focus city). It is instructed to decline data it was not given."],
              ["Incident summarisation", "Gemini drafts a three-part brief — situation, assessment, recommended action — for triage."],
            ].map(([t, d]) => (
              <li key={t}>
                <p className="font-medium">{t}</p>
                <p className="text-muted-foreground">{d}</p>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">
            Reliability: risk explanations are cached server-side for 10 minutes, nothing calls
            Gemini on render, and every AI surface requires an explicit user action. If Gemini is
            unavailable, the response is labelled <strong>DEMO FALLBACK — not AI generated</strong>{" "}
            and produced by the local rule engine.
          </p>
        </Panel>

        <Panel title="3. Risk calculation" className="lg:col-span-2">
          <p className="text-sm text-muted-foreground">
            A transparent additive model, not a black box. With no labelled cross-border ground truth
            available within a hackathon, a weighted model that can be audited line by line is more
            honest than a trained classifier presented as scientific. Every factor publishes its own
            contribution in the UI.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="pb-2 font-medium">Factor</th>
                  <th className="pb-2 font-medium">Max points</th>
                  <th className="pb-2 font-medium">Basis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {WEIGHTS.map(([f, m, b]) => (
                  <tr key={f}>
                    <td className="py-2 pr-4 font-medium">{f}</td>
                    <td className="py-2 pr-4 tabular-nums">{m}</td>
                    <td className="py-2 text-muted-foreground">{b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-sm">
            Bands: <strong>LOW</strong> 0–31 · <strong>MEDIUM</strong> 32–54 · <strong>HIGH</strong>{" "}
            55–74 · <strong>CRITICAL</strong> 75–100. An alert record is raised at 75.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Output is labelled a “prototype risk estimate” everywhere it appears. It is not an
            official AQI forecast and carries no regulatory meaning.
          </p>
        </Panel>

        <Panel title="4. Cross-border design">
          <p className="text-sm text-muted-foreground">
            The data model is country-agnostic: Country → Region → City → Environmental observation →
            AI analysis → Risk → Incident → Alert. Nothing in the risk engine, prompts or UI is
            India-specific. Adding a sixth country means appending rows to the dataset — no core
            rewrite, no new AI logic, no new schema.
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Because every country is scored with the identical method, cross-border comparison is
            meaningful in a way that mixing national indices is not — an important property for
            coordinated BRICS climate action.
          </p>
        </Panel>

        <Panel title="5. Privacy">
          <ul className="list-disc space-y-2 pl-4 text-sm text-muted-foreground">
            <li>No accounts, no phone numbers, no email addresses, no location tracking.</li>
            <li>
              Uploaded images are downscaled in the browser, sent once for analysis and never
              persisted on a server.
            </li>
            <li>Incident records stay in your browser’s local storage and can be cleared anytime.</li>
            <li>
              This is a citizen-facing environmental transparency tool, not a surveillance system.
            </li>
          </ul>
        </Panel>

        <Panel title="6. Limitations" className="lg:col-span-2">
          <ul className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
            {[
              "Environmental values are simulated demo data, not live government readings.",
              "Risk scores are heuristic estimates and are not validated against health outcomes.",
              "Image analysis can misread fog, cloud, dust or backlighting as pollution.",
              "The system cannot identify a specific facility, operator or legal violation.",
              "Trends are synthetic and do not represent measured history.",
              "No official partnership, satellite feed or authority integration exists.",
              "Prototype storage is per-browser; there is no shared multi-user database yet.",
              "Alerts are in-app only — no SMS or email is sent.",
            ].map((l) => (
              <li key={l} className="flex gap-2">
                <span className="text-risk-medium">•</span>
                {l}
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="7. Future deployment" className="lg:col-span-2">
          <p className="text-sm text-muted-foreground">
            Next steps: swap the demo layer for OpenAQ and Open-Meteo ingestion on a scheduled job;
            move incidents to a managed Postgres with row-level security; add satellite-derived
            aerosol context; calibrate the weighted model against reference-grade monitors and only
            then consider a supervised model; add multilingual Copilot output for each BRICS
            language. The entire current stack runs within free tiers.
          </p>
        </Panel>
      </div>
    </AppShell>
  );
}
