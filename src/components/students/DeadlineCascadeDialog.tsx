import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MilestoneTask {
  months_before?: number;
  weeks_before?: number;
  days_before?: number;
  title: string;
  type: string;
  priority: string;
}

interface DeadlineCascadeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  universityId: string;
  universityName: string;
  applicationSystem: string | null;
  deadlineDate: string;
  studentId: string;
}

const DeadlineCascadeDialog = ({
  open,
  onOpenChange,
  universityId,
  universityName,
  applicationSystem,
  deadlineDate,
  studentId,
}: DeadlineCascadeDialogProps) => {
  const [tasks, setTasks] = useState<Array<MilestoneTask & { dueDate: Date; selected: boolean }>>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const calculateDueDate = (deadline: Date, task: MilestoneTask): Date => {
    const dueDate = new Date(deadline);
    
    if (task.months_before) {
      dueDate.setMonth(dueDate.getMonth() - task.months_before);
    } else if (task.weeks_before) {
      dueDate.setDate(dueDate.getDate() - (task.weeks_before * 7));
    } else if (task.days_before) {
      dueDate.setDate(dueDate.getDate() - task.days_before);
    }
    
    return dueDate;
  };

  const loadTemplate = async () => {
    setLoading(true);
    try {
      const { data: templates, error } = await supabase
        .from("university_deadline_templates")
        .select("*")
        .eq("application_system", applicationSystem || "Common App")
        .limit(1);

      if (error) throw error;

      if (templates && templates.length > 0) {
        const template = templates[0];
        const deadline = new Date(deadlineDate);
        
        const tasksWithDates = (template.milestone_tasks as unknown as MilestoneTask[]).map((task) => ({
          ...task,
          dueDate: calculateDueDate(deadline, task),
          selected: true,
        }));

        // Sort by due date
        tasksWithDates.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
        setTasks(tasksWithDates);
      }
    } catch (error: any) {
      console.error("Error loading template:", error);
      toast.error("Failed to load deadline template");
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
      
      const tasksToInsert = selectedTasks.map(task => ({
        student_id: studentId,
        title: task.title.replace("[University]", universityName).replace("[System]", applicationSystem || ""),
        description: `Auto-generated task for ${universityName} application`,
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

      // Mark tasks as generated
      const { error: updateError } = await supabase
        .from("student_university_targets")
        .update({ tasks_generated: true })
        .eq("id", universityId);

      if (updateError) throw updateError;

      toast.success(`Generated ${selectedTasks.length} tasks for ${universityName}`);
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error generating tasks:", error);
      toast.error("Failed to generate tasks");
    } finally {
      setGenerating(false);
    }
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
    <Dialog open={open} onOpenChange={(open) => {
      if (open && tasks.length === 0) {
        loadTemplate();
      }
      onOpenChange(open);
    }}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Application Timeline</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Auto-generate milestone tasks working backward from the {new Date(deadlineDate).toLocaleDateString()} deadline for {universityName}
          </p>
        </DialogHeader>

        {loading ? (
          <div className="py-12 text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading timeline template...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">No template found for {applicationSystem || "this application system"}</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm font-medium">
                {tasks.filter(t => t.selected).length} of {tasks.length} tasks selected
              </span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setTasks(prev => prev.map(t => ({ ...t, selected: true })))}
              >
                Select All
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Skip for Now
          </Button>
          <Button 
            onClick={handleGenerateTasks} 
            disabled={generating || tasks.filter(t => t.selected).length === 0}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            {generating ? "Generating..." : `Generate ${tasks.filter(t => t.selected).length} Tasks`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeadlineCascadeDialog;
