import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { CheckCircle2, ImageUp, Send, Trash2 } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { AnalysisResult } from "@/components/AnalysisResult";
import { AiNotice, Panel, RiskBadge } from "@/components/primitives";
import { useCities } from "@/lib/airshield";
import { ALERT_THRESHOLD, computeRisk } from "@/lib/risk";
import { analyzeImage, summarizeIncident } from "@/lib/ai.functions";
import type { AiEnvelope, ImageAnalysis } from "@/lib/ai.server";
import { loadIncidents, nextIncidentId, saveIncident, type Incident } from "@/lib/incidents";
import { prepareImage, thumbnail, type PreparedImage } from "@/lib/imageUtil";

export const Route = createFileRoute("/report")({
  head: () => ({
    meta: [
      { title: "Report a Pollution Incident — BRICS AirShield" },
      {
        name: "description",
        content:
          "Submit pollution evidence: Gemini analyses the image, the risk engine scores it, and an incident brief is generated for monitoring authorities.",
      },
      { property: "og:title", content: "Report a Pollution Incident — BRICS AirShield" },
      {
        property: "og:description",
        content: "Citizen pollution reporting with AI analysis and automatic risk scoring.",
      },
    ],
  }),
  component: ReportPage,
});

type Step = "idle" | "analyzing" | "scoring" | "summarizing" | "done";

function ReportPage() {
  const cities = useCities();
  const inputRef = useRef<HTMLInputElement>(null);
  const [cityId, setCityId] = useState(cities[0]?.id ?? "");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [observedAt, setObservedAt] = useState(() => new Date().toISOString().slice(0, 16));
  const [image, setImage] = useState<PreparedImage | null>(null);
  const [step, setStep] = useState<Step>("idle");
  const [error, setError] = useState<string | null>(null);
  const [incident, setIncident] = useState<Incident | null>(null);
  const [analysis, setAnalysis] = useState<AiEnvelope<ImageAnalysis> | null>(null);
  const [summary, setSummary] = useState<AiEnvelope<{ text: string }> | null>(null);

  const city = cities.find((c) => c.id === cityId);
  const busy = step !== "idle" && step !== "done";

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    try {
      setImage(await prepareImage(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read that image.");
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!city) return;
    if (!location.trim()) {
      setError("Please describe the location (area, landmark or street).");
      return;
    }
    setError(null);
    setIncident(null);
    setSummary(null);
    setAnalysis(null);

    let imageResult: AiEnvelope<ImageAnalysis> | null = null;
    try {
      if (image) {
        setStep("analyzing");
        imageResult = await analyzeImage({
          data: {
            mimeType: image.mimeType,
            data: image.base64,
            city: city.city,
            country: city.country,
            note: description.slice(0, 500),
          },
        });
        setAnalysis(imageResult);
      }

      setStep("scoring");
      const risk = computeRisk(
        city,
        imageResult
          ? {
              severity: imageResult.data.severity,
              confidence: imageResult.data.confidence,
              pollution_detected: imageResult.data.pollution_detected,
            }
          : null,
      );

      const id = nextIncidentId(loadIncidents());

      setStep("summarizing");
      const brief = await summarizeIncident({
        data: {
          incidentId: id,
          country: city.country,
          city: city.city,
          location,
          description,
          observedAt,
          riskScore: risk.risk_score,
          riskLevel: risk.risk_level,
          imageFindings: imageResult
            ? `${imageResult.data.pollution_detected ? "Pollution detected" : "No clear pollution"} — ${imageResult.data.pollution_type}, severity ${imageResult.data.severity}, confidence ${Math.round(imageResult.data.confidence * 100)}%. Indicators: ${imageResult.data.visual_indicators.join("; ")}`
            : "",
        },
      });
      setSummary(brief);

      const record: Incident = {
        id,
        country_code: city.country_code,
        country: city.country,
        city: city.city,
        city_id: city.id,
        location,
        description,
        observed_at: observedAt,
        created_at: new Date().toISOString(),
        risk_score: risk.risk_score,
        risk_level: risk.risk_level,
        status: imageResult ? "AI Analysis Complete" : "Logged",
        analysis: imageResult?.data ?? null,
        analysis_source: imageResult?.ai.generated_by ?? null,
        summary: brief.data.text,
        summary_source: brief.ai.generated_by,
        alert: risk.risk_score >= ALERT_THRESHOLD,
        thumbnail: image ? await thumbnail(image.dataUrl) : null,
      };
      saveIncident(record);
      setIncident(record);
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the incident.");
      setStep("idle");
    }
  }

  return (
    <AppShell>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Report a pollution incident
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
          Submitting runs the full prototype pipeline: Gemini image analysis → transparent risk
          scoring → incident brief → dashboard alert. No personal data is collected and reports stay
          on this device.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[430px_1fr]">
        <Panel title="Incident details">
          <form onSubmit={submit} className="grid gap-4">
            <label className="block text-xs font-medium text-muted-foreground">
              Country &amp; city
              <select
                value={cityId}
                onChange={(e) => setCityId(e.target.value)}
                className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              >
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.country} — {c.city}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-xs font-medium text-muted-foreground">
              Location description *
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                maxLength={200}
                placeholder="Industrial area near the eastern ring road"
                className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </label>

            <label className="block text-xs font-medium text-muted-foreground">
              Observed time
              <input
                type="datetime-local"
                value={observedAt}
                onChange={(e) => setObservedAt(e.target.value)}
                className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </label>

            <label className="block text-xs font-medium text-muted-foreground">
              What did you observe?
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                maxLength={2000}
                placeholder="Dense grey smoke rising from a stack, strong burning smell, poor visibility."
                className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </label>

            <div>
              <p className="text-xs font-medium text-muted-foreground">Photo evidence (optional)</p>
              <input
                ref={inputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="sr-only"
                onChange={(e) => void onFile(e.target.files?.[0])}
              />
              {image ? (
                <div className="relative mt-1.5 overflow-hidden rounded-md border border-border">
                  <img src={image.dataUrl} alt="Incident evidence preview" className="w-full" />
                  <button
                    type="button"
                    onClick={() => {
                      setImage(null);
                      if (inputRef.current) inputRef.current.value = "";
                    }}
                    className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md bg-background/85 px-2 py-1 text-xs backdrop-blur"
                  >
                    <Trash2 className="size-3.5" /> Remove
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="mt-1.5 flex w-full flex-col items-center gap-2 rounded-md border border-dashed border-border px-4 py-8 text-xs text-muted-foreground hover:border-primary/50 hover:text-foreground"
                >
                  <ImageUp className="size-5 text-primary" />
                  Attach a photograph for Gemini analysis
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              <Send className="size-4" />
              {step === "analyzing"
                ? "Gemini analysing image…"
                : step === "scoring"
                  ? "Calculating risk…"
                  : step === "summarizing"
                    ? "Drafting incident brief…"
                    : "Submit incident"}
            </button>

            {error ? (
              <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {error}
              </p>
            ) : null}
          </form>
        </Panel>

        <div className="grid gap-6">
          {incident ? (
            <Panel bodyClassName="p-0">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border p-5">
                <div>
                  <p className="flex items-center gap-2 text-sm text-risk-low">
                    <CheckCircle2 className="size-4" /> Incident created
                  </p>
                  <h2 className="mt-1 font-mono text-xl font-semibold">Incident #{incident.id}</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Status: {incident.status} · {incident.location}, {incident.city},{" "}
                    {incident.country}
                  </p>
                </div>
                <div className="text-right">
                  <RiskBadge level={incident.risk_level} />
                  <p className="stat-value mt-1 text-2xl font-semibold">
                    {incident.risk_score}/100
                  </p>
                </div>
              </div>
              {incident.alert ? (
                <p className="border-b border-border bg-risk-critical/10 px-5 py-2.5 text-xs text-risk-critical">
                  <strong>High-risk pollution event detected.</strong> Alert record created and
                  surfaced on the dashboard.
                </p>
              ) : null}
              <div className="p-5">
                {summary ? (
                  <>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Incident brief
                    </p>
                    <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-foreground/90">
                      {summary.data.text}
                    </p>
                    <AiNotice
                      generatedBy={summary.ai.generated_by}
                      provider={summary.ai.provider}
                      error={summary.ai.error}
                    />
                  </>
                ) : null}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    to="/incidents"
                    className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-secondary"
                  >
                    View all incidents
                  </Link>
                  <Link
                    to="/copilot"
                    className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-secondary"
                  >
                    Ask the AI Copilot about this area
                  </Link>
                </div>
              </div>
            </Panel>
          ) : null}

          {analysis ? (
            <Panel title="Gemini image analysis">
              <AnalysisResult result={analysis} />
            </Panel>
          ) : null}

          {!incident && !analysis ? (
            <Panel title="What happens on submit">
              <ol className="space-y-3 text-sm text-muted-foreground">
                {[
                  "Your photo is sent to Google Gemini for structured pollution analysis.",
                  "The transparent risk engine fuses AI visual evidence with the local environmental readings.",
                  "An incident record and incident ID are created.",
                  "If risk ≥ 75/100 an alert record is raised and shown on the dashboard.",
                  "Gemini drafts a concise brief that an authority could triage.",
                ].map((s, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-secondary text-[11px] font-semibold text-primary">
                      {i + 1}
                    </span>
                    {s}
                  </li>
                ))}
              </ol>
              {city ? (
                <p className="mt-5 text-xs text-muted-foreground">
                  Current sensor-only risk for {city.city}: {computeRisk(city).risk_score}/100 (
                  {computeRisk(city).risk_level}) — live Open-Meteo / CAMS observation.
                </p>
              ) : null}
            </Panel>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}
