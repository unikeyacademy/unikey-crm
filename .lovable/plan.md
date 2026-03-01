

## Gap Analysis: Your Feature List vs Current CRM

Below is a section-by-section comparison. Items marked **HAVE** exist in the system. Items marked **MISSING** do not.

---

### 1. Client Profile & Strategy

**A. Identity** -- Mostly HAVE
- HAVE: Full name, preferred name, DOB, gender
- MISSING: Passport type / nationality

**B. Contact** -- Mostly HAVE
- HAVE: Student email + phone, parent name(s) + email + phone
- MISSING: City / timezone

**C. Education Context** -- HAVE
- HAVE: Current school, curriculum (IB/A-Level/AP/IGCSE/HKDSE/Other), grade level
- MISSING: Graduation year (currently uses `application_cycle` which is close but not the same)

**D. Targeting & Positioning** -- Mostly MISSING
- HAVE: Academic interests (partial proxy for target major)
- MISSING: Target major(s) (primary + secondary) as dedicated fields, Track (US only / UK only / Dual), Risk profile (Reach / Balanced / Conservative)

**E. Commercial + Internal Ownership** -- Mostly MISSING
- HAVE: Assigned consultant (single), quotation field
- MISSING: Lead source, engagement stage (Inquiry / Active / Deferred / Alumni), secondary consultant

---

### 2. Academic Profile -- Mostly MISSING

- HAVE: IB predicted grade, subject choices with predicted grades, curriculum
- MISSING: Current overall GPA, academic strengths/weaknesses (free text), standardized testing section (SAT/ACT scores + dates, subject tests like LNAT/UCAT/TMUA/ESAT, language tests TOEFL/IELTS)

---

### 3. Extracurriculars & Activities -- Partially HAVE

- HAVE: Activity name, type, status, description, outcomes, dates, progress
- MISSING: Role, duration/time commitment, measurable impact, awards/recognition, reference/mentor, link, the specific 11-category taxonomy you listed (currently uses generic types)

---

### 4. Application Tracking -- Mostly HAVE

- HAVE: Student link, university name, country, application system, major/program, status, notes, deadline
- MISSING: Round (ED/EA/RD, Oxbridge/Medicine early vs regular) -- the status field partially covers this but not explicitly

---

### 5. Essays & Deliverables -- ENTIRELY MISSING

This is a major gap. Nothing exists for:
- US essays checklist (Common App personal statement, supplementals, activity responses)
- UK writing checklist (UCAS personal statement, Cambridge SAQ, course-specific work)
- Per-item tracking: status, Google Doc link, owner, last updated
- Interview records (university, type, date, prep sessions, tutor, post-interview notes)

---

### 6. Decisions & Outcomes -- Mostly MISSING

- HAVE: Basic status on university targets (offer received, accepted, rejected)
- MISSING: Offer conditions, firm/insurance choice (UK), waitlist plan status (LOCI), clearing shortlist, final enrolment intention, matriculation confirmed

---

### 7. Meetings -- Partially HAVE

- HAVE: Date, type, notes, action items, next steps, meeting link
- MISSING: Attendees field, key decisions as a separate field, action items with owner + due date (currently just plain text list)

---

### 8. Financial Management -- ENTIRELY MISSING

Nothing exists for:
- Service packages (type, price, dates, contract type)
- Payment tracking (deposit, installments, status, outstanding balance, invoices)
- Upsell / renewal tracking

---

### 9. System Health & Alerts -- ENTIRELY MISSING

Nothing exists for:
- Overall health status (Red/Yellow/Green)
- Auto-calculated: days since last meeting, overdue items count
- Auto-flags: approaching deadlines, stale submissions, waitlist without plan, conditional offers at risk, missing required fields

---

## Summary of What Needs Building

```text
Priority  | Section                    | Effort
──────────┼────────────────────────────┼────────
HIGH      | 5. Essays & Deliverables   | Large (new tables + UI tab)
HIGH      | 8. Financial Management    | Large (new tables + UI page/tab)
HIGH      | 9. System Health & Alerts  | Medium (dashboard widgets + auto-queries)
MEDIUM    | 2. Academic Profile        | Medium (new test scores table + UI)
MEDIUM    | 6. Decisions & Outcomes    | Medium (extend university targets table + UI)
MEDIUM    | 1D. Targeting fields       | Small (add columns to students table)
MEDIUM    | 1E. Commercial fields      | Small (add columns + secondary consultant)
LOW       | 3. ECA taxonomy            | Small (add columns to student_ecas)
LOW       | 7. Meeting improvements    | Small (add columns to consultations)
LOW       | 1A/1B. Nationality/city    | Small (add columns to students)
```

## Recommended Implementation Order

1. **Extend student profile fields** -- Add nationality, city/timezone, target majors, track, risk profile, lead source, engagement stage, secondary consultant, graduation year. Small schema change, update AddStudentDialog and StudentProfileTab.

2. **Academic profile with test scores** -- New `student_test_scores` table (test_type, test_name, score, date, next_planned_date). New UI section in student profile or dedicated sub-tab.

3. **Essays & Deliverables** -- New `student_essays` table (student_id, university_target_id, essay_type, title, status, google_doc_link, owner, last_updated). New `student_interviews` table. New "Essays" tab on student detail. This is the biggest build.

4. **Decisions & Outcomes** -- Extend `student_university_targets` with: offer_conditions, round, firm_choice, insurance_choice, waitlist_plan_status, clearing_shortlist, enrolment_intention, matriculation_confirmed. Update university tab UI.

5. **Financial Management** -- New `student_packages` table (student_id, package_type, price, start/end dates, contract_type) and `payments` table (package_id, amount, date, type, status, invoice_ref). New "Financials" tab or page.

6. **ECA taxonomy upgrade** -- Add columns to `student_ecas`: role, time_commitment, impact, awards, reference_mentor, link, primary_category, secondary_category with the 11 categories.

7. **Meeting improvements** -- Add to `consultations`: attendees (text[]), key_decisions (text). Convert action_items to JSONB with owner + due_date per item.

8. **System Health & Alerts dashboard** -- New dashboard widgets computing: health score per student, days since last meeting, overdue counts, deadline proximity flags, missing field flags. No new tables needed -- purely computed from existing data.

