import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User } from "lucide-react";
import { toast } from "sonner";
import AddTaskDialog from "@/components/tasks/AddTaskDialog";

interface Task {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: string;
  status: string;
  task_type: string | null;
  assigned_to: string | null;
}

interface StudentTasksTabProps {
  studentId: string;
}

const StudentTasksTab = ({ studentId }: StudentTasksTabProps) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, [studentId]);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("student_id", studentId)
        .order("due_date", { ascending: true });

      if (error) throw error;
      setTasks(data || []);
    } catch (error: any) {
      toast.error("Error loading tasks");
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
      case "completed":
        return "bg-success/10 text-success border-success";
      case "in_progress":
        return "bg-info/10 text-info border-info";
      case "pending":
        return "bg-warning/10 text-warning border-warning";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Student Tasks</h3>
        <AddTaskDialog studentId={studentId} onTaskAdded={fetchTasks} />
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading tasks...</p>
          </CardContent>
        </Card>
      ) : tasks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No tasks assigned yet. Click "Add Task" to create one.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
      {tasks.map((task) => (
        <Card key={task.id}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h4 className="font-semibold mb-1">{task.title}</h4>
                {task.description && (
                  <p className="text-sm text-muted-foreground">{task.description}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Badge variant={getPriorityColor(task.priority as any)}>
                  {task.priority}
                </Badge>
                <Badge className={getStatusColor(task.status)}>
                  {task.status.replace("_", " ")}
                </Badge>
              </div>
            </div>

            <div className="flex gap-4 text-sm text-muted-foreground">
              {task.due_date && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Due: {new Date(task.due_date).toLocaleDateString()}
                </div>
              )}
              {task.task_type && (
                <div>Type: {task.task_type}</div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
        </div>
      )}
    </div>
  );
};

export default StudentTasksTab;
