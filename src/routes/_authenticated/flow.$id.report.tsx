import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { Download, Palette, Pencil } from "lucide-react";
import { Button, PageContainer, PageHeader, Skeleton } from "@/design-system/gentle-code-library-71de11";
import { AppLayout } from "@/components/AppLayout";
import { StepTracker } from "@/components/StepTracker";
import { groupPairs } from "@/lib/flow";
import { useInspectionFlow } from "@/lib/useInspectionFlow";
import { ScaledPage, buildReportData, renderReportPages, styleMeta, type StyleId } from "@/components/report-styles";

export const Route = createFileRoute("/_authenticated/flow/$id/report")({
  head: () => ({
    meta: [
      { title: "Final report — Inspect" },
      { name: "description", content: "Step 6: the finished inspection report in your chosen design, ready to download as PDF." },
      { property: "og:title", content: "Final inspection report — Inspect" },
      { property: "og:description", content: "Download the completed property inspection report." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReportStep,
});

function ReportStep() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { inspection, images, rows, urls } = useInspectionFlow(id);
  const style = (styleMeta((inspection.data as { report_style?: string } | undefined)?.report_style)?.id ?? "editorial") as StyleId;
  const pages = useMemo(
    () => renderReportPages(style, buildReportData(inspection.data, groupPairs(rows), urls)),
    [style, inspection.data, rows, urls],
  );

  if (inspection.isLoading || images.isLoading) return <AppLayout><PageContainer><Skeleton shape="block" /></PageContainer></AppLayout>;

  return (
    <AppLayout>
      <PageContainer>
        <div className="no-print">
          <PageHeader
            title="Final report"
            description={`Design: ${styleMeta(style)?.name}. Check the pages, then download as PDF.`}
            actions={
              <span className="app-row">
                <Button variant="ghost" leadingIcon={<Palette />} onClick={() => navigate({ to: "/flow/$id/design", params: { id } })}>Change design</Button>
                <Button variant="secondary" leadingIcon={<Pencil />} onClick={() => navigate({ to: "/flow/$id/review", params: { id } })}>Edit findings</Button>
                <Button leadingIcon={<Download />} onClick={() => window.print()}>Download PDF</Button>
              </span>
            }
          />
        </div>
        <StepTracker active={6} reached={6} id={id} />
        <div className="app-report-stack rs-print-stack">
          {pages.map((p, i) => <ScaledPage key={i} scale={1}>{p}</ScaledPage>)}
        </div>
      </PageContainer>
    </AppLayout>
  );
}
