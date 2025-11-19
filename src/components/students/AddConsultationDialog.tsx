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

interface AddConsultationDialogProps {
  studentId: string;
  onAdded: () => void;
}

const AddConsultationDialog = ({ studentId, onAdded }: AddConsultationDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    consultation_date: "",
    consultation_time: "",
    duration_minutes: "60",
    consultation_type: "",
    topics_discussed: "",
    notes: "",
    action_items: "",
    next_steps: "",
    meeting_link: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const consultationDateTime = `${formData.consultation_date}T${formData.consultation_time}:00`;

      const { error } = await supabase.from("consultations").insert([
        {
          student_id: studentId,
          consultant_id: user.id,
          consultation_date: consultationDateTime,
          duration_minutes: parseInt(formData.duration_minutes),
          consultation_type: formData.consultation_type,
          topics_discussed: formData.topics_discussed
            ? formData.topics_discussed.split(",").map((t) => t.trim())
            : null,
          notes: formData.notes || null,
          action_items: formData.action_items
            ? formData.action_items.split("\n").filter((i) => i.trim())
            : null,
          next_steps: formData.next_steps || null,
          meeting_link: formData.meeting_link || null,
        },
      ]);

      if (error) throw error;

      toast.success("Consultation logged successfully!");
      setOpen(false);
      setFormData({
        consultation_date: "",
        consultation_time: "",
        duration_minutes: "60",
        consultation_type: "",
        topics_discussed: "",
        notes: "",
        action_items: "",
        next_steps: "",
        meeting_link: "",
      });
      onAdded();
    } catch (error: any) {
      toast.error(error.message || "Error logging consultation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Add Consultation
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log Consultation</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="consultation_date">Date *</Label>
              <Input
                id="consultation_date"
                type="date"
                required
                value={formData.consultation_date}
                onChange={(e) => setFormData({ ...formData, consultation_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="consultation_time">Time *</Label>
              <Input
                id="consultation_time"
                type="time"
                required
                value={formData.consultation_time}
                onChange={(e) => setFormData({ ...formData, consultation_time: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="consultation_type">Consultation Type *</Label>
              <Select
                value={formData.consultation_type}
                onValueChange={(value) => setFormData({ ...formData, consultation_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Initial Consultation">Initial Consultation</SelectItem>
                  <SelectItem value="Monthly Check-in">Monthly Check-in</SelectItem>
                  <SelectItem value="Essay Review">Essay Review</SelectItem>
                  <SelectItem value="Interview Prep">Interview Prep</SelectItem>
                  <SelectItem value="Strategy Session">Strategy Session</SelectItem>
                  <SelectItem value="ECA Planning">ECA Planning</SelectItem>
                  <SelectItem value="Application Review">Application Review</SelectItem>
                  <SelectItem value="Parent Meeting">Parent Meeting</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration_minutes">Duration (minutes) *</Label>
              <Input
                id="duration_minutes"
                type="number"
                min="15"
                step="15"
                required
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="topics_discussed">Topics Discussed (comma-separated)</Label>
            <Input
              id="topics_discussed"
              placeholder="e.g., University selection, Essay brainstorming, ECA planning"
              value={formData.topics_discussed}
              onChange={(e) => setFormData({ ...formData, topics_discussed: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              rows={4}
              placeholder="Discussion summary, key insights, student concerns..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="action_items">Action Items (one per line)</Label>
            <Textarea
              id="action_items"
              rows={4}
              placeholder="Student to research 3 universities by Nov 30&#10;Consultant to send essay guidelines&#10;Schedule follow-up meeting"
              value={formData.action_items}
              onChange={(e) => setFormData({ ...formData, action_items: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="next_steps">Next Steps</Label>
            <Textarea
              id="next_steps"
              rows={2}
              placeholder="Planned next session topics, milestones..."
              value={formData.next_steps}
              onChange={(e) => setFormData({ ...formData, next_steps: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="meeting_link">Meeting Link (optional)</Label>
            <Input
              id="meeting_link"
              type="url"
              placeholder="https://meet.google.com/..."
              value={formData.meeting_link}
              onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Consultation"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddConsultationDialog;
