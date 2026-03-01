import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, ExternalLink, FileText, Users } from "lucide-react";

interface Essay {
  id: string;
  essay_region: string;
  essay_type: string;
  title: string | null;
  status: string;
  google_doc_link: string | null;
  owner: string | null;
  last_updated_date: string | null;
  notes: string | null;
}

interface Interview {
  id: string;
  university_name: string;
  interview_type: string;
  interview_date: string | null;
  prep_session_dates: string[] | null;
  tutor_names: string[] | null;
  post_interview_notes: string | null;
}

interface StudentEssaysTabProps {
  studentId: string;
}

const US_ESSAY_TYPES = [
  "Common App Personal Statement",
  "Supplemental: Why Us?",
  "Supplemental: Why Major?",
  "Supplemental: Community/Diversity/Perspective",
  "Supplemental: Intellectual Curiosity / Extracurricular",
  "Activity Short Responses",
  "Additional Information Statement",
  "Scholarship Essay",
  "Other US Essay",
];

const UK_ESSAY_TYPES = [
  "UCAS Personal Statement",
  "Cambridge SAQ / My Cambridge Application",
  "Cambridge Optional Additional Statement",
  "Course-specific Written Work",
  "Other UK Writing",
];

const INTERVIEW_TYPES = [
  "Oxbridge Academic",
  "Medicine MMI",
  "US Alumni",
  "US Admissions",
  "Other",
];

const statusColors: Record<string, string> = {
  "Not Started": "secondary",
  Drafting: "default",
  "Ready for Review": "outline",
  Final: "default",
};

const StudentEssaysTab = ({ studentId }: StudentEssaysTabProps) => {
  const [essays, setEssays] = useState<Essay[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [essayDialogOpen, setEssayDialogOpen] = useState(false);
  const [interviewDialogOpen, setInterviewDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [essayForm, setEssayForm] = useState({
    essay_region: "",
    essay_type: "",
    title: "",
    status: "Not Started",
    google_doc_link: "",
    owner: "",
    notes: "",
  });

  const [interviewForm, setInterviewForm] = useState({
    university_name: "",
    interview_type: "",
    interview_date: "",
    tutor_names: "",
    post_interview_notes: "",
  });

  useEffect(() => {
    fetchData();
  }, [studentId]);

  const fetchData = async () => {
    try {
      const [essayRes, interviewRes] = await Promise.all([
        supabase.from("student_essays").select("*").eq("student_id", studentId).order("created_at"),
        supabase.from("student_interviews").select("*").eq("student_id", studentId).order("interview_date", { ascending: true }),
      ]);

      if (essayRes.error) throw essayRes.error;
      if (interviewRes.error) throw interviewRes.error;

      setEssays(essayRes.data || []);
      setInterviews(interviewRes.data || []);
    } catch (error: any) {
      console.error("Error fetching essays/interviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEssay = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase.from("student_essays").insert({
        student_id: studentId,
        essay_region: essayForm.essay_region,
        essay_type: essayForm.essay_type,
        title: essayForm.title || null,
        status: essayForm.status,
        google_doc_link: essayForm.google_doc_link || null,
        owner: essayForm.owner || null,
        notes: essayForm.notes || null,
      });
      if (error) throw error;
      toast.success("Essay added");
      setEssayDialogOpen(false);
      setEssayForm({ essay_region: "", essay_type: "", title: "", status: "Not Started", google_doc_link: "", owner: "", notes: "" });
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Error adding essay");
    } finally {
      setSaving(false);
    }
  };

  const handleAddInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const tutors = interviewForm.tutor_names.split(",").map(t => t.trim()).filter(Boolean);
      const { error } = await supabase.from("student_interviews").insert({
        student_id: studentId,
        university_name: interviewForm.university_name,
        interview_type: interviewForm.interview_type,
        interview_date: interviewForm.interview_date || null,
        tutor_names: tutors.length > 0 ? tutors : null,
        post_interview_notes: interviewForm.post_interview_notes || null,
      });
      if (error) throw error;
      toast.success("Interview added");
      setInterviewDialogOpen(false);
      setInterviewForm({ university_name: "", interview_type: "", interview_date: "", tutor_names: "", post_interview_notes: "" });
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Error adding interview");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateEssayStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase.from("student_essays").update({ status: newStatus, last_updated_date: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
      fetchData();
    } catch (error: any) {
      toast.error("Error updating status");
    }
  };

  const handleDeleteEssay = async (id: string) => {
    try {
      const { error } = await supabase.from("student_essays").delete().eq("id", id);
      if (error) throw error;
      toast.success("Essay removed");
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteInterview = async (id: string) => {
    try {
      const { error } = await supabase.from("student_interviews").delete().eq("id", id);
      if (error) throw error;
      toast.success("Interview removed");
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const usEssays = essays.filter(e => e.essay_region === "US");
  const ukEssays = essays.filter(e => e.essay_region === "UK");

  const essayTypes = essayForm.essay_region === "US" ? US_ESSAY_TYPES : essayForm.essay_region === "UK" ? UK_ESSAY_TYPES : [];

  if (loading) return <p className="text-sm text-muted-foreground p-4">Loading...</p>;

  const renderEssayList = (items: Essay[], region: string) => (
    <div className="space-y-2">
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No {region} essays added yet.</p>
      ) : (
        items.map((essay) => (
          <div key={essay.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm">{essay.essay_type}</span>
                {essay.title && <span className="text-xs text-muted-foreground">— {essay.title}</span>}
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Select value={essay.status} onValueChange={(v) => handleUpdateEssayStatus(essay.id, v)}>
                  <SelectTrigger className="h-7 w-[140px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Not Started">Not Started</SelectItem>
                    <SelectItem value="Drafting">Drafting</SelectItem>
                    <SelectItem value="Ready for Review">Ready for Review</SelectItem>
                    <SelectItem value="Final">Final</SelectItem>
                  </SelectContent>
                </Select>
                {essay.owner && <Badge variant="outline" className="text-xs">{essay.owner}</Badge>}
                {essay.last_updated_date && (
                  <span className="text-xs text-muted-foreground">
                    Updated: {new Date(essay.last_updated_date).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 ml-2">
              {essay.google_doc_link && (
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                  <a href={essay.google_doc_link} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteEssay(essay.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Essays Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Essays & Writing
            </CardTitle>
            <Dialog open={essayDialogOpen} onOpenChange={setEssayDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  <Plus className="w-4 h-4" /> Add Essay
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Essay / Writing Item</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddEssay} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Region *</Label>
                      <Select value={essayForm.essay_region} onValueChange={(v) => setEssayForm({ ...essayForm, essay_region: v, essay_type: "" })}>
                        <SelectTrigger><SelectValue placeholder="US or UK" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="US">US</SelectItem>
                          <SelectItem value="UK">UK</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select value={essayForm.status} onValueChange={(v) => setEssayForm({ ...essayForm, status: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Not Started">Not Started</SelectItem>
                          <SelectItem value="Drafting">Drafting</SelectItem>
                          <SelectItem value="Ready for Review">Ready for Review</SelectItem>
                          <SelectItem value="Final">Final</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {essayForm.essay_region && (
                    <div className="space-y-2">
                      <Label>Essay Type *</Label>
                      <Select value={essayForm.essay_type} onValueChange={(v) => setEssayForm({ ...essayForm, essay_type: v })}>
                        <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                        <SelectContent>
                          {essayTypes.map((t) => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Custom Title</Label>
                    <Input value={essayForm.title} onChange={(e) => setEssayForm({ ...essayForm, title: e.target.value })} placeholder="e.g. Harvard supplemental" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Google Doc Link</Label>
                      <Input value={essayForm.google_doc_link} onChange={(e) => setEssayForm({ ...essayForm, google_doc_link: e.target.value })} placeholder="https://docs.google.com/..." />
                    </div>
                    <div className="space-y-2">
                      <Label>Owner</Label>
                      <Select value={essayForm.owner} onValueChange={(v) => setEssayForm({ ...essayForm, owner: v })}>
                        <SelectTrigger><SelectValue placeholder="Select owner" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Student">Student</SelectItem>
                          <SelectItem value="Consultant">Consultant</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea value={essayForm.notes} onChange={(e) => setEssayForm({ ...essayForm, notes: e.target.value })} rows={2} />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setEssayDialogOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={saving}>{saving ? "Adding..." : "Add Essay"}</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="us" className="space-y-4">
            <TabsList>
              <TabsTrigger value="us">US Essays ({usEssays.length})</TabsTrigger>
              <TabsTrigger value="uk">UK Writing ({ukEssays.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="us">{renderEssayList(usEssays, "US")}</TabsContent>
            <TabsContent value="uk">{renderEssayList(ukEssays, "UK")}</TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Interviews Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Interviews
            </CardTitle>
            <Dialog open={interviewDialogOpen} onOpenChange={setInterviewDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  <Plus className="w-4 h-4" /> Add Interview
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Interview Record</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddInterview} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>University / College *</Label>
                      <Input required value={interviewForm.university_name} onChange={(e) => setInterviewForm({ ...interviewForm, university_name: e.target.value })} placeholder="e.g. Trinity College, Cambridge" />
                    </div>
                    <div className="space-y-2">
                      <Label>Interview Type *</Label>
                      <Select value={interviewForm.interview_type} onValueChange={(v) => setInterviewForm({ ...interviewForm, interview_type: v })}>
                        <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                        <SelectContent>
                          {INTERVIEW_TYPES.map((t) => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Interview Date & Time</Label>
                      <Input type="datetime-local" value={interviewForm.interview_date} onChange={(e) => setInterviewForm({ ...interviewForm, interview_date: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Tutor(s) Assigned</Label>
                      <Input value={interviewForm.tutor_names} onChange={(e) => setInterviewForm({ ...interviewForm, tutor_names: e.target.value })} placeholder="Comma-separated names" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Post-Interview Notes</Label>
                    <Textarea value={interviewForm.post_interview_notes} onChange={(e) => setInterviewForm({ ...interviewForm, post_interview_notes: e.target.value })} rows={3} />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setInterviewDialogOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={saving}>{saving ? "Adding..." : "Add Interview"}</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {interviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">No interviews recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {interviews.map((interview) => (
                <div key={interview.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{interview.university_name}</span>
                      <Badge variant="secondary">{interview.interview_type}</Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                      {interview.interview_date && (
                        <span>{new Date(interview.interview_date).toLocaleString()}</span>
                      )}
                      {interview.tutor_names && interview.tutor_names.length > 0 && (
                        <span>Tutors: {interview.tutor_names.join(", ")}</span>
                      )}
                    </div>
                    {interview.post_interview_notes && (
                      <p className="text-xs mt-1 text-muted-foreground">{interview.post_interview_notes}</p>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteInterview(interview.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentEssaysTab;
