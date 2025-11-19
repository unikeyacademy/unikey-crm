-- Add subject_choices field to students table
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS subject_choices text[];