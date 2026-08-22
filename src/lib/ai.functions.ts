import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { analyzeImageImpl, copilotImpl, explainRiskImpl, summarizeIncidentImpl } from "./ai.server";

const imageInput = z.object({
  mimeType: z.string().max(64),
  /** base64 payload, no data: prefix. ~5MB raw ≈ 6.8MB base64 */
  data: z.string().min(32).max(9_000_000),
  city: z.string().max(120).optional(),
  country: z.string().max(120).optional(),
  note: z.string().max(500).optional(),
});

export const analyzeImage = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => imageInput.parse(d))
  .handler(async ({ data }) => analyzeImageImpl(data));

export const explainRisk = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ cityId: z.string().max(80) }).parse(d))
  .handler(async ({ data }) => explainRiskImpl(data.cityId));

export const askCopilot = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        question: z.string().min(2).max(1000),
        cityId: z.string().max(80).optional(),
        history: z
          .array(
            z.object({
              role: z.enum(["user", "assistant"]),
              content: z.string().max(4000),
            }),
          )
          .max(10)
          .optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => copilotImpl(data));

export const summarizeIncident = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        incidentId: z.string().max(40),
        country: z.string().max(120),
        city: z.string().max(120),
        location: z.string().max(200),
        description: z.string().max(2000),
        observedAt: z.string().max(60),
        riskScore: z.number(),
        riskLevel: z.string().max(20),
        imageFindings: z.string().max(2000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => summarizeIncidentImpl(data));

export const explainForecast = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ corridorId: z.string().max(40) }).parse(d))
  .handler(async ({ data }) => {
    const { forecastBriefImpl } = await import("./ai.server");
    return forecastBriefImpl(data.corridorId);
  });
