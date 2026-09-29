import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Building2, Factory, FolderOpen, Home, Plus, Save, Trash2 } from "lucide-react";
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  IconButton,
  Input,
  PageContainer,
  PageHeader,
  Skeleton,
} from "@/design-system/gentle-code-library-71de11";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { listTemplates, templateSections, type TemplateSection } from "@/lib/flow";

export const Route = createFileRoute("/_authenticated/templates")({
  head: () => ({
    meta: [
      { title: "Templates — Inspect" },
      { name: "description", content: "Choose and customise the sections and rooms used in inspection reports." },
      { property: "og:title", content: "Inspection templates — Inspect" },
      { property: "og:description", content: "Edit report templates for villas, apartments, offices and warehouses." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TemplatesPage,
});

const ICON: Record<string, React.ReactNode> = {
  Residential: <Home />,
  Commercial: <Building2 />,
  Industrial: <Factory />,
};

function TemplatesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const templates = useQuery({ queryKey: ["templates"], queryFn: listTemplates });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [sections, setSections] = useState<TemplateSection[]>([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const selected = templates.data?.find((t) => t.id === selectedId) ?? templates.data?.[0] ?? null;

  useEffect(() => {
    if (!selected) return;
    setName(selected.name);
    setSections(templateSections(selected));
    setDirty(false);
  }, [selected?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const groups = useMemo(() => {
    const g = new Map<string, typeof templates.data>();
    for (const t of templates.data ?? []) {
      const key = t.user_id ? "My templates" : t.category;
      g.set(key, [...(g.get(key) ?? []), t]);
    }
    return [...g.entries()];
  }, [templates.data]);

  function update(fn: (s: TemplateSection[]) => TemplateSection[]) {
    setSections((s) => fn(structuredClone(s)));
    setDirty(true);
  }
  const move = <T,>(arr: T[], i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= arr.length) return arr;
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
    return arr;
  };

  async function save() {
    if (!selected) return;
    setSaving(true);
    setMessage(null);
    const payload = sections
      .map((s) => ({ name: s.name.trim() || "Untitled section", rooms: s.rooms.map((r) => r.trim()).filter(Boolean) }));
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Your session expired.");
      if (selected.user_id) {
        const { error } = await supabase
          .from("templates")
          .update({ name: name.trim() || selected.name, sections: payload, updated_at: new Date().toISOString() })
          .eq("id", selected.id);
        if (error) throw new Error(error.message);
        setMessage({ tone: "success", text: "Template saved." });
      } else {
        const { data, error } = await supabase
          .from("templates")
          .insert({
            user_id: u.user.id,
            name: name.trim() === selected.name ? `${selected.name} (custom)` : name.trim() || selected.name,
            category: selected.category,
            sections: payload,
          })
          .select("id")
          .single();
        if (error) throw new Error(error.message);
        setSelectedId(data.id);
        setMessage({ tone: "success", text: "Built-in templates stay unchanged, so your edits were saved as a new template." });
      }
      await queryClient.invalidateQueries({ queryKey: ["templates"] });
      setDirty(false);
    } catch (err) {
      setMessage({ tone: "error", text: err instanceof Error ? err.message : "Could not save." });
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!selected?.user_id || !window.confirm(`Delete "${selected.name}"?`)) return;
    await supabase.from("templates").delete().eq("id", selected.id);
    setSelectedId(null);
    await queryClient.invalidateQueries({ queryKey: ["templates"] });
  }

  const roomCount = sections.reduce((n, s) => n + s.rooms.length, 0);

  return (
    <AppLayout>
      <PageContainer>
        <PageHeader
          title="Templates"
          description="Pick a template, then add, rename, reorder or remove sections and rooms."
          actions={
            <Button leadingIcon={<Plus />} onClick={() => navigate({ to: "/inspections/new" })}>
              Start inspection
            </Button>
          }
        />
        {message && <Alert tone={message.tone} title={message.tone === "success" ? "Saved" : "Could not save"}>{message.text}</Alert>}
        {templates.isLoading ? (
          <Skeleton shape="block" />
        ) : (
          <div className="app-template-layout">
            <Card padding="none" className="app-template-list">
              {groups.map(([group, items]) => (
                <div key={group} className="app-template-group">
                  <div className="app-row app-row--between ds-caption">
                    <span>{group.toUpperCase()}</span>
                    <span>{items?.length}</span>
                  </div>
                  {items?.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className="app-template-item"
                      aria-pressed={t.id === selected?.id}
                      onClick={() => setSelectedId(t.id)}
                    >
                      {ICON[t.category] ?? <Home />}
                      <span>{t.name}</span>
                    </button>
                  ))}
                </div>
              ))}
            </Card>

            <Card className="app-stack">
              {!selected ? (
                <EmptyState title="No templates" description="Templates will appear here." />
              ) : (
                <>
                  <div className="app-row app-row--between">
                    <div className="app-stack-sm">
                      <Input aria-label="Template name" value={name} onChange={(e) => { setName(e.target.value); setDirty(true); }} />
                      <span className="app-row ds-body-sm">
                        <Badge tone="brand">{selected.category}</Badge>
                        {sections.length} sections · {roomCount} rooms
                        {!selected.user_id && <Badge tone="neutral">Built-in</Badge>}
                      </span>
                    </div>
                    <span className="app-row">
                      {selected.user_id && (
                        <Button variant="destructive" leadingIcon={<Trash2 />} onClick={() => void remove()}>
                          Delete
                        </Button>
                      )}
                      <Button leadingIcon={<Save />} loading={saving} disabled={!dirty} onClick={() => void save()}>
                        {selected.user_id ? "Save template" : "Save as my template"}
                      </Button>
                    </span>
                  </div>

                  {sections.map((section, si) => (
                    <div key={si} className="app-tree-section">
                      <div className="app-row app-tree-head">
                        <FolderOpen aria-hidden />
                        <Input
                          aria-label="Section name"
                          value={section.name}
                          onChange={(e) => update((s) => { s[si]!.name = e.target.value; return s; })}
                        />
                        <IconButton label="Move section up" size="sm" variant="ghost" icon={<ArrowUp />} onClick={() => update((s) => move(s, si, -1))} />
                        <IconButton label="Move section down" size="sm" variant="ghost" icon={<ArrowDown />} onClick={() => update((s) => move(s, si, 1))} />
                        <IconButton label="Delete section" size="sm" variant="ghost" icon={<Trash2 />} onClick={() => update((s) => { s.splice(si, 1); return s; })} />
                      </div>
                      <div className="app-tree-rooms">
                        {section.rooms.map((room, ri) => (
                          <div key={ri} className="app-row app-tree-room">
                            <Input
                              aria-label="Room name"
                              value={room}
                              onChange={(e) => update((s) => { s[si]!.rooms[ri] = e.target.value; return s; })}
                            />
                            <IconButton label="Move room up" size="sm" variant="ghost" icon={<ArrowUp />} onClick={() => update((s) => { move(s[si]!.rooms, ri, -1); return s; })} />
                            <IconButton label="Move room down" size="sm" variant="ghost" icon={<ArrowDown />} onClick={() => update((s) => { move(s[si]!.rooms, ri, 1); return s; })} />
                            <IconButton label="Remove room" size="sm" variant="ghost" icon={<Trash2 />} onClick={() => update((s) => { s[si]!.rooms.splice(ri, 1); return s; })} />
                          </div>
                        ))}
                        <div>
                          <Button size="sm" variant="ghost" leadingIcon={<Plus />} onClick={() => update((s) => { s[si]!.rooms.push("New room"); return s; })}>
                            Add room
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div>
                    <Button variant="secondary" leadingIcon={<Plus />} onClick={() => update((s) => [...s, { name: "New section", rooms: [] }])}>
                      Add section
                    </Button>
                  </div>
                </>
              )}
            </Card>
          </div>
        )}
      </PageContainer>
    </AppLayout>
  );
}
