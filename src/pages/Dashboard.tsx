import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, CheckCircle, AlertCircle, Calendar, Eye, Clock } from "lucide-react";

interface DashboardStats {
  totalStudents: number;
  activeTasks: number;
  upcomingConsultations: number;
  overdueItems: number;
}

interface RecentStudent {
  id: string;
  first_name: string;
  last_name: string;
  current_stage: string;
  application_cycle: string;
  created_at: string;
}

interface UpcomingTask {
  id: string;
  title: string;
  due_date: string;
  priority: string;
  students: {
    first_name: string;
    last_name: string;
  } | null;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    activeTasks: 0,
    upcomingConsultations: 0,
    overdueItems: 0,
  });
  const [recentStudents, setRecentStudents] = useState<RecentStudent[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<UpcomingTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch stats
      const { count: studentCount } = await supabase
        .from("students")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      const { count: taskCount } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .neq("status", "completed");

      const now = new Date();
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const { count: consultationCount } = await supabase
        .from("consultations")
        .select("*", { count: "exact", head: true })
        .gte("consultation_date", now.toISOString())
        .lte("consultation_date", nextWeek.toISOString());

      const { count: overdueCount } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .lt("due_date", now.toISOString())
        .neq("status", "completed");

      setStats({
        totalStudents: studentCount || 0,
        activeTasks: taskCount || 0,
        upcomingConsultations: consultationCount || 0,
        overdueItems: overdueCount || 0,
      });

      // Fetch recent students
      const { data: studentsData } = await supabase
        .from("students")
        .select("id, first_name, last_name, current_stage, application_cycle, created_at")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(5);

      setRecentStudents(studentsData || []);

      // Fetch upcoming tasks
      const { data: tasksData } = await supabase
        .from("tasks")
        .select(`
          id,
          title,
          due_date,
          priority,
          students (first_name, last_name)
        `)
        .neq("status", "completed")
        .not("due_date", "is", null)
        .order("due_date", { ascending: true })
        .limit(5);

      setUpcomingTasks(tasksData || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Active Students",
      value: stats.totalStudents,
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Active Tasks",
      value: stats.activeTasks,
      icon: CheckCircle,
      color: "text-info",
      bgColor: "bg-info/10",
    },
    {
      title: "Upcoming Consultations",
      value: stats.upcomingConsultations,
      icon: Calendar,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      title: "Overdue Items",
      value: stats.overdueItems,
      icon: AlertCircle,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to UNIKEY Academy CRM
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`w-10 h-10 rounded-full ${stat.bgColor} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {loading ? "-" : stat.value}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Recent Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentStudents.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No students yet. Add your first student to get started.
              </p>
            ) : (
              <div className="space-y-3">
                {recentStudents.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/students/${student.id}`)}
                  >
                    <div className="flex-1">
                      <p className="font-medium">
                        {student.first_name} {student.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {student.current_stage} • Cycle {student.application_cycle}
                      </p>
                    </div>
                    <Button size="sm" variant="ghost">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Upcoming Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No upcoming tasks. Create tasks to stay organized.
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{task.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-muted-foreground">
                          Due: {new Date(task.due_date).toLocaleDateString()}
                        </p>
                        {task.students && (
                          <p className="text-sm text-muted-foreground">
                            • {task.students.first_name} {task.students.last_name}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge
                      variant={
                        task.priority === "high"
                          ? "destructive"
                          : task.priority === "medium"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {task.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
