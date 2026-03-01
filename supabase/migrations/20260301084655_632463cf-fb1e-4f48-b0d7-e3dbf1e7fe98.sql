
-- ============================================
-- STEP 5: Financial Management tables
-- ============================================

-- Service packages
CREATE TABLE public.student_packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  package_type TEXT NOT NULL,
  package_name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  start_date DATE,
  end_date DATE,
  contract_type TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.student_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view packages" ON public.student_packages FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Consultants and admins can create packages" ON public.student_packages FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'consultant'::app_role));
CREATE POLICY "Consultants and admins can update packages" ON public.student_packages FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'consultant'::app_role));
CREATE POLICY "Only admins can delete packages" ON public.student_packages FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_student_packages_updated_at BEFORE UPDATE ON public.student_packages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Payments
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  package_id UUID NOT NULL REFERENCES public.student_packages(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_type TEXT NOT NULL DEFAULT 'installment',
  payment_method TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  invoice_ref TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view payments" ON public.payments FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Consultants and admins can create payments" ON public.payments FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'consultant'::app_role));
CREATE POLICY "Consultants and admins can update payments" ON public.payments FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'consultant'::app_role));
CREATE POLICY "Only admins can delete payments" ON public.payments FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- STEP 6: ECA taxonomy upgrade
-- ============================================
ALTER TABLE public.student_ecas
  ADD COLUMN role TEXT,
  ADD COLUMN time_commitment TEXT,
  ADD COLUMN impact TEXT,
  ADD COLUMN awards TEXT,
  ADD COLUMN reference_mentor TEXT,
  ADD COLUMN link TEXT,
  ADD COLUMN primary_category TEXT,
  ADD COLUMN secondary_category TEXT;

-- ============================================
-- STEP 7: Meeting improvements
-- ============================================
ALTER TABLE public.consultations
  ADD COLUMN attendees TEXT[],
  ADD COLUMN key_decisions TEXT;
