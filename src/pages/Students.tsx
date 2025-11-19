import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Mail, Phone } from "lucide-react";
import { toast } from "sonner";

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
}

const Students = () => {
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
        .select("*")
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
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Add Student
        </Button>
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

      {/* Students Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading students...</p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {searchQuery
                ? "No students found matching your search."
                : "No students yet. Click 'Add Student' to get started."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredStudents.map((student) => (
            <Card key={student.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {student.preferred_name || student.first_name}{" "}
                      {student.last_name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      ID: {student.student_id}
                    </p>
                  </div>
                  <Badge
                    variant={student.status === "active" ? "default" : "secondary"}
                  >
                    {student.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {student.grade_level && (
                  <p className="text-sm">
                    <span className="font-medium">Grade:</span> {student.grade_level}
                  </p>
                )}
                {student.current_school && (
                  <p className="text-sm">
                    <span className="font-medium">School:</span>{" "}
                    {student.current_school}
                  </p>
                )}
                {student.application_cycle && (
                  <p className="text-sm">
                    <span className="font-medium">Cycle:</span>{" "}
                    {student.application_cycle}
                  </p>
                )}
                <div className="flex gap-2 pt-2">
                  {student.email && (
                    <Button size="sm" variant="outline" className="gap-2">
                      <Mail className="w-3 h-3" />
                      Email
                    </Button>
                  )}
                  {student.phone && (
                    <Button size="sm" variant="outline" className="gap-2">
                      <Phone className="w-3 h-3" />
                      Call
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Students;
