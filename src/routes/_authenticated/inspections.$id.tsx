import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Images, Play, RefreshCcw } from "lucide-react";
import {
  Alert,
  Button,
  Card,
  EmptyState,
  DropZone,
  PageContainer,
  PageHeader,
  ProgressBar,
  SeverityBadge,
  Skeleton,
  StatusBadge,
  Tabs,
  UploadItem,
  ImageCard,
} from "@/design-system/gentle-code-library-71de11";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { analyzeInspectionImage } from "@/lib/analysis.functions";
import { getInspection, listImages, signedUrls } from "@/lib/inspections";
import { formatBytes, formatDate } from "@/lib/format";
import { mapStatus } from "./dashboard";

export const Route = createFileRoute("/_authenticated/inspections/$id")({
  head: () => ({
    meta: [
      { title: "Inspection report — Inspect" },
      { name: "description", content: "Upload photos, follow AI analysis and review graded findings for this property." },
      { property: "og:title", content: "Inspection report — Inspect" },
      { property: "og:description", content: "Photo set, analysis progress and graded defect findings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: InspectionDetailPage,
});

type QueueItem = {
  id: string;
  filename: string;
  size: number;
  progress: number;
  state: "uploading" | "done" | "error";
};

const CONCURRENCY = 3;

function InspectionDetailPage() {
  const { id } = useParams({ from: "/_authenticated/inspections/$id" });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const analyze = useServerFn(analyzeInspectionImage);

  const [tab, setTab] = useState("photos");
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [analysing, setAnalysing] = useState(false);
  const runningRef = useRef(false);

  const inspection = useQuery({
    queryKey: ["inspection", id],
    queryFn: () => getInspection(id),
  });

  const images = useQuery({
    queryKey: ["inspection-images", id],
    queryFn: () => listImages(id),
    refetchInterval: analysing ? 4000 : false,
  });

  const rows = useMemo(() => images.data ?? [], [images.data]);

  const thumbs = useQuery({
    queryKey: ["inspection-thumbs", id, rows.map((r) => r.storage_path).join(",")],
    queryFn: () => signedUrls(rows.map((r) => r.storage_path)),
    enabled: rows.length > 0,
  });

  const uploadTotal = queue.length;
  const uploadDone = queue.filter((q) => q.state === "done").length;
  const uploadPercent = uploadTotal === 0 ? 0 : (uploadDone / uploadTotal) * 100;

  const analysed = rows.filter((r) => r.analysis_state === "done" || r.analysis_state === "error").length;
  const analysisPercent = rows.length === 0 ? 0 : (analysed / rows.length) * 100;
  const pending = rows.filter((r) => r.analysis_state === "pending" || r.analysis_state === "error");

  const handleFiles = useCallback(
    async (files: File[]) => {
      setError(null);
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) {
        setError("Your session expired. Sign in again.");
        return;
      }

      const items: QueueItem[] = files.map((file, index) => ({
        id: `${Date.now()}-${index}-${file.name}`,
        filename: file.name,
        size: file.size,
        progress: 0,
        state: "uploading",
      }));
      setQueue((prev) => [...prev, ...items]);

      let cursor = 0;
      const next = async (): Promise<void> => {
        const current = cursor++;
        if (current >= files.length) return;
        const file = files[current]!;
        const item = items[current]!;
        const path = `${userId}/${id}/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, "_")}`;
        try {
          const { error: uploadError } = await supabase.storage
            .from("inspection-images")
            .upload(path, file, { contentType: file.type, upsert: false });
          if (uploadError) throw new Error(uploadError.message);

          const { error: insertError } = await supabase.from("inspection_images").insert({
            inspection_id: id,
            user_id: userId,
            storage_path: path,
            filename: file.name,
            size_bytes: file.size,
          });
          if (insertError) throw new Error(insertError.message);

          setQueue((prev) =>
            prev.map((q) => (q.id === item.id ? { ...q, progress: 100, state: "done" } : q)),
          );
        } catch (err) {
          setError(err instanceof Error ? err.message : "An upload failed.");
          setQueue((prev) => prev.map((q) => (q.id === item.id ? { ...q, state: "error" } : q)));
        }
        await next();
      };

      await Promise.all(Array.from({ length: Math.min(CONCURRENCY, files.length) }, next));
      await queryClient.invalidateQueries({ queryKey: ["inspection-images", id] });
    },
    [id, queryClient],
  );

  const runAnalysis = useCallback(async () => {
    if (runningRef.current) return;
    const targets = (images.data ?? []).filter(
      (r) => r.analysis_state === "pending" || r.analysis_state === "error",
    );
    if (targets.length === 0) return;

    runningRef.current = true;
    setAnalysing(true);
    setError(null);
    await supabase.from("inspections").update({ status: "processing" }).eq("id", id);

    let cursor = 0;
    const worker = async (): Promise<void> => {
      const current = cursor++;
      if (current >= targets.length) return;
      const target = targets[current]!;
      try {
        await analyze({ data: { imageId: target.id } });
      } catch {
        // per-image failure is persisted server-side; keep the batch going
      }
      await queryClient.invalidateQueries({ queryKey: ["inspection-images", id] });
      await worker();
    };

    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, targets.length) }, worker));

    await supabase.from("inspections").update({ status: "review" }).eq("id", id);
    await queryClient.invalidateQueries({ queryKey: ["inspection", id] });
    await queryClient.invalidateQueries({ queryKey: ["inspection-images", id] });
    runningRef.current = false;
    setAnalysing(false);
  }, [analyze, id, images.data, queryClient]);

  useEffect(() => {
    if (!analysing) return;
    const timer = window.setInterval(() => {
      void queryClient.invalidateQueries({ queryKey: ["inspection-images", id] });
    }, 5000);
    return () => window.clearInterval(timer);
  }, [analysing, id, queryClient]);

  if (inspection.isLoading) {
    return (
      <AppLayout>
        <PageContainer>
          <Skeleton shape="block" />
        </PageContainer>
      </AppLayout>
    );
  }

  if (!inspection.data) {
    return (
      <AppLayout>
        <PageContainer>
          <EmptyState
            icon={<Images />}
            title="Inspection not found"
            description="It may have been deleted, or it belongs to another account."
            action={<Button onClick={() => navigate({ to: "/inspections" })}>Back to inspections</Button>}
          />
        </PageContainer>
      </AppLayout>
    );
  }

  const record = inspection.data;
  const urls = thumbs.data ?? {};

  return (
    <AppLayout>
      <PageContainer>
        <PageHeader
          title={record.title}
          description={record.property_address ?? "No address recorded"}
          actions={
            <>
              <StatusBadge status={mapStatus(record.status)} />
              <Button
                leadingIcon={pending.length === rows.length ? <Play /> : <RefreshCcw />}
                loading={analysing}
                disabled={pending.length === 0}
                onClick={() => void runAnalysis()}
              >
                {pending.length === 0 ? "All photos analysed" : `Analyse ${pending.length} photos`}
              </Button>
            </>
          }
        />

        {error && (
          <Alert tone="error" title="Something went wrong">
            {error}
          </Alert>
        )}

        <div className="app-grid-two">
          <Card>
            <DropZone onFiles={(files) => void handleFiles(files)} />
            <div className="app-stack" style={{ marginTop: "var(--ds-space-base)" }}>
              <ProgressBar
                label="Upload"
                value={uploadPercent}
                detail={uploadTotal === 0 ? "Idle" : `${uploadDone}/${uploadTotal} files`}
                tone={uploadTotal > 0 && uploadDone === uploadTotal ? "success" : "brand"}
              />
              <ProgressBar
                label="AI analysis"
                value={analysisPercent}
                detail={rows.length === 0 ? "Idle" : `${analysed}/${rows.length} photos`}
                tone={rows.length > 0 && analysed === rows.length ? "success" : "brand"}
              />
            </div>
            {queue.length > 0 && (
              <div className="app-stack" style={{ marginTop: "var(--ds-space-base)" }}>
                {queue.slice(-6).map((item) => (
                  <UploadItem
                    key={item.id}
                    filename={item.filename}
                    sizeLabel={formatBytes(item.size)}
                    progress={item.progress}
                    state={item.state}
                  />
                ))}
              </div>
            )}
          </Card>

          <Card>
            <h2 className="ds-h3">Visit details</h2>
            <dl className="app-detail-list">
              <div>
                <dt className="ds-caption">Inspector</dt>
                <dd className="ds-body">{record.inspector_name ?? "—"}</dd>
              </div>
              <div>
                <dt className="ds-caption">Created</dt>
                <dd className="ds-body">{formatDate(record.created_at)}</dd>
              </div>
              <div>
                <dt className="ds-caption">Photos</dt>
                <dd className="ds-body">{rows.length}</dd>
              </div>
              <div>
                <dt className="ds-caption">Notes</dt>
                <dd className="ds-body">{record.notes ?? "No notes recorded."}</dd>
              </div>
            </dl>
          </Card>
        </div>

        <div style={{ marginTop: "var(--ds-space-xl)" }}>
          <Tabs
            items={[
              { value: "photos", label: `Photos (${rows.length})` },
              { value: "findings", label: `Findings (${rows.filter((r) => r.summary).length})` },
            ]}
            value={tab}
            onChange={setTab}
          />
        </div>

        {rows.length === 0 ? (
          <Card style={{ marginTop: "var(--ds-space-lg)" }} padding="none">
            <EmptyState
              icon={<Images />}
              title="No photos yet"
              description="Drop the inspection photo set above to start the analysis."
            />
          </Card>
        ) : tab === "photos" ? (
          <div className="app-grid-images">
            {rows.map((row) => (
              <ImageCard
                key={row.id}
                src={urls[row.storage_path] ?? ""}
                alt={row.filename}
                filename={row.filename}
                kind={row.kind === "thermal" ? "thermal" : "visual"}
                severity={row.severity ?? undefined}
                meta={[
                  row.section ?? "Unclassified",
                  row.analysis_state === "done"
                    ? (row.severity ?? "graded")
                    : row.analysis_state === "error"
                      ? "Analysis failed"
                      : row.analysis_state === "analyzing"
                        ? "Analysing…"
                        : "Waiting",
                ]}
              />
            ))}
          </div>
        ) : (
          <div className="app-stack" style={{ marginTop: "var(--ds-space-lg)" }}>
            {rows.filter((r) => r.summary).length === 0 ? (
              <Card padding="none">
                <EmptyState
                  icon={<Images />}
                  title="No findings yet"
                  description="Run the analysis to generate graded findings for each photo."
                />
              </Card>
            ) : (
              rows
                .filter((r) => r.summary)
                .map((row) => (
                  <Card key={row.id}>
                    <div className="app-row app-row--between">
                      <h3 className="ds-h3">{row.section ?? "General"}</h3>
                      {row.severity && <SeverityBadge severity={row.severity} />}
                    </div>
                    <p className="ds-body" style={{ marginTop: "var(--ds-space-sm)" }}>
                      {row.summary}
                    </p>
                    {row.recommendation && (
                      <p className="ds-body-sm" style={{ marginTop: "var(--ds-space-sm)" }}>
                        <strong>Recommendation:</strong> {row.recommendation}
                      </p>
                    )}
                    <p className="ds-caption" style={{ marginTop: "var(--ds-space-sm)" }}>
                      {row.location_label ?? row.filename}
                    </p>
                  </Card>
                ))
            )}
          </div>
        )}
      </PageContainer>
    </AppLayout>
  );
}
