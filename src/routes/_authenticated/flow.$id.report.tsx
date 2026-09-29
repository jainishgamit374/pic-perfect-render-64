import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { Download, Pencil } from "lucide-react";
import {
  Button,
  Card,
  PageContainer,
  PageHeader,
  SeverityBadge,
  Skeleton,
} from "@/design-system/gentle-code-library-71de11";
import { AppLayout } from "@/components/AppLayout";
import { StepTracker } from "@/components/StepTracker";
import { groupPairs } from "@/lib/flow";
import { useInspectionFlow } from "@/lib/useInspectionFlow";

export const Route = createFileRoute("/_authenticated/flow/$id/report")({
  head: () => ({
    meta: [
      { title: "Final report — Inspect" },
      { name: "description", content: "Step 5: the finished inspection report, ready to download as PDF." },
      { property: "og:title", content: "Final inspection report — Inspect" },
      { property: "og:description", content: "Download the completed property inspection report." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReportStep,
});

type Sev = "normal" | "minor" | "moderate" | "defective" | "critical";

function ReportStep() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { inspection, images, rows, urls } = useInspectionFlow(id);
  const pairs = useMemo(() => groupPairs(rows), [rows]);
  const byRoom = useMemo(() => {
    const m = new Map<string, typeof pairs>();
    for (const p of pairs) {
      const room = p.items[0]?.room || p.items[0]?.section || "General";
      m.set(room, [...(m.get(room) ?? []), p]);
    }
    return [...m.entries()];
  }, [pairs]);

  if (inspection.isLoading || images.isLoading) return <AppLayout><PageContainer><Skeleton shape="block" /></PageContainer></AppLayout>;
  const i = inspection.data;
  const issues = rows.filter((r) => r.severity && r.severity !== "normal").length;
  const details: [string, string | null | undefined][] = [
    ["Client", i?.client_name], ["Phone", i?.client_phone], ["Email", i?.client_email],
    ["Address", [i?.property_address, i?.city, i?.state, i?.pin_code].filter(Boolean).join(", ")],
    ["Property type", i?.property_type], ["Inspector", i?.inspector_name],
    ["Date", [i?.inspection_date, i?.inspection_time].filter(Boolean).join(" ")],
    ["Age of home", i?.home_age], ["Size", i?.property_size], ["Weather", i?.weather],
  ];

  return (
    <AppLayout>
      <PageContainer>
        <div className="no-print">
          <PageHeader
            title="Final report"
            description="Check the report, then download it as a PDF."
            actions={
              <span className="app-row">
                <Button variant="secondary" leadingIcon={<Pencil />} onClick={() => navigate({ to: "/flow/$id/review", params: { id } })}>Edit findings</Button>
                <Button leadingIcon={<Download />} onClick={() => window.print()}>Download PDF</Button>
              </span>
            }
          />
        </div>
        <StepTracker active={5} reached={5} id={id} />

        <Card className="app-report app-stack">
          <header className="app-stack-sm">
            <span className="ds-caption">PROPERTY INSPECTION REPORT</span>
            <h1 className="ds-display">{i?.property_address || i?.title}</h1>
            <p className="ds-body">{pairs.length} locations inspected · {issues} photos with issues</p>
          </header>
          <dl className="app-report-details">
            {details.filter(([, v]) => v).map(([k, v]) => (
              <div key={k}><dt className="ds-caption">{k}</dt><dd>{v}</dd></div>
            ))}
          </dl>
          {i?.notes && <p className="ds-body">{i.notes}</p>}
        </Card>

        {byRoom.map(([room, list]) => (
          <section key={room} className="app-stack app-report-section">
            <h2 className="ds-h2">{room}</h2>
            {list.map((p) => {
              const f = p.items[0]!;
              const photos = [p.thermal, p.visual].filter(Boolean);
              return (
                <Card key={p.key} className="app-stack app-report-finding">
                  <div className="app-row app-row--between">
                    <strong>{f.area || f.location_label || p.key}</strong>
                    <SeverityBadge severity={(f.severity ?? "normal") as Sev} />
                  </div>
                  <div className="app-pair">
                    {photos.map((img) => (
                      <figure key={img!.id} className="app-report-photo">
                        {urls[img!.storage_path] && <img src={urls[img!.storage_path]} alt={img!.filename} />}
                        <figcaption className="ds-caption">{img!.kind === "thermal" ? "Thermal IR" : "Visual"} · {img!.filename}</figcaption>
                      </figure>
                    ))}
                  </div>
                  {p.thermal && (f.thermal_observation || p.thermal.summary) && (
                    <p className="ds-body"><strong>Thermal: </strong>{f.thermal_observation || p.thermal.summary}</p>
                  )}
                  {p.visual && (f.visual_observation || p.visual.summary) && (
                    <p className="ds-body"><strong>Visual: </strong>{f.visual_observation || p.visual.summary}</p>
                  )}
                  {f.recommendation && <p className="ds-body"><strong>Recommendation: </strong>{f.recommendation}</p>}
                </Card>
              );
            })}
          </section>
        ))}
      </PageContainer>
    </AppLayout>
  );
}
