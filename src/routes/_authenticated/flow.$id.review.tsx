import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ArrowRight, Flame, Image as ImageIcon, Layers } from "lucide-react";
import {
  Alert,
  Badge,
  Button,
  EmptyState,
  Field,
  Input,
  PageContainer,
  PageHeader,
  Select,
  Skeleton,
  StatCard,
  Tabs,
  Textarea,
} from "@/design-system/gentle-code-library-71de11";
import { AppLayout } from "@/components/AppLayout";
import { StepTracker } from "@/components/StepTracker";
import { PairCard } from "@/components/PairCard";
import { supabase } from "@/integrations/supabase/client";
import { groupPairs, setStep, templateRooms, type PhotoPair } from "@/lib/flow";
import { useInspectionFlow } from "@/lib/useInspectionFlow";

export const Route = createFileRoute("/_authenticated/flow/$id/review")({
  head: () => ({
    meta: [
      { title: "Review & edit — Inspect" },
      { name: "description", content: "Step 4: check and edit AI findings for each photo pair." },
      { property: "og:title", content: "Review & edit findings — Inspect" },
      { property: "og:description", content: "Edit rooms, severity and observations before the final report." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReviewStep,
});

const SEVERITY_OPTIONS = [
  { value: "normal", label: "Normal / acceptable" },
  { value: "minor", label: "Minor" },
  { value: "moderate", label: "Moderate" },
  { value: "defective", label: "Defective" },
  { value: "critical", label: "Critical" },
];

function ReviewStep() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { inspection, images, rows, urls, template } = useInspectionFlow(id);
  const [filter, setFilter] = useState("all");
  const [saved, setSaved] = useState<"idle" | "saving" | "saved">("idle");
  const pairs = useMemo(() => groupPairs(rows), [rows]);
  const rooms = templateRooms(template);
  const roomOptions = [{ value: "", label: "Unassigned" }, ...rooms.map((r) => ({ value: r, label: r }))];
  const visual = rows.filter((r) => r.kind !== "thermal").length;

  async function savePair(pair: PhotoPair, patch: Record<string, string | null>) {
    setSaved("saving");
    const ids = pair.items.map((i) => i.id);
    await supabase.from("inspection_images").update(patch as never).in("id", ids);
    await queryClient.invalidateQueries({ queryKey: ["inspection-images", id] });
    setSaved("saved");
  }

  const problems = useMemo(() => {
    const out: Record<string, string[]> = {};
    for (const p of pairs) {
      const f = p.items[0]!;
      const missing: string[] = [];
      if (!f.room) missing.push("room");
      const obs = f.visual_observation || f.thermal_observation || p.visual?.summary || p.thermal?.summary;
      if (!obs?.trim()) missing.push("observation");
      if (!f.recommendation?.trim()) missing.push("recommendation");
      if (missing.length) out[p.key] = missing;
    }
    return out;
  }, [pairs]);
  const incomplete = Object.keys(problems).length;
  const shown = pairs.filter((p) => filter === "all" || (filter === "issues" ? p.items.some((i) => i.severity && i.severity !== "normal") : filter === "incomplete" ? !!problems[p.key] : false));
  const [tried, setTried] = useState(false);

  async function next() {
    setTried(true);
    if (incomplete > 0 || pairs.length === 0) {
      setFilter("incomplete");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    await setStep(id, 5);
    await supabase.from("inspections").update({ status: "completed" }).eq("id", id);
    await queryClient.invalidateQueries({ queryKey: ["inspection", id] });
    navigate({ to: "/flow/$id/design", params: { id } });
  }

  if (inspection.isLoading || images.isLoading) return <AppLayout><PageContainer><Skeleton shape="block" /></PageContainer></AppLayout>;

  return (
    <AppLayout>
      <PageContainer>
        <PageHeader
          title="Review & edit findings"
          description="Changes save automatically when you leave a field."
          actions={<Badge tone={saved === "saving" ? "info" : "success"} dot>{saved === "saving" ? "Saving…" : saved === "saved" ? "All changes saved" : "Autosave on"}</Badge>}
        />
        <StepTracker active={4} reached={inspection.data?.current_step ?? 4} id={id} />
        {incomplete > 0 ? (
          <Alert tone={tried ? "error" : "warning"} title={`${incomplete} photo pair${incomplete === 1 ? "" : "s"} still need details`}>
            Each finding needs a room, an observation and a recommendation before you can create the report.
          </Alert>
        ) : pairs.length > 0 ? (
          <Alert tone="success" title="All findings are complete">You can create the final report.</Alert>
        ) : null}
        <div className="app-grid-stats">
          <StatCard label="Photo pairs" value={pairs.length} icon={<Layers />} />
          <StatCard label="Visual photos" value={visual} icon={<ImageIcon />} />
          <StatCard label="Thermal scans" value={rows.length - visual} icon={<Flame />} />
        </div>
        <div className="app-row app-row--between">
          <h2 className="ds-h2">Findings</h2>
          <Tabs value={filter} onChange={setFilter} items={[{ value: "all", label: "All" }, { value: "issues", label: "Issues only" }, { value: "incomplete", label: `Needs details ${incomplete}` }]} />
        </div>

        {shown.length === 0 ? (
          <EmptyState icon={<Layers />} title="Nothing to review" description="No photos match this filter." />
        ) : (
          shown.map((pair) => <PairEditor key={pair.key} missing={problems[pair.key] ?? []} pair={pair} urls={urls} roomOptions={roomOptions} onSave={(p) => void savePair(pair, p)} />)
        )}

        <div className="app-row app-row--between app-footer">
          <Button variant="ghost" onClick={() => navigate({ to: "/flow/$id/upload", params: { id } })}>Back to photos</Button>
          <Button trailingIcon={<ArrowRight />} disabled={pairs.length === 0} onClick={() => void next()}>Choose report design</Button>
        </div>
      </PageContainer>
    </AppLayout>
  );
}

function PairEditor({
  missing,
  pair, urls, roomOptions, onSave,
}: {
  missing: string[];
  pair: PhotoPair;
  urls: Record<string, string>;
  roomOptions: { value: string; label: string }[];
  onSave: (patch: Record<string, string | null>) => void;
}) {
  const first = pair.items[0]!;
  const opts = first.room && !roomOptions.some((o) => o.value === first.room) ? [...roomOptions, { value: first.room, label: first.room }] : roomOptions;
  const blur = (key: string) => (e: { target: { value: string } }) => onSave({ [key]: e.target.value.trim() || null });
  const k = pair.key;
  const m = (f: string) => missing.includes(f);
  return (
    <PairCard pair={pair} urls={urls}>
      <div className="app-form-grid">
        <Field label="Room / location *" htmlFor={`room-${k}`} error={m("room") ? "Choose a room" : undefined}>
          <Select id={`room-${k}`} invalid={m("room")} options={opts} defaultValue={first.room ?? ""} onChange={(e) => onSave({ room: e.target.value || null })} />
        </Field>
        <Field label="Severity" htmlFor={`sev-${k}`}>
          <Select id={`sev-${k}`} options={SEVERITY_OPTIONS} defaultValue={first.severity ?? "normal"} onChange={(e) => onSave({ severity: e.target.value })} />
        </Field>
        <Field label="Inspection area" htmlFor={`area-${k}`} className="app-span-2">
          <Input id={`area-${k}`} placeholder="e.g. Balcony floor and threshold" defaultValue={first.area ?? first.location_label ?? ""} onBlur={blur("area")} />
        </Field>
        {pair.thermal && (
          <Field label="Thermal observation" htmlFor={`th-${k}`} error={m("observation") ? "Describe what you see" : undefined}>
            <Textarea id={`th-${k}`} invalid={m("observation")} rows={4} defaultValue={first.thermal_observation ?? pair.thermal.summary ?? ""} onBlur={blur("thermal_observation")} />
          </Field>
        )}
        {pair.visual && (
          <Field label="Visual observation" htmlFor={`vi-${k}`} error={m("observation") ? "Describe what you see" : undefined}>
            <Textarea id={`vi-${k}`} invalid={m("observation")} rows={4} defaultValue={first.visual_observation ?? pair.visual.summary ?? ""} onBlur={blur("visual_observation")} />
          </Field>
        )}
        <Field label="Recommendation *" htmlFor={`rec-${k}`} className="app-span-2" error={m("recommendation") ? "Add a recommendation" : undefined}>
          <Textarea id={`rec-${k}`} invalid={m("recommendation")} rows={2} defaultValue={first.recommendation ?? ""} onBlur={blur("recommendation")} />
        </Field>
      </div>
    </PairCard>
  );
}
