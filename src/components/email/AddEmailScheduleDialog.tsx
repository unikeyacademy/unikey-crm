import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus } from "lucide-react";

interface AddEmailScheduleDialogProps {
  onAdded: () => void;
}

export const AddEmailScheduleDialog = ({ onAdded }: AddEmailScheduleDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    template_id: "",
    trigger_type: "deadline_reminder",
    trigger_days_before: 7,
    trigger_stage: "",
    send_to_student: true,
    send_to_parent: false,
  });

  useEffect(() => {
    if (open) {
      fetchTemplates();
    }
  }, [open]);

  const fetchTemplates = async () => {
    const { data } = await supabase
      .from('email_templates')
      .select('id, template_name')
      .order('template_name');
    setTemplates(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('email_schedules')
        .insert({
          ...formData,
          trigger_days_before: formData.trigger_type.includes('reminder') ? formData.trigger_days_before : null,
          trigger_stage: formData.trigger_type === 'stage_change' ? formData.trigger_stage : null,
        });

      if (error) throw error;

      toast.success("Email schedule created successfully");
      setOpen(false);
      setFormData({
        template_id: "",
        trigger_type: "deadline_reminder",
        trigger_days_before: 7,
        trigger_stage: "",
        send_to_student: true,
        send_to_parent: false,
      });
      onAdded();
    } catch (error: any) {
      toast.error(error.message || "Failed to create schedule");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Schedule
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Email Schedule</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="template_id">Email Template *</Label>
            <Select
              value={formData.template_id}
              onValueChange={(value) => setFormData({ ...formData, template_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.template_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="trigger_type">Trigger Type *</Label>
            <Select
              value={formData.trigger_type}
              onValueChange={(value) => setFormData({ ...formData, trigger_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="deadline_reminder">Deadline Reminder</SelectItem>
                <SelectItem value="consultation_reminder">Consultation Reminder</SelectItem>
                <SelectItem value="stage_change">Stage Change</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(formData.trigger_type === 'deadline_reminder' || formData.trigger_type === 'consultation_reminder') && (
            <div className="space-y-2">
              <Label htmlFor="trigger_days_before">Days Before Event</Label>
              <Input
                id="trigger_days_before"
                type="number"
                min="1"
                value={formData.trigger_days_before}
                onChange={(e) => setFormData({ ...formData, trigger_days_before: parseInt(e.target.value) })}
              />
            </div>
          )}

          {formData.trigger_type === 'stage_change' && (
            <div className="space-y-2">
              <Label htmlFor="trigger_stage">Trigger Stage</Label>
              <Select
                value={formData.trigger_stage}
                onValueChange={(value) => setFormData({ ...formData, trigger_stage: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Initial Consultation">Initial Consultation</SelectItem>
                  <SelectItem value="Profile Building">Profile Building</SelectItem>
                  <SelectItem value="University Research">University Research</SelectItem>
                  <SelectItem value="Application Prep">Application Prep</SelectItem>
                  <SelectItem value="Essay Writing">Essay Writing</SelectItem>
                  <SelectItem value="Application Submission">Application Submission</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-4">
            <Label>Send To</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="send_to_student"
                checked={formData.send_to_student}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, send_to_student: checked as boolean })
                }
              />
              <label htmlFor="send_to_student" className="text-sm">Student</label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="send_to_parent"
                checked={formData.send_to_parent}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, send_to_parent: checked as boolean })
                }
              />
              <label htmlFor="send_to_parent" className="text-sm">Parent</label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Schedule"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};