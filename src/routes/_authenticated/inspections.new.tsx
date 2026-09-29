import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  Alert,
  Button,
  Card,
  Field,
  Input,
  PageContainer,
  PageHeader,
  Textarea,
} from "@/design-system/gentle-code-library-71de11";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/inspections/new")({
  head: () => ({
    meta: [
      { title: "New inspection — Inspect" },
      { name: "description", content: "Start a new property inspection and upload its photo set." },
      { property: "og:title", content: "New inspection — Inspect" },
      { property: "og:description", content: "Create an inspection record before uploading site photos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NewInspectionPage,
});

function NewInspectionPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [address, setAddress] = useState("");
  const [inspector, setInspector] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error("Your session expired. Sign in again.");

      const { data, error: insertError } = await supabase
        .from("inspections")
        .insert({
          user_id: userId,
          title: title.trim(),
          property_address: address.trim() || null,
          inspector_name: inspector.trim() || null,
          notes: notes.trim() || null,
        })
        .select("id")
        .single();
      if (insertError) throw new Error(insertError.message);

      navigate({ to: "/inspections/$id", params: { id: data.id } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the inspection.");
      setBusy(false);
    }
  }

  return (
    <AppLayout>
      <PageContainer>
        <PageHeader
          title="New inspection"
          description="Name the visit first — photos are uploaded on the next screen."
        />
        <Card style={{ maxWidth: "640px" }}>
          <form className="app-stack" onSubmit={create}>
            {error && <Alert tone="error" title="Could not save">{error}</Alert>}
            <Field label="Inspection title" htmlFor="title">
              <Input
                id="title"
                required
                placeholder="12 Harbour Street — pre-purchase"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </Field>
            <Field label="Property address" htmlFor="address">
              <Input
                id="address"
                placeholder="12 Harbour Street, Bristol"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </Field>
            <Field label="Inspector" htmlFor="inspector">
              <Input
                id="inspector"
                placeholder="Name of the inspector on site"
                value={inspector}
                onChange={(e) => setInspector(e.target.value)}
              />
            </Field>
            <Field label="Site notes" htmlFor="notes" hint="Optional context the report should mention">
              <Textarea id="notes" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </Field>
            <div className="app-row">
              <Button type="submit" size="lg" loading={busy}>
                Create and add photos
              </Button>
              <Button type="button" variant="ghost" onClick={() => navigate({ to: "/inspections" })}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </PageContainer>
    </AppLayout>
  );
}
