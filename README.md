# BRICS AirShield

**Detect. Predict. Explain. Coordinate.**

An AI-powered cross-border air-pollution intelligence prototype for BRICS nations, built for
**Build with AI: Code for Communities — Second Edition**.

> ⚠️ **Prototype notice.** Environmental values in this build are *simulated demo data* with
> realistic magnitudes — not live government sensor readings. Risk scores are *prototype
> estimates* from a transparent weighted model, not official AQI forecasts. Image analysis is
> AI-assisted and is not an official environmental diagnosis. No government partnership,
> satellite feed or authority integration exists.

---

## Problem

Air-quality monitoring is typically organised nationally and reported at coarse geographic
levels. Localised events — an open burn, a stack malfunction, a dust plume — are frequently
missed, and pollution that crosses a border becomes invisible when each country publishes an
incompatible index. Citizens who *can see* a pollution event have no structured way to feed
that observation into a monitoring workflow.

## Solution

BRICS AirShield combines three signals into one comparable picture:

1. **Environmental indicators** per city (PM2.5, PM10, AQI, meteorology).
2. **Citizen visual evidence**, analysed by **Google Gemini**.
3. A **transparent risk engine** that fuses both and shows exactly which factors produced the
   score.

Every country is scored with the *identical* method, which makes cross-border comparison
meaningful.

## Features

| Module | Route | What it does |
| --- | --- | --- |
| BRICS overview dashboard | `/` | Global risk index, hotspots, incidents, map, country comparison, 14-day trend, AI insight |
| Live intelligence | `/live` | Per-city readings, factor-by-factor risk breakdown, Gemini explanation, recommended action |
| AI photo analyzer | `/analyze` | Upload evidence → Gemini structured analysis → combined sensor + visual risk |
| Incident reporting | `/report` | Full pipeline: analyse → score → create incident → alert → Gemini brief |
| Incidents & alerts | `/incidents` | Incident register with AI findings, briefs and alert records |
| AI Climate Copilot | `/copilot` | Grounded chat over the live application context |
| Country comparison | `/countries` | AQI, PM2.5/PM10, high-risk counts, risk profile radar, trends |
| Data & methodology | `/methodology` | Data provenance, AI architecture, weights, limitations, privacy |

## End-to-end demo flow (works in the prototype)

Dashboard → select country/city → view conditions → see prototype risk → open hotspot map →
upload pollution image → **Gemini analyses it** → indicators + severity + confidence + explanation →
risk recalculated with visual evidence → incident created with an ID → alert raised if risk ≥ 75 →
Gemini drafts the incident brief → dashboard and incident register update → Copilot explains the
situation → recommended action shown.

## Google AI integration

Google Gemini (`gemini-2.5-flash`) performs four distinct jobs, all server-side:

- **Multimodal image analysis** → strict JSON (`pollution_detected`, `pollution_type`, `severity`,
  `confidence`, `visual_indicators`, `possible_sources`, `environmental_risk`,
  `recommended_action`).
- **Risk explanation** grounded in the city's readings and the model's factor contributions.
- **Climate Copilot** grounded in a structured context block; instructed to refuse invented data.
- **Incident summarisation** into a three-part authority brief.

Reliability and honesty:

- The key lives in a server environment variable — never in frontend code or network payloads.
- Explanations are cached server-side for 10 minutes; nothing calls Gemini on render; every AI
  surface requires an explicit user action.
- If Gemini is unavailable, output is clearly labelled **"DEMO FALLBACK — not AI generated"** and
  produced by the local rule engine. The app never claims Gemini produced something it did not.

Two credential routes are supported, in priority order: `GEMINI_API_KEY` (Google AI Studio free
tier) then `LOVABLE_API_KEY` (Lovable's gateway, which proxies the same Google Gemini models).

## Architecture

```
Country → Region → City → Environmental observation
                                   ↓
                        Gemini visual analysis (optional)
                                   ↓
                     Transparent weighted risk engine
                                   ↓
                          Incident → Alert → Copilot
```

Nothing is India-specific. Adding a sixth country = appending rows to `src/data/brics.ts`.

```
src/
├── data/brics.ts            # country / city dataset + AQI computation
├── lib/
│   ├── risk.ts              # transparent weighted risk engine
│   ├── gemini.server.ts     # Google Gemini access layer (server only)
│   ├── ai.server.ts         # prompts, JSON parsing, caching, fallbacks
│   ├── ai.functions.ts      # typed RPC endpoints (Zod-validated)
│   ├── airshield.ts         # aggregation hooks + country statistics
│   ├── incidents.ts         # prototype incident store
│   └── imageUtil.ts         # client-side validation + downscaling
├── components/              # AppShell, map, charts, result cards
└── routes/                  # one file per page, SSR + own SEO metadata
```

## Tech stack

React 19 · TypeScript · TanStack Start (SSR) · Vite · Tailwind CSS v4 · Recharts ·
Leaflet + OpenStreetMap · Lucide icons · Zod · Google Gemini API.

Server logic runs as typed server functions, so no separate backend process is needed and the
whole app deploys as one free unit. The Gemini access layer and risk engine are isolated modules,
so swapping in a FastAPI/Python service later requires no UI changes.

## Data strategy

- **Simulated demo data**: 26 cities × 5 countries, realistic per-city baselines, deterministic
  hourly variation. Labelled as demo everywhere it is shown.
- **Real method**: AQI derived from PM2.5 using published US-EPA breakpoints.
- **Real user input**: uploaded photographs, analysed live by Gemini.
- **Production path**: OpenAQ + Open-Meteo (both free) drop into the same schema.

## Free-tier strategy (₹0 target)

No paid API, database, hosting or cloud service. Google AI Studio free tier for Gemini,
OpenStreetMap tiles for mapping, browser local storage for prototype incident records, and static
+ serverless deployment on a free platform. No Firebase, BigQuery, Vertex AI or paid Google Maps.

## Installation

```bash
bun install          # or: npm install
cp .env.example .env # add your GEMINI_API_KEY
bun run dev          # http://localhost:8080
```

### Environment variables

| Name | Required | Purpose |
| --- | --- | --- |
| `GEMINI_API_KEY` | recommended | Google AI Studio key; server-side only |
| `LOVABLE_API_KEY` | optional | Gateway fallback that proxies Google Gemini |

Without either key the app still runs end-to-end using clearly-labelled demo fallbacks.

## Deployment

The app builds to a static client plus a serverless server bundle:

```bash
bun run build
```

Deploy on any free-tier platform that supports serverless functions (Cloudflare Pages/Workers,
Vercel Hobby, Netlify). Set `GEMINI_API_KEY` as a server-side environment variable in the platform
dashboard — never in client config. No always-on server, container or managed database is
required, so cold starts and sleeping instances do not affect the demo.

## Screenshots

_Add screenshots of `/`, `/analyze`, `/report` and `/copilot` here before submission._

## Limitations

Listed in full at `/methodology`: simulated readings, unvalidated heuristic scoring, image analysis
can misread fog/cloud/dust, no facility-level attribution, synthetic trends, per-browser storage,
in-app alerts only.

## Future scope

Live OpenAQ + Open-Meteo ingestion; managed Postgres with row-level security; satellite aerosol
context; calibration against reference-grade monitors before any supervised model; multilingual
Copilot output for each BRICS language.

## Hackathon information

- Event: Build with AI: Code for Communities — Second Edition
- Track fit: cross-border AI for climate and community resilience
- Mandatory Google AI: Google Gemini performs image analysis, explanation, conversation and
  summarisation — it is the core of the product, not decoration.
