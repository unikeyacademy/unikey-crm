import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { CheckCircle2, XCircle } from "lucide-react";

interface RequestDetailsDialogProps {
  request: any;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export const RequestDetailsDialog = ({ request, open, onClose, onUpdated }: RequestDetailsDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    status: request.status,
    priority: request.priority,
    resolution_notes: request.resolution_notes || "",
  });

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const updateData: any = {
        status: formData.status,
        priority: formData.priority,
        resolution_notes: formData.resolution_notes,
      };

      if (formData.status === 'completed' && !request.completed_at) {
        const { data: { user } } = await supabase.auth.getUser();
        updateData.completed_at = new Date().toISOString();
        updateData.completed_by = user?.id;
      }

      const { error } = await supabase
        .from('ad_hoc_requests')
        .update(updateData)
        .eq('id', request.id);

      if (error) throw error;

      toast.success("Request updated successfully");
      onUpdated();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to update request");
    } finally {
      setLoading(false);
    }
  };

  const handleConvertToTask = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: task, error } = await supabase
        .from('tasks')
        .insert({
          title: request.title,
          description: request.description,
          student_id: request.student_id,
          assigned_to: request.assigned_to,
          due_date: request.due_date,
          priority: request.priority,
          status: 'pending',
          created_by: user?.id,
          task_type: request.request_type,
        })
        .select()
        .single();

      if (error) throw error;

      // Link task to request
      await supabase
        .from('ad_hoc_requests')
        .update({ related_task_id: task.id })
        .eq('id', request.id);

      toast.success("Task created successfully");
      onUpdated();
    } catch (error: any) {
      toast.error(error.message || "Failed to convert to task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{request.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Student</Label>
              <p className="font-medium">
                {request.students?.first_name} {request.students?.last_name}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Type</Label>
              <p className="font-medium">{request.request_type.replace('_', ' ')}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Submitted By</Label>
              <p className="font-medium">
                {request.submitted_by_name || request.submitted_by}
                {request.submitted_by_email && (
                  <span className="text-sm text-muted-foreground block">
                    {request.submitted_by_email}
                  </span>
                )}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Created</Label>
              <p className="font-medium">
                {format(new Date(request.created_at), 'MMM d, yyyy h:mm a')}
              </p>
            </div>
          </div>

          {request.description && (
            <div>
              <Label className="text-muted-foreground">Description</Label>
              <p className="mt-1">{request.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
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
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
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
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="resolution_notes">Resolution Notes</Label>
            <Textarea
              id="resolution_notes"
              rows={4}
              value={formData.resolution_notes}
              onChange={(e) => setFormData({ ...formData, resolution_notes: e.target.value })}
              placeholder="Add notes about how this request was resolved..."
            />
          </div>

          {request.completed_at && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Completed on {format(new Date(request.completed_at), 'MMM d, yyyy h:mm a')}
            </div>
          )}

          <div className="flex justify-between pt-4 border-t">
            <div>
              {!request.related_task_id && (
                <Button
                  variant="outline"
                  onClick={handleConvertToTask}
                  disabled={loading}
                >
                  Convert to Task
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={loading}>
                {loading ? "Updating..." : "Update Request"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};