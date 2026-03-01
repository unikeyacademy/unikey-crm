
-- Create student_essays table
CREATE TABLE public.student_essays (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  university_target_id UUID REFERENCES public.student_university_targets(id) ON DELETE SET NULL,
  essay_region TEXT NOT NULL, -- 'US' or 'UK'
  essay_type TEXT NOT NULL, -- e.g. 'Common App Personal Statement', 'UCAS Personal Statement', etc.
  title TEXT, -- optional custom title
  status TEXT NOT NULL DEFAULT 'Not Started', -- 'Not Started', 'Drafting', 'Ready for Review', 'Final'
  google_doc_link TEXT,
  owner TEXT, -- 'Student' or 'Consultant'
  last_updated_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.student_essays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view essays"
  ON public.student_essays FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Consultants and admins can create essays"
  ON public.student_essays FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'consultant'::app_role));

CREATE POLICY "Consultants and admins can update essays"
  ON public.student_essays FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'consultant'::app_role));

CREATE POLICY "Only admins can delete essays"
  ON public.student_essays FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_student_essays_updated_at
  BEFORE UPDATE ON public.student_essays
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create student_interviews table
CREATE TABLE public.student_interviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  university_target_id UUID REFERENCES public.student_university_targets(id) ON DELETE SET NULL,
  university_name TEXT NOT NULL,
  interview_type TEXT NOT NULL, -- 'Oxbridge Academic', 'Medicine MMI', 'US Alumni', 'US Admissions', 'Other'
  interview_date TIMESTAMP WITH TIME ZONE,
  prep_session_dates TIMESTAMP WITH TIME ZONE[],
  tutor_names TEXT[],
  post_interview_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.student_interviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view interviews"
  ON public.student_interviews FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Consultants and admins can create interviews"
  ON public.student_interviews FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'consultant'::app_role));

CREATE POLICY "Consultants and admins can update interviews"
  ON public.student_interviews FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'consultant'::app_role));

CREATE POLICY "Only admins can delete interviews"
  ON public.student_interviews FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_student_interviews_updated_at
  BEFORE UPDATE ON public.student_interviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
