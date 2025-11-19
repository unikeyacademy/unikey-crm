-- Create checklist_templates table for reusable application system templates
CREATE TABLE IF NOT EXISTS public.checklist_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_name TEXT NOT NULL,
  application_system TEXT NOT NULL,
  description TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.checklist_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view checklist templates"
  ON public.checklist_templates
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Consultants and admins can create checklist templates"
  ON public.checklist_templates
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'consultant'::app_role));

CREATE POLICY "Consultants and admins can update checklist templates"
  ON public.checklist_templates
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'consultant'::app_role));

CREATE POLICY "Only admins can delete checklist templates"
  ON public.checklist_templates
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed checklist templates
INSERT INTO public.checklist_templates (template_name, application_system, description, items) VALUES
(
  'Common App Standard Checklist',
  'Common App',
  'Complete checklist for Common Application submissions',
  '[
    {"name": "Create Common App account", "description": "Register and verify email", "priority": "high", "order_index": 1},
    {"name": "Complete Profile section", "description": "Personal information, contact details, citizenship", "priority": "high", "order_index": 2},
    {"name": "Complete Family section", "description": "Parent/guardian information, household details", "priority": "high", "order_index": 3},
    {"name": "Complete Education section", "description": "Current and previous schools, coursework", "priority": "high", "order_index": 4},
    {"name": "Complete Testing section", "description": "SAT/ACT scores, AP/IB scores, TOEFL/IELTS if applicable", "priority": "high", "order_index": 5},
    {"name": "Complete Activities section", "description": "Extracurriculars, work experience, community service (up to 10)", "priority": "high", "order_index": 6},
    {"name": "Write Personal Essay", "description": "650-word Common App essay (one of 7 prompts)", "priority": "high", "order_index": 7},
    {"name": "Request teacher recommendations", "description": "Invite 2 teachers through Common App", "priority": "high", "order_index": 8},
    {"name": "Request counselor recommendation", "description": "Invite school counselor through Common App", "priority": "high", "order_index": 9},
    {"name": "Upload unofficial transcript", "description": "Self-reported grades or transcript upload", "priority": "high", "order_index": 10},
    {"name": "Complete Writing supplement", "description": "University-specific supplemental essays", "priority": "high", "order_index": 11},
    {"name": "Submit application fee payment", "description": "Pay application fee or request fee waiver", "priority": "medium", "order_index": 12},
    {"name": "Review application for errors", "description": "Proofread all sections before submission", "priority": "high", "order_index": 13},
    {"name": "Submit application", "description": "Final submission before deadline", "priority": "high", "order_index": 14},
    {"name": "Monitor application portal", "description": "Check university portal for additional requirements", "priority": "medium", "order_index": 15},
    {"name": "Send official test scores", "description": "Request score reports from testing agencies", "priority": "high", "order_index": 16},
    {"name": "Send official transcript", "description": "Request official transcript from school", "priority": "high", "order_index": 17},
    {"name": "Submit mid-year grades", "description": "Update grades after first semester (if applicable)", "priority": "medium", "order_index": 18}
  ]'::jsonb
),
(
  'UCAS Application Checklist',
  'UCAS',
  'Complete checklist for UK university applications through UCAS',
  '[
    {"name": "Register for UCAS account", "description": "Create account and obtain buzzword from school", "priority": "high", "order_index": 1},
    {"name": "Complete Personal Details", "description": "Name, contact information, residency status", "priority": "high", "order_index": 2},
    {"name": "Complete Choices section", "description": "Select up to 5 university courses", "priority": "high", "order_index": 3},
    {"name": "Complete Education section", "description": "All qualifications and grades", "priority": "high", "order_index": 4},
    {"name": "Enter predicted grades", "description": "Work with school to input predicted A-Level/IB grades", "priority": "high", "order_index": 5},
    {"name": "Write Personal Statement", "description": "4,000 characters explaining your interest and suitability", "priority": "high", "order_index": 6},
    {"name": "Request academic reference", "description": "School will provide reference through UCAS", "priority": "high", "order_index": 7},
    {"name": "Complete Employment section", "description": "Any paid work experience", "priority": "medium", "order_index": 8},
    {"name": "Declare any criminal convictions", "description": "Required disclosure if applicable", "priority": "high", "order_index": 9},
    {"name": "Review entire application", "description": "Check for errors and completeness", "priority": "high", "order_index": 10},
    {"name": "Pay application fee", "description": "£27.50 for multiple choices or £22.50 for single choice", "priority": "high", "order_index": 11},
    {"name": "Submit application", "description": "Final submission by 15 October (Oxbridge/Medicine) or 29 January", "priority": "high", "order_index": 12}
  ]'::jsonb
),
(
  'UC Application Checklist',
  'UC',
  'Complete checklist for University of California applications',
  '[
    {"name": "Create UC Application account", "description": "Register on UC application portal", "priority": "high", "order_index": 1},
    {"name": "Complete About You section", "description": "Personal information, citizenship, military status", "priority": "high", "order_index": 2},
    {"name": "Complete Campuses & Majors", "description": "Select UC campuses (up to 9) and majors", "priority": "high", "order_index": 3},
    {"name": "Complete Academic History", "description": "All high school coursework and grades", "priority": "high", "order_index": 4},
    {"name": "Enter test scores", "description": "SAT/ACT scores (test-optional but can include)", "priority": "medium", "order_index": 5},
    {"name": "Complete Activities & Awards", "description": "Up to 20 activities, awards, honors", "priority": "high", "order_index": 6},
    {"name": "Write Personal Insight Questions", "description": "Choose 4 out of 8 prompts (350 words each)", "priority": "high", "order_index": 7},
    {"name": "Complete Scholarships section", "description": "Answer questions for scholarship consideration", "priority": "medium", "order_index": 8},
    {"name": "Review application summary", "description": "Check all information for accuracy", "priority": "high", "order_index": 9},
    {"name": "Submit application", "description": "Final submission by November 30", "priority": "high", "order_index": 10},
    {"name": "Pay application fee", "description": "$80 per campus or request fee waiver", "priority": "high", "order_index": 11},
    {"name": "Send official test scores", "description": "Request score reports if submitting scores", "priority": "medium", "order_index": 12},
    {"name": "Submit official transcripts", "description": "Send transcripts to admitted campus after acceptance", "priority": "high", "order_index": 13},
    {"name": "Update with senior grades", "description": "Report grades in January and after graduation", "priority": "high", "order_index": 14}
  ]'::jsonb
),
(
  'JUPAS Application Checklist',
  'JUPAS',
  'Complete checklist for Hong Kong university applications through JUPAS',
  '[
    {"name": "Register JUPAS account", "description": "Create account on JUPAS portal", "priority": "high", "order_index": 1},
    {"name": "Complete Personal Particulars", "description": "Personal details, contact information", "priority": "high", "order_index": 2},
    {"name": "Complete Educational Qualifications", "description": "HKDSE subjects and predicted grades", "priority": "high", "order_index": 3},
    {"name": "Select programme choices", "description": "Choose up to 20 programme choices (Band A)", "priority": "high", "order_index": 4},
    {"name": "Rank programme choices", "description": "Order programmes by preference", "priority": "high", "order_index": 5},
    {"name": "Submit OEA/SLP", "description": "Other Experiences and Achievements / Student Learning Profile", "priority": "high", "order_index": 6},
    {"name": "Pay application fee", "description": "Pay JUPAS application processing fee", "priority": "high", "order_index": 7},
    {"name": "Submit application", "description": "Confirm and submit by December deadline", "priority": "high", "order_index": 8},
    {"name": "Change programme choices", "description": "Modify choices during change period (if needed)", "priority": "medium", "order_index": 9},
    {"name": "Monitor JUPAS account", "description": "Check for university interview invitations", "priority": "high", "order_index": 10}
  ]'::jsonb
);

-- Trigger for updated_at
CREATE TRIGGER update_checklist_templates_updated_at
  BEFORE UPDATE ON public.checklist_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();