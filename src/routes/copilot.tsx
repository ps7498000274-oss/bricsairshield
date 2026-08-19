import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Send, Sparkles } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { Panel } from "@/components/primitives";
import { useCities } from "@/lib/airshield";
import { askCopilot } from "@/lib/ai.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/copilot")({
  head: () => ({
    meta: [
      { title: "AI Climate Copilot — BRICS AirShield" },
      {
        name: "description",
        content:
          "Ask Google Gemini why a BRICS location is high risk, what authorities should investigate and how the architecture scales across borders.",
      },
      { property: "og:title", content: "AI Climate Copilot — BRICS AirShield" },
      {
        property: "og:description",
        content: "Grounded AI analyst for cross-border air-pollution intelligence.",
      },
    ],
  }),
  component: CopilotPage,
});

interface Msg {
  role: "user" | "assistant";
  content: string;
  source?: "gemini" | "fallback";
}

const SUGGESTIONS = [
  "Why is Delhi currently high risk?",
  "Which BRICS countries have the most high-risk locations?",
  "What factors are contributing to the worst hotspot right now?",
  "What action should an authority take today?",
  "How can AirShield scale to Brazil?",
  "What are the likely environmental impacts of these conditions?",
];

function CopilotPage() {
  const cities = useCities();
  const [cityId, setCityId] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(question: string) {
    const q = question.trim();
    if (!q || loading) return;
    setError(null);
    setInput("");
    const history = messages.slice(-6).map((m) => ({ role: m.role, content: m.content }));
    setMessages((m) => [...m, { role: "user", content: q }]);
    setLoading(true);
    try {
      const res = await askCopilot({
        data: { question: q, cityId: cityId || undefined, history },
      });
      setMessages((m) => [
        ...m,
        { role: "assistant", content: res.data.text, source: res.ai.generated_by },
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "The Copilot is unavailable right now.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">AI Climate Copilot</h1>
        <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
          Grounded on the AirShield dataset and risk engine. The Copilot is instructed to refuse
          invented data — if something is not in the prototype, it says so.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <Panel bodyClassName="p-0" className="flex min-h-[560px] flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            {messages.length === 0 ? (
              <div className="rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground">
                <p className="flex items-center gap-2 font-medium text-foreground">
                  <Sparkles className="size-4 text-primary" /> Ask about any BRICS location
                </p>
                <p className="mt-2">
                  The Copilot receives a structured context block: per-country averages, the top
                  risk locations and — when selected — a focus city with its full factor breakdown.
                </p>
              </div>
            ) : null}

            {messages.map((m, i) => (
              <div
                key={i}
                className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-lg px-4 py-3 text-sm leading-relaxed",
                    m.role === "user"
                      ? "bg-primary/15 text-foreground"
                      : "border border-border bg-secondary/50",
                  )}
                >
                  <p className="whitespace-pre-line">{m.content}</p>
                  {m.role === "assistant" ? (
                    <p
                      className={cn(
                        "mt-2 text-[10px] uppercase tracking-wider",
                        m.source === "gemini" ? "text-primary" : "text-risk-medium",
                      )}
                    >
                      {m.source === "gemini"
                        ? "Google Gemini · AI assistance, prototype data"
                        : "Demo fallback — not AI generated"}
                    </p>
                  ) : null}
                </div>
              </div>
            ))}

            {loading ? (
              <div className="flex justify-start">
                <div className="w-56 space-y-2 rounded-lg border border-border bg-secondary/50 px-4 py-3">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-3 animate-pulse rounded bg-border" />
                  ))}
                </div>
              </div>
            ) : null}

            {error ? (
              <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {error}
              </p>
            ) : null}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
            className="flex items-center gap-2 border-t border-border p-4"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about a hotspot, a country, or how the system scales…"
              maxLength={1000}
              className="flex-1 rounded-md border border-border bg-background px-3 py-2.5 text-sm"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              <Send className="size-4" /> Ask
            </button>
          </form>
        </Panel>

        <div className="grid content-start gap-6">
          <Panel title="Focus location" description="Adds a detailed context block">
            <select
              value={cityId}
              onChange={(e) => setCityId(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            >
              <option value="">All BRICS (no focus)</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.city}, {c.country}
                </option>
              ))}
            </select>
          </Panel>

          <Panel title="Suggested questions">
            <ul className="grid gap-2">
              {SUGGESTIONS.map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    onClick={() => void send(s)}
                    disabled={loading}
                    className="w-full rounded-md border border-border px-3 py-2 text-left text-xs text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-50"
                  >
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
