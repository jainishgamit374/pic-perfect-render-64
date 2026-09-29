CREATE TABLE public.templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'Residential',
  sections jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.templates TO authenticated;
GRANT ALL ON public.templates TO service_role;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read builtin or own templates" ON public.templates FOR SELECT TO authenticated USING (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY "insert own templates" ON public.templates FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "update own templates" ON public.templates FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "delete own templates" ON public.templates FOR DELETE TO authenticated USING (user_id = auth.uid());

INSERT INTO public.templates (user_id, name, category, sections) VALUES
(NULL, 'Residential Villa / House', 'Residential', '[{"name":"Inside Areas","rooms":["Living Room","Master Bedroom","Kitchen","Bathroom"]},{"name":"Outside Areas","rooms":["Balcony / Terrace","Main Entrance & Porch","Roof"]},{"name":"Additional Checkpoints","rooms":["Electrical DB Panel","Plumbing & Overhead Tank"]}]'),
(NULL, 'Apartment / Condominium', 'Residential', '[{"name":"Inside Areas","rooms":["Living Room","Bedroom","Kitchen","Bathroom"]},{"name":"Outside Areas","rooms":["Balcony","Common Corridor"]},{"name":"Additional Checkpoints","rooms":["Electrical DB Panel","Plumbing"]}]'),
(NULL, 'Commercial Office Space', 'Commercial', '[{"name":"Work Areas","rooms":["Open Office","Meeting Rooms","Reception"]},{"name":"Facilities","rooms":["Restrooms","Pantry","Server Room"]},{"name":"Building Systems","rooms":["HVAC","Fire Safety","Electrical"]}]'),
(NULL, 'Industrial Warehouse Facility', 'Industrial', '[{"name":"Storage","rooms":["Racking Area","Loading Dock"]},{"name":"Structure","rooms":["Roof & Skylights","Walls & Cladding","Floor Slab"]},{"name":"Systems","rooms":["Electrical","Fire Suppression","Drainage"]}]');

ALTER TABLE public.inspections
  ADD COLUMN client_name text,
  ADD COLUMN client_phone text,
  ADD COLUMN client_email text,
  ADD COLUMN city text,
  ADD COLUMN state text,
  ADD COLUMN pin_code text,
  ADD COLUMN property_type text,
  ADD COLUMN template_id uuid,
  ADD COLUMN inspection_date date,
  ADD COLUMN inspection_time text,
  ADD COLUMN home_age text,
  ADD COLUMN property_size text,
  ADD COLUMN weather text,
  ADD COLUMN current_step integer NOT NULL DEFAULT 1;

ALTER TABLE public.inspection_images
  ADD COLUMN room text,
  ADD COLUMN area text,
  ADD COLUMN thermal_observation text,
  ADD COLUMN visual_observation text,
  ADD COLUMN pair_key text;