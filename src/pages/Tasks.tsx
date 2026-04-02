import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  students: {
    first_name: string;
    last_name: string;
  } | null;
}

const Tasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select(`
          *,
          students!inner (first_name, last_name, application_cycle)
        `)
        .neq("students.application_cycle", "2026")
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

  const filteredTasks = tasks.filter((task) => {
    if (filter === "all") return true;
    if (filter === "pending") return task.status === "pending";
    if (filter === "in_progress") return task.status === "in_progress";
    if (filter === "completed") return task.status === "completed";
    if (filter === "overdue") {
      return task.due_date && new Date(task.due_date) < new Date() && task.status !== "completed";
    }
    return true;
  });

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tasks</h1>
          <p className="text-muted-foreground">
            Manage student tasks and deadlines
          </p>
        </div>
        <AddTaskDialog onTaskAdded={fetchTasks} />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {[
          { key: "all", label: "All Tasks" },
          { key: "pending", label: "Pending" },
          { key: "in_progress", label: "In Progress" },
          { key: "overdue", label: "Overdue" },
          { key: "completed", label: "Completed" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === tab.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading tasks...</p>
          </CardContent>
        </Card>
      ) : filteredTasks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No tasks found. Click "New Task" to create one.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredTasks.map((task) => (
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
                  {task.students && (
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {task.students.first_name} {task.students.last_name}
                    </div>
                  )}
                  {task.task_type && <div>Type: {task.task_type}</div>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Tasks;
