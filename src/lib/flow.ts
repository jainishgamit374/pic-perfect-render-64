import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { InspectionImage } from "@/lib/inspections";

export type TemplateRow = Database["public"]["Tables"]["templates"]["Row"];
export interface TemplateSection {
  name: string;
  rooms: string[];
}

export function templateSections(t: TemplateRow | null | undefined): TemplateSection[] {
  if (!t || !Array.isArray(t.sections)) return [];
  return (t.sections as unknown as TemplateSection[]).map((s) => ({
    name: String(s?.name ?? "Section"),
    rooms: Array.isArray(s?.rooms) ? s.rooms.map(String) : [],
  }));
}

export function templateRooms(t: TemplateRow | null | undefined): string[] {
  return templateSections(t).flatMap((s) => s.rooms);
}

export async function listTemplates(): Promise<TemplateRow[]> {
  const { data, error } = await supabase
    .from("templates")
    .select("*")
    .order("user_id", { ascending: true, nullsFirst: true })
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getTemplate(id: string | null | undefined): Promise<TemplateRow | null> {
  if (!id) return null;
  const { data, error } = await supabase.from("templates").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

/** "RB20492X.JPG" -> { key: "RB20492", kind: "thermal" }. X = thermal, Y = visual. */
export function parseFilename(name: string): { key: string; kind: "thermal" | "visual" } {
  const base = name.replace(/\.[^.]+$/, "");
  const m = base.match(/^(.*?)([XxYy])$/);
  if (m && m[1]) return { key: m[1].toUpperCase(), kind: /x/i.test(m[2]!) ? "thermal" : "visual" };
  const thermal = /thermal|ir[_-]|flir/i.test(base);
  return { key: base.toUpperCase(), kind: thermal ? "thermal" : "visual" };
}

export interface PhotoPair {
  key: string;
  thermal?: InspectionImage;
  visual?: InspectionImage;
  items: InspectionImage[];
}

export function groupPairs(images: InspectionImage[]): PhotoPair[] {
  const map = new Map<string, PhotoPair>();
  for (const img of images) {
    const key = img.pair_key ?? img.id;
    const pair = map.get(key) ?? { key, items: [] };
    pair.items.push(img);
    if (img.kind === "thermal" && !pair.thermal) pair.thermal = img;
    else if (!pair.visual) pair.visual = img;
    else if (!pair.thermal) pair.thermal = img;
    map.set(key, pair);
  }
  return [...map.values()];
}

export const STEP_PATHS = [
  "/inspections/new",
  "/flow/$id/upload",
  "/flow/$id/analysis",
  "/flow/$id/review",
  "/flow/$id/report",
] as const;

export async function setStep(id: string, step: number) {
  const { data } = await supabase.from("inspections").select("current_step").eq("id", id).maybeSingle();
  if (!data || data.current_step < step) {
    await supabase.from("inspections").update({ current_step: step }).eq("id", id);
  }
}
