-- =============================================
-- CREATE SPECIALIZED PROFILES SYSTEM
-- =============================================
-- Allows lawyers to create multiple specialized profiles
-- (e.g., Generic, Corporate Law, Family Law, etc.)

-- Create specialized_profiles table
CREATE TABLE IF NOT EXISTS public.specialized_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lawyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  specialization_name TEXT NOT NULL,
  is_generic BOOLEAN DEFAULT false,
  hourly_rate DECIMAL(10, 2),
  bio TEXT,
  bio_extended TEXT,
  years_of_experience INTEGER,
  success_rate DECIMAL(5, 2),
  total_cases INTEGER DEFAULT 0,
  average_rating DECIMAL(3, 2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure only one generic profile per lawyer
  CONSTRAINT unique_generic_per_lawyer UNIQUE NULLS NOT DISTINCT (lawyer_id, is_generic) WHERE is_generic = true,
  
  -- Ensure unique specialization names per lawyer
  CONSTRAINT unique_specialization_per_lawyer UNIQUE (lawyer_id, specialization_name)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_specialized_profiles_lawyer_id ON public.specialized_profiles(lawyer_id);
CREATE INDEX IF NOT EXISTS idx_specialized_profiles_specialization ON public.specialized_profiles(specialization_name);
CREATE INDEX IF NOT EXISTS idx_specialized_profiles_active ON public.specialized_profiles(lawyer_id, is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.specialized_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "specialized_profiles_select_own"
  ON public.specialized_profiles FOR SELECT
  USING (auth.uid() = lawyer_id);

CREATE POLICY "specialized_profiles_select_public"
  ON public.specialized_profiles FOR SELECT
  USING (is_active = true);

CREATE POLICY "specialized_profiles_insert_own"
  ON public.specialized_profiles FOR INSERT
  WITH CHECK (auth.uid() = lawyer_id);

CREATE POLICY "specialized_profiles_update_own"
  ON public.specialized_profiles FOR UPDATE
  USING (auth.uid() = lawyer_id)
  WITH CHECK (auth.uid() = lawyer_id);

CREATE POLICY "specialized_profiles_delete_own"
  ON public.specialized_profiles FOR DELETE
  USING (auth.uid() = lawyer_id);

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_specialized_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_specialized_profiles_updated_at
  BEFORE UPDATE ON public.specialized_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_specialized_profiles_updated_at();

-- Add comment
COMMENT ON TABLE public.specialized_profiles IS
  'Allows lawyers to create multiple specialized profiles (generic + specialized)';

