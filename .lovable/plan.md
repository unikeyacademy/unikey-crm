

## Add Student Quick-Access List in Sidebar

### What to Build

Add a collapsible section in the sidebar, below the main navigation, that shows all **active students** by name. Clicking a student name navigates directly to their profile (`/students/:id`). This acts as a quick-access panel so you don't need to go to the Students page first.

### Design

- Below the main nav links, add a section header "Current Students" with a collapsible toggle
- Fetch active students from the `students` table on mount
- Display each student as a clickable sidebar link showing their preferred/first name + last name
- Highlight the active student when viewing their profile
- Show a small count badge next to the header (e.g., "Current Students (12)")
- Scrollable if the list is long (max height with overflow)

### Technical Details

**Modified file: `src/components/DashboardLayout.tsx`**
- Add `useState` + `useEffect` to fetch students where `status = 'active'`, ordered by first name
- Add a collapsible "Current Students" section after the nav links, using Radix Collapsible or simple toggle state
- Each student entry is a `<Link to={/students/${id}}>` with active styling when `location.pathname` matches
- Wrap the student list in a `ScrollArea` for overflow handling

No database changes needed — reads from the existing `students` table.

