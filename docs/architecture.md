# Architecture

## Layers

1. **Data layer** (`src/data/brics.ts`) — country-agnostic Country → Region → City → Observation
   model. Demo readings with realistic per-city baselines and deterministic hourly variation.
   AQI derived from PM2.5 using US-EPA breakpoints. Swappable for OpenAQ + Open-Meteo.
2. **Risk layer** (`src/lib/risk.ts`) — transparent additive model returning a 0-100 score, a band
   (LOW/MEDIUM/HIGH/CRITICAL) and per-factor contributions. Optional AI visual-evidence factor.
3. **AI layer** (`src/lib/gemini.server.ts`, `src/lib/ai.server.ts`) — Google Gemini for image
   analysis, risk explanation, Copilot answers and incident briefs. Server-only key, 10-minute
   cache, strict JSON parsing, explicit labelled fallbacks.
4. **RPC layer** (`src/lib/ai.functions.ts`) — Zod-validated typed server functions. Image type and
   size validated on both client and server.
5. **UI layer** (`src/routes`, `src/components`) — SSR pages, each with its own SEO metadata;
   Leaflet/OpenStreetMap map; Recharts analytics; loading, error and empty states everywhere.

## Request flow (image → alert)

```
browser: validate + downscale image
  → server fn analyzeImage (Zod) → Gemini multimodal → strict JSON
  → computeRisk(reading, visual evidence) → score + factors
  → incident record + alert flag (score >= 75)
  → server fn summarizeIncident → Gemini brief
  → dashboard, incident register and Copilot context update
```

## Cross-border extension

Adding a country requires only new rows in `SEEDS` plus a `COUNTRIES` entry. Risk engine, prompts,
aggregation, charts, map and Copilot context are all derived generically.

## Failure behaviour

Gemini unavailable → labelled DEMO FALLBACK from the rule engine. Map tiles unavailable → the rest
of the dashboard still renders. No external service is required for the core demo except Gemini.
