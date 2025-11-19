-- Add missing fields to students table
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS gender TEXT,
  ADD COLUMN IF NOT EXISTS ib_predicted_grade INTEGER,
  ADD COLUMN IF NOT EXISTS current_stage TEXT DEFAULT 'Initial Consultation',
  ADD COLUMN IF NOT EXISTS region_interest TEXT[],
  ADD COLUMN IF NOT EXISTS academic_interests TEXT[],
  ADD COLUMN IF NOT EXISTS contract_signed_date DATE,
  ADD COLUMN IF NOT EXISTS parent_email TEXT,
  ADD COLUMN IF NOT EXISTS parent_phone TEXT,
  ADD COLUMN IF NOT EXISTS parent_names TEXT;

-- Create parent_communications table
CREATE TABLE IF NOT EXISTS public.parent_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  consultant_id UUID NOT NULL REFERENCES auth.users(id),
  communication_date TIMESTAMPTZ NOT NULL,
  communication_type TEXT NOT NULL,
  subject TEXT,
  notes TEXT,
  follow_up_required BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create ECAs table
CREATE TABLE IF NOT EXISTS public.student_ecas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  eca_name TEXT NOT NULL,
  eca_type TEXT NOT NULL,
  status TEXT DEFAULT 'planning',
  start_date DATE,
  end_date DATE,
  lead_consultant_id UUID REFERENCES auth.users(id),
  completion_percentage INTEGER DEFAULT 0,
  description TEXT,
  objectives TEXT,
  milestones JSONB,
  outcomes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create university targets table
CREATE TABLE IF NOT EXISTS public.student_university_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  university_name TEXT NOT NULL,
  program TEXT,
  country TEXT,
  application_system TEXT,
  deadline_date DATE,
  status TEXT DEFAULT 'researching',
  priority TEXT DEFAULT 'medium',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE public.parent_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_ecas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_university_targets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for parent_communications
CREATE POLICY "Authenticated users can view parent communications"
  ON public.parent_communications FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Consultants and admins can create parent communications"
  ON public.parent_communications FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'consultant')
  );

CREATE POLICY "Consultants and admins can update parent communications"
  ON public.parent_communications FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'consultant')
  );

-- RLS Policies for student_ecas
CREATE POLICY "Authenticated users can view ECAs"
  ON public.student_ecas FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Consultants and admins can create ECAs"
  ON public.student_ecas FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'consultant')
  );

CREATE POLICY "Consultants and admins can update ECAs"
  ON public.student_ecas FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'consultant')
  );

CREATE POLICY "Only admins can delete ECAs"
  ON public.student_ecas FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for student_university_targets
CREATE POLICY "Authenticated users can view university targets"
  ON public.student_university_targets FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Consultants and admins can create university targets"
  ON public.student_university_targets FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'consultant')
  );

CREATE POLICY "Consultants and admins can update university targets"
  ON public.student_university_targets FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'consultant')
  );

CREATE POLICY "Only admins can delete university targets"
  ON public.student_university_targets FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Add triggers for updated_at
CREATE TRIGGER update_parent_communications_updated_at
  BEFORE UPDATE ON public.parent_communications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_student_ecas_updated_at
  BEFORE UPDATE ON public.student_ecas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_student_university_targets_updated_at
  BEFORE UPDATE ON public.student_university_targets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();