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

interface AddECADialogProps {
  studentId: string;
  onAdded: () => void;
}

const AddECADialog = ({ studentId, onAdded }: AddECADialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    eca_name: "",
    eca_type: "",
    status: "planning",
    start_date: "",
    end_date: "",
    description: "",
    objectives: "",
    completion_percentage: "0",
    role: "",
    time_commitment: "",
    impact: "",
    awards: "",
    reference_mentor: "",
    link: "",
    primary_category: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("student_ecas").insert([
        {
          student_id: studentId,
          eca_name: formData.eca_name,
          eca_type: formData.eca_type,
          status: formData.status,
          start_date: formData.start_date || null,
          end_date: formData.end_date || null,
          description: formData.description || null,
          objectives: formData.objectives || null,
          completion_percentage: parseInt(formData.completion_percentage),
          lead_consultant_id: user.id,
          role: formData.role || null,
          time_commitment: formData.time_commitment || null,
          impact: formData.impact || null,
          awards: formData.awards || null,
          reference_mentor: formData.reference_mentor || null,
          link: formData.link || null,
          primary_category: formData.primary_category || null,
        },
      ]);

      if (error) throw error;

      toast.success("ECA added successfully!");
      setOpen(false);
      setFormData({
        eca_name: "",
        eca_type: "",
        status: "planning",
        start_date: "",
        end_date: "",
        description: "",
        objectives: "",
        completion_percentage: "0",
        role: "",
        time_commitment: "",
        impact: "",
        awards: "",
        reference_mentor: "",
        link: "",
        primary_category: "",
      });
      onAdded();
    } catch (error: any) {
      toast.error(error.message || "Error adding ECA");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Add ECA
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Extra-Curricular Activity</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="eca_name">ECA Name *</Label>
            <Input
              id="eca_name"
              required
              value={formData.eca_name}
              onChange={(e) => setFormData({ ...formData, eca_name: e.target.value })}
              placeholder="e.g., Green Economy Essay Competition"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="eca_type">ECA Type *</Label>
              <Select
                value={formData.eca_type}
                onValueChange={(value) => setFormData({ ...formData, eca_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                 <SelectItem value="Pre-College Course">Pre-College Course</SelectItem>
                  <SelectItem value="Competition">Competition</SelectItem>
                  <SelectItem value="Passion Project">Passion Project</SelectItem>
                  <SelectItem value="Research Experience">Research Experience</SelectItem>
                  <SelectItem value="Internship">Internship</SelectItem>
                  <SelectItem value="Volunteering">Volunteering</SelectItem>
                  <SelectItem value="Leadership Role">Leadership Role</SelectItem>
                  <SelectItem value="Publication">Publication</SelectItem>
                  <SelectItem value="Conference">Conference Presentation</SelectItem>
                  <SelectItem value="Sport">Sport</SelectItem>
                  <SelectItem value="Arts">Arts / Creative</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="application_submitted">Application Submitted</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="completion_percentage">Completion Percentage</Label>
            <Input
              id="completion_percentage"
              type="number"
              min="0"
              max="100"
              value={formData.completion_percentage}
              onChange={(e) => setFormData({ ...formData, completion_percentage: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the activity..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="objectives">Objectives</Label>
            <Textarea
              id="objectives"
              rows={3}
              value={formData.objectives}
              onChange={(e) => setFormData({ ...formData, objectives: e.target.value })}
              placeholder="What are the goals and learning outcomes?"
            />
          </div>

          {/* New taxonomy fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Role / Position</Label>
              <Input value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} placeholder="e.g., Team Lead, Researcher" />
            </div>
            <div className="space-y-2">
              <Label>Time Commitment</Label>
              <Input value={formData.time_commitment} onChange={e => setFormData({ ...formData, time_commitment: e.target.value })} placeholder="e.g., 10 hrs/week for 6 months" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Measurable Impact</Label>
              <Input value={formData.impact} onChange={e => setFormData({ ...formData, impact: e.target.value })} placeholder="e.g., Raised $5,000, Published 2 papers" />
            </div>
            <div className="space-y-2">
              <Label>Awards / Recognition</Label>
              <Input value={formData.awards} onChange={e => setFormData({ ...formData, awards: e.target.value })} placeholder="e.g., Gold Medal, Finalist" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Reference / Mentor</Label>
              <Input value={formData.reference_mentor} onChange={e => setFormData({ ...formData, reference_mentor: e.target.value })} placeholder="Name and contact" />
            </div>
            <div className="space-y-2">
              <Label>Link / URL</Label>
              <Input type="url" value={formData.link} onChange={e => setFormData({ ...formData, link: e.target.value })} placeholder="https://..." />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Primary Category</Label>
            <Select value={formData.primary_category} onValueChange={v => setFormData({ ...formData, primary_category: v })}>
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Academic Enrichment">Academic Enrichment</SelectItem>
                <SelectItem value="Research & Innovation">Research & Innovation</SelectItem>
                <SelectItem value="Leadership & Governance">Leadership & Governance</SelectItem>
                <SelectItem value="Community Service">Community Service</SelectItem>
                <SelectItem value="Entrepreneurship">Entrepreneurship</SelectItem>
                <SelectItem value="Arts & Culture">Arts & Culture</SelectItem>
                <SelectItem value="Athletics">Athletics</SelectItem>
                <SelectItem value="STEM">STEM</SelectItem>
                <SelectItem value="Media & Communication">Media & Communication</SelectItem>
                <SelectItem value="Social Impact">Social Impact</SelectItem>
                <SelectItem value="Professional Development">Professional Development</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add ECA"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddECADialog;
