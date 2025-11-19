-- Create email_templates table
CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  template_type TEXT NOT NULL, -- 'consultation_reminder', 'application_update', 'welcome', 'custom'
  merge_fields JSONB DEFAULT '[]'::jsonb, -- Available merge fields like {{student_name}}, {{consultant_name}}
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create email_logs table
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  template_id UUID REFERENCES public.email_templates(id) ON DELETE SET NULL,
  sent_by UUID NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT DEFAULT 'sent', -- 'sent', 'failed', 'pending'
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create parent_communications_log table for tracking all parent communications
CREATE TABLE IF NOT EXISTS public.parent_communications_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  communication_type TEXT NOT NULL, -- 'email', 'phone', 'meeting', 'message'
  subject TEXT,
  content TEXT,
  recipient TEXT NOT NULL,
  sent_by UUID NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_communications_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_templates
CREATE POLICY "Authenticated users can view email templates"
  ON public.email_templates FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Consultants and admins can create email templates"
  ON public.email_templates FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'consultant'::app_role)
  );

CREATE POLICY "Consultants and admins can update email templates"
  ON public.email_templates FOR UPDATE
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'consultant'::app_role)
  );

CREATE POLICY "Only admins can delete email templates"
  ON public.email_templates FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for email_logs
CREATE POLICY "Authenticated users can view email logs"
  ON public.email_logs FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Consultants and admins can create email logs"
  ON public.email_logs FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'consultant'::app_role)
  );

-- RLS Policies for parent_communications_log
CREATE POLICY "Authenticated users can view parent communications"
  ON public.parent_communications_log FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Consultants and admins can create parent communications"
  ON public.parent_communications_log FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'consultant'::app_role)
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_email_templates_type ON public.email_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_student_id ON public.email_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON public.email_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_parent_communications_student_id ON public.parent_communications_log(student_id);

-- Create trigger for updated_at
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default email templates
INSERT INTO public.email_templates (template_name, subject, body, template_type, merge_fields, created_by) 
VALUES 
  (
    'Consultation Reminder',
    'Upcoming Consultation - {{consultation_date}}',
    'Dear {{parent_name}},

This is a friendly reminder about {{student_name}}''s upcoming consultation scheduled for {{consultation_date}} at {{consultation_time}}.

Meeting Link: {{meeting_link}}

Topics to discuss:
{{topics}}

Please let us know if you need to reschedule.

Best regards,
{{consultant_name}}
UNIKEY Academy',
    'consultation_reminder',
    '["{{student_name}}", "{{parent_name}}", "{{consultation_date}}", "{{consultation_time}}", "{{meeting_link}}", "{{topics}}", "{{consultant_name}}"]'::jsonb,
    '00000000-0000-0000-0000-000000000000'
  ),
  (
    'Application Update',
    'Application Progress Update for {{student_name}}',
    'Dear {{parent_name}},

We wanted to provide you with an update on {{student_name}}''s university application progress.

Completed:
{{completed_items}}

In Progress:
{{in_progress_items}}

Next Steps:
{{next_steps}}

If you have any questions, please don''t hesitate to reach out.

Best regards,
{{consultant_name}}
UNIKEY Academy',
    'application_update',
    '["{{student_name}}", "{{parent_name}}", "{{completed_items}}", "{{in_progress_items}}", "{{next_steps}}", "{{consultant_name}}"]'::jsonb,
    '00000000-0000-0000-0000-000000000000'
  ),
  (
    'Welcome Email',
    'Welcome to UNIKEY Academy - {{student_name}}',
    'Dear {{parent_name}},

Welcome to UNIKEY Academy! We''re thrilled to begin this journey with {{student_name}}.

Your assigned consultant is {{consultant_name}}. They will be in touch shortly to schedule your initial consultation.

In the meantime, please feel free to explore your student portal where you can:
- Track application progress
- View upcoming consultations
- Access important documents
- Monitor tasks and deadlines

We look forward to working together to achieve {{student_name}}''s academic goals.

Best regards,
The UNIKEY Academy Team',
    'welcome',
    '["{{student_name}}", "{{parent_name}}", "{{consultant_name}}"]'::jsonb,
    '00000000-0000-0000-0000-000000000000'
  );