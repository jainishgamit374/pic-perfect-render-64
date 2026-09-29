import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowRight, LayoutTemplate, RotateCcw } from "lucide-react";
import {
  Alert,
  Button,
  Card,
  Field,
  Input,
  PageContainer,
  PageHeader,
  Select,
  Textarea,
} from "@/design-system/gentle-code-library-71de11";
import { AppLayout } from "@/components/AppLayout";
import { StepTracker } from "@/components/StepTracker";
import { supabase } from "@/integrations/supabase/client";
import { listTemplates } from "@/lib/flow";

export const Route = createFileRoute("/_authenticated/inspections/new")({
  head: () => ({
    meta: [
      { title: "New inspection — Inspect" },
      { name: "description", content: "Step 1: enter client, property and visit details for a new inspection." },
      { property: "og:title", content: "New inspection — Inspect" },
      { property: "og:description", content: "Start a property inspection with client and property details." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NewInspectionPage,
});

const EMPTY = {
  client_name: "",
  inspector_name: "",
  client_phone: "",
  client_email: "",
  property_address: "",
  pin_code: "",
  template_id: "",
  city: "",
  state: "",
  inspection_date: "",
  inspection_time: "",
  home_age: "",
  property_size: "",
  weather: "",
  notes: "",
};
type Form = typeof EMPTY;

function NewInspectionPage() {
  const navigate = useNavigate();
  const templates = useQuery({ queryKey: ["templates"], queryFn: listTemplates });
  const [form, setForm] = useState<Form>(EMPTY);
  const [busy, setBusy] = useState<"draft" | "next" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tried, setTried] = useState(false);

  useEffect(() => {
    if (!form.template_id && templates.data?.[0]) {
      setForm((f) => ({ ...f, template_id: templates.data![0]!.id }));
    }
  }, [templates.data, form.template_id]);

  const set = (key: keyof Form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  function validate(): Partial<Record<keyof Form, string>> {
    const e: Partial<Record<keyof Form, string>> = {};
    if (!form.client_name.trim()) e.client_name = "Enter the client's name";
    if (!form.inspector_name.trim()) e.inspector_name = "Enter the inspector's name";
    if (!form.property_address.trim()) e.property_address = "Enter the property address";
    if (!form.city.trim()) e.city = "Enter the city";
    if (!form.template_id) e.template_id = "Choose a property type";
    if (!form.inspection_date) e.inspection_date = "Pick the inspection date";
    if (!form.client_email.trim() && !form.client_phone.trim()) e.client_email = "Add an email or phone number";
    if (form.client_email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.client_email.trim())) e.client_email = "Enter a valid email address";
    return e;
  }
  const errors = tried ? validate() : {};

  async function save(mode: "draft" | "next") {
    if (mode === "next") {
      setTried(true);
      if (Object.keys(validate()).length) {
        setError(null);
        return;
      }
    }
    setBusy(mode);
    setError(null);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error("Your session expired. Sign in again.");
      const template = templates.data?.find((t) => t.id === form.template_id);
      const clean = (v: string) => v.trim() || null;
      const title =
        [form.property_address.trim(), form.client_name.trim()].filter(Boolean).join(" — ") || "Untitled inspection";

      const { data, error: insertError } = await supabase
        .from("inspections")
        .insert({
          user_id: userId,
          title,
          client_name: clean(form.client_name),
          inspector_name: clean(form.inspector_name),
          client_phone: clean(form.client_phone),
          client_email: clean(form.client_email),
          property_address: clean(form.property_address),
          pin_code: clean(form.pin_code),
          city: clean(form.city),
          state: clean(form.state),
          template_id: template?.id ?? null,
          property_type: template?.name ?? null,
          inspection_date: form.inspection_date || null,
          inspection_time: clean(form.inspection_time),
          home_age: clean(form.home_age),
          property_size: clean(form.property_size),
          weather: clean(form.weather),
          notes: clean(form.notes),
          current_step: mode === "next" ? 2 : 1,
        })
        .select("id")
        .single();
      if (insertError) throw new Error(insertError.message);

      if (mode === "next") navigate({ to: "/flow/$id/upload", params: { id: data.id } });
      else navigate({ to: "/inspections" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the inspection.");
      setBusy(null);
    }
  }

  return (
    <AppLayout>
      <PageContainer>
        <PageHeader title="New site inspection" description="Step 1 of 5 — who, where and when." />
        <StepTracker active={1} reached={1} />
        <Card>
          <form
            className="app-stack"
            onSubmit={(e) => {
              e.preventDefault();
              void save("next");
            }}
          >
            {error && <Alert tone="error" title="Could not save">{error}</Alert>}
            {Object.keys(errors).length > 0 && (
              <Alert tone="warning" title="Complete the required details to continue">
                Fields marked * are required. {Object.keys(errors).length} still need attention.
              </Alert>
            )}
            <div className="app-form-grid">
              <Field label="Client name *" htmlFor="client_name" error={errors.client_name}>
                <Input id="client_name" invalid={!!errors.client_name} placeholder="e.g. John Smith" value={form.client_name} onChange={set("client_name")} />
              </Field>
              <Field label="Inspector name *" htmlFor="inspector_name" error={errors.inspector_name}>
                <Input id="inspector_name" invalid={!!errors.inspector_name} placeholder="e.g. Marcus Vance" value={form.inspector_name} onChange={set("inspector_name")} />
              </Field>
              <Field label="Phone number" htmlFor="client_phone">
                <Input id="client_phone" type="tel" placeholder="e.g. +91 94995 76736" value={form.client_phone} onChange={set("client_phone")} />
              </Field>
              <Field label="Email address" htmlFor="client_email" error={errors.client_email}>
                <Input id="client_email" invalid={!!errors.client_email} type="email" placeholder="client@example.com" value={form.client_email} onChange={set("client_email")} />
              </Field>
              <Field label="Inspection address *" htmlFor="property_address" error={errors.property_address} className="app-span-2">
                <Input id="property_address" invalid={!!errors.property_address} placeholder="e.g. 742 Evergreen Boulevard" value={form.property_address} onChange={set("property_address")} />
              </Field>
              <Field label="PIN / ZIP code" htmlFor="pin_code">
                <Input id="pin_code" placeholder="e.g. 396001" value={form.pin_code} onChange={set("pin_code")} />
              </Field>
              <Field label="Property type *" htmlFor="template_id" error={errors.template_id} hint="Sets the rooms used in the report">
                <Select
                  id="template_id" invalid={!!errors.template_id}
                  value={form.template_id}
                  onChange={set("template_id")}
                  placeholder={templates.isLoading ? "Loading…" : "Choose a template"}
                  options={(templates.data ?? []).map((t) => ({ value: t.id, label: t.user_id ? `${t.name} (mine)` : t.name }))}
                />
              </Field>
              <Field label="City *" htmlFor="city" error={errors.city}>
                <Input id="city" invalid={!!errors.city} placeholder="e.g. Valsad" value={form.city} onChange={set("city")} />
              </Field>
              <Field label="State" htmlFor="state">
                <Input id="state" placeholder="e.g. Gujarat" value={form.state} onChange={set("state")} />
              </Field>
              <Field label="Date of inspection *" htmlFor="inspection_date" error={errors.inspection_date}>
                <Input id="inspection_date" invalid={!!errors.inspection_date} type="date" value={form.inspection_date} onChange={set("inspection_date")} />
              </Field>
              <Field label="Time of inspection" htmlFor="inspection_time">
                <Input id="inspection_time" type="time" value={form.inspection_time} onChange={set("inspection_time")} />
              </Field>
              <Field label="Age of home" htmlFor="home_age">
                <Input id="home_age" placeholder="e.g. 10 years or built 2014" value={form.home_age} onChange={set("home_age")} />
              </Field>
              <Field label="Property size" htmlFor="property_size">
                <Input id="property_size" placeholder="e.g. 2,400 sq. ft." value={form.property_size} onChange={set("property_size")} />
              </Field>
              <Field label="Weather" htmlFor="weather" className="app-span-2">
                <Input id="weather" placeholder="e.g. Clear, 30°C" value={form.weather} onChange={set("weather")} />
              </Field>
              <Field label="Other info" htmlFor="notes" className="app-span-2">
                <Textarea id="notes" rows={4} placeholder="Special instructions, access notes…" value={form.notes} onChange={set("notes")} />
              </Field>
            </div>
            <div className="app-row app-row--between app-footer">
              <Button type="button" variant="ghost" leadingIcon={<LayoutTemplate />} onClick={() => navigate({ to: "/templates" })}>
                Manage templates
              </Button>
              <span className="app-row">
                <Button type="button" variant="ghost" leadingIcon={<RotateCcw />} onClick={() => setForm({ ...EMPTY, template_id: form.template_id })}>
                  Reset
                </Button>
                <Button type="button" variant="secondary" loading={busy === "draft"} onClick={() => void save("draft")}>
                  Save as draft
                </Button>
                <Button type="submit" loading={busy === "next"} trailingIcon={<ArrowRight />}>
                  Save & upload images
                </Button>
              </span>
            </div>
          </form>
        </Card>
      </PageContainer>
    </AppLayout>
  );
}
