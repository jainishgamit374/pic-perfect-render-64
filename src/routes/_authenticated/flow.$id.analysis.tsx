import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, CheckCircle2, Circle, Loader2, RefreshCw } from "lucide-react";
import {
  Alert,
  Badge,
  Button,
  Card,
  PageContainer,
  PageHeader,
  ProgressBar,
  Skeleton,
  StatCard,
} from "@/design-system/gentle-code-library-71de11";
import { AppLayout } from "@/components/AppLayout";
import { StepTracker } from "@/components/StepTracker";
import { supabase } from "@/integrations/supabase/client";
import { analyzeInspectionImage } from "@/lib/analysis.functions";
import { setStep, templateRooms } from "@/lib/flow";
import { useInspectionFlow } from "@/lib/useInspectionFlow";

export const Route = createFileRoute("/_authenticated/flow/$id/analysis")({
  head: () => ({
    meta: [
      { title: "AI analysis — Inspect" },
      { name: "description", content: "Step 3: AI reviews every inspection photo and drafts findings." },
      { property: "og:title", content: "AI analysis — Inspect" },
      { property: "og:description", content: "Watch AI analyse inspection photos one by one." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AnalysisStep,
});

const CONCURRENCY = 3;

function AnalysisStep() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const analyze = useServerFn(analyzeInspectionImage);
  const [running, setRunning] = useState(false);
  const [current, setCurrent] = useState<string | null>(null);
  const { inspection, images, rows, urls, template } = useInspectionFlow(id, { poll: running });
  const started = useRef(false);

  const total = rows.length;
  const finished = rows.filter((r) => r.analysis_state === "done").length;
  const failed = rows.filter((r) => r.analysis_state === "error").length;
  const pending = rows.filter((r) => r.analysis_state === "pending" || r.analysis_state === "analyzing").length;
  const pct = total ? ((finished + failed) / total) * 100 : 0;
  const complete = total > 0 && pending === 0 && !running;

  async function run(retryFailed = false) {
    if (started.current && !retryFailed) return;
    started.current = true;
    const targets = rows.filter((r) => r.analysis_state === "pending" || (retryFailed && r.analysis_state === "error"));
    if (!targets.length) return;
    setRunning(true);
    await supabase.from("inspections").update({ status: "processing" }).eq("id", id);
    const rooms = templateRooms(template);
    let cursor = 0;
    const worker = async (): Promise<void> => {
      const t = targets[cursor++];
      if (!t) return;
      setCurrent(t.filename);
      try { await analyze({ data: { imageId: t.id, rooms } }); } catch { /* persisted per image */ }
      void queryClient.invalidateQueries({ queryKey: ["inspection-images", id] });
      await worker();
    };
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, targets.length) }, worker));
    await supabase.from("inspections").update({ status: "review" }).eq("id", id);
    await setStep(id, 4);
    await queryClient.invalidateQueries({ queryKey: ["inspection", id] });
    await queryClient.invalidateQueries({ queryKey: ["inspection-images", id] });
    setCurrent(null);
    setRunning(false);
  }

  useEffect(() => {
    if (images.isSuccess && inspection.isSuccess && rows.length && !started.current) void run();
  }, [images.isSuccess, inspection.isSuccess, rows.length]); // eslint-disable-line react-hooks/exhaustive-deps

  if (inspection.isLoading || images.isLoading) return <AppLayout><PageContainer><Skeleton shape="block" /></PageContainer></AppLayout>;

  const currentRow = rows.find((r) => r.filename === current);
  const stages = [
    { label: "Images uploaded", done: total > 0 },
    { label: "Analysing each photo for defects", done: pending === 0 && total > 0, active: running },
    { label: "Matching thermal and visual pairs", done: complete },
    { label: "Preparing findings for review", done: complete },
  ];

  return (
    <AppLayout>
      <PageContainer>
        <PageHeader title={complete ? "Analysis finished" : "AI is analysing your inspection"} description="You can leave this page — progress is saved per photo." />
        <StepTracker active={3} reached={inspection.data?.current_step ?? 3} id={id} />

        <Card className="app-stack">
          <ProgressBar label="Analysis progress" value={pct} detail={`${finished + failed} of ${total} photos`} tone={complete ? "success" : "brand"} />
          {currentRow && (
            <div className="app-row">
              {urls[currentRow.storage_path] && <img className="app-thumb" src={urls[currentRow.storage_path]} alt="" />}
              <span className="app-stack-sm">
                <strong>{currentRow.filename}</strong>
                <span className="app-row ds-body-sm"><Loader2 className="app-spin" aria-hidden /> Analysing…</span>
              </span>
              <Badge tone={currentRow.kind === "thermal" ? "danger-orange" : "brand"}>{currentRow.kind === "thermal" ? "Thermal IR" : "Visual HD"}</Badge>
            </div>
          )}
          <ul className="app-checklist">
            {stages.map((s) => (
              <li key={s.label} className={s.done ? "is-done" : s.active ? "is-active" : ""}>
                {s.done ? <CheckCircle2 aria-hidden /> : s.active ? <Loader2 className="app-spin" aria-hidden /> : <Circle aria-hidden />}
                <span>{s.label}</span>
              </li>
            ))}
          </ul>
        </Card>

        {failed > 0 && !running && (
          <Alert tone="warning" title={`${failed} photo${failed === 1 ? "" : "s"} could not be analysed`}>
            <span className="app-stack-sm">
              <span>Every photo needs a finding before review. Try again, or go back to photos and remove the ones that keep failing.</span>
              <span><Button size="sm" variant="secondary" leadingIcon={<RefreshCw />} onClick={() => void run(true)}>Try again</Button></span>
            </span>
          </Alert>
        )}

        <div className="app-grid-stats">
          <StatCard label="Total photos" value={total} />
          <StatCard label="Analysed" value={finished} />
          <StatCard label="Remaining" value={pending} />
        </div>

        <div className="app-row app-row--between app-footer">
          <Button variant="ghost" onClick={() => navigate({ to: "/flow/$id/upload", params: { id } })}>Back to photos</Button>
          <Button trailingIcon={<ArrowRight />} disabled={!complete || failed > 0} onClick={() => navigate({ to: "/flow/$id/review", params: { id } })}>
            Review findings
          </Button>
        </div>
      </PageContainer>
    </AppLayout>
  );
}
