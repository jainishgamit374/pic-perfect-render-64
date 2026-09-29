import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Building2, ScanSearch, FileText, Layers } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  PageContainer,
  StatCard,
} from "@/design-system/gentle-code-library-71de11";
import { useSession } from "@/lib/session";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Inspect — AI property inspection reports" },
      {
        name: "description",
        content:
          "Upload hundreds of inspection photos, let AI grade every defect, and publish a structured property report in minutes.",
      },
      { property: "og:title", content: "Inspect — AI property inspection reports" },
      {
        property: "og:description",
        content:
          "Bulk photo upload, automatic defect grading and a ready-to-share property inspection report.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  const { session, loading } = useSession();

  useEffect(() => {
    if (!loading && session) navigate({ to: "/dashboard", replace: true });
  }, [loading, session, navigate]);

  return (
    <PageContainer>
      <div className="app-hero app-stack">
        <Badge tone="brand" dot>
          Property inspection platform
        </Badge>
        <h1 className="ds-display">
          Turn hundreds of site photos into one clear inspection report.
        </h1>
        <p className="ds-body-lg">
          Drop an entire shoot into Inspect. Every photo is graded for severity, grouped by section
          and written up automatically, so you review findings instead of typing them.
        </p>
        <div className="app-row">
          <Button size="lg" onClick={() => navigate({ to: "/auth" })}>
            Start an inspection
          </Button>
          <Button size="lg" variant="secondary" onClick={() => navigate({ to: "/auth" })}>
            Sign in
          </Button>
        </div>
      </div>

      <div className="app-grid-stats">
        <StatCard label="Photos per inspection" value="500+" icon={<Layers />} />
        <StatCard label="Severity levels graded" value="5" icon={<ScanSearch />} />
        <StatCard label="Report sections" value="Auto" icon={<FileText />} />
        <StatCard label="Site visits stored" value="Unlimited" icon={<Building2 />} />
      </div>

      <Card style={{ marginTop: "var(--ds-space-xl)" }}>
        <h2 className="ds-h2">How it works</h2>
        <p className="ds-body" style={{ marginTop: "var(--ds-space-sm)" }}>
          1. Create the inspection and drop in the photo set. 2. Upload progress and analysis
          progress are tracked separately, so a refresh never loses work. 3. Review the graded
          findings, edit anything, then share the report.
        </p>
      </Card>
    </PageContainer>
  );
}
