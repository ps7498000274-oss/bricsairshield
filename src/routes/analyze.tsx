import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { ImageUp, Sparkles, Trash2 } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { AnalysisResult } from "@/components/AnalysisResult";
import { Empty, Panel, RiskBadge } from "@/components/primitives";
import { useCities } from "@/lib/airshield";
import { computeRisk } from "@/lib/risk";
import { analyzeImage } from "@/lib/ai.functions";
import type { AiEnvelope, ImageAnalysis } from "@/lib/ai.server";
import { prepareImage, type PreparedImage } from "@/lib/imageUtil";

export const Route = createFileRoute("/analyze")({
  head: () => ({
    meta: [
      { title: "AI Pollution Photo Analyzer — BRICS AirShield" },
      {
        name: "description",
        content:
          "Upload pollution or smoke photographs and let Google Gemini identify indicators, severity, likely sources and recommended action.",
      },
      { property: "og:title", content: "AI Pollution Photo Analyzer — BRICS AirShield" },
      {
        property: "og:description",
        content: "Google Gemini analyses citizen pollution evidence and returns structured findings.",
      },
    ],
  }),
  component: AnalyzePage,
});

function AnalyzePage() {
  const cities = useCities();
  const inputRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<PreparedImage | null>(null);
  const [cityId, setCityId] = useState(cities[0]?.id ?? "");
  const [note, setNote] = useState("");
  const [result, setResult] = useState<AiEnvelope<ImageAnalysis> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const city = cities.find((c) => c.id === cityId);
  const combined = useMemo(() => {
    if (!city) return null;
    return computeRisk(
      city,
      result
        ? {
            severity: result.data.severity,
            confidence: result.data.confidence,
            pollution_detected: result.data.pollution_detected,
          }
        : null,
    );
  }, [city, result]);
  const baseline = city ? computeRisk(city) : null;

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setResult(null);
    try {
      setImage(await prepareImage(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read that image.");
    }
  }

  async function run() {
    if (!image) return;
    setLoading(true);
    setError(null);
    try {
      const res = await analyzeImage({
        data: {
          mimeType: image.mimeType,
          data: image.base64,
          city: city?.city ?? "",
          country: city?.country ?? "",
          note,
        },
      });
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          AI pollution photo analyzer
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
          Google Gemini inspects the photograph for visible pollution indicators and returns
          structured findings. Images are processed in-memory for the analysis request and are never
          stored on a server in this prototype.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
        <Panel title="Evidence" description="Max 5 MB · PNG, JPEG, WEBP or GIF">
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="sr-only"
            onChange={(e) => void onFile(e.target.files?.[0])}
          />

          {image ? (
            <div className="relative overflow-hidden rounded-md border border-border">
              <img src={image.dataUrl} alt="Uploaded pollution evidence preview" className="w-full" />
              <button
                type="button"
                onClick={() => {
                  setImage(null);
                  setResult(null);
                  if (inputRef.current) inputRef.current.value = "";
                }}
                className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md bg-background/85 px-2 py-1 text-xs backdrop-blur hover:bg-background"
              >
                <Trash2 className="size-3.5" /> Remove
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex w-full flex-col items-center gap-2 rounded-md border border-dashed border-border px-4 py-12 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
            >
              <ImageUp className="size-6 text-primary" />
              Click to upload a pollution or smoke photograph
            </button>
          )}

          <label className="mt-4 block text-xs font-medium text-muted-foreground">
            Nearest monitored location
            <select
              value={cityId}
              onChange={(e) => setCityId(e.target.value)}
              className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            >
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.city}, {c.country}
                </option>
              ))}
            </select>
          </label>

          <label className="mt-4 block text-xs font-medium text-muted-foreground">
            Context note (optional)
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="e.g. Thick dark smoke visible since early morning near the highway."
              className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </label>

          <button
            type="button"
            onClick={run}
            disabled={!image || loading}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <Sparkles className="size-4" />
            {loading ? "Gemini is analysing…" : "Analyze with Google Gemini"}
          </button>

          {error ? (
            <p className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          ) : null}
        </Panel>

        <div className="grid gap-6">
          <Panel title="Analysis result" description="AI-assisted — not an official diagnosis">
            {loading ? (
              <div className="space-y-3">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-4 animate-pulse rounded bg-secondary" />
                ))}
              </div>
            ) : result ? (
              <AnalysisResult result={result} />
            ) : (
              <Empty>Upload an image and run the analysis to see structured findings here.</Empty>
            )}
          </Panel>

          {result && combined && baseline && city ? (
            <Panel
              title="Combined risk estimate"
              description={`Environmental data for ${city.city} fused with the AI visual evidence`}
            >
              <div className="flex flex-wrap items-center gap-6">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Sensor-only
                  </p>
                  <p className="stat-value text-2xl font-semibold">{baseline.risk_score}/100</p>
                  <RiskBadge level={baseline.risk_level} className="mt-1" />
                </div>
                <span className="text-muted-foreground">→</span>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    With AI visual evidence
                  </p>
                  <p className="stat-value text-2xl font-semibold text-primary">
                    {combined.risk_score}/100
                  </p>
                  <RiskBadge level={combined.risk_level} className="mt-1" />
                </div>
              </div>
              <ul className="mt-4 space-y-2 text-xs text-muted-foreground">
                {combined.factors.map((f) => (
                  <li key={f.label} className="flex justify-between gap-4">
                    <span>{f.label}</span>
                    <span className="tabular-nums">
                      {f.points}/{f.max}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-[11px] text-muted-foreground">
                Prototype risk estimate from a transparent weighted model — not an official AQI
                forecast.
              </p>
            </Panel>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}
