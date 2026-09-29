import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronLeft, ChevronRight, Eye, Maximize2, Minimize2, ZoomIn, ZoomOut } from "lucide-react";
import {
  Alert, Badge, Button, IconButton, Modal, PageContainer, PageHeader, Skeleton,
} from "@/design-system/gentle-code-library-71de11";
import { AppLayout } from "@/components/AppLayout";
import { StepTracker } from "@/components/StepTracker";
import { groupPairs, setStep } from "@/lib/flow";
import { useInspectionFlow } from "@/lib/useInspectionFlow";
import { supabase } from "@/integrations/supabase/client";
import {
  REPORT_STYLES, ScaledPage, buildReportData, renderReportPages, styleMeta, type StyleId,
} from "@/components/report-styles";

export const Route = createFileRoute("/_authenticated/flow/$id/design")({
  head: () => ({
    meta: [
      { title: "Choose report design — Inspect" },
      { name: "description", content: "Step 5: pick one of four distinct report designs and preview it with your own findings." },
      { property: "og:title", content: "Choose a report design — Inspect" },
      { property: "og:description", content: "Preview Editorial, Bold Studio, Luxury and Data System report designs." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DesignStep,
});

function DesignStep() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { inspection, images, rows, urls } = useInspectionFlow(id);
  const [selected, setSelected] = useState<StyleId | null>(null);
  const [preview, setPreview] = useState<StyleId | null>(null);
  const [page, setPage] = useState(0);
  const [zoom, setZoom] = useState(0.7);
  const [full, setFull] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const s = (inspection.data as { report_style?: string } | undefined)?.report_style;
    if (s && styleMeta(s) && (inspection.data?.current_step ?? 0) >= 6) setSelected(s as StyleId);
  }, [inspection.data]);

  const data = useMemo(() => buildReportData(inspection.data, groupPairs(rows), urls), [inspection.data, rows, urls]);
  const previewPages = useMemo(() => (preview ? renderReportPages(preview, data) : []), [preview, data]);

  function openPreview(s: StyleId) { setPreview(s); setPage(0); }
  function onGridKey(e: KeyboardEvent) {
    const idx = REPORT_STYLES.findIndex((s) => s.id === selected);
    const d = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const next = REPORT_STYLES[(Math.max(idx, 0) + d + REPORT_STYLES.length) % REPORT_STYLES.length]!;
    setSelected(next.id);
    document.getElementById(`design-${next.id}`)?.focus();
  }

  async function continueNext() {
    if (!selected) return;
    setSaving(true);
    setError(null);
    const { error } = await supabase.from("inspections").update({ report_style: selected }).eq("id", id);
    if (error) { setError(error.message); setSaving(false); return; }
    await setStep(id, 6);
    await queryClient.invalidateQueries({ queryKey: ["inspection", id] });
    navigate({ to: "/flow/$id/report", params: { id } });
  }

  if (inspection.isLoading || images.isLoading) return <AppLayout><PageContainer><Skeleton shape="block" /></PageContainer></AppLayout>;
  const sel = styleMeta(selected);
  const pm = styleMeta(preview);

  return (
    <AppLayout>
      <PageContainer>
        <PageHeader
          title="Choose a report identity"
          description={`Pick the design that fits ${inspection.data?.client_name ? `${inspection.data.client_name}'s` : "this"} report. Every preview uses your real photos and findings.`}
          actions={<Button variant="secondary" leadingIcon={<ArrowLeft />} onClick={() => navigate({ to: "/flow/$id/review", params: { id } })}>Back to review</Button>}
        />
        <StepTracker active={5} reached={inspection.data?.current_step ?? 5} id={id} />
        {error && <Alert tone="error" title="Could not save your choice">{error} Please try again.</Alert>}

        <div className="app-design-grid" role="radiogroup" aria-label="Report designs" onKeyDown={onGridKey}>
          {REPORT_STYLES.map((s) => {
            const on = selected === s.id;
            const cover = renderReportPages(s.id, data)[0];
            return (
              <div
                key={s.id}
                id={`design-${s.id}`}
                role="radio"
                aria-checked={on}
                tabIndex={on || (!selected && s.id === "editorial") ? 0 : -1}
                className="app-design-card"
                onClick={() => setSelected(s.id)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelected(s.id); } }}
              >
                <div className="app-design-thumb"><ScaledPage scale={0.28}>{cover}</ScaledPage></div>
                <div className="app-stack">
                  <div className="app-stack-sm">
                    <span className="app-design-letter" aria-hidden>{s.letter}</span>
                    <h2 className="ds-h3">{s.name}</h2>
                    <p className="ds-body-sm">{s.description}</p>
                  </div>
                  <span className="app-row">{s.tags.map((t) => <Badge key={t} tone="neutral">{t}</Badge>)}</span>
                  {on && <span className="app-design-check"><CheckCircle2 aria-hidden /> Selected</span>}
                  <span className="app-row">
                    <Button size="sm" variant="secondary" leadingIcon={<Eye />} onClick={(e) => { e.stopPropagation(); openPreview(s.id); }}>Preview</Button>
                    <Button size="sm" variant={on ? "primary" : "ghost"} onClick={(e) => { e.stopPropagation(); setSelected(s.id); }}>{on ? "Selected" : "Select"}</Button>
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="app-continue-bar">
          <span className="ds-body-sm">{sel ? <>Selected design: <strong>{sel.name}</strong></> : "Choose a design to continue."}</span>
          <Button trailingIcon={<ArrowRight />} disabled={!sel} loading={saving} onClick={() => void continueNext()}>
            {sel ? `Continue with ${sel.name}` : "Continue"}
          </Button>
        </div>
      </PageContainer>

      <Modal
        open={!!preview}
        onClose={() => setPreview(null)}
        size={full ? "full" : "lg"}
        title={pm ? `${pm.letter}. ${pm.name}` : ""}
        description={pm?.description}
        footer={
          <div className="app-row app-row--between app-fill">
            <span className="app-row">
              <IconButton label="Previous page" variant="ghost" icon={<ChevronLeft />} disabled={page === 0} onClick={() => setPage((p) => p - 1)} />
              <span className="ds-body-sm">Page {page + 1} of {previewPages.length}</span>
              <IconButton label="Next page" variant="ghost" icon={<ChevronRight />} disabled={page >= previewPages.length - 1} onClick={() => setPage((p) => p + 1)} />
              <IconButton label="Zoom out" variant="ghost" icon={<ZoomOut />} disabled={zoom <= 0.4} onClick={() => setZoom((z) => +(z - 0.1).toFixed(1))} />
              <span className="ds-body-sm">{Math.round(zoom * 100)}%</span>
              <IconButton label="Zoom in" variant="ghost" icon={<ZoomIn />} disabled={zoom >= 1.5} onClick={() => setZoom((z) => +(z + 0.1).toFixed(1))} />
              <IconButton label={full ? "Exit fullscreen" : "Fullscreen"} variant="ghost" icon={full ? <Minimize2 /> : <Maximize2 />} onClick={() => setFull((f) => !f)} />
            </span>
            <Button leadingIcon={<CheckCircle2 />} onClick={() => { if (preview) setSelected(preview); setPreview(null); }}>
              {selected === preview ? "Selected" : "Use this design"}
            </Button>
          </div>
        }
      >
        <div
          className="app-preview-stage"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") setPage((p) => Math.min(previewPages.length - 1, p + 1));
            if (e.key === "ArrowLeft") setPage((p) => Math.max(0, p - 1));
          }}
        >
          <ScaledPage scale={zoom}>{previewPages[page]}</ScaledPage>
        </div>
      </Modal>
    </AppLayout>
  );
}
