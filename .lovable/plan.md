

## Co-Consultant Management & Monthly Payment Summary

### Understanding

Co-consultants are external contractors assigned to student cases. They log hours per student, and at month-end the CRM produces a summary of hours worked per co-consultant across all students, ready for confirmation and payment.

### What to Build

**1. New DB table: `co_consultant_hours`**
- `id`, `consultant_id` (references profiles), `student_id` (references students), `work_date`, `hours` (numeric), `description`, `hourly_rate` (numeric), `created_at`, `updated_at`
- RLS: authenticated can view, consultants/admins can insert/update, admins can delete

**2. New page: Co-Consultants (`/co-consultants`)**
- Lists all users with the `consultant` role (from profiles table) who are assigned as `secondary_consultant_id` on any student
- For each co-consultant: show name, email, total hours this month, total amount owed
- Click into a co-consultant to see detailed breakdown by student
- "Log Hours" dialog to record hours against a student
- **Monthly Summary view**: select a month, see per-student hours + totals for a selected co-consultant, with a "Copy Summary" or "Export" action for sending to the co-consultant for confirmation

**3. Student detail integration**
- On the existing student profile, show co-consultant hours logged for that student (small section or within the Financials tab)

**4. Navigation update**
- Add "Co-Consultants" to sidebar navigation

### Technical Details

**Database migration:**
```sql
CREATE TABLE public.co_consultant_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consultant_id uuid NOT NULL REFERENCES public.profiles(id),
  student_id uuid NOT NULL REFERENCES public.students(id),
  work_date date NOT NULL DEFAULT CURRENT_DATE,
  hours numeric NOT NULL,
  hourly_rate numeric NOT NULL DEFAULT 0,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- RLS policies (same pattern as other tables)
-- updated_at trigger
```

**New files:**
- `src/pages/CoConsultants.tsx` -- main page with month picker, consultant list, summary generation
- `src/components/co-consultants/LogHoursDialog.tsx` -- form to log hours
- `src/components/co-consultants/MonthlySummary.tsx` -- monthly breakdown per consultant

**Modified files:**
- `src/App.tsx` -- add `/co-consultants` route
- `src/components/DashboardLayout.tsx` -- add nav item
- `src/components/students/StudentFinancialsTab.tsx` -- add co-consultant hours section

