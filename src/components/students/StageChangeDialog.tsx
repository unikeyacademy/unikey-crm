import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, CheckCircle2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TemplateTask {
  title: string;
  type: string;
  priority: string;
  due_days_offset: number;
  description?: string;
}

interface StageChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  studentName: string;
  newStage: string;
  oldStage?: string;
  onConfirm: () => void;
}

const StageChangeDialog = ({
  open,
  onOpenChange,
  studentId,
  studentName,
  newStage,
  oldStage,
  onConfirm,
}: StageChangeDialogProps) => {
  const [tasks, setTasks] = useState<Array<TemplateTask & { dueDate: Date; selected: boolean }>>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (open) {
      loadTemplate();
    }
  }, [open, newStage]);

  const calculateDueDate = (offsetDays: number): Date => {
    const date = new Date();
    date.setDate(date.getDate() + offsetDays);
    return date;
  };

  const loadTemplate = async () => {
    setLoading(true);
    try {
      const { data: templates, error } = await supabase
        .from("task_templates")
        .select("*")
        .eq("stage", newStage)
        .limit(1);

      if (error) throw error;

      if (templates && templates.length > 0) {
        const template = templates[0];
        
        const tasksWithDates = (template.tasks as unknown as TemplateTask[]).map((task) => ({
          ...task,
          dueDate: calculateDueDate(task.due_days_offset),
          selected: true,
        }));

        // Sort by due date
        tasksWithDates.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
        setTasks(tasksWithDates);
      } else {
        setTasks([]);
      }
    } catch (error: any) {
      console.error("Error loading template:", error);
      toast.error("Failed to load stage template");
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateTasks = async () => {
    setGenerating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const selectedTasks = tasks.filter(t => t.selected);
      
      if (selectedTasks.length > 0) {
        const tasksToInsert = selectedTasks.map(task => ({
          student_id: studentId,
          title: task.title,
          description: task.description || `Auto-generated task for ${newStage} stage`,
          task_type: task.type,
          priority: task.priority,
          status: "pending",
          due_date: task.dueDate.toISOString(),
          created_by: user.id,
        }));

        const { error: tasksError } = await supabase
          .from("tasks")
          .insert(tasksToInsert);

        if (tasksError) throw tasksError;

        toast.success(`Generated ${selectedTasks.length} tasks for ${studentName}`);
      }

      // Update stage history
      const { data: student } = await supabase
        .from("students")
        .select("stage_history")
        .eq("id", studentId)
        .single();

      const stageHistory = (student?.stage_history || []) as any[];
      stageHistory.push({
        stage: newStage,
        changed_at: new Date().toISOString(),
        tasks_generated: selectedTasks.length,
      });

      await supabase
        .from("students")
        .update({ stage_history: stageHistory })
        .eq("id", studentId);

      onConfirm();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error generating tasks:", error);
      toast.error("Failed to generate tasks");
    } finally {
      setGenerating(false);
    }
  };

  const handleSkip = () => {
    onConfirm();
    onOpenChange(false);
  };

  const toggleTask = (index: number) => {
    setTasks(prev => prev.map((task, i) => 
      i === index ? { ...task, selected: !task.selected } : task
    ));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "destructive";
      case "medium": return "default";
      case "low": return "secondary";
      default: return "outline";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Stage Change Automation
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {oldStage ? `Moving ${studentName} from "${oldStage}" to "${newStage}"` : `Setting ${studentName}'s stage to "${newStage}"`}
          </p>
        </DialogHeader>

        {loading ? (
          <div className="py-12 text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading task template...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground mb-4">No task template configured for "{newStage}"</p>
            <Button onClick={handleSkip}>Continue Without Tasks</Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm font-medium">
                {tasks.filter(t => t.selected).length} of {tasks.length} tasks will be created
              </span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setTasks(prev => prev.map(t => ({ ...t, selected: !t.selected })))}
              >
                {tasks.every(t => t.selected) ? "Deselect All" : "Select All"}
              </Button>
            </div>

            {tasks.map((task, index) => (
              <Card key={index} className={!task.selected ? "opacity-50" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={task.selected}
                      onCheckedChange={() => toggleTask(index)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h4 className="font-medium">{task.title}</h4>
                          {task.description && (
                            <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            <span>Due: {task.dueDate.toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant={getPriorityColor(task.priority as any)}>
                            {task.priority}
                          </Badge>
                          <Badge variant="outline">{task.type}</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleSkip}>
            Skip Tasks
          </Button>
          {tasks.length > 0 && (
            <Button 
              onClick={handleGenerateTasks} 
              disabled={generating || tasks.filter(t => t.selected).length === 0}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {generating ? "Generating..." : `Generate ${tasks.filter(t => t.selected).length} Tasks`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StageChangeDialog;
