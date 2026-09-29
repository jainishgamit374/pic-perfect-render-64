import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Inspection = Database["public"]["Tables"]["inspections"]["Row"];
export type InspectionImage = Database["public"]["Tables"]["inspection_images"]["Row"];

export async function listInspections(): Promise<Inspection[]> {
  const { data, error } = await supabase
    .from("inspections")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getInspection(id: string): Promise<Inspection | null> {
  const { data, error } = await supabase.from("inspections").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function listImages(inspectionId: string): Promise<InspectionImage[]> {
  const { data, error } = await supabase
    .from("inspection_images")
    .select("*")
    .eq("inspection_id", inspectionId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function signedUrls(paths: string[]): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  const { data, error } = await supabase.storage
    .from("inspection-images")
    .createSignedUrls(paths, 3600);
  if (error) throw new Error(error.message);
  const map: Record<string, string> = {};
  for (const entry of data ?? []) {
    if (entry.path && entry.signedUrl) map[entry.path] = entry.signedUrl;
  }
  return map;
}
