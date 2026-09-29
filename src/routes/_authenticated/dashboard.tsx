import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, AlertTriangle, Images, CheckCircle2, Plus, ArrowUpRight } from "lucide-react";
import { useState } from "react";
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
  SearchInput,
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
  const [filter, setFilter] = useState("");

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

  const recent = (inspections.data ?? []).filter((row) => `${row.title} ${row.property_address ?? ""}`.toLowerCase().includes(filter.toLowerCase())).slice(0, 8);
  const next = (inspections.data ?? []).find((row) => row.status !== "completed");

  return (
    <AppLayout>
      <PageContainer>
        <div className="app-dashboard-header"><PageHeader
          title="Dashboard"
          description="A clear view of every property in progress."
          actions={
            <Button leadingIcon={<Plus />} onClick={() => navigate({ to: "/inspections/new" })}>
              New inspection
            </Button>
          }
        /></div>

        {next && <div className="app-dashboard-focus"><div><span className="ds-caption">PICK UP WHERE YOU LEFT OFF</span><h2 className="ds-h2">{next.title}</h2><p className="ds-body">{next.property_address || "Property address not set"} · Continue the inspection report.</p></div><Button variant="secondary" trailingIcon={<ArrowUpRight />} onClick={() => navigate({ to: ((["/flow/$id/upload","/flow/$id/upload","/flow/$id/analysis","/flow/$id/review","/flow/$id/design","/flow/$id/report"] as const)[Math.min(5, Math.max(0, (next.current_step ?? 2) - 1))]), params: { id: next.id } })}>Continue inspection</Button></div>}

        <div className="app-grid-stats">
          <StatCard label="Inspections" value={inspections.data?.length ?? 0} icon={<ClipboardList />} />
          <StatCard label="Photos uploaded" value={stats.data?.total ?? 0} icon={<Images />} />
          <StatCard label="Photos analysed" value={stats.data?.analysed ?? 0} icon={<CheckCircle2 />} />
          <StatCard label="Serious findings" value={stats.data?.critical ?? 0} icon={<AlertTriangle />} />
        </div>

        <section className="app-dashboard-activity"><div className="app-row app-row--between"><div><span className="ds-caption">RECENT ACTIVITY</span><h2 className="ds-h2">Inspections</h2></div><SearchInput aria-label="Filter inspections" placeholder="Filter inspections" value={filter} onChange={(event) => setFilter(event.target.value)} /></div>
        <Card padding="none">
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
              onRowClick={(row) => navigate({ to: ((["/flow/$id/upload","/flow/$id/upload","/flow/$id/analysis","/flow/$id/review","/flow/$id/design","/flow/$id/report"] as const)[Math.min(5, Math.max(0, (row.current_step ?? 2) - 1))]), params: { id: row.id } })}
            />
          )}
        </Card>
        </section>

        <div className="app-dashboard-key">
          <h2 className="ds-h3">Finding severity</h2>
          <div className="app-row" style={{ marginTop: "var(--ds-space-md)" }}>
            <SeverityBadge severity="normal">Normal</SeverityBadge>
            <SeverityBadge severity="minor">Minor</SeverityBadge>
            <SeverityBadge severity="moderate">Moderate</SeverityBadge>
            <SeverityBadge severity="defective">Defective</SeverityBadge>
            <SeverityBadge severity="critical">Critical</SeverityBadge>
          </div>
        </div>
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
