import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Search, Eye } from "lucide-react";
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
}

const Students = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from("students")
        .select("id, student_id, first_name, last_name, preferred_name, email, phone, grade_level, current_school, application_cycle, status, tags, track, current_stage")
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

  const filteredStudents = students.filter((student) => {
    const query = searchQuery.toLowerCase();
    return (
      student.first_name.toLowerCase().includes(query) ||
      student.last_name.toLowerCase().includes(query) ||
      student.student_id.toLowerCase().includes(query) ||
      (student.email && student.email.toLowerCase().includes(query))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Students</h1>
          <p className="text-muted-foreground">
            Manage your student profiles and applications
          </p>
        </div>
        <AddStudentDialog onStudentAdded={fetchStudents} />
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search students by name, ID, or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
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
            {searchQuery
              ? "No students found matching your search."
              : "No students yet. Click 'Add Student' to get started."}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Student ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>School</TableHead>
                <TableHead>Cycle</TableHead>
                <TableHead>Track</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => (
                <TableRow
                  key={student.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/students/${student.id}`)}
                >
                  <TableCell className="font-medium">
                    {student.preferred_name || student.first_name} {student.last_name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{student.student_id}</TableCell>
                  <TableCell>
                    <Badge variant={student.status === "active" ? "default" : "secondary"}>
                      {student.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{student.grade_level ?? "—"}</TableCell>
                  <TableCell>{student.current_school ?? "—"}</TableCell>
                  <TableCell>{student.application_cycle ?? "—"}</TableCell>
                  <TableCell>{student.track ?? "—"}</TableCell>
                  <TableCell>{student.current_stage ?? "—"}</TableCell>
                  <TableCell>{student.email ?? "—"}</TableCell>
                  <TableCell>{student.phone ?? "—"}</TableCell>
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
