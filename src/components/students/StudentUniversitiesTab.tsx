import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Calendar, Globe, Sparkles, ChevronDown, ChevronUp, Shield, Award } from "lucide-react";
import { toast } from "sonner";
import AddUniversityDialog from "./AddUniversityDialog";
import DeadlineCascadeDialog from "./DeadlineCascadeDialog";

interface UniversityTarget {
  id: string;
  university_name: string;
  program: string | null;
  country: string | null;
  application_system: string | null;
  deadline_date: string | null;
  status: string;
  priority: string;
  notes: string | null;
  tasks_generated: boolean;
  round: string | null;
  offer_conditions: string | null;
  firm_choice: boolean;
  insurance_choice: boolean;
  waitlist_plan_status: string | null;
  clearing_shortlist: boolean;
  enrolment_intention: string | null;
  matriculation_confirmed: boolean;
}

interface StudentUniversitiesTabProps {
  studentId: string;
}

const StudentUniversitiesTab = ({ studentId }: StudentUniversitiesTabProps) => {
  const [universities, setUniversities] = useState<UniversityTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [cascadeUni, setCascadeUni] = useState<UniversityTarget | null>(null);
  const [cascadeOpen, setCascadeOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchUniversities();
  }, [studentId]);

  const fetchUniversities = async () => {
    try {
      const { data, error } = await supabase
        .from("student_university_targets")
        .select("*")
        .eq("student_id", studentId)
        .order("priority", { ascending: true });

      if (error) throw error;
      setUniversities(data || []);
    } catch (error: any) {
      toast.error("Error loading university targets");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "offer_accepted":
        return "bg-success/10 text-success border-success";
      case "offer_received":
        return "bg-success/20 text-success border-success";
      case "submitted":
        return "bg-info/10 text-info border-info";
      case "in_progress":
        return "bg-warning/10 text-warning border-warning";
      default:
        return "";
    }
  };

  const handleGenerateTasks = (uni: UniversityTarget) => {
    setCascadeUni(uni);
    setCascadeOpen(true);
  };

  const handleCascadeClose = () => {
    setCascadeOpen(false);
    setCascadeUni(null);
    fetchUniversities();
  };

  const updateField = async (id: string, field: string, value: any) => {
    try {
      const { error } = await supabase
        .from("student_university_targets")
        .update({ [field]: value })
        .eq("id", id);
      if (error) throw error;
      setUniversities((prev) =>
        prev.map((u) => (u.id === id ? { ...u, [field]: value } : u))
      );
    } catch (error: any) {
      toast.error("Error updating field");
      console.error(error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">University Targets</h3>
        <AddUniversityDialog studentId={studentId} onAdded={fetchUniversities} />
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading university targets...</p>
          </CardContent>
        </Card>
      ) : universities.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No university targets added yet. Click "Add University" to begin.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
      {universities.map((uni) => (
        <Card key={uni.id}>
          <CardContent className="pt-6 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-semibold text-lg">{uni.university_name}</h4>
                {uni.program && (
                  <p className="text-sm text-muted-foreground mt-1">{uni.program}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Badge variant={getPriorityColor(uni.priority as any)}>
                  {uni.priority}
                </Badge>
                <Badge className={getStatusColor(uni.status)}>
                  {uni.status.replace("_", " ")}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              {uni.country && (
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <span>{uni.country}</span>
                </div>
              )}
              {uni.application_system && (
                <div>
                  <span className="text-muted-foreground">System: </span>
                  {uni.application_system}
                </div>
              )}
              {uni.round && (
                <div>
                  <span className="text-muted-foreground">Round: </span>
                  {uni.round}
                </div>
              )}
              {uni.deadline_date && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>Deadline: {new Date(uni.deadline_date).toLocaleDateString()}</span>
                </div>
              )}
              {uni.firm_choice && (
                <Badge variant="default" className="w-fit gap-1">
                  <Shield className="w-3 h-3" /> Firm Choice
                </Badge>
              )}
              {uni.insurance_choice && (
                <Badge variant="secondary" className="w-fit gap-1">
                  <Award className="w-3 h-3" /> Insurance
                </Badge>
              )}
              {uni.matriculation_confirmed && (
                <Badge variant="default" className="w-fit bg-green-600">Matriculated</Badge>
              )}
            </div>

            {uni.notes && (
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground">{uni.notes}</p>
              </div>
            )}

            {/* Decisions & Outcomes expandable section */}
            <div className="pt-3 border-t mt-3">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-between"
                onClick={() => setExpandedId(expandedId === uni.id ? null : uni.id)}
              >
                <span className="text-sm font-medium">Decisions & Outcomes</span>
                {expandedId === uni.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>

              {expandedId === uni.id && (
                <div className="mt-3 space-y-4 p-3 bg-muted/30 rounded-md">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs">Status</Label>
                      <Select value={uni.status} onValueChange={(v) => updateField(uni.id, "status", v)}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="researching">Researching</SelectItem>
                          <SelectItem value="shortlisted">Shortlisted</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="submitted">Submitted</SelectItem>
                          <SelectItem value="interview_scheduled">Interview Scheduled</SelectItem>
                          <SelectItem value="offer_received">Offer Received</SelectItem>
                          <SelectItem value="offer_accepted">Offer Accepted</SelectItem>
                          <SelectItem value="waitlisted">Waitlisted</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                          <SelectItem value="withdrawn">Withdrawn</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Offer Conditions</Label>
                      <Input
                        className="h-8 text-xs"
                        placeholder="e.g., AAA at A-Level"
                        defaultValue={uni.offer_conditions || ""}
                        onBlur={(e) => updateField(uni.id, "offer_conditions", e.target.value || null)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs">Waitlist Plan</Label>
                      <Select value={uni.waitlist_plan_status || ""} onValueChange={(v) => updateField(uni.id, "waitlist_plan_status", v || null)}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="N/A" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="loci_planned">LOCI Planned</SelectItem>
                          <SelectItem value="loci_sent">LOCI Sent</SelectItem>
                          <SelectItem value="additional_materials">Additional Materials Sent</SelectItem>
                          <SelectItem value="converted">Converted to Offer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Enrolment Intention</Label>
                      <Select value={uni.enrolment_intention || ""} onValueChange={(v) => updateField(uni.id, "enrolment_intention", v || null)}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="N/A" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="likely">Likely</SelectItem>
                          <SelectItem value="possible">Possible</SelectItem>
                          <SelectItem value="unlikely">Unlikely</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="declined">Declined</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2">
                      <Switch checked={uni.firm_choice} onCheckedChange={(v) => updateField(uni.id, "firm_choice", v)} id={`firm-${uni.id}`} />
                      <Label htmlFor={`firm-${uni.id}`} className="text-xs">Firm Choice</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={uni.insurance_choice} onCheckedChange={(v) => updateField(uni.id, "insurance_choice", v)} id={`ins-${uni.id}`} />
                      <Label htmlFor={`ins-${uni.id}`} className="text-xs">Insurance</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={uni.clearing_shortlist} onCheckedChange={(v) => updateField(uni.id, "clearing_shortlist", v)} id={`clear-${uni.id}`} />
                      <Label htmlFor={`clear-${uni.id}`} className="text-xs">Clearing</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={uni.matriculation_confirmed} onCheckedChange={(v) => updateField(uni.id, "matriculation_confirmed", v)} id={`mat-${uni.id}`} />
                      <Label htmlFor={`mat-${uni.id}`} className="text-xs">Matriculated</Label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {uni.deadline_date && !uni.tasks_generated && (
              <div className="pt-3 border-t mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleGenerateTasks(uni)}
                  className="w-full gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Generate Application Timeline
                </Button>
              </div>
            )}

            {uni.tasks_generated && (
              <div className="pt-3 border-t mt-3 flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Tasks generated
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleGenerateTasks(uni)}
                >
                  Regenerate
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
        </div>
      )}

      {cascadeUni && (
        <DeadlineCascadeDialog
          open={cascadeOpen}
          onOpenChange={handleCascadeClose}
          universityId={cascadeUni.id}
          universityName={cascadeUni.university_name}
          applicationSystem={cascadeUni.application_system}
          deadlineDate={cascadeUni.deadline_date!}
          studentId={studentId}
        />
      )}
    </div>
  );
};

export default StudentUniversitiesTab;
