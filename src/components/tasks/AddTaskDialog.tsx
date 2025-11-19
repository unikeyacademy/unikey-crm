import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus } from "lucide-react";

interface AddTaskDialogProps {
  studentId?: string;
  onTaskAdded?: () => void;
  trigger?: React.ReactNode;
}

const AddTaskDialog = ({ studentId, onTaskAdded, trigger }: AddTaskDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [consultants, setConsultants] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    student_id: studentId || "",
    title: "",
    description: "",
    task_type: "",
    priority: "medium",
    due_date: "",
    assigned_to: "",
  });

  useEffect(() => {
    if (open) {
      fetchStudents();
      fetchConsultants();
    }
  }, [open]);

  const fetchStudents = async () => {
    const { data } = await supabase
      .from("students")
      .select("id, first_name, last_name, student_id")
      .eq("status", "active")
      .order("last_name");
    setStudents(data || []);
  };

  const fetchConsultants = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .order("full_name");
    setConsultants(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("tasks").insert([
        {
          student_id: formData.student_id || null,
          title: formData.title,
          description: formData.description || null,
          task_type: formData.task_type || null,
          priority: formData.priority,
          due_date: formData.due_date ? new Date(formData.due_date).toISOString() : null,
          assigned_to: formData.assigned_to || user.id,
          created_by: user.id,
          status: "pending",
        },
      ]);

      if (error) throw error;

      toast.success("Task created successfully!");
      setOpen(false);
      setFormData({
        student_id: studentId || "",
        title: "",
        description: "",
        task_type: "",
        priority: "medium",
        due_date: "",
        assigned_to: "",
      });
      if (onTaskAdded) onTaskAdded();
    } catch (error: any) {
      toast.error(error.message || "Error creating task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            New Task
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="student_id">Student (optional)</Label>
            <Select
              value={formData.student_id}
              onValueChange={(value) => setFormData({ ...formData, student_id: value })}
              disabled={!!studentId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select student" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No specific student</SelectItem>
                {students.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.first_name} {student.last_name} ({student.student_id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Task Title *</Label>
            <Input
              id="title"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Review Stanford essay draft"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="task_type">Task Type</Label>
              <Select
                value={formData.task_type}
                onValueChange={(value) => setFormData({ ...formData, task_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Essay Review">Essay Review</SelectItem>
                  <SelectItem value="Document Verification">Document Verification</SelectItem>
                  <SelectItem value="Mock Interview">Mock Interview</SelectItem>
                  <SelectItem value="Application Submission">Application Submission</SelectItem>
                  <SelectItem value="ECA Support">ECA Support</SelectItem>
                  <SelectItem value="Student Request">Student Request</SelectItem>
                  <SelectItem value="Consultation Scheduling">Consultation Scheduling</SelectItem>
                  <SelectItem value="Parent Communication">Parent Communication</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority *</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="due_date">Due Date</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assigned_to">Assign To</Label>
              <Select
                value={formData.assigned_to}
                onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Assign to consultant" />
                </SelectTrigger>
                <SelectContent>
                  {consultants.map((consultant) => (
                    <SelectItem key={consultant.id} value={consultant.id}>
                      {consultant.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Task details, requirements, notes..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Task"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTaskDialog;
