
-- Extend student_university_targets with decisions & outcomes fields
ALTER TABLE public.student_university_targets
  ADD COLUMN round text,
  ADD COLUMN offer_conditions text,
  ADD COLUMN firm_choice boolean DEFAULT false,
  ADD COLUMN insurance_choice boolean DEFAULT false,
  ADD COLUMN waitlist_plan_status text,
  ADD COLUMN clearing_shortlist boolean DEFAULT false,
  ADD COLUMN enrolment_intention text,
  ADD COLUMN matriculation_confirmed boolean DEFAULT false;
