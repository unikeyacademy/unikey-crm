-- Create student_documents table for document management
CREATE TABLE IF NOT EXISTS public.student_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  document_name TEXT NOT NULL,
  document_type TEXT NOT NULL, -- 'transcript', 'essay', 'recommendation', 'test_scores', 'other'
  file_path TEXT NOT NULL,
  file_size INTEGER,
  uploaded_by UUID NOT NULL,
  upload_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create application_checklists table
CREATE TABLE IF NOT EXISTS public.application_checklists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  university_target_id UUID REFERENCES public.student_university_targets(id) ON DELETE CASCADE,
  checklist_name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create checklist_items table
CREATE TABLE IF NOT EXISTS public.checklist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  checklist_id UUID NOT NULL REFERENCES public.application_checklists(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  description TEXT,
  is_completed BOOLEAN DEFAULT false,
  completed_date TIMESTAMP WITH TIME ZONE,
  completed_by UUID,
  due_date TIMESTAMP WITH TIME ZONE,
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high'
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.student_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for student_documents
CREATE POLICY "Authenticated users can view documents"
  ON public.student_documents FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Consultants and admins can upload documents"
  ON public.student_documents FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'consultant'::app_role)
  );

CREATE POLICY "Consultants and admins can update documents"
  ON public.student_documents FOR UPDATE
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'consultant'::app_role)
  );

CREATE POLICY "Only admins can delete documents"
  ON public.student_documents FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for application_checklists
CREATE POLICY "Authenticated users can view checklists"
  ON public.application_checklists FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Consultants and admins can create checklists"
  ON public.application_checklists FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'consultant'::app_role)
  );

CREATE POLICY "Consultants and admins can update checklists"
  ON public.application_checklists FOR UPDATE
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'consultant'::app_role)
  );

CREATE POLICY "Only admins can delete checklists"
  ON public.application_checklists FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for checklist_items
CREATE POLICY "Authenticated users can view checklist items"
  ON public.checklist_items FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Consultants and admins can create checklist items"
  ON public.checklist_items FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'consultant'::app_role)
  );

CREATE POLICY "Consultants and admins can update checklist items"
  ON public.checklist_items FOR UPDATE
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'consultant'::app_role)
  );

CREATE POLICY "Only admins can delete checklist items"
  ON public.checklist_items FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create storage bucket for student documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('student-documents', 'student-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for student documents
CREATE POLICY "Authenticated users can view student documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'student-documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "Consultants and admins can upload student documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'student-documents' AND
    (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'consultant'::app_role))
  );

CREATE POLICY "Consultants and admins can update student documents"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'student-documents' AND
    (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'consultant'::app_role))
  );

CREATE POLICY "Only admins can delete student documents from storage"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'student-documents' AND
    has_role(auth.uid(), 'admin'::app_role)
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_student_documents_student_id ON public.student_documents(student_id);
CREATE INDEX IF NOT EXISTS idx_application_checklists_student_id ON public.application_checklists(student_id);
CREATE INDEX IF NOT EXISTS idx_checklist_items_checklist_id ON public.checklist_items(checklist_id);

-- Create trigger for updated_at
CREATE TRIGGER update_student_documents_updated_at
  BEFORE UPDATE ON public.student_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_application_checklists_updated_at
  BEFORE UPDATE ON public.application_checklists
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_checklist_items_updated_at
  BEFORE UPDATE ON public.checklist_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();