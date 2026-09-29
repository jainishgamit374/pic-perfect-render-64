# Full 5-step inspection flow with editable templates

## What you'll get
A guided flow with a step tracker at the top of every screen:

```text
1 Property details -> 2 Upload images -> 3 AI analysis -> 4 Review & edit -> 5 Final report
```

- **Templates page**: a library on the left (Residential Villa, Apartment, Office, Warehouse) and the chosen template's sections and rooms on the right. You can add, rename, reorder and delete sections and rooms, then save your own templates.
- **Step 1 – Property details**: client name, phone, email, address, city, state, PIN, property type (picks the template), date and time, age, size, weather, notes. Save as draft or continue.
- **Step 2 – Upload images**: drop zone, totals (all / visual / thermal), photos in capture order with filter tabs, visual and thermal photos shown side by side in pairs. "Start AI analysis" button.
- **Step 3 – AI analysis**: overall progress, the photo being analysed now, a simple checklist of stages, and counts (total / done / remaining). Moves to review when finished.
- **Step 4 – Review & edit**: each photo pair with editable room (chosen from the template's rooms), area, severity, thermal observation and visual observation. Changes save automatically.
- **Step 5 – Final report**: a clean printable report (cover, property details, findings with photos) with a Download PDF button (uses the browser's print-to-PDF).

The existing inspection pages keep working. Each inspection remembers which step it's on, so you can come back to it later.

## Technical details
- New tables: `templates` (built-in and per-user, sections/rooms stored as structured data), with RLS so each user only sees built-ins plus their own. Four built-in templates are added in the migration.
- `inspections` gets new columns: client name, phone, email, city, state, PIN, property type, template id, date/time, age, size, weather, current step.
- `inspection_images` gets editable fields: room, area, thermal observation, visual observation, pair key (pairs X/Y filenames such as RB20492X / RB20492Y).
- Routes under `_authenticated`: `/templates`, `/inspections/new` (step 1), `/inspections/$id/upload`, `/$id/analysis`, `/$id/review`, `/$id/report`. A shared `StepTracker` wraps all five.
- Reuses the existing upload and AI analysis code; the AI prompt also receives the template's room list so it can suggest a room.
- All styling uses the attached design system components and tokens.
