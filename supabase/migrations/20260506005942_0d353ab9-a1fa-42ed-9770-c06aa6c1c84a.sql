-- Create student_flags table
CREATE TABLE public.student_flags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  flag_level TEXT NOT NULL CHECK (flag_level IN ('red', 'yellow', 'green')),
  category TEXT NOT NULL,
  reason TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  source TEXT NOT NULL DEFAULT 'hermes',
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_student_flags_student ON public.student_flags(student_id);
CREATE INDEX idx_student_flags_level ON public.student_flags(flag_level);
CREATE UNIQUE INDEX idx_student_flags_unique ON public.student_flags(student_id, category, source);

ALTER TABLE public.student_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view student flags"
  ON public.student_flags FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Consultants and admins can create student flags"
  ON public.student_flags FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'consultant'::app_role));

CREATE POLICY "Consultants and admins can update student flags"
  ON public.student_flags FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'consultant'::app_role));

CREATE POLICY "Admins can delete student flags"
  ON public.student_flags FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_student_flags_updated_at
  BEFORE UPDATE ON public.student_flags
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();