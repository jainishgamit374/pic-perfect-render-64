import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState, type CSSProperties, type ChangeEvent } from "react";
import { ChevronLeft, ChevronRight, Download, Palette, Pencil, RotateCcw, Save, Upload } from "lucide-react";
import { Alert, Button, Field, IconButton, Input, PageContainer, Skeleton, Tabs, Textarea } from "@/design-system/gentle-code-library-71de11";
import { AppLayout } from "@/components/AppLayout";
import { StepTracker } from "@/components/StepTracker";
import { groupPairs } from "@/lib/flow";
import { useInspectionFlow } from "@/lib/useInspectionFlow";
import { supabase } from "@/integrations/supabase/client";
import { ScaledPage, buildReportData, renderReportPages, styleMeta, type StyleId } from "@/components/report-styles";

export const Route = createFileRoute("/_authenticated/flow/$id/report")({
  head: () => ({ meta: [
    { title: "Report editor — Inspect" },
    { name: "description", content: "Customize the inspection report cover, details and branding before exporting a PDF." },
    { property: "og:title", content: "Report editor — Inspect" },
    { property: "og:description", content: "Review and customize your property inspection report." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: ReportStep,
});

type ReportEdits = {
  report_cover_title: string; report_cover_subtitle: string; report_company: string;
  report_footer: string; report_brand_primary: string; report_brand_secondary: string;
  client_name: string; inspector_name: string; property_address: string;
  inspection_date: string; property_type: string;
};
const EMPTY: ReportEdits = {
  report_cover_title: "Property inspection report", report_cover_subtitle: "", report_company: "", report_footer: "",
  report_brand_primary: "blue", report_brand_secondary: "blue", client_name: "",
  inspector_name: "", property_address: "", inspection_date: "", property_type: "",
};
const BRAND_OPTIONS = [
  { key: "blue", label: "Blue" },
  { key: "navy", label: "Navy" },
  { key: "warm", label: "Warm" },
] as const;
const BRAND_TOKENS: Record<string, string> = {
  blue: "var(--ds-brand-500)", navy: "var(--ds-brand-900)", warm: "var(--ds-color-caution)",
};
function fromInspection(value: Record<string, unknown> | null | undefined): ReportEdits {
  const get = (key: keyof ReportEdits) => typeof value?.[key] === "string" ? value[key] as string : "";
  return {
    report_cover_title: get("report_cover_title") || "Property inspection report", report_cover_subtitle: get("report_cover_subtitle"),
    report_company: get("report_company"), report_footer: get("report_footer"),
    report_brand_primary: get("report_brand_primary") || "blue", report_brand_secondary: get("report_brand_secondary") || "blue",
    client_name: get("client_name"), inspector_name: get("inspector_name"),
    property_address: get("property_address"), inspection_date: get("inspection_date"), property_type: get("property_type"),
  };
}

function ReportStep() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { inspection, images, rows, urls } = useInspectionFlow(id);
  const [draft, setDraft] = useState<ReportEdits>(EMPTY);
  const [saved, setSaved] = useState<ReportEdits>(EMPTY);
  const [logoPath, setLogoPath] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [tab, setTab] = useState("cover");
  const [page, setPage] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!inspection.data) return;
    const next = fromInspection(inspection.data);
    setDraft(next); setSaved(next);
    setLogoPath(inspection.data.report_logo_path || "");
  }, [inspection.data]);

  useEffect(() => {
    if (!logoPath) { setLogoUrl(""); return; }
    let current = true;
    void supabase.storage.from("inspection-images").createSignedUrl(logoPath, 3600).then(({ data }) => {
      if (current) setLogoUrl(data?.signedUrl || "");
    });
    return () => { current = false; };
  }, [logoPath]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(saved) || logoPath !== (inspection.data?.report_logo_path || "");
  const style = (styleMeta(inspection.data?.report_style)?.id ?? "editorial") as StyleId;
  const data = useMemo(() => buildReportData({ ...inspection.data, ...draft }, groupPairs(rows), urls, logoUrl), [inspection.data, draft, rows, urls, logoUrl]);
  const pages = useMemo(() => renderReportPages(style, data), [style, data]);
  const reportColors = {
    "--report-accent": BRAND_TOKENS[draft.report_brand_primary] || BRAND_TOKENS.blue,
    "--report-accent-secondary": BRAND_TOKENS[draft.report_brand_secondary] || BRAND_TOKENS.blue,
  } as CSSProperties;

  function update(key: keyof ReportEdits, value: string) {
    setDraft((old) => ({ ...old, [key]: value }));
    setNotice("");
  }

  async function uploadLogo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setError("Choose a PNG, JPG or WebP logo under 5 MB."); return;
    }
    setSaving(true); setError("");
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { setError("Sign in again to upload your logo."); setSaving(false); return; }
    const path = `${auth.user.id}/${id}/branding/${crypto.randomUUID()}.${file.type.split("/")[1]}`;
    const { error: uploadError } = await supabase.storage.from("inspection-images").upload(path, file, { contentType: file.type });
    if (uploadError) setError(uploadError.message);
    else setLogoPath(path);
    setSaving(false);
    event.target.value = "";
  }

  async function save() {
    if (!draft.report_cover_title.trim()) { setTab("cover"); setError("Enter a cover title before saving."); return false; }
    setSaving(true); setError(""); setNotice("");
    const { error: saveError } = await supabase.from("inspections").update({ ...draft, report_logo_path: logoPath || null }).eq("id", id);
    setSaving(false);
    if (saveError) { setError(saveError.message); return false; }
    setSaved(draft); setNotice("All changes saved.");
    await queryClient.invalidateQueries({ queryKey: ["inspection", id] });
    return true;
  }

  async function exportPdf() {
    if (dirty && !(await save())) return;
    setPage(0);
    window.setTimeout(() => window.print(), 100);
  }

  if (inspection.isLoading || images.isLoading) return <AppLayout><PageContainer><Skeleton shape="block" /></PageContainer></AppLayout>;

  return <AppLayout>
    <PageContainer>
      <div className="no-print app-report-heading">
        <div><span className="ds-caption">REPORT / {inspection.data?.title || "INSPECTION"}</span><h1 className="ds-h1">Make the report yours.</h1><p className="ds-body">Refine the document, then export the final PDF.</p></div>
        <div className="app-row">
          <Button variant="ghost" leadingIcon={<Pencil />} onClick={() => navigate({ to: "/flow/$id/review", params: { id } })}>Edit findings</Button>
          <Button variant="secondary" leadingIcon={<Palette />} onClick={() => navigate({ to: "/flow/$id/design", params: { id } })}>Change design</Button>
          <Button leadingIcon={<Download />} onClick={() => void exportPdf()} disabled={saving}>Export PDF</Button>
        </div>
      </div>
      <div className="no-print"><StepTracker active={6} reached={6} id={id} /></div>
      <div className="no-print app-report-notices">
        {error && <Alert tone="error" title="Could not save the report">{error}</Alert>}
        {notice && <Alert tone="success" title={notice} />}
      </div>
      <div className="app-report-workspace no-print">
        <section className="app-report-editor" aria-label="Report settings">
          <div className="app-row app-row--between"><div><span className="ds-caption">DOCUMENT SETTINGS</span><h2 className="ds-h2">Report details</h2></div><span className="ds-caption" role="status">{saving ? "Saving…" : dirty ? "Unsaved changes" : "Saved"}</span></div>
          <Tabs items={[{ value: "cover", label: "Cover" }, { value: "details", label: "Details" }, { value: "brand", label: "Branding" }]} value={tab} onChange={setTab} />
          <div className="app-report-fields">
            {tab === "cover" && <>
              <Field label="Cover title" htmlFor="report-title" error={!draft.report_cover_title.trim() ? "Required before export" : undefined}><Input id="report-title" value={draft.report_cover_title} onChange={(e) => update("report_cover_title", e.target.value)} maxLength={100} invalid={!draft.report_cover_title.trim()} /></Field>
              <Field label="Subtitle" htmlFor="report-subtitle"><Input id="report-subtitle" value={draft.report_cover_subtitle} onChange={(e) => update("report_cover_subtitle", e.target.value)} maxLength={120} /></Field>
              <Field label="Footer note" htmlFor="report-footer"><Textarea id="report-footer" value={draft.report_footer} onChange={(e) => update("report_footer", e.target.value)} maxLength={180} rows={3} /></Field>
            </>}
            {tab === "details" && <>
              <Field label="Property address" htmlFor="report-address"><Input id="report-address" value={draft.property_address} onChange={(e) => update("property_address", e.target.value)} /></Field>
              <Field label="Inspection date" htmlFor="report-date"><Input id="report-date" type="date" value={draft.inspection_date} onChange={(e) => update("inspection_date", e.target.value)} /></Field>
              <Field label="Property type" htmlFor="report-type"><Input id="report-type" value={draft.property_type} onChange={(e) => update("property_type", e.target.value)} /></Field>
              <Field label="Client" htmlFor="report-client"><Input id="report-client" value={draft.client_name} onChange={(e) => update("client_name", e.target.value)} /></Field>
              <Field label="Inspector" htmlFor="report-inspector"><Input id="report-inspector" value={draft.inspector_name} onChange={(e) => update("inspector_name", e.target.value)} /></Field>
            </>}
            {tab === "brand" && <>
              <Field label="Company name" htmlFor="report-company"><Input id="report-company" value={draft.report_company} onChange={(e) => update("report_company", e.target.value)} maxLength={80} /></Field>
              <Field label="Company logo" htmlFor="report-logo" hint="PNG, JPG or WebP · 5 MB maximum">
                <label className="app-logo-upload" htmlFor="report-logo">{logoUrl ? <img src={logoUrl} alt="Current company logo" /> : <Upload aria-hidden />}<span>{logoUrl ? "Replace logo" : "Upload logo"}</span></label>
                <input id="report-logo" className="app-visually-hidden" type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => void uploadLogo(e)} />
              </Field>
              {logoPath && <Button variant="ghost" onClick={() => { setLogoPath(""); setLogoUrl(""); }}>Remove logo</Button>}
              {(["report_brand_primary", "report_brand_secondary"] as const).map((key) => <fieldset className="app-brand-choices" key={key}><legend className="ds-label">{key === "report_brand_primary" ? "Primary accent" : "Secondary accent"}</legend><div className="app-row">{BRAND_OPTIONS.map((option) => <label className="app-brand-choice" key={option.key}><input type="radio" name={key} value={option.key} checked={draft[key] === option.key} onChange={() => update(key, option.key)} /><span className={`app-brand-swatch app-brand-swatch--${option.key}`} />{option.label}</label>)}</div></fieldset>)}
            </>}
          </div>
          <div className="app-report-editor-actions"><Button variant="ghost" leadingIcon={<RotateCcw />} disabled={!dirty} onClick={() => { setDraft(saved); setLogoPath(inspection.data?.report_logo_path || ""); setError(""); }}>Reset changes</Button><Button variant="secondary" leadingIcon={<Save />} disabled={!dirty} loading={saving} onClick={() => void save()}>Save changes</Button></div>
        </section>
        <section className="app-report-preview" aria-label="Live report preview" style={reportColors}>
          <div className="app-row app-row--between"><div><span className="ds-caption">LIVE PREVIEW</span><h2 className="ds-h3">{styleMeta(style)?.name} <span className="ds-caption">· A4 portrait</span></h2></div><span className="app-row"><IconButton label="Previous page" icon={<ChevronLeft />} disabled={page === 0} onClick={() => setPage((p) => p - 1)} /><span className="ds-body-sm">{page + 1} / {pages.length}</span><IconButton label="Next page" icon={<ChevronRight />} disabled={page >= pages.length - 1} onClick={() => setPage((p) => p + 1)} /></span></div>
          <div className="app-report-preview-sheet"><ScaledPage scale={0.62}>{pages[page]}</ScaledPage></div>
        </section>
      </div>
      <div className="app-report-stack rs-print-stack app-print-only" style={reportColors}>{pages.map((item, index) => <ScaledPage key={index} scale={1}>{item}</ScaledPage>)}</div>
    </PageContainer>
  </AppLayout>;
}