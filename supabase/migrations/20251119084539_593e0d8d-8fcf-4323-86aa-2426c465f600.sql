-- Create task_templates table for stage-based task automation
CREATE TABLE IF NOT EXISTS public.task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT NOT NULL,
  stage TEXT,
  description TEXT,
  tasks JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id)
);

-- Create university_deadline_templates table for deadline cascade automation
CREATE TABLE IF NOT EXISTS public.university_deadline_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT NOT NULL,
  application_system TEXT,
  milestone_tasks JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add tracking fields to existing tables
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS stage_history JSONB DEFAULT '[]';
ALTER TABLE public.student_university_targets ADD COLUMN IF NOT EXISTS tasks_generated BOOLEAN DEFAULT false;

-- Enable RLS
ALTER TABLE public.task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.university_deadline_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for task_templates
CREATE POLICY "Authenticated users can view task templates"
  ON public.task_templates FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Consultants and admins can create task templates"
  ON public.task_templates FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'consultant'::app_role));

CREATE POLICY "Consultants and admins can update task templates"
  ON public.task_templates FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'consultant'::app_role));

CREATE POLICY "Only admins can delete task templates"
  ON public.task_templates FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for university_deadline_templates
CREATE POLICY "Authenticated users can view deadline templates"
  ON public.university_deadline_templates FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Consultants and admins can create deadline templates"
  ON public.university_deadline_templates FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'consultant'::app_role));

CREATE POLICY "Consultants and admins can update deadline templates"
  ON public.university_deadline_templates FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'consultant'::app_role));

-- Trigger for updated_at on task_templates
CREATE TRIGGER update_task_templates_updated_at
  BEFORE UPDATE ON public.task_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default task templates
INSERT INTO public.university_deadline_templates (template_name, application_system, milestone_tasks) VALUES
('Common App Deadline Cascade', 'Common App', '[
  {"months_before": 6, "title": "Research university requirements and essay prompts", "type": "Research", "priority": "medium"},
  {"months_before": 5, "title": "Finalize university as application target", "type": "Planning", "priority": "high"},
  {"months_before": 4, "title": "Brainstorm Common App essay topics", "type": "Essay", "priority": "high"},
  {"months_before": 3.5, "title": "Complete Common App essay first draft", "type": "Essay", "priority": "high"},
  {"months_before": 3, "title": "Request teacher recommendations", "type": "Administrative", "priority": "high"},
  {"months_before": 2.5, "title": "Request counselor recommendation", "type": "Administrative", "priority": "high"},
  {"months_before": 2, "title": "Complete supplemental essay drafts", "type": "Essay", "priority": "high"},
  {"months_before": 1.5, "title": "Final essay revisions with consultant", "type": "Essay", "priority": "high"},
  {"months_before": 1, "title": "Complete activities list and honors section", "type": "Administrative", "priority": "medium"},
  {"months_before": 0.5, "title": "Review complete application for accuracy", "type": "Review", "priority": "high"},
  {"weeks_before": 1, "title": "Final checks before submission", "type": "Review", "priority": "high"},
  {"days_before": 1, "title": "Submit application", "type": "Submission", "priority": "high"}
]'),
('UCAS Deadline Cascade', 'UCAS', '[
  {"months_before": 6, "title": "Research UK university requirements", "type": "Research", "priority": "medium"},
  {"months_before": 5, "title": "Finalize UCAS university choices (5 max)", "type": "Planning", "priority": "high"},
  {"months_before": 4, "title": "Brainstorm personal statement topics", "type": "Essay", "priority": "high"},
  {"months_before": 3, "title": "Complete personal statement first draft", "type": "Essay", "priority": "high"},
  {"months_before": 2.5, "title": "Request academic reference from teacher", "type": "Administrative", "priority": "high"},
  {"months_before": 2, "title": "Personal statement revisions", "type": "Essay", "priority": "high"},
  {"months_before": 1.5, "title": "Complete UCAS application form", "type": "Administrative", "priority": "medium"},
  {"months_before": 1, "title": "Final personal statement review", "type": "Review", "priority": "high"},
  {"weeks_before": 2, "title": "Review complete UCAS application", "type": "Review", "priority": "high"},
  {"days_before": 3, "title": "Final checks and payment", "type": "Administrative", "priority": "high"},
  {"days_before": 1, "title": "Submit UCAS application", "type": "Submission", "priority": "high"}
]'),
('UC Application Cascade', 'UC', '[
  {"months_before": 4, "title": "Research UC campus requirements", "type": "Research", "priority": "medium"},
  {"months_before": 3.5, "title": "Finalize UC campus selections", "type": "Planning", "priority": "high"},
  {"months_before": 3, "title": "Brainstorm UC PIQ essay topics (4 required)", "type": "Essay", "priority": "high"},
  {"months_before": 2.5, "title": "Complete UC PIQ first drafts", "type": "Essay", "priority": "high"},
  {"months_before": 2, "title": "UC PIQ essay revisions", "type": "Essay", "priority": "high"},
  {"months_before": 1.5, "title": "Complete activities and awards section", "type": "Administrative", "priority": "medium"},
  {"months_before": 1, "title": "Final UC PIQ review", "type": "Review", "priority": "high"},
  {"weeks_before": 2, "title": "Review complete UC application", "type": "Review", "priority": "high"},
  {"days_before": 3, "title": "Final checks before submission", "type": "Review", "priority": "high"},
  {"days_before": 1, "title": "Submit UC application", "type": "Submission", "priority": "high"}
]'),
('Early Decision/Action Cascade', 'Early Decision', '[
  {"months_before": 5, "title": "Research ED/EA university requirements", "type": "Research", "priority": "high"},
  {"months_before": 4, "title": "Finalize ED/EA university choice", "type": "Planning", "priority": "high"},
  {"months_before": 3.5, "title": "Brainstorm essay topics", "type": "Essay", "priority": "high"},
  {"months_before": 3, "title": "Complete essay first drafts", "type": "Essay", "priority": "high"},
  {"months_before": 2.5, "title": "Request teacher recommendations", "type": "Administrative", "priority": "high"},
  {"months_before": 2, "title": "Request counselor recommendation", "type": "Administrative", "priority": "high"},
  {"months_before": 1.5, "title": "Final essay revisions", "type": "Essay", "priority": "high"},
  {"months_before": 1, "title": "Complete application form", "type": "Administrative", "priority": "medium"},
  {"weeks_before": 2, "title": "Review complete application", "type": "Review", "priority": "high"},
  {"days_before": 3, "title": "Final checks before submission", "type": "Review", "priority": "high"},
  {"days_before": 1, "title": "Submit ED/EA application", "type": "Submission", "priority": "high"}
]')