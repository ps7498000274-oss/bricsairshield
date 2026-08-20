import { Link } from "@tanstack/react-router";
import { Menu, ShieldCheck, X } from "lucide-react";
import { useState, type ReactNode } from "react";

const NAV = [
  { to: "/", label: "Overview" },
  { to: "/live", label: "Live Intelligence" },
  { to: "/analyze", label: "Photo Analyzer" },
  { to: "/report", label: "Report" },
  { to: "/incidents", label: "Incidents" },
  { to: "/copilot", label: "AI Copilot" },
  { to: "/countries", label: "Countries" },
  { to: "/methodology", label: "Methodology" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-[500] border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-6 px-4 sm:px-6">
          <Link to="/" className="flex shrink-0 items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-md bg-primary/15 text-primary">
              <ShieldCheck className="size-5" />
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-semibold tracking-tight">BRICS AirShield</span>
              <span className="block text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Detect · Predict · Explain
              </span>
            </span>
          </Link>

          <nav className="ml-auto hidden items-center gap-1 lg:flex">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/" }}
                className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                activeProps={{ className: "bg-secondary text-foreground" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <span className="ml-auto hidden shrink-0 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-primary lg:ml-0 lg:inline">
            Prototype · Live data
          </span>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle navigation"
            className="ml-auto rounded-md border border-border p-2 lg:hidden"
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>

        {open ? (
          <nav className="grid gap-1 border-t border-border px-4 py-3 lg:hidden">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
                activeProps={{ className: "bg-secondary text-foreground" }}
                activeOptions={{ exact: item.to === "/" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        ) : null}
      </header>

      <main className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-6">{children}</main>

      <footer className="mt-12 border-t border-border">
        <div className="mx-auto max-w-[1400px] px-4 py-8 text-xs leading-relaxed text-muted-foreground sm:px-6">
          <p className="max-w-3xl">
            BRICS AirShield is a hackathon prototype. Environmental values in this build are
            <strong className="text-foreground"> live Open-Meteo / CAMS model data</strong> with realistic
            magnitudes — they are not live government sensor readings. Risk scores are prototype
            estimates from a transparent weighted model, not official AQI forecasts. Image analysis
            is AI-assisted (Google Gemini) and is not an official environmental diagnosis.
          </p>
          <p className="mt-3">
            Built for “Build with AI: Code for Communities — Second Edition”. ·{" "}
            <Link to="/methodology" className="text-primary hover:underline">
              Methodology &amp; limitations
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
