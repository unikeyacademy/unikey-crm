import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AddChecklistDialogProps {
  studentId: string;
  onChecklistAdded: () => void;
}

const AddChecklistDialog = ({ studentId, onChecklistAdded }: AddChecklistDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [universities, setUniversities] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    checklistName: "",
    description: "",
    universityTargetId: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchUniversities();
    }
  }, [open, studentId]);

  const fetchUniversities = async () => {
    const { data } = await supabase
      .from('student_university_targets')
      .select('id, university_name')
      .eq('student_id', studentId);
    setUniversities(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('application_checklists').insert({
        student_id: studentId,
        checklist_name: formData.checklistName,
        description: formData.description || null,
        university_target_id: formData.universityTargetId || null,
      });

      if (error) throw error;

      toast({
        title: "Checklist created",
        description: "Application checklist has been created successfully",
      });

      setOpen(false);
      setFormData({ checklistName: "", description: "", universityTargetId: "" });
      onChecklistAdded();
    } catch (error: any) {
      toast({
        title: "Error creating checklist",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Checklist
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Application Checklist</DialogTitle>
          <DialogDescription>
            Create a new checklist to track application progress
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="checklistName">Checklist Name</Label>
            <Input
              id="checklistName"
              value={formData.checklistName}
              onChange={(e) => setFormData({ ...formData, checklistName: e.target.value })}
              placeholder="e.g., Common App Requirements"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="university">Link to University (Optional)</Label>
            <Select
              value={formData.universityTargetId}
              onValueChange={(value) => setFormData({ ...formData, universityTargetId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select university" />
              </SelectTrigger>
              <SelectContent>
                {universities.map((uni) => (
                  <SelectItem key={uni.id} value={uni.id}>
                    {uni.university_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add a description for this checklist"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Checklist"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddChecklistDialog;
