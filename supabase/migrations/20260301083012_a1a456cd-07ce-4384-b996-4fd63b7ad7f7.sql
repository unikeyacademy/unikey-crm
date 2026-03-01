
-- Create student_test_scores table
CREATE TABLE public.student_test_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  test_category TEXT NOT NULL, -- 'Standardized', 'Subject/Admissions', 'Language'
  test_name TEXT NOT NULL, -- e.g. 'SAT', 'ACT', 'LNAT', 'UCAT', 'TMUA', 'ESAT', 'TOEFL', 'IELTS'
  score TEXT NOT NULL, -- flexible text to handle different scoring formats
  test_date DATE,
  next_planned_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.student_test_scores ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Authenticated users can view test scores"
  ON public.student_test_scores FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Consultants and admins can create test scores"
  ON public.student_test_scores FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'consultant'::app_role));

CREATE POLICY "Consultants and admins can update test scores"
  ON public.student_test_scores FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'consultant'::app_role));

CREATE POLICY "Only admins can delete test scores"
  ON public.student_test_scores FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_student_test_scores_updated_at
  BEFORE UPDATE ON public.student_test_scores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
