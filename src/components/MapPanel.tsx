import { Suspense, lazy, useEffect, useState } from "react";

import type { ScoredCity } from "@/lib/airshield";

const PollutionMap = lazy(() => import("./PollutionMap"));

export function MapPanel(props: {
  cities: ScoredCity[];
  height?: number;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const height = props.height ?? 460;

  if (!mounted) {
    return (
      <div
        style={{ height }}
        className="flex w-full items-center justify-center rounded-md border border-border bg-secondary/40 text-xs text-muted-foreground"
      >
        Loading map…
      </div>
    );
  }
  return (
    <Suspense
      fallback={
        <div
          style={{ height }}
          className="flex w-full items-center justify-center rounded-md border border-border bg-secondary/40 text-xs text-muted-foreground"
        >
          Loading map…
        </div>
      }
    >
      <PollutionMap {...props} height={height} />
    </Suspense>
  );
}
