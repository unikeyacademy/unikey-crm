
CREATE TABLE public.notion_session_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notion_page_id TEXT NOT NULL UNIQUE,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  session_date DATE,
  session_type TEXT,
  consultant_name TEXT,
  summary TEXT,
  raw_properties JSONB,
  notion_url TEXT,
  notion_last_edited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notion_session_reports_student ON public.notion_session_reports(student_id);

ALTER TABLE public.notion_session_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view session reports"
  ON public.notion_session_reports FOR SELECT
  TO authenticated USING (true);

CREATE TRIGGER trg_notion_session_reports_updated
  BEFORE UPDATE ON public.notion_session_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.notion_sync_state (
  id TEXT PRIMARY KEY,
  last_synced_at TIMESTAMPTZ,
  last_cursor TEXT,
  last_status TEXT,
  last_error TEXT,
  stats JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notion_sync_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view sync state"
  ON public.notion_sync_state FOR SELECT
  TO authenticated USING (true);

CREATE TRIGGER trg_notion_sync_state_updated
  BEFORE UPDATE ON public.notion_sync_state
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
