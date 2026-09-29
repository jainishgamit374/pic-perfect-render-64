-- Profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  email text,
  full_name text,
  company text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data ->> 'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Inspections
CREATE TYPE public.inspection_status AS ENUM ('draft','processing','review','completed','failed');
CREATE TYPE public.finding_severity AS ENUM ('normal','minor','moderate','defective','critical');

CREATE TABLE public.inspections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  property_address text,
  inspector_name text,
  status public.inspection_status NOT NULL DEFAULT 'draft',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inspections TO authenticated;
GRANT ALL ON public.inspections TO service_role;
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own inspections" ON public.inspections FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX inspections_user_idx ON public.inspections (user_id, created_at DESC);

-- Images
CREATE TABLE public.inspection_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id uuid NOT NULL REFERENCES public.inspections(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  storage_path text NOT NULL,
  filename text NOT NULL,
  size_bytes bigint,
  section text,
  location_label text,
  kind text NOT NULL DEFAULT 'visual',
  analysis_state text NOT NULL DEFAULT 'pending',
  severity public.finding_severity,
  summary text,
  recommendation text,
  confidence numeric,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  analyzed_at timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inspection_images TO authenticated;
GRANT ALL ON public.inspection_images TO service_role;
ALTER TABLE public.inspection_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own images" ON public.inspection_images FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX inspection_images_inspection_idx ON public.inspection_images (inspection_id, created_at);
