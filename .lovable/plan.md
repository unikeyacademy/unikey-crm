

## Revert Sidebar Student List + Replace Students Page with Table View

### What to Change

1. **Revert `DashboardLayout.tsx`**: Remove the collapsible "Current Students" section (the `useState`/`useEffect` for students, the `Collapsible`/`ScrollArea` block, and the extra imports). The "Students" nav link at `/students` already exists and will serve as the entry point.

2. **Rewrite `Students.tsx`**: Replace the current card grid with a full-width table (using the existing `Table` components from `src/components/ui/table.tsx`). Each student gets one horizontal row with key profile columns:
   - Name (preferred or first + last)
   - Student ID
   - Status (badge)
   - Grade Level
   - Current School
   - Application Cycle
   - Track (US/UK/Dual)
   - Current Stage
   - Email
   - Phone
   - "View" button linking to `/students/:id`

   Keep the existing search bar and Add Student button. Rows are clickable to navigate to the student detail page.

### Technical Details

**`DashboardLayout.tsx`**:
- Remove `useState`, `useEffect` imports (keep `ReactNode`)
- Remove `Badge`, `ScrollArea`, `Collapsible` imports
- Remove `ChevronDown`, `ChevronRight`, `User` icon imports
- Remove `students` state, `studentsOpen` state, and the `useEffect` fetch
- Remove the entire "Current Students" collapsible block between `</nav>` and the Logout section

**`Students.tsx`**:
- Import `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell` from `@/components/ui/table`
- Replace the card grid with a table layout
- Add columns for the key fields listed above
- Make each row clickable with `onClick={() => navigate(/students/${id})}`
- Fetch additional fields (`current_stage`, `track`) that aren't currently selected

