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
import { Plus, Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface AddConsultationCalendarDialogProps {
  selectedDate?: Date;
  onConsultationAdded: () => void;
}

const AddConsultationCalendarDialog = ({
  selectedDate,
  onConsultationAdded,
}: AddConsultationCalendarDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatingMeet, setGeneratingMeet] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    studentId: "",
    consultationType: "Initial Assessment",
    consultationDate: selectedDate ? format(selectedDate, "yyyy-MM-dd") : "",
    consultationTime: "",
    durationMinutes: 60,
    meetingLink: "",
    notes: "",
  });
  const { toast } = useToast();

  const handleGenerateMeetLink = async () => {
    if (!formData.consultationDate || !formData.consultationTime || !formData.studentId) {
      toast({
        title: "Missing information",
        description: "Please fill in student, date and time first",
        variant: "destructive",
      });
      return;
    }

    setGeneratingMeet(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data: student } = await supabase
        .from('students')
        .select('first_name, last_name')
        .eq('id', formData.studentId)
        .single();

      const consultationDateTime = `${formData.consultationDate}T${formData.consultationTime}:00`;
      const studentName = student ? `${student.first_name} ${student.last_name}` : 'Student';

      const { data, error } = await supabase.functions.invoke('create-meet-link', {
        body: {
          consultationDate: consultationDateTime,
          duration: formData.durationMinutes,
          studentName,
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.meetLink) {
        setFormData({ ...formData, meetingLink: data.meetLink });
        toast({
          title: "Google Meet link generated!",
          description: "The link has been added to the meeting link field",
        });
      }
    } catch (error: any) {
      toast({
        title: "Failed to generate Meet link",
        description: error.message || "Make sure Google Calendar is connected in Settings.",
        variant: "destructive",
      });
    } finally {
      setGeneratingMeet(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchStudents();
    }
  }, [open]);

  useEffect(() => {
    if (selectedDate) {
      setFormData((prev) => ({
        ...prev,
        consultationDate: format(selectedDate, "yyyy-MM-dd"),
      }));
    }
  }, [selectedDate]);

  const fetchStudents = async () => {
    const { data } = await supabase
      .from('students')
      .select('id, first_name, last_name')
      .eq('status', 'active')
      .neq('application_cycle', '2026')
      .order('first_name');
    setStudents(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const consultationDateTime = `${formData.consultationDate}T${formData.consultationTime}:00`;

      const { data: insertedConsultation, error } = await supabase
        .from('consultations')
        .insert({
          student_id: formData.studentId,
          consultant_id: user.id,
          consultation_type: formData.consultationType,
          consultation_date: consultationDateTime,
          duration_minutes: formData.durationMinutes,
          meeting_link: formData.meetingLink || null,
          notes: formData.notes || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Auto-sync with Google Calendar if connected
      if (insertedConsultation) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          await supabase.functions.invoke('sync-calendar', {
            body: {
              consultationId: insertedConsultation.id,
              action: 'create',
            },
            headers: {
              Authorization: `Bearer ${session?.access_token}`,
            },
          });
        } catch (calendarError) {
          console.log('Calendar sync optional, skipped:', calendarError);
        }
      }

      toast({
        title: "Consultation scheduled",
        description: "The consultation has been added to the calendar",
      });

      setOpen(false);
      setFormData({
        studentId: "",
        consultationType: "Initial Assessment",
        consultationDate: "",
        consultationTime: "",
        durationMinutes: 60,
        meetingLink: "",
        notes: "",
      });
      onConsultationAdded();
    } catch (error: any) {
      toast({
        title: "Error scheduling consultation",
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
          Schedule Consultation
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Schedule Consultation</DialogTitle>
          <DialogDescription>Add a new consultation to the calendar</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="student">Student</Label>
            <Select
              value={formData.studentId}
              onValueChange={(value) => setFormData({ ...formData, studentId: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select student" />
              </SelectTrigger>
              <SelectContent>
                {students.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.first_name} {student.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Consultation Type</Label>
            <Select
              value={formData.consultationType}
              onValueChange={(value) => setFormData({ ...formData, consultationType: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Initial Assessment">Initial Assessment</SelectItem>
                <SelectItem value="Profile Building">Profile Building</SelectItem>
                <SelectItem value="School List Discussion">School List Discussion</SelectItem>
                <SelectItem value="Essay Review">Essay Review</SelectItem>
                <SelectItem value="Application Review">Application Review</SelectItem>
                <SelectItem value="Interview Prep">Interview Prep</SelectItem>
                <SelectItem value="General Check-in">General Check-in</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.consultationDate}
                onChange={(e) => setFormData({ ...formData, consultationDate: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={formData.consultationTime}
                onChange={(e) => setFormData({ ...formData, consultationTime: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Input
              id="duration"
              type="number"
              value={formData.durationMinutes}
              onChange={(e) =>
                setFormData({ ...formData, durationMinutes: parseInt(e.target.value) })
              }
              min="15"
              step="15"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="meetingLink">Meeting Link</Label>
            <div className="flex gap-2">
              <Input
                id="meetingLink"
                value={formData.meetingLink}
                onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                placeholder="https://meet.google.com/..."
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleGenerateMeetLink}
                disabled={generatingMeet || !formData.studentId || !formData.consultationDate || !formData.consultationTime}
                title="Generate Google Meet link"
              >
                <Video className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Click the video icon to auto-generate a Google Meet link
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any notes for this consultation"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Scheduling..." : "Schedule"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddConsultationCalendarDialog;
