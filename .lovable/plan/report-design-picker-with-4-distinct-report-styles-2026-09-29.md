# Report design picker with 4 distinct report styles

## What you'll get
A new "Choose report design" screen before the final report (between Review and Final report). Your inspection's real photos and findings are used in every preview, so you judge each design with your own data.

Four report designs, each with its own look — not the same page recoloured:

- **A. Editorial** — Swiss-style: large type, black and white with one accent colour, asymmetric grid, thin rules, lots of white space.
- **B. Bold Studio** — neo-brutalist: huge headings, thick black borders, flat colour blocks, hard offset edges, numbered findings as big tiles.
- **C. Luxury Architectural** — magazine feel: serif headings, warm neutrals, full-bleed cover photo, fine gold-grey dividers, calm spacing.
- **D. Data System** — technical: dark cover, severity charts and counts up front, dense finding tables, monospace labels, precise grid.

### The picker screen
- Header with inspection name, step tracker, back button.
- Short title: "Choose a report identity that matches your inspection."
- Large live mini-previews of each design's cover page, with name, one-line description, style tags, "Preview" and "Select".
- Selected design gets a check mark, a thick outline and a "Selected" label (not colour only). You can change it any time.
- Preview window: multiple pages (cover, property details, findings), page arrows, zoom in/out, fullscreen, and "Use this design".
- Bottom bar: "Continue with [design name]" — disabled until one is chosen, shows loading, then goes to the final report.
- Keyboard: arrow keys move between designs, Enter selects, Esc closes preview. Works on desktop and tablet; on phones the designs show one at a time.

### Final report
The Final report page renders in the chosen design, and Download PDF prints that design. A small "Change design" link returns to the picker.

## Technical details
- Migration: add `report_style text not null default 'editorial'` to `inspections`.
- Step tracker becomes 6 steps; new route `flow.$id.design.tsx`; review's "Create final report" goes to design step.
- `src/components/report-styles/` with one component per style (`Editorial`, `Studio`, `Luxury`, `DataSystem`) sharing a `ReportData` type and a `pages` API so the preview can paginate. Each has its own scoped CSS file.
- Picker UI (header, cards, modal, continue bar) uses the attached design system components and tokens.
- **Deliberate deviation:** the four report designs themselves use their own fonts (loaded via head links) and colours, because the brief requires independent visual identities. This is scoped to the report pages only; the app UI stays on the design system.
- Uses existing stack (TanStack Router, React Query) instead of the brief's React Router/Zustand/Axios, which this project doesn't use.
