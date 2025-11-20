import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";

interface AddECAOpportunityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opportunity?: any;
  onSuccess: () => void;
}

export const AddECAOpportunityDialog = ({
  open,
  onOpenChange,
  opportunity,
  onSuccess
}: AddECAOpportunityDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [isEnriching, setIsEnriching] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    eligibility: "",
    deadline_date: "",
    deadline_type: "annual",
    registration_fee: "",
    cost: "",
    prestige_level: "medium",
    time_commitment: "",
    website: "",
    past_success_notes: "",
    internal_notes: "",
  });

  const [subjectAreas, setSubjectAreas] = useState<string[]>([]);
  const [newSubject, setNewSubject] = useState("");
  const [requiredDocs, setRequiredDocs] = useState<string[]>([]);
  const [newDoc, setNewDoc] = useState("");
  const [bestFor, setBestFor] = useState<string[]>([]);
  const [newBestFor, setNewBestFor] = useState("");

  useEffect(() => {
    if (opportunity) {
      setFormData({
        name: opportunity.name || "",
        type: opportunity.type || "",
        eligibility: opportunity.eligibility || "",
        deadline_date: opportunity.deadline_date || "",
        deadline_type: opportunity.deadline_type || "annual",
        registration_fee: opportunity.registration_fee || "",
        cost: opportunity.cost || "",
        prestige_level: opportunity.prestige_level || "medium",
        time_commitment: opportunity.time_commitment || "",
        website: opportunity.website || "",
        past_success_notes: opportunity.past_success_notes || "",
        internal_notes: opportunity.internal_notes || "",
      });
      setSubjectAreas(opportunity.subject_areas || []);
      setRequiredDocs(opportunity.required_documents || []);
      setBestFor(opportunity.best_for || []);
    } else {
      resetForm();
    }
  }, [opportunity, open]);

  const resetForm = () => {
    setFormData({
      name: "",
      type: "",
      eligibility: "",
      deadline_date: "",
      deadline_type: "annual",
      registration_fee: "",
      cost: "",
      prestige_level: "medium",
      time_commitment: "",
      website: "",
      past_success_notes: "",
      internal_notes: "",
    });
    setSubjectAreas([]);
    setRequiredDocs([]);
    setBestFor([]);
    setNewSubject("");
    setNewDoc("");
    setNewBestFor("");
    setUrlInput('');
  };

  const handleAutoFill = async () => {
    if (!urlInput.trim()) {
      toast.error("Please enter a URL to auto-fill the form");
      return;
    }

    setIsEnriching(true);
    try {
      const { data, error } = await supabase.functions.invoke('enrich-eca-opportunity', {
        body: { url: urlInput }
      });

      if (error) throw error;

      if (data.success && data.data) {
        setFormData({
          name: data.data.name || "",
          type: data.data.type || "",
          eligibility: data.data.eligibility || "",
          deadline_date: data.data.deadline_date || "",
          deadline_type: data.data.deadline_type || "annual",
          registration_fee: data.data.registration_fee || "",
          cost: data.data.cost || "",
          prestige_level: data.data.prestige_level || "medium",
          time_commitment: data.data.time_commitment || "",
          website: data.data.website || urlInput,
          past_success_notes: "",
          internal_notes: data.data.internal_notes || "",
        });
        setSubjectAreas(data.data.subject_areas || []);
        setRequiredDocs(data.data.required_documents || []);
        setBestFor(data.data.best_for || []);

        toast.success("Form populated! Please review and edit as needed.");
      } else {
        throw new Error(data.error || 'Failed to extract information');
      }
    } catch (error) {
      console.error('Error auto-filling form:', error);
      toast.error(error instanceof Error ? error.message : "Could not extract information from URL");
    } finally {
      setIsEnriching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        ...formData,
        subject_areas: subjectAreas,
        required_documents: requiredDocs,
        best_for: bestFor,
        deadline_date: formData.deadline_date || null,
      };

      if (opportunity) {
        const { error } = await supabase
          .from("eca_opportunities")
          .update(data)
          .eq("id", opportunity.id);

        if (error) throw error;
        toast.success("Opportunity updated successfully");
      } else {
        const { error } = await supabase
          .from("eca_opportunities")
          .insert([data]);

        if (error) throw error;
        toast.success("Opportunity added successfully");
      }

      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Failed to save opportunity");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const addItem = (value: string, setter: React.Dispatch<React.SetStateAction<string[]>>, resetInput: () => void) => {
    if (value.trim()) {
      setter(prev => [...prev, value.trim()]);
      resetInput();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{opportunity ? "Edit" : "Add"} ECA Opportunity</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* AI Auto-Fill Section */}
          {!opportunity && (
            <div className="bg-muted/50 p-4 rounded-lg border border-border space-y-2">
              <label className="block text-sm font-semibold">🤖 AI Auto-Fill from URL</label>
              <p className="text-xs text-muted-foreground">
                Paste a competition or program URL to automatically extract details
              </p>
              <div className="flex gap-2">
                <Input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/competition"
                  disabled={isEnriching}
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={handleAutoFill}
                  disabled={isEnriching || !urlInput.trim()}
                  variant="secondary"
                  className="whitespace-nowrap"
                >
                  {isEnriching ? 'Extracting...' : 'Auto-Fill'}
                </Button>
              </div>
            </div>
          )}

          {/* Basic Info */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Opportunity Name *</Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., John Locke Essay Competition"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type *</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger id="type" className="bg-background">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    <SelectItem value="Competition">Competition</SelectItem>
                    <SelectItem value="Research Program">Research Program</SelectItem>
                    <SelectItem value="Summer Program">Summer Program</SelectItem>
                    <SelectItem value="Internship">Internship</SelectItem>
                    <SelectItem value="Workshop">Workshop</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Subject Areas */}
            <div className="space-y-2">
              <Label>Subject Areas</Label>
              <div className="flex gap-2">
                <Input
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="Add subject area"
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addItem(newSubject, setSubjectAreas, () => setNewSubject("")))}
                />
                <Button type="button" onClick={() => addItem(newSubject, setSubjectAreas, () => setNewSubject(""))} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {subjectAreas.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {subjectAreas.map((subject, index) => (
                    <Badge key={index} variant="secondary">
                      {subject}
                      <button
                        type="button"
                        onClick={() => setSubjectAreas(subjectAreas.filter((_, i) => i !== index))}
                        className="ml-2"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prestige_level">Prestige Level</Label>
                <Select value={formData.prestige_level} onValueChange={(value) => setFormData({ ...formData, prestige_level: value })}>
                  <SelectTrigger id="prestige_level" className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="time_commitment">Time Commitment</Label>
                <Input
                  id="time_commitment"
                  value={formData.time_commitment}
                  onChange={(e) => setFormData({ ...formData, time_commitment: e.target.value })}
                  placeholder="e.g., 40-60 hours"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cost">Cost</Label>
                <Input
                  id="cost"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  placeholder="e.g., Free or USD 6,000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="registration_fee">Registration Fee</Label>
                <Input
                  id="registration_fee"
                  value={formData.registration_fee}
                  onChange={(e) => setFormData({ ...formData, registration_fee: e.target.value })}
                  placeholder="e.g., HKD 100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                <Label htmlFor="deadline_type">Deadline Type</Label>
                <Select value={formData.deadline_type} onValueChange={(value) => setFormData({ ...formData, deadline_type: value })}>
                  <SelectTrigger id="deadline_type" className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    <SelectItem value="annual">Annual</SelectItem>
                    <SelectItem value="rolling">Rolling</SelectItem>
                    <SelectItem value="one-time">One-time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="eligibility">Eligibility</Label>
              <Input
                id="eligibility"
                value={formData.eligibility}
                onChange={(e) => setFormData({ ...formData, eligibility: e.target.value })}
                placeholder="e.g., Ages 18 and under"
              />
            </div>

            {/* Required Documents */}
            <div className="space-y-2">
              <Label>Required Documents</Label>
              <div className="flex gap-2">
                <Input
                  value={newDoc}
                  onChange={(e) => setNewDoc(e.target.value)}
                  placeholder="Add required document"
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addItem(newDoc, setRequiredDocs, () => setNewDoc("")))}
                />
                <Button type="button" onClick={() => addItem(newDoc, setRequiredDocs, () => setNewDoc(""))} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {requiredDocs.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {requiredDocs.map((doc, index) => (
                    <Badge key={index} variant="outline">
                      {doc}
                      <button
                        type="button"
                        onClick={() => setRequiredDocs(requiredDocs.filter((_, i) => i !== index))}
                        className="ml-2"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Best For */}
            <div className="space-y-2">
              <Label>Best For</Label>
              <div className="flex gap-2">
                <Input
                  value={newBestFor}
                  onChange={(e) => setNewBestFor(e.target.value)}
                  placeholder="e.g., UK applicants, Economics majors"
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addItem(newBestFor, setBestFor, () => setNewBestFor("")))}
                />
                <Button type="button" onClick={() => addItem(newBestFor, setBestFor, () => setNewBestFor(""))} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {bestFor.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {bestFor.map((item, index) => (
                    <Badge key={index} variant="outline">
                      {item}
                      <button
                        type="button"
                        onClick={() => setBestFor(bestFor.filter((_, i) => i !== index))}
                        className="ml-2"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="past_success_notes">Past Success Notes</Label>
              <Textarea
                id="past_success_notes"
                value={formData.past_success_notes}
                onChange={(e) => setFormData({ ...formData, past_success_notes: e.target.value })}
                placeholder="e.g., 3 UNIKEY students won prizes (2023-2024)"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="internal_notes">Internal Notes</Label>
              <Textarea
                id="internal_notes"
                value={formData.internal_notes}
                onChange={(e) => setFormData({ ...formData, internal_notes: e.target.value })}
                placeholder="Internal notes for consultants"
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : opportunity ? "Update" : "Add"} Opportunity
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};