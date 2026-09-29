import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SEVERITIES = ["normal", "minor", "moderate", "defective", "critical"] as const;

const PROMPT = `You are a certified property inspector reviewing a single inspection photograph.
Return ONLY a JSON object, no markdown fences, with exactly these keys:
{
  "section": short building section such as "Roof", "Exterior", "Kitchen", "Bathroom", "Electrical", "Plumbing", "HVAC", "Structure", "Interior",
  "location_label": short phrase describing where in the property the photo was taken,
  "severity": one of "normal", "minor", "moderate", "defective", "critical",
  "summary": one or two sentences describing the observed condition,
  "recommendation": one sentence with the recommended action,
  "confidence": a number between 0 and 1
}
Keep the summary under 320 characters. If the photo shows no defect, use severity "normal".`;

async function callGateway(imageUrl: string): Promise<string> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI is not configured for this project.");

  const response = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: "openai/gpt-6-astra",
      stream: true,
      store: false,
      reasoning: { effort: "low" },
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: PROMPT },
            { type: "input_image", image_url: imageUrl },
          ],
        },
      ],
    }),
  });

  if (!response.ok || !response.body) {
    const detail = await response.text().catch(() => "");
    if (response.status === 429) throw new Error("Too many analysis requests right now. Try again shortly.");
    if (response.status === 402) throw new Error("AI credits are exhausted for this workspace.");
    throw new Error(`Analysis failed (${response.status}). ${detail.slice(0, 200)}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const event = JSON.parse(payload) as { type?: string; delta?: string };
        if (event.type === "response.output_text.delta" && typeof event.delta === "string") {
          text += event.delta;
        }
      } catch {
        /* ignore partial frames */
      }
    }
  }

  return text;
}

function parseResult(raw: string) {
  const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("The model returned an unreadable result.");
  const parsed = JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
  const severity = String(parsed["severity"] ?? "normal").toLowerCase();
  return {
    section: typeof parsed["section"] === "string" ? parsed["section"] : "General",
    location_label: typeof parsed["location_label"] === "string" ? parsed["location_label"] : null,
    severity: (SEVERITIES as readonly string[]).includes(severity) ? severity : "normal",
    summary: typeof parsed["summary"] === "string" ? parsed["summary"] : "No description returned.",
    recommendation: typeof parsed["recommendation"] === "string" ? parsed["recommendation"] : null,
    confidence: typeof parsed["confidence"] === "number" ? Math.max(0, Math.min(1, parsed["confidence"])) : null,
  };
}

/** Analyses exactly one image. The client drives a bounded queue over these calls. */
export const analyzeInspectionImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ imageId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: image, error } = await supabase
      .from("inspection_images")
      .select("id, storage_path, inspection_id, analysis_state")
      .eq("id", data.imageId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!image) throw new Error("Image not found.");

    await supabase
      .from("inspection_images")
      .update({ analysis_state: "analyzing", error: null })
      .eq("id", image.id);

    try {
      const signed = await supabase.storage
        .from("inspection-images")
        .createSignedUrl(image.storage_path, 600);
      if (signed.error || !signed.data) throw new Error("Could not read the uploaded photo.");

      const result = parseResult(await callGateway(signed.data.signedUrl));

      const { error: updateError } = await supabase
        .from("inspection_images")
        .update({
          analysis_state: "done",
          analyzed_at: new Date().toISOString(),
          section: result.section,
          location_label: result.location_label,
          severity: result.severity as never,
          summary: result.summary,
          recommendation: result.recommendation,
          confidence: result.confidence,
          error: null,
        })
        .eq("id", image.id)
        .eq("user_id", userId);
      if (updateError) throw new Error(updateError.message);

      return { ok: true as const, imageId: image.id };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Analysis failed.";
      await supabase
        .from("inspection_images")
        .update({ analysis_state: "error", error: message })
        .eq("id", image.id);
      return { ok: false as const, imageId: image.id, error: message };
    }
  });
