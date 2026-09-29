import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronLeft, ChevronRight, Maximize2, Minimize2, ZoomIn, ZoomOut } from "lucide-react";
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
  const [active, setActive] = useState<StyleId>("editorial");
  const [canvasPage, setCanvasPage] = useState(0);
  const [zoom, setZoom] = useState(0.7);
  const [full, setFull] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const s = (inspection.data as { report_style?: string } | undefined)?.report_style;
    if (s && styleMeta(s) && (inspection.data?.current_step ?? 0) >= 6) { setSelected(s as StyleId); setActive(s as StyleId); }
  }, [inspection.data]);

  const data = useMemo(() => buildReportData(inspection.data, groupPairs(rows), urls), [inspection.data, rows, urls]);
  const activePages = useMemo(() => renderReportPages(active, data), [active, data]);
  const previewPages = useMemo(() => (preview ? renderReportPages(preview, data) : []), [preview, data]);

  function choose(s: StyleId) { setSelected(s); setActive(s); setCanvasPage(0); }
  function onGridKey(e: KeyboardEvent) {
    const idx = REPORT_STYLES.findIndex((s) => s.id === selected);
    const d = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const next = REPORT_STYLES[(Math.max(idx, 0) + d + REPORT_STYLES.length) % REPORT_STYLES.length]!;
    choose(next.id);
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
  const am = styleMeta(active);

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

        <div className="app-studio">
          <nav className="app-studio-rail" aria-label="Report designs">
            <span className="ds-caption">{REPORT_STYLES.length} DESIGNS</span>
            <div role="radiogroup" aria-label="Report designs" className="app-stack-sm" onKeyDown={onGridKey}>
              {REPORT_STYLES.map((s) => {
                const on = selected === s.id;
                return (
                  <div
                    key={s.id}
                    id={`design-${s.id}`}
                    role="radio"
                    aria-checked={on}
                    data-active={active === s.id}
                    tabIndex={on || (!selected && s.id === "editorial") ? 0 : -1}
                    className="app-studio-item"
                    onClick={() => choose(s.id)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); choose(s.id); } }}
                  >
                    <div className="app-design-thumb"><ScaledPage scale={0.1}>{renderReportPages(s.id, data)[0]}</ScaledPage></div>
                    <div className="app-stack-sm">
                      <strong className="ds-body-sm">{s.letter}. {s.name}</strong>
                      <span className="ds-caption">{s.tags.slice(0, 2).join(" · ")}</span>
                      {on && <span className="app-design-check"><CheckCircle2 aria-hidden /> Selected</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </nav>

          <section className="app-studio-canvas" aria-label="Live preview">
            <div className="app-row app-row--between">
              <span className="app-row">
                <IconButton label="Previous page" variant="ghost" icon={<ChevronLeft />} disabled={canvasPage === 0} onClick={() => setCanvasPage((p) => p - 1)} />
                <span className="ds-body-sm">Page {canvasPage + 1} of {activePages.length}</span>
                <IconButton label="Next page" variant="ghost" icon={<ChevronRight />} disabled={canvasPage >= activePages.length - 1} onClick={() => setCanvasPage((p) => p + 1)} />
              </span>
              <Button size="sm" variant="ghost" leadingIcon={<Maximize2 />} onClick={() => { setPreview(active); setPage(canvasPage); }}>Full preview</Button>
            </div>
            <div key={`${active}-${canvasPage}`} className="app-studio-page">
              <ScaledPage scale={0.62}>{activePages[canvasPage]}</ScaledPage>
            </div>
          </section>

          <aside className="app-studio-meta">
            {am && (
              <div className="app-stack">
                <div className="app-stack-sm">
                  <span className="app-design-letter" aria-hidden>{am.letter}</span>
                  <h2 className="ds-h2">{am.name}</h2>
                  <p className="ds-body-sm">{am.description}</p>
                </div>
                <span className="app-row">{am.tags.map((t) => <Badge key={t} tone="neutral">{t}</Badge>)}</span>
                <dl className="app-studio-dl">
                  <dt className="ds-caption">Pages</dt><dd className="ds-body-sm">{activePages.length}</dd>
                  <dt className="ds-caption">Format</dt><dd className="ds-body-sm">A4 portrait</dd>
                  <dt className="ds-caption">Findings</dt><dd className="ds-body-sm">{data.findings.length}</dd>
                </dl>
                {selected === active ? (
                  <span className="app-design-check"><CheckCircle2 aria-hidden /> This design is selected</span>
                ) : (
                  <Button leadingIcon={<CheckCircle2 />} onClick={() => choose(active)}>Use this design</Button>
                )}
              </div>
            )}
          </aside>
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
