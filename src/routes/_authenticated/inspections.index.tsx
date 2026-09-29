import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ClipboardList, Upload } from "lucide-react";
import {
  Button,
  Card,
  DataTable,
  EmptyState,
  PageContainer,
  PageHeader,
  SearchInput,
  Skeleton,
  StatusBadge,
  Tabs,
} from "@/design-system/gentle-code-library-71de11";
import { AppLayout } from "@/components/AppLayout";
import { listInspections } from "@/lib/inspections";
import { formatDate } from "@/lib/format";
import { mapStatus } from "./dashboard";

export const Route = createFileRoute("/_authenticated/inspections/")({
  head: () => ({
    meta: [
      { title: "Inspections — Inspect" },
      { name: "description", content: "Browse every property inspection, filter by status and open its report." },
      { property: "og:title", content: "Inspections — Inspect" },
      { property: "og:description", content: "All property inspections in your workspace with live status." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: InspectionsPage,
});

const TABS = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "processing", label: "Analysing" },
  { value: "review", label: "In review" },
  { value: "completed", label: "Completed" },
];

function InspectionsPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("all");
  const [term, setTerm] = useState("");
  const inspections = useQuery({ queryKey: ["inspections"], queryFn: listInspections });

  const rows = (inspections.data ?? []).filter((row) => {
    const matchesTab = tab === "all" || row.status === tab;
    const haystack = `${row.title} ${row.property_address ?? ""}`.toLowerCase();
    return matchesTab && haystack.includes(term.toLowerCase());
  });

  return (
    <AppLayout>
      <PageContainer>
        <PageHeader
          title="Inspections"
          description="Every site visit, its photo set and its report."
          actions={
            <Button leadingIcon={<Upload />} onClick={() => navigate({ to: "/inspections/new" })}>
              New inspection
            </Button>
          }
        />

        <div className="app-row app-row--between app-inspections-tools">
          <Tabs items={TABS} value={tab} onChange={setTab} />
          <SearchInput
            placeholder="Search by title or address"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
          />
        </div>

        <Card padding="none" style={{ marginTop: "var(--ds-space-lg)" }}>
          {inspections.isLoading ? (
            <div style={{ padding: "var(--ds-space-card)" }}>
              <Skeleton shape="block" />
            </div>
          ) : rows.length === 0 ? (
            <EmptyState
              icon={<ClipboardList />}
              title="Nothing here yet"
              description="Inspections you create will appear in this list."
              action={<Button onClick={() => navigate({ to: "/inspections/new" })}>Create inspection</Button>}
            />
          ) : (
            <DataTable
              caption="Inspections"
              columns={[
                { key: "title", header: "Inspection", render: (row) => row.title },
                { key: "address", header: "Property", render: (row) => row.property_address ?? "—" },
                { key: "inspector", header: "Inspector", render: (row) => row.inspector_name ?? "—" },
                { key: "status", header: "Status", render: (row) => <StatusBadge status={mapStatus(row.status)} /> },
                { key: "created", header: "Created", render: (row) => formatDate(row.created_at) },
              ]}
              rows={rows}
              getRowKey={(row) => row.id}
              onRowClick={(row) => navigate({ to: ((["/flow/$id/upload","/flow/$id/upload","/flow/$id/analysis","/flow/$id/review","/flow/$id/design","/flow/$id/report"] as const)[Math.min(5, Math.max(0, (row.current_step ?? 2) - 1))]), params: { id: row.id } })}
            />
          )}
        </Card>
      </PageContainer>
    </AppLayout>
  );
}
