import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Mail, Phone, Calendar, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import SendEmailDialog from "@/components/email/SendEmailDialog";
import StudentProfileTab from "@/components/students/StudentProfileTab";
import StudentConsultationsTab from "@/components/students/StudentConsultationsTab";
import StudentTasksTab from "@/components/students/StudentTasksTab";
import StudentECAsTab from "@/components/students/StudentECAsTab";
import StudentUniversitiesTab from "@/components/students/StudentUniversitiesTab";
import StudentDocumentsTab from "@/components/students/StudentDocumentsTab";
import StudentChecklistsTab from "@/components/students/StudentChecklistsTab";
import StudentEssaysTab from "@/components/students/StudentEssaysTab";
import StudentFinancialsTab from "@/components/students/StudentFinancialsTab";
import StudentNotionNotesTab from "@/components/students/StudentNotionNotesTab";

interface Student {
  id: string;
  student_id: string;
  first_name: string;
  last_name: string;
  preferred_name: string | null;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;
  gender: string | null;
  grade_level: number | null;
  current_school: string | null;
  application_cycle: string | null;
  ib_predicted_grade: number | null;
  current_stage: string | null;
  status: string;
  notes: string | null;
  parent_names: string | null;
  parent_email: string | null;
  parent_phone: string | null;
  region_interest: string[] | null;
  academic_interests: string[] | null;
  passport_nationality: string | null;
  city: string | null;
  timezone: string | null;
  graduation_year: number | null;
  target_major_primary: string | null;
  target_major_secondary: string | null;
  track: string | null;
  risk_profile: string | null;
  lead_source: string | null;
  engagement_stage: string | null;
  secondary_consultant_id: string | null;
  current_gpa: string | null;
  academic_strengths: string | null;
  academic_weaknesses: string | null;
  tutor_in_charge: string | null;
  secondary_tutor: string | null;
  google_drive_folder_url: string | null;
  notion_page_id: string | null;
  notion_notes: string | null;
}

const StudentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchStudent();
    }
  }, [id]);

  const fetchStudent = async () => {
    try {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setStudent(data);
    } catch (error: any) {
      toast.error("Error loading student profile");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading student profile...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Student not found</p>
        <Button onClick={() => navigate("/students")} className="mt-4">
          Back to Students
        </Button>
      </div>
    );
  }

  const displayName = student.preferred_name || student.first_name;
  const fullName = `${student.first_name} ${student.last_name}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/students")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{displayName} {student.last_name}</h1>
            <Badge variant={student.status === "active" ? "default" : "secondary"}>
              {student.status}
            </Badge>
          </div>
          <p className="text-muted-foreground">ID: {student.student_id}</p>
        </div>
      </div>

      {/* Quick Info Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Full Name</p>
              <p className="font-medium">{fullName}</p>
            </div>
            {student.current_school && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">School</p>
                <p className="font-medium">{student.current_school}</p>
              </div>
            )}
            {student.grade_level && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Grade Level</p>
                <p className="font-medium">Year {student.grade_level}</p>
              </div>
            )}
            {student.current_stage && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Current Stage</p>
                <p className="font-medium">{student.current_stage}</p>
              </div>
            )}
            {student.application_cycle && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Application Cycle</p>
                <p className="font-medium">{student.application_cycle}</p>
              </div>
            )}
            {student.ib_predicted_grade && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">IB Predicted</p>
                <p className="font-medium">{student.ib_predicted_grade}/45</p>
              </div>
            )}
            {student.tutor_in_charge && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Tutor-in-Charge</p>
                <p className="font-medium">{student.tutor_in_charge}</p>
              </div>
            )}
            {student.secondary_tutor && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Secondary Tutor</p>
                <p className="font-medium">{student.secondary_tutor}</p>
              </div>
            )}
          </div>

          {/* Contact Information */}
          <div className="flex gap-2 mt-4 pt-4 border-t">
            {(student.parent_email || student.email) && (
              <SendEmailDialog
                studentId={student.id}
                defaultTo={student.parent_email || student.email || ""}
                defaultToName={student.parent_names || `${student.first_name} ${student.last_name}`}
                trigger={
                  <Button variant="outline" size="sm" className="gap-2">
                    <Mail className="w-4 h-4" />
                    Send Email
                  </Button>
                }
              />
            )}
            {student.phone && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => window.location.href = `tel:${student.phone}`}
              >
                <Phone className="w-4 h-4" />
                {student.phone}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="profile" className="space-y-6">
              <TabsList className="grid w-full grid-cols-10">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="consultations">Consultations</TabsTrigger>
                <TabsTrigger value="tasks">Tasks</TabsTrigger>
                <TabsTrigger value="ecas">ECAs</TabsTrigger>
                <TabsTrigger value="universities">Universities</TabsTrigger>
                <TabsTrigger value="essays">Essays</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="checklists">Checklists</TabsTrigger>
                <TabsTrigger value="financials">Financials</TabsTrigger>
                <TabsTrigger value="notion">Notion Notes</TabsTrigger>
              </TabsList>

        <TabsContent value="profile">
          <StudentProfileTab student={student} onUpdate={fetchStudent} />
        </TabsContent>

        <TabsContent value="consultations">
          <StudentConsultationsTab studentId={student.id} />
        </TabsContent>

        <TabsContent value="tasks">
          <StudentTasksTab studentId={student.id} />
        </TabsContent>

        <TabsContent value="ecas">
          <StudentECAsTab studentId={student.id} studentName={fullName} />
        </TabsContent>

        <TabsContent value="universities">
          <StudentUniversitiesTab studentId={student.id} />
        </TabsContent>

        <TabsContent value="essays">
          <StudentEssaysTab studentId={student.id} />
        </TabsContent>

        <TabsContent value="documents">
          <StudentDocumentsTab studentId={student.id} />
        </TabsContent>

        <TabsContent value="checklists">
          <StudentChecklistsTab studentId={student.id} />
        </TabsContent>

        <TabsContent value="financials">
          <StudentFinancialsTab studentId={student.id} />
        </TabsContent>

        <TabsContent value="notion">
          <StudentNotionNotesTab notionPageId={student.notion_page_id} notionNotes={student.notion_notes} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StudentDetail;
