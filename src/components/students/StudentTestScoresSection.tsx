import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, GraduationCap } from "lucide-react";

interface TestScore {
  id: string;
  test_category: string;
  test_name: string;
  score: string;
  test_date: string | null;
  next_planned_date: string | null;
  notes: string | null;
}

interface StudentTestScoresSectionProps {
  studentId: string;
}

const TEST_OPTIONS: Record<string, string[]> = {
  Standardized: ["SAT", "ACT"],
  "Subject/Admissions": ["LNAT", "UCAT", "TMUA", "ESAT", "SAT Subject Test", "Other"],
  Language: ["TOEFL", "IELTS", "Duolingo English Test", "Other"],
};

const categoryColors: Record<string, string> = {
  Standardized: "default",
  "Subject/Admissions": "secondary",
  Language: "outline",
};

const StudentTestScoresSection = ({ studentId }: StudentTestScoresSectionProps) => {
  const [scores, setScores] = useState<TestScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    test_category: "",
    test_name: "",
    score: "",
    test_date: "",
    next_planned_date: "",
    notes: "",
  });

  useEffect(() => {
    fetchScores();
  }, [studentId]);

  const fetchScores = async () => {
    try {
      const { data, error } = await supabase
        .from("student_test_scores")
        .select("*")
        .eq("student_id", studentId)
        .order("test_date", { ascending: false });

      if (error) throw error;
      setScores(data || []);
    } catch (error: any) {
      console.error("Error fetching test scores:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase.from("student_test_scores").insert({
        student_id: studentId,
        test_category: form.test_category,
        test_name: form.test_name,
        score: form.score,
        test_date: form.test_date || null,
        next_planned_date: form.next_planned_date || null,
        notes: form.notes || null,
      });

      if (error) throw error;
      toast.success("Test score added");
      setDialogOpen(false);
      setForm({ test_category: "", test_name: "", score: "", test_date: "", next_planned_date: "", notes: "" });
      fetchScores();
    } catch (error: any) {
      toast.error(error.message || "Error adding test score");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("student_test_scores").delete().eq("id", id);
      if (error) throw error;
      toast.success("Test score removed");
      fetchScores();
    } catch (error: any) {
      toast.error(error.message || "Error deleting test score");
    }
  };

  const grouped = scores.reduce<Record<string, TestScore[]>>((acc, s) => {
    if (!acc[s.test_category]) acc[s.test_category] = [];
    acc[s.test_category].push(s);
    return acc;
  }, {});

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            Test Scores
          </CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <Plus className="w-4 h-4" /> Add Score
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Test Score</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select value={form.test_category} onValueChange={(v) => setForm({ ...form, test_category: v, test_name: "" })}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Standardized">Standardized (SAT/ACT)</SelectItem>
                      <SelectItem value="Subject/Admissions">Subject / Admissions Tests</SelectItem>
                      <SelectItem value="Language">Language Tests</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {form.test_category && (
                  <div className="space-y-2">
                    <Label>Test Name *</Label>
                    <Select value={form.test_name} onValueChange={(v) => setForm({ ...form, test_name: v })}>
                      <SelectTrigger><SelectValue placeholder="Select test" /></SelectTrigger>
                      <SelectContent>
                        {TEST_OPTIONS[form.test_category]?.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Score *</Label>
                  <Input required value={form.score} onChange={(e) => setForm({ ...form, score: e.target.value })} placeholder="e.g. 1520, 7.5, 34" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Test Date</Label>
                    <Input type="date" value={form.test_date} onChange={(e) => setForm({ ...form, test_date: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Next Planned Date</Label>
                    <Input type="date" value={form.next_planned_date} onChange={(e) => setForm({ ...form, next_planned_date: e.target.value })} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes" />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={saving}>{saving ? "Adding..." : "Add Score"}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : scores.length === 0 ? (
          <p className="text-sm text-muted-foreground">No test scores recorded yet.</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped).map(([category, items]) => (
              <div key={category}>
                <p className="text-sm font-medium text-muted-foreground mb-2">{category}</p>
                <div className="space-y-2">
                  {items.map((s) => (
                    <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                      <div className="flex items-center gap-3">
                        <Badge variant={categoryColors[category] as any || "default"}>{s.test_name}</Badge>
                        <span className="font-semibold">{s.score}</span>
                        {s.test_date && (
                          <span className="text-sm text-muted-foreground">
                            {new Date(s.test_date).toLocaleDateString()}
                          </span>
                        )}
                        {s.next_planned_date && (
                          <span className="text-xs text-muted-foreground">
                            Next: {new Date(s.next_planned_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(s.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StudentTestScoresSection;
