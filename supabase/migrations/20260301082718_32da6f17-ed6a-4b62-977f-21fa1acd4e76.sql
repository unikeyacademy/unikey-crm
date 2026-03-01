
-- Step 1: Extend students table with missing profile fields
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS passport_nationality text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS timezone text,
  ADD COLUMN IF NOT EXISTS graduation_year integer,
  ADD COLUMN IF NOT EXISTS target_major_primary text,
  ADD COLUMN IF NOT EXISTS target_major_secondary text,
  ADD COLUMN IF NOT EXISTS track text,
  ADD COLUMN IF NOT EXISTS risk_profile text,
  ADD COLUMN IF NOT EXISTS lead_source text,
  ADD COLUMN IF NOT EXISTS engagement_stage text DEFAULT 'Active',
  ADD COLUMN IF NOT EXISTS secondary_consultant_id uuid,
  ADD COLUMN IF NOT EXISTS academic_strengths text,
  ADD COLUMN IF NOT EXISTS academic_weaknesses text,
  ADD COLUMN IF NOT EXISTS current_gpa text;
