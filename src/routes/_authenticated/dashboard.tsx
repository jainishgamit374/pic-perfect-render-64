import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, AlertTriangle, Images, CheckCircle2, Upload } from "lucide-react";
import {
  Button,
  Card,
  DataTable,
  EmptyState,
  PageContainer,
  PageHeader,
  Skeleton,
  StatCard,
  StatusBadge,
  SeverityBadge,
} from "@/design-system/gentle-code-library-71de11";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { listInspections } from "@/lib/inspections";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Inspect" },
      { name: "description", content: "Overview of your property inspections, photo volume and open defects." },
      { property: "og:title", content: "Dashboard — Inspect" },
      { property: "og:description", content: "Track inspection status, analysed photos and critical findings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();

  const inspections = useQuery({ queryKey: ["inspections"], queryFn: listInspections });

  const stats = useQuery({
    queryKey: ["image-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inspection_images")
        .select("severity, analysis_state");
      if (error) throw new Error(error.message);
      const rows = data ?? [];
      return {
        total: rows.length,
        analysed: rows.filter((r) => r.analysis_state === "done").length,
        critical: rows.filter((r) => r.severity === "critical" || r.severity === "defective").length,
      };
    },
  });

  const recent = (inspections.data ?? []).slice(0, 8);

  return (
    <AppLayout>
      <PageContainer>
        <PageHeader
          title="Dashboard"
          description="Everything happening across your inspections right now."
          actions={
            <Button leadingIcon={<Upload />} onClick={() => navigate({ to: "/inspections/new" })}>
              New inspection
            </Button>
          }
        />

        <div className="app-grid-stats">
          <StatCard label="Inspections" value={inspections.data?.length ?? 0} icon={<ClipboardList />} />
          <StatCard label="Photos uploaded" value={stats.data?.total ?? 0} icon={<Images />} />
          <StatCard label="Photos analysed" value={stats.data?.analysed ?? 0} icon={<CheckCircle2 />} />
          <StatCard label="Serious findings" value={stats.data?.critical ?? 0} icon={<AlertTriangle />} />
        </div>

        <Card padding="none" style={{ marginTop: "var(--ds-space-lg)" }}>
          {inspections.isLoading ? (
            <div style={{ padding: "var(--ds-space-card)" }}>
              <Skeleton shape="block" />
            </div>
          ) : recent.length === 0 ? (
            <EmptyState
              icon={<ClipboardList />}
              title="No inspections yet"
              description="Create your first inspection and upload the photo set to see findings here."
              action={
                <Button onClick={() => navigate({ to: "/inspections/new" })}>Create inspection</Button>
              }
            />
          ) : (
            <DataTable
              caption="Recent inspections"
              columns={[
                { key: "title", header: "Inspection", render: (row) => row.title },
                {
                  key: "property_address",
                  header: "Property",
                  render: (row) => row.property_address ?? "—",
                },
                {
                  key: "status",
                  header: "Status",
                  render: (row) => <StatusBadge status={mapStatus(row.status)} />,
                },
                { key: "created_at", header: "Created", render: (row) => formatDate(row.created_at) },
              ]}
              rows={recent}
              getRowKey={(row) => row.id}
              onRowClick={(row) => navigate({ to: ((["/flow/$id/upload","/flow/$id/upload","/flow/$id/analysis","/flow/$id/review","/flow/$id/report"] as const)[Math.min(4, Math.max(0, (row.current_step ?? 2) - 1))]), params: { id: row.id } })}
            />
          )}
        </Card>

        <Card style={{ marginTop: "var(--ds-space-lg)" }}>
          <h2 className="ds-h3">Severity legend</h2>
          <div className="app-row" style={{ marginTop: "var(--ds-space-md)" }}>
            <SeverityBadge severity="normal">Normal</SeverityBadge>
            <SeverityBadge severity="minor">Minor</SeverityBadge>
            <SeverityBadge severity="moderate">Moderate</SeverityBadge>
            <SeverityBadge severity="defective">Defective</SeverityBadge>
            <SeverityBadge severity="critical">Critical</SeverityBadge>
          </div>
        </Card>
      </PageContainer>
    </AppLayout>
  );
}

export function mapStatus(status: string): "completed" | "processing" | "review" | "failed" | "draft" {
  if (status === "completed" || status === "processing" || status === "review" || status === "failed") {
    return status;
  }
  return "draft";
}
