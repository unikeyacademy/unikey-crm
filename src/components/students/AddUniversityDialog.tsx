import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import DeadlineCascadeDialog from "./DeadlineCascadeDialog";
import { ChecklistGenerationDialog } from "../checklists/ChecklistGenerationDialog";

interface AddUniversityDialogProps {
  studentId: string;
  onAdded: () => void;
}

const AddUniversityDialog = ({ studentId, onAdded }: AddUniversityDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cascadeOpen, setCascadeOpen] = useState(false);
  const [checklistOpen, setChecklistOpen] = useState(false);
  const [addedUniversity, setAddedUniversity] = useState<any>(null);
  const [formData, setFormData] = useState({
    university_name: "",
    program: "",
    country: "",
    application_system: "",
    deadline_date: "",
    status: "researching",
    priority: "medium",
    notes: "",
    round: "",
    offer_conditions: "",
    firm_choice: false,
    insurance_choice: false,
    waitlist_plan_status: "",
    clearing_shortlist: false,
    enrolment_intention: "",
    matriculation_confirmed: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.from("student_university_targets").insert([
        {
          student_id: studentId,
          university_name: formData.university_name,
          program: formData.program || null,
          country: formData.country || null,
          application_system: formData.application_system || null,
          deadline_date: formData.deadline_date || null,
          status: formData.status,
          priority: formData.priority,
          notes: formData.notes || null,
          round: formData.round || null,
          offer_conditions: formData.offer_conditions || null,
          firm_choice: formData.firm_choice,
          insurance_choice: formData.insurance_choice,
          waitlist_plan_status: formData.waitlist_plan_status || null,
          clearing_shortlist: formData.clearing_shortlist,
          enrolment_intention: formData.enrolment_intention || null,
          matriculation_confirmed: formData.matriculation_confirmed,
        },
      ]).select();

      if (error) throw error;

      toast.success("University target added!");
      setOpen(false);
      
      // Store university data for subsequent dialogs
      if (data && data[0]) {
        setAddedUniversity(data[0]);
        
        // First, check if we should generate a checklist
        if (formData.application_system) {
          setChecklistOpen(true);
        } else if (formData.deadline_date) {
          // If no application system but has deadline, go straight to cascade
          setCascadeOpen(true);
        } else {
          // No checklist or cascade needed, just close
          handleFinalClose();
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Error adding university");
    } finally {
      setLoading(false);
    }
  };

  const handleChecklistClose = () => {
    setChecklistOpen(false);
    
    // After checklist generation, check if we need to show cascade dialog
    if (addedUniversity?.deadline_date) {
      setCascadeOpen(true);
    } else {
      // No cascade needed, finish up
      handleFinalClose();
    }
  };

  const handleCascadeClose = () => {
    setCascadeOpen(false);
    handleFinalClose();
  };

  const handleFinalClose = () => {
    setAddedUniversity(null);
    setFormData({
      university_name: "",
      program: "",
      country: "",
      application_system: "",
      deadline_date: "",
      status: "researching",
      priority: "medium",
      notes: "",
      round: "",
      offer_conditions: "",
      firm_choice: false,
      insurance_choice: false,
      waitlist_plan_status: "",
      clearing_shortlist: false,
      enrolment_intention: "",
      matriculation_confirmed: false,
    });
    onAdded();
  };

  return (
    <>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Add University
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add University Target</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="university_name">University Name *</Label>
            <Input
              id="university_name"
              required
              value={formData.university_name}
              onChange={(e) => setFormData({ ...formData, university_name: e.target.value })}
              placeholder="e.g., Stanford University"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="program">Program/Major</Label>
            <Input
              id="program"
              value={formData.program}
              onChange={(e) => setFormData({ ...formData, program: e.target.value })}
              placeholder="e.g., Economics, Computer Science, PPE"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Select
                value={formData.country}
                onValueChange={(value) => setFormData({ ...formData, country: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="US">United States</SelectItem>
                  <SelectItem value="UK">United Kingdom</SelectItem>
                  <SelectItem value="HK">Hong Kong</SelectItem>
                  <SelectItem value="Canada">Canada</SelectItem>
                  <SelectItem value="Australia">Australia</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="application_system">Application System</Label>
              <Select
                value={formData.application_system}
                onValueChange={(value) => setFormData({ ...formData, application_system: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select system" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UCAS">UCAS</SelectItem>
                  <SelectItem value="Common App">Common App</SelectItem>
                  <SelectItem value="UC Application">UC Application</SelectItem>
                  <SelectItem value="JUPAS">JUPAS</SelectItem>
                  <SelectItem value="OUAC">OUAC</SelectItem>
                  <SelectItem value="Coalition">Coalition App</SelectItem>
                  <SelectItem value="Direct">Direct Application</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deadline_date">Deadline Date</Label>
              <Input
                id="deadline_date"
                type="date"
                value={formData.deadline_date}
                onChange={(e) => setFormData({ ...formData, deadline_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="researching">Researching</SelectItem>
                  <SelectItem value="shortlisted">Shortlisted</SelectItem>
                  <SelectItem value="in_progress">Application in Progress</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="interview_scheduled">Interview Scheduled</SelectItem>
                  <SelectItem value="offer_received">Offer Received</SelectItem>
                  <SelectItem value="offer_accepted">Offer Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="withdrawn">Withdrawn</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High (Top Choice)</SelectItem>
                  <SelectItem value="medium">Medium (Target)</SelectItem>
                  <SelectItem value="low">Low (Safety)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Round */}
          <div className="space-y-2">
            <Label htmlFor="round">Application Round</Label>
            <Select
              value={formData.round}
              onValueChange={(value) => setFormData({ ...formData, round: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select round" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ED">Early Decision (ED)</SelectItem>
                <SelectItem value="ED2">Early Decision II (ED2)</SelectItem>
                <SelectItem value="EA">Early Action (EA)</SelectItem>
                <SelectItem value="REA">Restrictive Early Action (REA)</SelectItem>
                <SelectItem value="RD">Regular Decision (RD)</SelectItem>
                <SelectItem value="Rolling">Rolling</SelectItem>
                <SelectItem value="Oxbridge">Oxbridge (Oct 15)</SelectItem>
                <SelectItem value="Medicine">Medicine (Oct 15)</SelectItem>
                <SelectItem value="UCAS_Jan">UCAS January</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Application requirements, fit analysis, strategic notes..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add University"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
    
    {addedUniversity && checklistOpen && (
      <ChecklistGenerationDialog
        open={checklistOpen}
        onOpenChange={setChecklistOpen}
        studentId={studentId}
        universityTargetId={addedUniversity.id}
        universityName={addedUniversity.university_name}
        applicationSystem={addedUniversity.application_system}
        onGenerated={handleChecklistClose}
      />
    )}

    {addedUniversity && cascadeOpen && (
      <DeadlineCascadeDialog
        open={cascadeOpen}
        onOpenChange={handleCascadeClose}
        universityId={addedUniversity.id}
        universityName={addedUniversity.university_name}
        applicationSystem={addedUniversity.application_system}
        deadlineDate={addedUniversity.deadline_date}
        studentId={studentId}
      />
    )}
    </>
  );
};

export default AddUniversityDialog;
