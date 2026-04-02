import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Eye, Filter, X, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import AddStudentDialog from "@/components/students/AddStudentDialog";

interface Student {
  id: string;
  student_id: string;
  first_name: string;
  last_name: string;
  preferred_name: string | null;
  email: string | null;
  phone: string | null;
  grade_level: number | null;
  current_school: string | null;
  application_cycle: string | null;
  status: string;
  tags: string[] | null;
  track: string | null;
  current_stage: string | null;
  target_major_primary: string | null;
  consultation_programme: string | null;
  assigned_consultant_id: string | null;
  secondary_consultant_id: string | null;
  curriculum: string | null;
}

interface Profile {
  id: string;
  full_name: string | null;
  email: string;
}

const Students = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCycles, setFilterCycles] = useState<string[]>([]);
  const [filterTrack, setFilterTrack] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterProgramme, setFilterProgramme] = useState<string>("all");

  useEffect(() => {
    fetchStudents();
    fetchProfiles();
  }, []);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from("students")
        .select("id, student_id, first_name, last_name, preferred_name, email, phone, grade_level, current_school, application_cycle, status, tags, track, current_stage, target_major_primary, consultation_programme, assigned_consultant_id, secondary_consultant_id, curriculum")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setStudents(data || []);
    } catch (error: any) {
      toast.error("Error loading students");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email");
      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error("Error fetching profiles:", error);
    }
  };

  const getConsultantName = (consultantId: string | null) => {
    if (!consultantId) return "—";
    const profile = profiles.find(p => p.id === consultantId);
    return profile?.full_name || profile?.email || "—";
  };

  // Derive unique values for filters
  const uniqueCycles = [...new Set(students.map(s => s.application_cycle).filter(Boolean))] as string[];
  const uniqueTracks = [...new Set(students.map(s => s.track).filter(Boolean))] as string[];
  const uniqueProgrammes = [...new Set(students.map(s => s.consultation_programme).filter(Boolean))] as string[];

  const filteredStudents = students.filter((student) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      student.first_name.toLowerCase().includes(query) ||
      student.last_name.toLowerCase().includes(query) ||
      student.student_id.toLowerCase().includes(query) ||
      (student.email && student.email.toLowerCase().includes(query)) ||
      (student.target_major_primary && student.target_major_primary.toLowerCase().includes(query));

    const matchesCycle = filterCycles.length === 0 || (student.application_cycle && filterCycles.includes(student.application_cycle));
    const matchesTrack = filterTrack === "all" || student.track === filterTrack;
    const matchesStatus = filterStatus === "all" || student.status === filterStatus;
    const matchesProgramme = filterProgramme === "all" || student.consultation_programme === filterProgramme;

    return matchesSearch && matchesCycle && matchesTrack && matchesStatus && matchesProgramme;
  });

  const hasActiveFilters = filterCycle !== "all" || filterTrack !== "all" || filterStatus !== "all" || filterProgramme !== "all";

  const clearFilters = () => {
    setFilterCycle("all");
    setFilterTrack("all");
    setFilterStatus("all");
    setFilterProgramme("all");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Students</h1>
          <p className="text-muted-foreground">
            {filteredStudents.length} of {students.length} students
          </p>
        </div>
        <AddStudentDialog onStudentAdded={fetchStudents} />
      </div>

      {/* Search + Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, ID, email, or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Filter className="w-4 h-4" />
            Filters:
          </div>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="graduated">Graduated</SelectItem>
            </SelectContent>
          </Select>

          {uniqueCycles.length > 0 && (
            <Select value={filterCycle} onValueChange={setFilterCycle}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue placeholder="Entry Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cycles</SelectItem>
                {uniqueCycles.sort().map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {uniqueTracks.length > 0 && (
            <Select value={filterTrack} onValueChange={setFilterTrack}>
              <SelectTrigger className="w-[130px] h-8 text-xs">
                <SelectValue placeholder="Track" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tracks</SelectItem>
                {uniqueTracks.sort().map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {uniqueProgrammes.length > 0 && (
            <Select value={filterProgramme} onValueChange={setFilterProgramme}>
              <SelectTrigger className="w-[200px] h-8 text-xs">
                <SelectValue placeholder="Programme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Programmes</SelectItem>
                {uniqueProgrammes.sort().map(p => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={clearFilters}>
              <X className="w-3 h-3 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Students Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading students...</p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="text-muted-foreground">
            {searchQuery || hasActiveFilters
              ? "No students found matching your criteria."
              : "No students yet. Click 'Add Student' to get started."}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-card z-10">Name</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Programme</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Tutor-in-charge</TableHead>
                <TableHead>Entry Year</TableHead>
                <TableHead>School</TableHead>
                <TableHead>Curriculum</TableHead>
                <TableHead>Track</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => (
                <TableRow
                  key={student.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/students/${student.id}`)}
                >
                  <TableCell className="font-medium sticky left-0 bg-card z-10 whitespace-nowrap">
                    {student.preferred_name || student.first_name} {student.last_name}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">{student.student_id}</TableCell>
                  <TableCell>
                    <Badge
                      variant={student.status === "active" ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {student.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm max-w-[200px] truncate">
                    {student.consultation_programme ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {student.target_major_primary ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm whitespace-nowrap">
                    {getConsultantName(student.assigned_consultant_id)}
                    {student.secondary_consultant_id && (
                      <span className="text-muted-foreground text-xs block">
                        + {getConsultantName(student.secondary_consultant_id)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{student.application_cycle ?? "—"}</TableCell>
                  <TableCell className="text-sm">{student.current_school ?? "—"}</TableCell>
                  <TableCell className="text-sm">{student.curriculum ?? "—"}</TableCell>
                  <TableCell className="text-sm">{student.track ?? "—"}</TableCell>
                  <TableCell className="text-sm">{student.current_stage ?? "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{student.email ?? "—"}</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/students/${student.id}`);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default Students;
