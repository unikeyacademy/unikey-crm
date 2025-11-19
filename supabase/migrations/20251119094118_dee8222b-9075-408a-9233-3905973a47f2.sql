-- Create ECA opportunities database table
CREATE TABLE public.eca_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- Competition, Research Program, Summer Program, etc.
  subject_areas TEXT[] NOT NULL DEFAULT '{}',
  eligibility TEXT,
  deadline_date DATE,
  deadline_type TEXT DEFAULT 'annual', -- annual, rolling, one-time
  required_documents TEXT[] DEFAULT '{}',
  registration_fee TEXT,
  cost TEXT,
  prestige_level TEXT, -- high, medium, low
  time_commitment TEXT,
  best_for TEXT[] DEFAULT '{}', -- UK applicants, US applicants, STEM majors, etc.
  website TEXT,
  past_success_notes TEXT,
  internal_notes TEXT,
  is_active BOOLEAN DEFAULT true,
  is_recommended BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.eca_opportunities ENABLE ROW LEVEL SECURITY;

-- Policies for ECA opportunities
CREATE POLICY "Authenticated users can view active ECAs"
  ON public.eca_opportunities
  FOR SELECT
  USING (auth.uid() IS NOT NULL AND is_active = true);

CREATE POLICY "Consultants and admins can view all ECAs"
  ON public.eca_opportunities
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'consultant'::app_role));

CREATE POLICY "Consultants and admins can create ECAs"
  ON public.eca_opportunities
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'consultant'::app_role));

CREATE POLICY "Consultants and admins can update ECAs"
  ON public.eca_opportunities
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'consultant'::app_role));

CREATE POLICY "Only admins can delete ECAs"
  ON public.eca_opportunities
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_eca_opportunities_updated_at
  BEFORE UPDATE ON public.eca_opportunities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();