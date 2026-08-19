import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Bell, Trash2 } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { Empty, Panel, RiskBadge } from "@/components/primitives";
import { fmtTime, useIncidents } from "@/lib/airshield";
import { clearIncidents } from "@/lib/incidents";

export const Route = createFileRoute("/incidents")({
  head: () => ({
    meta: [
      { title: "Incidents & Alerts — BRICS AirShield" },
      {
        name: "description",
        content:
          "Citizen pollution incidents with AI image findings, prototype risk scores, alert records and Gemini-generated briefs.",
      },
      { property: "og:title", content: "Incidents & Alerts — BRICS AirShield" },
      {
        property: "og:description",
        content: "Track pollution incidents and high-risk alerts across BRICS locations.",
      },
    ],
  }),
  component: IncidentsPage,
});

function IncidentsPage() {
  const incidents = useIncidents();
  const [openId, setOpenId] = useState<string | null>(null);
  const alerts = incidents.filter((i) => i.alert);

  return (
    <AppShell>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Incidents &amp; alerts</h1>
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
            Reports created in this browser. Prototype storage is local to your device — no personal
            data is transmitted or retained on a server.
          </p>
        </div>
        {incidents.length ? (
          <button
            type="button"
            onClick={() => clearIncidents()}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-secondary"
          >
            <Trash2 className="size-3.5" /> Clear local records
          </button>
        ) : null}
      </header>

      {alerts.length ? (
        <div className="mb-6 rounded-lg border border-risk-critical/40 bg-risk-critical/10 px-4 py-3 text-sm text-risk-critical">
          <p className="flex items-center gap-2 font-semibold">
            <Bell className="size-4" /> {alerts.length} active high-risk alert
            {alerts.length > 1 ? "s" : ""}
          </p>
          <p className="mt-1 text-xs">
            Alert records are raised automatically when the prototype risk score reaches 75/100.
            No SMS or email is sent — alerting is in-app only in this build.
          </p>
        </div>
      ) : null}

      {incidents.length === 0 ? (
        <Empty>
          No incidents yet.{" "}
          <Link to="/report" className="text-primary hover:underline">
            File a report
          </Link>{" "}
          to run the end-to-end detect → analyse → score → alert flow.
        </Empty>
      ) : (
        <div className="grid gap-4">
          {incidents.map((i) => {
            const open = openId === i.id;
            return (
              <Panel key={i.id} bodyClassName="p-0">
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : i.id)}
                  className="flex w-full flex-wrap items-center gap-4 p-5 text-left hover:bg-secondary/40"
                >
                  {i.thumbnail ? (
                    <img
                      src={i.thumbnail}
                      alt={`Evidence for incident ${i.id}`}
                      className="size-14 shrink-0 rounded-md border border-border object-cover"
                    />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-sm font-semibold text-primary">#{i.id}</p>
                    <p className="truncate text-sm font-medium">
                      {i.location} · {i.city}, {i.country}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {i.status} · observed {i.observed_at.replace("T", " ")} · created{" "}
                      {fmtTime(i.created_at)}
                    </p>
                  </div>
                  {i.alert ? (
                    <span className="rounded-full border border-risk-critical/40 bg-risk-critical/12 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-risk-critical">
                      Alert
                    </span>
                  ) : null}
                  <RiskBadge level={i.risk_level} score={i.risk_score} />
                </button>

                {open ? (
                  <div className="grid gap-5 border-t border-border p-5 lg:grid-cols-2">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Reporter description
                      </p>
                      <p className="mt-1.5 text-sm text-foreground/90">
                        {i.description || "None provided."}
                      </p>

                      {i.analysis ? (
                        <>
                          <p className="mt-5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Image findings ({i.analysis_source === "gemini" ? "Google Gemini" : "demo fallback"})
                          </p>
                          <ul className="mt-1.5 space-y-1 text-sm text-foreground/90">
                            <li>
                              Pollution detected:{" "}
                              {i.analysis.pollution_detected ? "yes" : "no clear evidence"}
                            </li>
                            <li>Type: {String(i.analysis.pollution_type).replace(/_/g, " ")}</li>
                            <li>Severity: {String(i.analysis.severity)}</li>
                            <li>Confidence: {Math.round((i.analysis.confidence ?? 0) * 100)}%</li>
                            {i.analysis.possible_sources?.length ? (
                              <li>Possible sources: {i.analysis.possible_sources.join(", ")}</li>
                            ) : null}
                          </ul>
                        </>
                      ) : null}
                    </div>

                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Incident brief ({i.summary_source === "gemini" ? "Google Gemini" : "demo fallback"})
                      </p>
                      <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-foreground/90">
                        {i.summary || "No brief generated."}
                      </p>
                      <Link
                        to="/live"
                        className="mt-4 inline-flex rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-secondary"
                      >
                        Open live intelligence
                      </Link>
                    </div>
                  </div>
                ) : null}
              </Panel>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
