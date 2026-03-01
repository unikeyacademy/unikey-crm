
CREATE TABLE public.co_consultant_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consultant_id uuid NOT NULL REFERENCES public.profiles(id),
  student_id uuid NOT NULL REFERENCES public.students(id),
  work_date date NOT NULL DEFAULT CURRENT_DATE,
  hours numeric NOT NULL,
  hourly_rate numeric NOT NULL DEFAULT 0,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.co_consultant_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view co-consultant hours"
ON public.co_consultant_hours FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Consultants and admins can create co-consultant hours"
ON public.co_consultant_hours FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'consultant'::app_role));

CREATE POLICY "Consultants and admins can update co-consultant hours"
ON public.co_consultant_hours FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'consultant'::app_role));

CREATE POLICY "Only admins can delete co-consultant hours"
ON public.co_consultant_hours FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_co_consultant_hours_updated_at
BEFORE UPDATE ON public.co_consultant_hours
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
