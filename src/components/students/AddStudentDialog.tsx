import { useState } from "react";
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
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [newSubject, setNewSubject] = useState("");
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
    ib_predicted_grade: "",
    current_stage: "Initial Consultation",
    parent_names: "",
    parent_email: "",
    parent_phone: "",
    notes: "",
  });

  const handleAddSubject = () => {
    const trimmedSubject = newSubject.trim();
    if (trimmedSubject && !subjects.includes(trimmedSubject)) {
      setSubjects([...subjects, trimmedSubject]);
      setNewSubject("");
    } else if (subjects.includes(trimmedSubject)) {
      toast.error("This subject is already added");
    }
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
          subject_choices: subjects.length > 0 ? subjects : null,
          application_cycle: formData.application_cycle || null,
          ib_predicted_grade: formData.ib_predicted_grade ? parseInt(formData.ib_predicted_grade) : null,
          current_stage: formData.current_stage,
          parent_names: formData.parent_names || null,
          parent_email: formData.parent_email || null,
          parent_phone: formData.parent_phone || null,
          notes: formData.notes || null,
          status: "active",
        },
      ]);

      if (error) throw error;

      toast.success("Student added successfully!");
      setOpen(false);
      setSubjects([]);
      setNewSubject("");
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
        ib_predicted_grade: "",
        current_stage: "Initial Consultation",
        parent_names: "",
        parent_email: "",
        parent_phone: "",
        notes: "",
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
            <h3 className="font-semibold text-sm text-muted-foreground">Basic Information</h3>
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

            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Date of Birth</Label>
              <Input
                id="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
              />
            </div>
          </div>

          {/* Academic Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground">Academic Information</h3>
            <div className="grid grid-cols-2 gap-4">
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
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                    <SelectItem value="National">National Curriculum</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ib_predicted_grade">IB Predicted Grade (0-45)</Label>
                <Input
                  id="ib_predicted_grade"
                  type="number"
                  min="0"
                  max="45"
                  value={formData.ib_predicted_grade}
                  onChange={(e) => setFormData({ ...formData, ib_predicted_grade: e.target.value })}
                />
              </div>
            </div>

            {/* Subject Choices */}
            <div className="space-y-3">
              <Label>Subject Choices</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter a subject (e.g., Mathematics HL)"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddSubject();
                    }
                  }}
                />
                <Button type="button" onClick={handleAddSubject} variant="outline" size="icon">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {subjects.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {subjects.map((subject, index) => (
                    <Badge key={index} variant="secondary" className="pr-1">
                      {subject}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 ml-2 hover:bg-transparent"
                        onClick={() => handleRemoveSubject(index)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
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
