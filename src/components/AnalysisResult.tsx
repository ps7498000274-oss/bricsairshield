import { AlertTriangle, CheckCircle2, Eye, Factory, ShieldAlert } from "lucide-react";

import { AiNotice } from "@/components/primitives";
import type { AiEnvelope, ImageAnalysis } from "@/lib/ai.server";
import { cn } from "@/lib/utils";

const SEV_CLASS: Record<string, string> = {
  none: "text-risk-low",
  low: "text-risk-low",
  medium: "text-risk-medium",
  high: "text-risk-high",
  severe: "text-risk-critical",
  critical: "text-risk-critical",
};

export function AnalysisResult({ result }: { result: AiEnvelope<ImageAnalysis> }) {
  const a = result.data;
  const sev = String(a.severity ?? "none").toLowerCase();

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        {a.pollution_detected ? (
          <span className="inline-flex items-center gap-2 rounded-full border border-risk-critical/40 bg-risk-critical/12 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-risk-critical">
            <AlertTriangle className="size-3.5" /> Pollution detected
          </span>
        ) : (
          <span className="inline-flex items-center gap-2 rounded-full border border-risk-low/40 bg-risk-low/12 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-risk-low">
            <CheckCircle2 className="size-3.5" /> No clear pollution evidence
          </span>
        )}
        <span className="text-lg font-semibold capitalize">
          {String(a.pollution_type ?? "undetermined").replace(/_/g, " ")}
        </span>
      </div>

      <div className="mt-5 grid gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-2">
        <div className="bg-card px-4 py-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Severity</p>
          <p className={cn("mt-1 text-xl font-semibold uppercase", SEV_CLASS[sev] ?? "")}>
            {sev}
          </p>
        </div>
        <div className="bg-card px-4 py-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Model confidence
          </p>
          <p className="stat-value mt-1 text-xl font-semibold">
            {Math.round((a.confidence ?? 0) * 100)}%
          </p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${Math.round((a.confidence ?? 0) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <Section icon={<Eye className="size-3.5" />} title="Visual indicators">
          {a.visual_indicators?.length ? (
            <ul className="list-disc space-y-1 pl-4">
              {a.visual_indicators.map((v, i) => (
                <li key={i}>{v}</li>
              ))}
            </ul>
          ) : (
            <p>None reported.</p>
          )}
        </Section>
        <Section icon={<Factory className="size-3.5" />} title="Possible sources">
          {a.possible_sources?.length ? (
            <ul className="list-disc space-y-1 pl-4">
              {a.possible_sources.map((v, i) => (
                <li key={i}>{v}</li>
              ))}
            </ul>
          ) : (
            <p>Not determinable from the image.</p>
          )}
        </Section>
        <Section icon={<ShieldAlert className="size-3.5" />} title="Environmental risk">
          <p>{a.environmental_risk || "Not assessed."}</p>
        </Section>
        <Section icon={<CheckCircle2 className="size-3.5" />} title="Recommended action">
          <p>{a.recommended_action || "No action recommended."}</p>
        </Section>
      </div>

      <AiNotice
        generatedBy={result.ai.generated_by}
        provider={result.ai.provider}
        error={result.ai.error}
      />
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {icon}
        {title}
      </p>
      <div className="mt-1.5 text-sm leading-relaxed text-foreground/90">{children}</div>
    </div>
  );
}
