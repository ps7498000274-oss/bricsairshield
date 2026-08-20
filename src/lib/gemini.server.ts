/**
 * Google Gemini access layer (server-only).
 *
 * Two free routes are supported, in priority order:
 *  1. GEMINI_API_KEY  -> Google AI Studio Gemini API directly (free tier).
 *  2. LOVABLE_API_KEY -> Lovable AI Gateway, which proxies Google Gemini.
 *
 * If neither key is present or the call fails, callers receive `ok: false`
 * and must render a clearly-labelled fallback. We never claim Gemini produced
 * something it did not.
 */

const GOOGLE_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL_GOOGLE = "gemini-3.6-flash";
const MODEL_GATEWAY = "google/gemini-3.7-flash";

export interface GeminiImage {
  mimeType: string;
  /** base64 payload without the data: prefix */
  data: string;
}

export type GeminiResult =
  | { ok: true; text: string; provider: "google-ai-studio" | "lovable-gemini-gateway" }
  | { ok: false; error: string; status?: number };

export async function callGemini(opts: {
  system: string;
  prompt: string;
  image?: GeminiImage | null | undefined;
  json?: boolean | undefined;
  history?: Array<{ role: "user" | "assistant"; content: string }> | undefined;
}): Promise<GeminiResult> {
  const googleKey = process.env["GEMINI_API_KEY"];
  if (googleKey) {
    const r = await callGoogle(googleKey, opts);
    if (r.ok) return r;
    // fall through to the gateway if the direct key failed (quota etc.)
  }
  const lovableKey = process.env["LOVABLE_API_KEY"];
  if (lovableKey) return callGateway(lovableKey, opts);
  return { ok: false, error: "No Gemini credentials configured (GEMINI_API_KEY missing)." };
}

async function callGoogle(
  key: string,
  opts: Parameters<typeof callGemini>[0],
): Promise<GeminiResult> {
  try {
    const parts: unknown[] = [];
    if (opts.image) {
      parts.push({ inline_data: { mime_type: opts.image.mimeType, data: opts.image.data } });
    }
    parts.push({ text: opts.prompt });

    const contents = [
      ...(opts.history ?? []).map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
      { role: "user", parts },
    ];

    const res = await fetch(`${GOOGLE_URL}/${MODEL_GOOGLE}:generateContent?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        systemInstruction: { parts: [{ text: opts.system }] },
        generationConfig: opts.json ? { responseMimeType: "application/json" } : {},
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`Gemini (AI Studio) failed [${res.status}]: ${body}`);
      return { ok: false, error: `Gemini API error ${res.status}`, status: res.status };
    }
    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
    if (!text.trim()) return { ok: false, error: "Empty Gemini response" };
    return { ok: true, text, provider: "google-ai-studio" };
  } catch (e) {
    console.error("Gemini (AI Studio) exception", e);
    return { ok: false, error: e instanceof Error ? e.message : "Unknown Gemini error" };
  }
}

async function callGateway(
  key: string,
  opts: Parameters<typeof callGemini>[0],
): Promise<GeminiResult> {
  try {
    const userContent: unknown = opts.image
      ? [
          { type: "text", text: opts.prompt },
          {
            type: "image_url",
            image_url: { url: `data:${opts.image.mimeType};base64,${opts.image.data}` },
          },
        ]
      : opts.prompt;

    const res = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: MODEL_GATEWAY,
        messages: [
          { role: "system", content: opts.system },
          ...(opts.history ?? []),
          { role: "user", content: userContent },
        ],
        ...(opts.json ? { response_format: { type: "json_object" } } : {}),
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`Gemini (gateway) failed [${res.status}]: ${body}`);
      return { ok: false, error: `Gemini gateway error ${res.status}`, status: res.status };
    }
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = data.choices?.[0]?.message?.content ?? "";
    if (!text.trim()) return { ok: false, error: "Empty Gemini response" };
    return { ok: true, text, provider: "lovable-gemini-gateway" };
  } catch (e) {
    console.error("Gemini (gateway) exception", e);
    return { ok: false, error: e instanceof Error ? e.message : "Unknown Gemini error" };
  }
}

/** Extracts the first JSON object from a model reply, tolerating code fences. */
export function parseJsonLoose<T>(text: string): T | null {
  const cleaned = text.replace(/```json/gi, "```").split("```").join("\n");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}
