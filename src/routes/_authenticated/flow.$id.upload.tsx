import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { ArrowLeft, Flame, Image as ImageIcon, Layers, Sparkles } from "lucide-react";
import {
  Alert,
  Badge,
  Button,
  Card,
  DropZone,
  EmptyState,
  PageContainer,
  PageHeader,
  ProgressBar,
  Skeleton,
  StatCard,
  Tabs,
  UploadItem,
} from "@/design-system/gentle-code-library-71de11";
import { AppLayout } from "@/components/AppLayout";
import { StepTracker } from "@/components/StepTracker";
import { PairCard } from "@/components/PairCard";
import { supabase } from "@/integrations/supabase/client";
import { groupPairs, parseFilename, setStep } from "@/lib/flow";
import { useInspectionFlow } from "@/lib/useInspectionFlow";

export const Route = createFileRoute("/_authenticated/flow/$id/upload")({
  head: () => ({
    meta: [
      { title: "Upload images — Inspect" },
      { name: "description", content: "Step 2: upload visual and thermal inspection photos." },
      { property: "og:title", content: "Upload images — Inspect" },
      { property: "og:description", content: "Upload the visual and thermal photo set for this inspection." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: UploadStep,
});

const CONCURRENCY = 4;
interface QueueItem { id: string; filename: string; size: number; state: "uploading" | "done" | "error" }

function UploadStep() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { inspection, images, rows, urls } = useInspectionFlow(id);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState<string | null>(null);

  const visual = rows.filter((r) => r.kind !== "thermal").length;
  const thermal = rows.length - visual;
  const done = queue.filter((q) => q.state !== "uploading").length;
  const uploading = queue.some((q) => q.state === "uploading");

  const pairs = useMemo(() => {
    const filtered = rows.filter((r) => filter === "all" || (filter === "thermal" ? r.kind === "thermal" : r.kind !== "thermal"));
    return groupPairs(filtered);
  }, [rows, filter]);

  const onFiles = useCallback(async (files: File[]) => {
    const imgs = files.filter((f) => f.type.startsWith("image/") || /\.(jpe?g|png|webp|heic|tiff?)$/i.test(f.name));
    if (!imgs.length) return;
    setError(null);
    const { data: u } = await supabase.auth.getUser();
    const userId = u.user?.id;
    if (!userId) return setError("Your session expired. Sign in again.");
    const items = imgs.map((f, i) => ({ id: `${Date.now()}-${i}`, filename: f.name, size: f.size, state: "uploading" as const }));
    setQueue((q) => [...items, ...q]);
    let cursor = 0;
    const worker = async (): Promise<void> => {
      const i = cursor++;
      if (i >= imgs.length) return;
      const file = imgs[i]!;
      const item = items[i]!;
      const path = `${userId}/${id}/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, "_")}`;
      const meta = parseFilename(file.name);
      try {
        const up = await supabase.storage.from("inspection-images").upload(path, file, { contentType: file.type || undefined });
        if (up.error) throw new Error(up.error.message);
        const ins = await supabase.from("inspection_images").insert({
          inspection_id: id, user_id: userId, storage_path: path, filename: file.name,
          size_bytes: file.size, kind: meta.kind, pair_key: meta.key,
        });
        if (ins.error) throw new Error(ins.error.message);
        setQueue((q) => q.map((x) => (x.id === item.id ? { ...x, state: "done" } : x)));
      } catch (err) {
        setError(err instanceof Error ? err.message : "An upload failed.");
        setQueue((q) => q.map((x) => (x.id === item.id ? { ...x, state: "error" } : x)));
      }
      if (i % 10 === 9) void queryClient.invalidateQueries({ queryKey: ["inspection-images", id] });
      await worker();
    };
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, imgs.length) }, worker));
    await queryClient.invalidateQueries({ queryKey: ["inspection-images", id] });
  }, [id, queryClient]);

  async function removeImage(imageId: string, path: string) {
    await supabase.storage.from("inspection-images").remove([path]);
    await supabase.from("inspection_images").delete().eq("id", imageId);
    await queryClient.invalidateQueries({ queryKey: ["inspection-images", id] });
  }

  async function start() {
    await setStep(id, 3);
    await queryClient.invalidateQueries({ queryKey: ["inspection", id] });
    navigate({ to: "/flow/$id/analysis", params: { id } });
  }

  if (inspection.isLoading) return <AppLayout><PageContainer><Skeleton shape="block" /></PageContainer></AppLayout>;
  const reached = inspection.data?.current_step ?? 2;
  const blockers = [
    rows.length === 0 && "Upload at least one inspection photo.",
    uploading && "Wait for all uploads to finish.",
  ].filter(Boolean) as string[];

  return (
    <AppLayout>
      <PageContainer>
        <PageHeader title="Upload inspection images" description={inspection.data?.title ?? "Step 2 of 5"} />
        <StepTracker active={2} reached={reached} id={id} />
        {error && <Alert tone="error" title="Some uploads failed">{error}</Alert>}
        <DropZone onFiles={(f) => void onFiles(f)} hint="JPG, PNG, WebP, HEIC · name thermal photos …X and visual photos …Y to pair them" />

        {queue.length > 0 && (
          <Card className="app-stack">
            <ProgressBar
              label="Upload progress"
              value={(done / queue.length) * 100}
              detail={`${done}/${queue.length} files`}
              tone={!uploading ? "success" : "brand"}
            />
            <div className="app-upload-list">
              {queue.slice(0, 6).map((q) => (
                <UploadItem key={q.id} filename={q.filename} state={q.state} progress={q.state === "uploading" ? 50 : 100} sizeLabel={`${(q.size / 1048576).toFixed(1)} MB`} />
              ))}
              {queue.length > 6 && <span className="ds-caption">+{queue.length - 6} more files</span>}
            </div>
          </Card>
        )}

        <div className="app-grid-stats">
          <StatCard label="Total images" value={rows.length} icon={<Layers />} />
          <StatCard label="Visual photos" value={visual} icon={<ImageIcon />} />
          <StatCard label="Thermal scans" value={thermal} icon={<Flame />} />
        </div>

        <div className="app-row app-row--between">
          <h2 className="ds-h2">Walkthrough sequence</h2>
          <Tabs
            value={filter}
            onChange={setFilter}
            items={[
              { value: "all", label: `All ${rows.length}` },
              { value: "visual", label: `Visual ${visual}` },
              { value: "thermal", label: `Thermal ${thermal}` },
            ]}
          />
        </div>

        {images.isLoading ? (
          <Skeleton shape="block" />
        ) : pairs.length === 0 ? (
          <Card><EmptyState icon={<Layers />} title="No photos yet" description="Drop photos above to start. Thermal and visual shots with matching names are shown side by side." /></Card>
        ) : (
          <div className="app-stack">
            {pairs.map((p) => (
              <PairCard key={p.key} pair={p} urls={urls} onRemove={(img) => void removeImage(img.id, img.storage_path)} />
            ))}
          </div>
        )}

        {blockers.length > 0 && (
          <Alert tone="warning" title="Before you can start AI analysis">
            <ul className="app-stack-sm">{blockers.map((b) => <li key={b}>{b}</li>)}</ul>
          </Alert>
        )}

        <div className="app-row app-row--between app-footer">
          <Button variant="ghost" leadingIcon={<ArrowLeft />} onClick={() => navigate({ to: "/inspections" })}>
            Back to inspections
          </Button>
          <span className="app-row">
            <Badge tone={blockers.length ? "warning" : "success"} dot>{rows.length} images ready</Badge>
            <Button leadingIcon={<Sparkles />} disabled={blockers.length > 0} onClick={() => void start()}>
              Start AI analysis
            </Button>
          </span>
        </div>
      </PageContainer>
    </AppLayout>
  );
}
