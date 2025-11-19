-- Phase 2: Email Automation Tables
CREATE TABLE public.email_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES public.email_templates(id) ON DELETE CASCADE,
  trigger_type text NOT NULL, -- 'deadline_reminder', 'stage_change', 'consultation_reminder', 'manual'
  trigger_days_before integer, -- For deadline reminders
  trigger_stage text, -- For stage change triggers
  is_active boolean DEFAULT true,
  send_to_student boolean DEFAULT true,
  send_to_parent boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.scheduled_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_schedule_id uuid REFERENCES public.email_schedules(id) ON DELETE CASCADE,
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE,
  scheduled_for timestamp with time zone NOT NULL,
  sent_at timestamp with time zone,
  status text DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'cancelled'
  error_message text,
  email_log_id uuid REFERENCES public.email_logs(id),
  created_at timestamp with time zone DEFAULT now()
);

-- Phase 4: Ad-hoc Request Tracking
CREATE TABLE public.ad_hoc_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE,
  request_type text NOT NULL, -- 'student_inquiry', 'parent_question', 'document_request', 'meeting_request', 'other'
  priority text DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  status text DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'cancelled'
  title text NOT NULL,
  description text,
  submitted_by text NOT NULL, -- 'student', 'parent', 'consultant'
  submitted_by_name text,
  submitted_by_email text,
  assigned_to uuid REFERENCES public.profiles(id),
  due_date timestamp with time zone,
  completed_at timestamp with time zone,
  completed_by uuid REFERENCES public.profiles(id),
  resolution_notes text,
  related_task_id uuid REFERENCES public.tasks(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_hoc_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_schedules
CREATE POLICY "Authenticated users can view email schedules"
  ON public.email_schedules FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Consultants and admins can manage email schedules"
  ON public.email_schedules FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'consultant'::app_role));

-- RLS Policies for scheduled_emails
CREATE POLICY "Authenticated users can view scheduled emails"
  ON public.scheduled_emails FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Consultants and admins can manage scheduled emails"
  ON public.scheduled_emails FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'consultant'::app_role));

-- RLS Policies for ad_hoc_requests
CREATE POLICY "Authenticated users can view ad-hoc requests"
  ON public.ad_hoc_requests FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Consultants and admins can create ad-hoc requests"
  ON public.ad_hoc_requests FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'consultant'::app_role));

CREATE POLICY "Consultants and admins can update ad-hoc requests"
  ON public.ad_hoc_requests FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'consultant'::app_role));

CREATE POLICY "Only admins can delete ad-hoc requests"
  ON public.ad_hoc_requests FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Triggers for updated_at
CREATE TRIGGER update_email_schedules_updated_at
  BEFORE UPDATE ON public.email_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ad_hoc_requests_updated_at
  BEFORE UPDATE ON public.ad_hoc_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for performance
CREATE INDEX idx_scheduled_emails_scheduled_for ON public.scheduled_emails(scheduled_for);
CREATE INDEX idx_scheduled_emails_status ON public.scheduled_emails(status);
CREATE INDEX idx_ad_hoc_requests_status ON public.ad_hoc_requests(status);
CREATE INDEX idx_ad_hoc_requests_student_id ON public.ad_hoc_requests(student_id);
CREATE INDEX idx_ad_hoc_requests_assigned_to ON public.ad_hoc_requests(assigned_to);