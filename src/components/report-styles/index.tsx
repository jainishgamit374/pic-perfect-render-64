import type { ReactNode } from "react";
import { EditorialPages } from "./Editorial";
import { StudioPages } from "./Studio";
import { LuxuryPages } from "./Luxury";
import { DataSystemPages } from "./DataSystem";

export type Sev = "normal" | "minor" | "moderate" | "defective" | "critical";
export const SEVS: Sev[] = ["critical", "defective", "moderate", "minor", "normal"];

export type ReportFinding = {
  key: string;
  room: string;
  area: string;
  severity: Sev;
  thermalUrl?: string;
  visualUrl?: string;
  thermalName?: string;
  visualName?: string;
  thermalObs?: string;
  visualObs?: string;
  recommendation?: string;
};

export type ReportData = {
  title: string;
  coverTitle: string;
  coverSubtitle: string;
  company: string;
  footer: string;
  logoUrl?: string;
  brandPrimary?: string;
  brandSecondary?: string;
  address: string;
  client: string;
  inspector: string;
  date: string;
  propertyType: string;
  details: [string, string][];
  notes?: string;
  findings: ReportFinding[];
  counts: Record<Sev, number>;
  coverUrl?: string;
};

export type StyleId = "editorial" | "studio" | "luxury" | "data";

export const REPORT_STYLES: { id: StyleId; name: string; letter: string; description: string; tags: string[] }[] = [
  { id: "editorial", letter: "A", name: "Editorial", description: "Swiss-style grid, large type, black and white with a single red accent.", tags: ["Minimal", "Typographic", "Asymmetric"] },
  { id: "studio", letter: "B", name: "Bold Studio", description: "Neo-brutalist blocks, thick borders and huge numbered findings.", tags: ["Bold", "High contrast", "Expressive"] },
  { id: "luxury", letter: "C", name: "Luxury Architectural", description: "Magazine-style serif layout with warm neutrals and full-bleed photography.", tags: ["Elegant", "Serif", "Photo-led"] },
  { id: "data", letter: "D", name: "Data System", description: "Technical dark cover, severity charts and dense finding tables.", tags: ["Technical", "Data-dense", "Monospace"] },
];

export function styleMeta(id: string | null | undefined) {
  return REPORT_STYLES.find((s) => s.id === id) ?? null;
}

export function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out.length ? out : [[]];
}

/** Every style returns an array of A4 pages (794 x 1123 px). */
export function renderReportPages(style: StyleId, data: ReportData): ReactNode[] {
  switch (style) {
    case "studio": return StudioPages(data);
    case "luxury": return LuxuryPages(data);
    case "data": return DataSystemPages(data);
    default: return EditorialPages(data);
  }
}

export const PAGE_W = 794;
export const PAGE_H = 1123;

/** Renders one page scaled to fit a given width. */
export function ScaledPage({ scale, children }: { scale: number; children: ReactNode }) {
  return (
    <div className="rs-scaled" style={{ width: PAGE_W * scale, height: PAGE_H * scale }}>
      <div className="rs-scaled__inner" style={{ transform: `scale(${scale})` }}>{children}</div>
    </div>
  );
}

type Img = {
  id: string; filename: string; kind: string; storage_path: string; severity: string | null;
  room: string | null; area: string | null; section: string | null; location_label: string | null;
  thermal_observation: string | null; visual_observation: string | null; summary: string | null; recommendation: string | null;
};
type Pair = { key: string; items: Img[]; thermal?: Img; visual?: Img };
type Insp = Record<string, unknown> | null | undefined;

export function buildReportData(i: Insp, pairs: Pair[], urls: Record<string, string>, logoUrl?: string): ReportData {
  const s = (k: string) => (i?.[k] as string | null | undefined) ?? "";
  const findings: ReportFinding[] = pairs.map((p) => {
    const f = p.items[0]!;
    return {
      key: p.key,
      room: f.room || f.section || "General",
      area: f.area || f.location_label || p.key,
      severity: ((f.severity ?? "normal") as Sev),
      thermalUrl: p.thermal ? urls[p.thermal.storage_path] : undefined,
      visualUrl: p.visual ? urls[p.visual.storage_path] : (!p.thermal ? urls[f.storage_path] : undefined),
      thermalName: p.thermal?.filename,
      visualName: p.visual?.filename ?? (!p.thermal ? f.filename : undefined),
      thermalObs: f.thermal_observation || p.thermal?.summary || undefined,
      visualObs: f.visual_observation || p.visual?.summary || (!p.thermal ? f.summary : null) || undefined,
      recommendation: f.recommendation || undefined,
    };
  });
  const counts = { normal: 0, minor: 0, moderate: 0, defective: 0, critical: 0 } as Record<Sev, number>;
  findings.forEach((f) => counts[f.severity]++);
  const address = [s("property_address"), s("city"), s("state"), s("pin_code")].filter(Boolean).join(", ");
  const date = [s("inspection_date"), s("inspection_time")].filter(Boolean).join(" ");
  const details = ([
    ["Client", s("client_name")], ["Phone", s("client_phone")], ["Email", s("client_email")],
    ["Address", address], ["Property type", s("property_type")], ["Inspector", s("inspector_name")],
    ["Date", date], ["Age of home", s("home_age")], ["Size", s("property_size")], ["Weather", s("weather")],
  ] as [string, string][]).filter(([, v]) => v);
  const cover = findings.find((f) => f.visualUrl)?.visualUrl ?? findings.find((f) => f.thermalUrl)?.thermalUrl;
  return {
    title: s("title") || "Property inspection",
    coverTitle: s("report_cover_title") || "Property inspection report",
    coverSubtitle: s("report_cover_subtitle") || "Property condition assessment",
    company: s("report_company"),
    footer: s("report_footer"),
    logoUrl,
    brandPrimary: s("report_brand_primary") || undefined,
    brandSecondary: s("report_brand_secondary") || undefined,
    address: s("property_address") || s("title") || "Property",
    client: s("client_name"), inspector: s("inspector_name"), date, propertyType: s("property_type"),
    details, notes: s("notes") || undefined, findings, counts, coverUrl: cover,
  };
}

export const SEV_LABEL: Record<Sev, string> = { normal: "Normal", minor: "Minor", moderate: "Moderate", defective: "Defective", critical: "Critical" };
