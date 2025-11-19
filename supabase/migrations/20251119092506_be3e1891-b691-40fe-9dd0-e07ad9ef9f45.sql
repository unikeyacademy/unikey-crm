-- Add curriculum field to students table
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS curriculum text;