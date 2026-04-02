ALTER TABLE public.students ADD COLUMN IF NOT EXISTS tutor_in_charge text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS secondary_tutor text;