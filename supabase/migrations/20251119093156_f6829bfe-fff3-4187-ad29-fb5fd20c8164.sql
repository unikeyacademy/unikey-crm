-- Change subject_choices column to jsonb to store structured data with predicted grades
ALTER TABLE public.students 
ALTER COLUMN subject_choices TYPE jsonb USING 
  CASE 
    WHEN subject_choices IS NULL THEN NULL
    ELSE jsonb_build_array(subject_choices)
  END;