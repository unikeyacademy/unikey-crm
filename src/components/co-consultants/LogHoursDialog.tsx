import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface LogHoursDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  consultantId?: string;
  onSuccess: () => void;
}

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  student_id: string;
}

const LogHoursDialog = ({ open, onOpenChange, consultantId, onSuccess }: LogHoursDialogProps) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [consultants, setConsultants] = useState<{ id: string; full_name: string; email: string }[]>([]);
  const [form, setForm] = useState({
    consultant_id: consultantId || "",
    student_id: "",
    work_date: new Date().toISOString().split("T")[0],
    hours: "",
    hourly_rate: "",
    description: "",
  });

  useEffect(() => {
    if (open) {
      fetchStudents();
      if (!consultantId) fetchConsultants();
    }
  }, [open]);

  useEffect(() => {
    if (consultantId) setForm(f => ({ ...f, consultant_id: consultantId }));
  }, [consultantId]);

  const fetchStudents = async () => {
    const { data } = await supabase.from("students").select("id, first_name, last_name, student_id").eq("status", "active").order("first_name");
    setStudents(data || []);
  };

  const fetchConsultants = async () => {
    const { data } = await supabase.from("profiles").select("id, full_name, email");
    setConsultants(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from("co_consultant_hours").insert([{
        consultant_id: form.consultant_id,
        student_id: form.student_id,
        work_date: form.work_date,
        hours: parseFloat(form.hours),
        hourly_rate: parseFloat(form.hourly_rate || "0"),
        description: form.description || null,
      }]);
      if (error) throw error;
      toast.success("Hours logged successfully!");
      onOpenChange(false);
      setForm({ consultant_id: consultantId || "", student_id: "", work_date: new Date().toISOString().split("T")[0], hours: "", hourly_rate: "", description: "" });
      onSuccess();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Log Co-Consultant Hours</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!consultantId && (
            <div className="space-y-2">
              <Label>Co-Consultant *</Label>
              <Select value={form.consultant_id} onValueChange={v => setForm({ ...form, consultant_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select consultant" /></SelectTrigger>
                <SelectContent>
                  {consultants.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.full_name || c.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label>Student *</Label>
            <Select value={form.student_id} onValueChange={v => setForm({ ...form, student_id: v })}>
              <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
              <SelectContent>
                {students.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.student_id})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2"><Label>Date *</Label><Input required type="date" value={form.work_date} onChange={e => setForm({ ...form, work_date: e.target.value })} /></div>
            <div className="space-y-2"><Label>Hours *</Label><Input required type="number" step="0.25" min="0.25" value={form.hours} onChange={e => setForm({ ...form, hours: e.target.value })} placeholder="e.g., 2.5" /></div>
            <div className="space-y-2"><Label>Hourly Rate ($)</Label><Input type="number" step="0.01" value={form.hourly_rate} onChange={e => setForm({ ...form, hourly_rate: e.target.value })} placeholder="0" /></div>
          </div>
          <div className="space-y-2"><Label>Description</Label><Textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="What was worked on?" /></div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={!form.consultant_id || !form.student_id || !form.hours}>Log Hours</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LogHoursDialog;
