-- Buildings table
CREATE TABLE public.buildings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('public', 'private', 'institution')),
  has_ramp TEXT CHECK (has_ramp IN ('yes', 'no', 'na')),
  has_elevator TEXT CHECK (has_elevator IN ('yes', 'no', 'na')),
  has_wide_doors TEXT CHECK (has_wide_doors IN ('yes', 'no', 'na')),
  has_adapted_bathroom TEXT CHECK (has_adapted_bathroom IN ('yes', 'no', 'na')),
  has_obstacle_free_access TEXT CHECK (has_obstacle_free_access IN ('yes', 'no', 'na')),
  comments TEXT NOT NULL DEFAULT '',
  images TEXT[] NOT NULL DEFAULT '{}',
  verdict TEXT NOT NULL CHECK (verdict IN ('accessible', 'inaccessible')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.buildings ENABLE ROW LEVEL SECURITY;

-- Public read & insert (no auth required)
CREATE POLICY "Anyone can view buildings"
  ON public.buildings FOR SELECT
  USING (true);

CREATE POLICY "Anyone can add buildings"
  ON public.buildings FOR INSERT
  WITH CHECK (true);

CREATE INDEX idx_buildings_created_at ON public.buildings (created_at DESC);

-- Storage bucket for building photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('building-images', 'building-images', true);

CREATE POLICY "Building images are publicly viewable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'building-images');

CREATE POLICY "Anyone can upload building images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'building-images');