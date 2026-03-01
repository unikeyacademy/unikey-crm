import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import EditStageDialog from "./EditStageDialog";
import StudentTestScoresSection from "./StudentTestScoresSection";

interface StudentProfileTabProps {
  student: any;
  onUpdate: () => void;
}

const StudentProfileTab = ({ student, onUpdate }: StudentProfileTabProps) => {
  const [secondaryConsultantName, setSecondaryConsultantName] = useState<string | null>(null);

  useEffect(() => {
    if (student.secondary_consultant_id) {
      supabase.from("profiles").select("full_name, email").eq("id", student.secondary_consultant_id).single()
        .then(({ data }) => {
          if (data) setSecondaryConsultantName(data.full_name || data.email);
        });
    }
  }, [student.secondary_consultant_id]);

  return (
    <div className="space-y-6">
      {/* Current Stage Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Current Stage</CardTitle>
            <EditStageDialog
              studentId={student.id}
              studentName={`${student.first_name} ${student.last_name}`}
              currentStage={student.current_stage || "Initial Consultation"}
              onStageChanged={onUpdate}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1 p-4 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-lg font-semibold text-primary">
                {student.current_stage || "Initial Consultation"}
              </p>
            </div>
            {student.engagement_stage && (
              <Badge variant="outline" className="text-sm">
                {student.engagement_stage}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Targeting & Strategy */}
      {(student.target_major_primary || student.track || student.risk_profile) && (
        <Card>
          <CardHeader>
            <CardTitle>Targeting & Strategy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {student.target_major_primary && (
                <div>
                  <p className="text-sm text-muted-foreground">Primary Major</p>
                  <p className="font-medium">{student.target_major_primary}</p>
                </div>
              )}
              {student.target_major_secondary && (
                <div>
                  <p className="text-sm text-muted-foreground">Secondary Major</p>
                  <p className="font-medium">{student.target_major_secondary}</p>
                </div>
              )}
              {student.track && (
                <div>
                  <p className="text-sm text-muted-foreground">Track</p>
                  <Badge variant="secondary">{student.track}</Badge>
                </div>
              )}
              {student.risk_profile && (
                <div>
                  <p className="text-sm text-muted-foreground">Risk Profile</p>
                  <Badge variant="outline">{student.risk_profile}</Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Academic Background */}
      <Card>
        <CardHeader>
          <CardTitle>Academic Background</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">School</p>
              <p className="font-medium">{student.current_school || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Grade Level</p>
              <p className="font-medium">{student.grade_level ? `Year ${student.grade_level}` : "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Curriculum</p>
              <p className="font-medium">{student.curriculum || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Graduation Year</p>
              <p className="font-medium">{student.graduation_year || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Current GPA / Grades</p>
              <p className="font-medium">{student.current_gpa || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">IB Predicted Grade</p>
              <p className="font-medium">{student.ib_predicted_grade ? `${student.ib_predicted_grade}/45` : "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Application Cycle</p>
              <p className="font-medium">{student.application_cycle || "-"}</p>
            </div>
          </div>

          {student.subject_choices && student.subject_choices.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Subject Choices</p>
              <div className="space-y-1">
                {student.subject_choices.map((choice: any, index: number) => (
                  <div key={index} className="text-sm flex items-center gap-2">
                    <span className="font-medium">{choice.subject}</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground">Grade: {choice.predicted_grade}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {student.academic_strengths && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Academic Strengths</p>
              <p className="text-sm">{student.academic_strengths}</p>
            </div>
          )}

          {student.academic_weaknesses && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Academic Weaknesses</p>
              <p className="text-sm">{student.academic_weaknesses}</p>
            </div>
          )}

          {student.academic_interests && student.academic_interests.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Academic Interests</p>
              <div className="flex flex-wrap gap-2">
                {student.academic_interests.map((interest: string) => (
                  <Badge key={interest} variant="secondary">
                    {interest}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {student.region_interest && student.region_interest.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Region Interests</p>
              <div className="flex flex-wrap gap-2">
                {student.region_interest.map((region: string) => (
                  <Badge key={region} variant="outline">
                    {region}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Scores */}
      <StudentTestScoresSection studentId={student.id} />

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Full Name</p>
              <p className="font-medium">{student.first_name} {student.last_name}</p>
            </div>
            {student.preferred_name && (
              <div>
                <p className="text-sm text-muted-foreground">Preferred Name</p>
                <p className="font-medium">{student.preferred_name}</p>
              </div>
            )}
            {student.gender && (
              <div>
                <p className="text-sm text-muted-foreground">Gender</p>
                <p className="font-medium">{student.gender}</p>
              </div>
            )}
            {student.date_of_birth && (
              <div>
                <p className="text-sm text-muted-foreground">Date of Birth</p>
                <p className="font-medium">
                  {new Date(student.date_of_birth).toLocaleDateString()}
                </p>
              </div>
            )}
            {student.passport_nationality && (
              <div>
                <p className="text-sm text-muted-foreground">Passport / Nationality</p>
                <p className="font-medium">{student.passport_nationality}</p>
              </div>
            )}
            {student.city && (
              <div>
                <p className="text-sm text-muted-foreground">City / Timezone</p>
                <p className="font-medium">{student.city}</p>
              </div>
            )}
            {student.email && (
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{student.email}</p>
              </div>
            )}
            {student.phone && (
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{student.phone}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Commercial & Ownership */}
      {(student.lead_source || student.engagement_stage || student.quotation || student.secondary_consultant_id) && (
        <Card>
          <CardHeader>
            <CardTitle>Commercial & Ownership</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {student.lead_source && (
                <div>
                  <p className="text-sm text-muted-foreground">Lead Source</p>
                  <p className="font-medium">{student.lead_source}</p>
                </div>
              )}
              {student.engagement_stage && (
                <div>
                  <p className="text-sm text-muted-foreground">Engagement Stage</p>
                  <Badge variant="outline">{student.engagement_stage}</Badge>
                </div>
              )}
              {student.quotation && (
                <div>
                  <p className="text-sm text-muted-foreground">Quotation</p>
                  <p className="font-medium">{student.quotation}</p>
                </div>
              )}
              {secondaryConsultantName && (
                <div>
                  <p className="text-sm text-muted-foreground">Co-Consultant</p>
                  <p className="font-medium">{secondaryConsultantName}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Parent Information */}
      {(student.parent_names || student.parent_email || student.parent_phone) && (
        <Card>
          <CardHeader>
            <CardTitle>Parent Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {student.parent_names && (
                <div>
                  <p className="text-sm text-muted-foreground">Parent Names</p>
                  <p className="font-medium">{student.parent_names}</p>
                </div>
              )}
              {student.parent_email && (
                <div>
                  <p className="text-sm text-muted-foreground">Parent Email</p>
                  <p className="font-medium">{student.parent_email}</p>
                </div>
              )}
              {student.parent_phone && (
                <div>
                  <p className="text-sm text-muted-foreground">Parent Phone</p>
                  <p className="font-medium">{student.parent_phone}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {student.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{student.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StudentProfileTab;
