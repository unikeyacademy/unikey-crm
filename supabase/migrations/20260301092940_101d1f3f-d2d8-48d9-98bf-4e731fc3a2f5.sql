
CREATE TABLE public.co_consultant_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  default_hourly_rate numeric NOT NULL DEFAULT 0,
  specialisation text,
  contract_start_date date,
  contract_end_date date,
  payment_terms text,
  bank_details text,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.co_consultant_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view co-consultant profiles"
ON public.co_consultant_profiles FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Consultants and admins can create co-consultant profiles"
ON public.co_consultant_profiles FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'consultant'::app_role));

CREATE POLICY "Consultants and admins can update co-consultant profiles"
ON public.co_consultant_profiles FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'consultant'::app_role));

CREATE POLICY "Only admins can delete co-consultant profiles"
ON public.co_consultant_profiles FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_co_consultant_profiles_updated_at
BEFORE UPDATE ON public.co_consultant_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update co_consultant_hours to reference the new profiles table
ALTER TABLE public.co_consultant_hours
  ADD COLUMN co_consultant_profile_id uuid REFERENCES public.co_consultant_profiles(id);
