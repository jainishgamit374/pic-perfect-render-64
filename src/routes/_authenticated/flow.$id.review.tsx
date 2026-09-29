import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ArrowRight, Flame, Image as ImageIcon, Layers } from "lucide-react";
import {
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
  const shown = pairs.filter((p) => filter === "all" || (filter === "issues" ? p.items.some((i) => i.severity && i.severity !== "normal") : false));
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

  async function next() {
    await setStep(id, 5);
    await supabase.from("inspections").update({ status: "completed" }).eq("id", id);
    await queryClient.invalidateQueries({ queryKey: ["inspection", id] });
    navigate({ to: "/flow/$id/report", params: { id } });
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
        <div className="app-grid-stats">
          <StatCard label="Photo pairs" value={pairs.length} icon={<Layers />} />
          <StatCard label="Visual photos" value={visual} icon={<ImageIcon />} />
          <StatCard label="Thermal scans" value={rows.length - visual} icon={<Flame />} />
        </div>
        <div className="app-row app-row--between">
          <h2 className="ds-h2">Findings</h2>
          <Tabs value={filter} onChange={setFilter} items={[{ value: "all", label: "All" }, { value: "issues", label: "Issues only" }]} />
        </div>

        {shown.length === 0 ? (
          <EmptyState icon={<Layers />} title="Nothing to review" description="No photos match this filter." />
        ) : (
          shown.map((pair) => <PairEditor key={pair.key} pair={pair} urls={urls} roomOptions={roomOptions} onSave={(p) => void savePair(pair, p)} />)
        )}

        <div className="app-row app-row--between app-footer">
          <Button variant="ghost" onClick={() => navigate({ to: "/flow/$id/upload", params: { id } })}>Back to photos</Button>
          <Button trailingIcon={<ArrowRight />} onClick={() => void next()}>Create final report</Button>
        </div>
      </PageContainer>
    </AppLayout>
  );
}

function PairEditor({
  pair, urls, roomOptions, onSave,
}: {
  pair: PhotoPair;
  urls: Record<string, string>;
  roomOptions: { value: string; label: string }[];
  onSave: (patch: Record<string, string | null>) => void;
}) {
  const first = pair.items[0]!;
  const opts = first.room && !roomOptions.some((o) => o.value === first.room) ? [...roomOptions, { value: first.room, label: first.room }] : roomOptions;
  const blur = (key: string) => (e: { target: { value: string } }) => onSave({ [key]: e.target.value.trim() || null });
  const k = pair.key;
  return (
    <PairCard pair={pair} urls={urls}>
      <div className="app-form-grid">
        <Field label="Room / location" htmlFor={`room-${k}`}>
          <Select id={`room-${k}`} options={opts} defaultValue={first.room ?? ""} onChange={(e) => onSave({ room: e.target.value || null })} />
        </Field>
        <Field label="Severity" htmlFor={`sev-${k}`}>
          <Select id={`sev-${k}`} options={SEVERITY_OPTIONS} defaultValue={first.severity ?? "normal"} onChange={(e) => onSave({ severity: e.target.value })} />
        </Field>
        <Field label="Inspection area" htmlFor={`area-${k}`} className="app-span-2">
          <Input id={`area-${k}`} placeholder="e.g. Balcony floor and threshold" defaultValue={first.area ?? first.location_label ?? ""} onBlur={blur("area")} />
        </Field>
        {pair.thermal && (
          <Field label="Thermal observation" htmlFor={`th-${k}`}>
            <Textarea id={`th-${k}`} rows={4} defaultValue={first.thermal_observation ?? pair.thermal.summary ?? ""} onBlur={blur("thermal_observation")} />
          </Field>
        )}
        {pair.visual && (
          <Field label="Visual observation" htmlFor={`vi-${k}`}>
            <Textarea id={`vi-${k}`} rows={4} defaultValue={first.visual_observation ?? pair.visual.summary ?? ""} onBlur={blur("visual_observation")} />
          </Field>
        )}
        <Field label="Recommendation" htmlFor={`rec-${k}`} className="app-span-2">
          <Textarea id={`rec-${k}`} rows={2} defaultValue={first.recommendation ?? ""} onBlur={blur("recommendation")} />
        </Field>
      </div>
    </PairCard>
  );
}
