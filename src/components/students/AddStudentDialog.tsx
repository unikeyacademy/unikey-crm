import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";

interface AddStudentDialogProps {
  onStudentAdded?: () => void;
}

const AddStudentDialog = ({ onStudentAdded }: AddStudentDialogProps) => {
  interface SubjectChoice {
    subject: string;
    predicted_grade: string;
  }

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState<SubjectChoice[]>([]);
  const [newSubject, setNewSubject] = useState({ subject: "", predicted_grade: "" });
  const [consultants, setConsultants] = useState<{ id: string; full_name: string | null; email: string }[]>([]);

  useEffect(() => {
    if (open) {
      supabase.from("profiles").select("id, full_name, email").then(({ data }) => setConsultants(data || []));
    }
  }, [open]);
  const [formData, setFormData] = useState({
    student_id: "",
    first_name: "",
    last_name: "",
    preferred_name: "",
    email: "",
    phone: "",
    date_of_birth: "",
    gender: "",
    grade_level: "",
    current_school: "",
    curriculum: "",
    application_cycle: "",
    quotation: "",
    current_stage: "Initial Consultation",
    parent_names: "",
    parent_email: "",
    parent_phone: "",
    notes: "",
    // New fields
    passport_nationality: "",
    city: "",
    timezone: "",
    graduation_year: "",
    target_major_primary: "",
    target_major_secondary: "",
    track: "",
    consultation_programme: "",
    risk_profile: "",
    lead_source: "",
    engagement_stage: "Active",
    current_gpa: "",
    academic_strengths: "",
    academic_weaknesses: "",
    secondary_consultant_id: "",
  });

  const handleAddSubject = () => {
    if (!newSubject.subject.trim() || !newSubject.predicted_grade.trim()) {
      toast.error("Please fill in both subject and predicted grade");
      return;
    }
    
    if (subjects.some(s => s.subject === newSubject.subject.trim())) {
      toast.error("This subject has already been added");
      return;
    }
    
    setSubjects([...subjects, { 
      subject: newSubject.subject.trim(), 
      predicted_grade: newSubject.predicted_grade.trim() 
    }]);
    setNewSubject({ subject: "", predicted_grade: "" });
  };

  const handleRemoveSubject = (index: number) => {
    setSubjects(subjects.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from("students").insert([
        {
          student_id: formData.student_id,
          first_name: formData.first_name,
          last_name: formData.last_name,
          preferred_name: formData.preferred_name || null,
          email: formData.email || null,
          phone: formData.phone || null,
          date_of_birth: formData.date_of_birth || null,
          gender: formData.gender || null,
          grade_level: formData.grade_level ? parseInt(formData.grade_level) : null,
          current_school: formData.current_school || null,
          curriculum: formData.curriculum || null,
          subject_choices: subjects.length > 0 ? subjects as any : null,
          application_cycle: formData.application_cycle || null,
          quotation: formData.quotation || null,
          current_stage: formData.current_stage,
          parent_names: formData.parent_names || null,
          parent_email: formData.parent_email || null,
          parent_phone: formData.parent_phone || null,
          notes: formData.notes || null,
          status: "active",
          // New fields
          passport_nationality: formData.passport_nationality || null,
          city: formData.city || null,
          timezone: formData.timezone || null,
          graduation_year: formData.graduation_year ? parseInt(formData.graduation_year) : null,
          target_major_primary: formData.target_major_primary || null,
          target_major_secondary: formData.target_major_secondary || null,
          track: formData.track || null,
          consultation_programme: formData.consultation_programme || null,
          risk_profile: formData.risk_profile || null,
          lead_source: formData.lead_source || null,
          engagement_stage: formData.engagement_stage || null,
          current_gpa: formData.current_gpa || null,
          academic_strengths: formData.academic_strengths || null,
          academic_weaknesses: formData.academic_weaknesses || null,
          secondary_consultant_id: formData.secondary_consultant_id || null,
        },
      ]);

      if (error) throw error;

      toast.success("Student added successfully!");
      setOpen(false);
      setSubjects([]);
      setNewSubject({ subject: "", predicted_grade: "" });
      setFormData({
        student_id: "",
        first_name: "",
        last_name: "",
        preferred_name: "",
        email: "",
        phone: "",
        date_of_birth: "",
        gender: "",
        grade_level: "",
        current_school: "",
        curriculum: "",
        application_cycle: "",
        quotation: "",
        current_stage: "Initial Consultation",
        parent_names: "",
        parent_email: "",
        parent_phone: "",
        notes: "",
        passport_nationality: "",
        city: "",
        timezone: "",
        graduation_year: "",
        target_major_primary: "",
        target_major_secondary: "",
        track: "",
        risk_profile: "",
        lead_source: "",
        engagement_stage: "Active",
        current_gpa: "",
        academic_strengths: "",
        academic_weaknesses: "",
        secondary_consultant_id: "",
      });
      if (onStudentAdded) onStudentAdded();
    } catch (error: any) {
      toast.error(error.message || "Error adding student");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Add Student
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Student</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground">Identity & Contact</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="student_id">Student ID *</Label>
                <Input
                  id="student_id"
                  required
                  value={formData.student_id}
                  onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                  placeholder="UK2025-001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                    <SelectItem value="Prefer Not to Say">Prefer Not to Say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  required
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  required
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="preferred_name">Preferred Name</Label>
                <Input
                  id="preferred_name"
                  value={formData.preferred_name}
                  onChange={(e) => setFormData({ ...formData, preferred_name: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date_of_birth">Date of Birth</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="passport_nationality">Passport / Nationality</Label>
                <Input
                  id="passport_nationality"
                  value={formData.passport_nationality}
                  onChange={(e) => setFormData({ ...formData, passport_nationality: e.target.value })}
                  placeholder="e.g. British, Hong Kong SAR"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City / Timezone</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="e.g. Hong Kong (GMT+8)"
                />
              </div>
            </div>
          </div>

          {/* Academic Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground">Academic Information</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="current_school">Current School</Label>
                <Input
                  id="current_school"
                  value={formData.current_school}
                  onChange={(e) => setFormData({ ...formData, current_school: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="grade_level">Grade Level</Label>
                <Input
                  id="grade_level"
                  type="number"
                  min="1"
                  max="13"
                  value={formData.grade_level}
                  onChange={(e) => setFormData({ ...formData, grade_level: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="graduation_year">Graduation Year</Label>
                <Input
                  id="graduation_year"
                  type="number"
                  min="2024"
                  max="2035"
                  value={formData.graduation_year}
                  onChange={(e) => setFormData({ ...formData, graduation_year: e.target.value })}
                  placeholder="2026"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="curriculum">Curriculum</Label>
                <Select
                  value={formData.curriculum}
                  onValueChange={(value) => setFormData({ ...formData, curriculum: value })}
                >
                  <SelectTrigger id="curriculum" className="bg-background">
                    <SelectValue placeholder="Select curriculum" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    <SelectItem value="IB">International Baccalaureate (IB)</SelectItem>
                    <SelectItem value="A-Levels">A-Levels</SelectItem>
                    <SelectItem value="AP">Advanced Placement (AP)</SelectItem>
                    <SelectItem value="IGCSE">IGCSE</SelectItem>
                    <SelectItem value="HKDSE">HKDSE</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="current_gpa">Current GPA / Grades</Label>
                <Input
                  id="current_gpa"
                  value={formData.current_gpa}
                  onChange={(e) => setFormData({ ...formData, current_gpa: e.target.value })}
                  placeholder="e.g. 3.8 / 4.0 or 38/45"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quotation">Quotation</Label>
                <Input
                  id="quotation"
                  value={formData.quotation}
                  onChange={(e) => setFormData({ ...formData, quotation: e.target.value })}
                  placeholder="Enter quotation"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Subject Choices</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Subject name (e.g., Mathematics HL)"
                  value={newSubject.subject}
                  onChange={(e) => setNewSubject({ ...newSubject, subject: e.target.value })}
                  className="flex-1"
                />
                <Input
                  placeholder="Grade"
                  value={newSubject.predicted_grade}
                  onChange={(e) => setNewSubject({ ...newSubject, predicted_grade: e.target.value })}
                  className="w-24"
                />
                <Button type="button" onClick={handleAddSubject} variant="outline" size="icon">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {subjects.length > 0 && (
                <div className="space-y-2">
                  {subjects.map((choice, index) => (
                    <div key={index} className="flex items-center justify-between p-2 rounded-md bg-muted">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{choice.subject}</span>
                        <Badge variant="outline">Grade: {choice.predicted_grade}</Badge>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveSubject(index)}
                        className="h-8 w-8"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="academic_strengths">Academic Strengths</Label>
                <Textarea
                  id="academic_strengths"
                  value={formData.academic_strengths}
                  onChange={(e) => setFormData({ ...formData, academic_strengths: e.target.value })}
                  rows={2}
                  placeholder="Strong in quantitative reasoning, research skills..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="academic_weaknesses">Academic Weaknesses</Label>
                <Textarea
                  id="academic_weaknesses"
                  value={formData.academic_weaknesses}
                  onChange={(e) => setFormData({ ...formData, academic_weaknesses: e.target.value })}
                  rows={2}
                  placeholder="Needs improvement in essay writing..."
                />
              </div>
            </div>
          </div>

          {/* Targeting & Strategy */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground">Targeting & Strategy</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="target_major_primary">Target Major (Primary)</Label>
                <Input
                  id="target_major_primary"
                  value={formData.target_major_primary}
                  onChange={(e) => setFormData({ ...formData, target_major_primary: e.target.value })}
                  placeholder="e.g. Economics"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="target_major_secondary">Target Major (Secondary)</Label>
                <Input
                  id="target_major_secondary"
                  value={formData.target_major_secondary}
                  onChange={(e) => setFormData({ ...formData, target_major_secondary: e.target.value })}
                  placeholder="e.g. Political Science"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="track">Track</Label>
                <Select value={formData.track} onValueChange={(value) => setFormData({ ...formData, track: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select track" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="US Only">US Only</SelectItem>
                    <SelectItem value="UK Only">UK Only</SelectItem>
                    <SelectItem value="Dual">Dual (US + UK)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="risk_profile">Risk Profile</Label>
                <Select value={formData.risk_profile} onValueChange={(value) => setFormData({ ...formData, risk_profile: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select risk profile" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Reach-heavy">Reach-heavy</SelectItem>
                    <SelectItem value="Balanced">Balanced</SelectItem>
                    <SelectItem value="Conservative">Conservative</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="application_cycle">Application Cycle</Label>
                <Input
                  id="application_cycle"
                  placeholder="2026"
                  value={formData.application_cycle}
                  onChange={(e) => setFormData({ ...formData, application_cycle: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Commercial & Ownership */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground">Commercial & Ownership</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lead_source">Lead Source</Label>
                <Select value={formData.lead_source} onValueChange={(value) => setFormData({ ...formData, lead_source: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Referral">Referral</SelectItem>
                    <SelectItem value="Webinar">Webinar</SelectItem>
                    <SelectItem value="School">School</SelectItem>
                    <SelectItem value="Inbound">Inbound</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="engagement_stage">Engagement Stage</Label>
                <Select value={formData.engagement_stage} onValueChange={(value) => setFormData({ ...formData, engagement_stage: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Inquiry">Inquiry</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Deferred">Deferred</SelectItem>
                    <SelectItem value="Alumni">Alumni</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="current_stage">Current Stage</Label>
                <Select value={formData.current_stage} onValueChange={(value) => setFormData({ ...formData, current_stage: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Initial Consultation">Initial Consultation</SelectItem>
                    <SelectItem value="Kickoff / Year 1">Kickoff / Year 1</SelectItem>
                    <SelectItem value="Year 2">Year 2</SelectItem>
                    <SelectItem value="Year 3 Pre-Application">Year 3 Pre-Application</SelectItem>
                    <SelectItem value="Application Season">Application Season</SelectItem>
                    <SelectItem value="Post-Application">Post-Application</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="secondary_consultant">Secondary Consultant (Co-Consultant)</Label>
              <Select value={formData.secondary_consultant_id} onValueChange={(value) => setFormData({ ...formData, secondary_consultant_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select co-consultant" />
                </SelectTrigger>
                <SelectContent>
                  {consultants.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.full_name || c.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          </div>

          {/* Parent Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground">Parent Information</h3>
            <div className="space-y-2">
              <Label htmlFor="parent_names">Parent Names</Label>
              <Input
                id="parent_names"
                value={formData.parent_names}
                onChange={(e) => setFormData({ ...formData, parent_names: e.target.value })}
                placeholder="Mr. & Mrs. Zhang"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="parent_email">Parent Email</Label>
                <Input
                  id="parent_email"
                  type="email"
                  value={formData.parent_email}
                  onChange={(e) => setFormData({ ...formData, parent_email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parent_phone">Parent Phone</Label>
                <Input
                  id="parent_phone"
                  value={formData.parent_phone}
                  onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Initial Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Initial assessment notes..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Student"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddStudentDialog;
