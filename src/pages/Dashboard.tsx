import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, CheckCircle, AlertCircle, Calendar, Eye, Clock, AlertTriangle, ShieldAlert, TrendingUp } from "lucide-react";

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

interface StudentAlert {
  studentId: string;
  studentName: string;
  alerts: string[];
  health: "red" | "yellow" | "green";
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
  const [studentAlerts, setStudentAlerts] = useState<StudentAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch 2026 student IDs to exclude site-wide
      const { data: excludedStudents } = await supabase
        .from("students")
        .select("id")
        .eq("application_cycle", "2026");
      const excludedIds = (excludedStudents || []).map(s => s.id);

      // Fetch stats
      const { count: studentCount } = await supabase
        .from("students")
        .select("*", { count: "exact", head: true })
        .eq("status", "active")
        .neq("application_cycle", "2026");

      let taskQuery = supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .neq("status", "completed");
      if (excludedIds.length > 0) {
        taskQuery = taskQuery.not("student_id", "in", `(${excludedIds.join(",")})`);
      }
      const { count: taskCount } = await taskQuery;

      const now = new Date();
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      let consultQuery = supabase
        .from("consultations")
        .select("*", { count: "exact", head: true })
        .gte("consultation_date", now.toISOString())
        .lte("consultation_date", nextWeek.toISOString());
      if (excludedIds.length > 0) {
        consultQuery = consultQuery.not("student_id", "in", `(${excludedIds.join(",")})`);
      }
      const { count: consultationCount } = await consultQuery;

      let overdueQuery = supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .lt("due_date", now.toISOString())
        .neq("status", "completed");
      if (excludedIds.length > 0) {
        overdueQuery = overdueQuery.not("student_id", "in", `(${excludedIds.join(",")})`);
      }
      const { count: overdueCount } = await overdueQuery;

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
        .neq("application_cycle", "2026")
        .order("created_at", { ascending: false })
        .limit(5);

      setRecentStudents(studentsData || []);

      // Fetch upcoming tasks
      let upcomingQuery = supabase
        .from("tasks")
        .select(`id, title, due_date, priority, students (first_name, last_name)`)
        .neq("status", "completed")
        .not("due_date", "is", null)
        .order("due_date", { ascending: true })
        .limit(5);
      if (excludedIds.length > 0) {
        upcomingQuery = upcomingQuery.not("student_id", "in", `(${excludedIds.join(",")})`);
      }
      const { data: tasksData } = await upcomingQuery;

      setUpcomingTasks(tasksData || []);

      // === STEP 8: System Health & Alerts ===
      await computeStudentAlerts(now);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const computeStudentAlerts = async (now: Date) => {
    try {
      const { data: students } = await supabase
        .from("students")
        .select("id, first_name, last_name")
        .eq("status", "active")
        .neq("application_cycle", "2026");

      if (!students || students.length === 0) return;

      const studentIds = students.map(s => s.id);

      // Fetch last consultation per student
      const { data: consultations } = await supabase
        .from("consultations")
        .select("student_id, consultation_date")
        .in("student_id", studentIds)
        .order("consultation_date", { ascending: false });

      // Fetch overdue tasks per student
      const { data: overdueTasks } = await supabase
        .from("tasks")
        .select("student_id")
        .in("student_id", studentIds)
        .lt("due_date", now.toISOString())
        .neq("status", "completed");

      // Fetch approaching deadlines (next 14 days)
      const twoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
      const { data: approachingDeadlines } = await supabase
        .from("student_university_targets")
        .select("student_id, university_name, deadline_date")
        .in("student_id", studentIds)
        .gte("deadline_date", now.toISOString().split("T")[0])
        .lte("deadline_date", twoWeeks.toISOString().split("T")[0]);

      // Build last consultation map
      const lastConsultationMap = new Map<string, Date>();
      consultations?.forEach(c => {
        if (!lastConsultationMap.has(c.student_id)) {
          lastConsultationMap.set(c.student_id, new Date(c.consultation_date));
        }
      });

      // Overdue count per student
      const overdueMap = new Map<string, number>();
      overdueTasks?.forEach(t => {
        if (t.student_id) overdueMap.set(t.student_id, (overdueMap.get(t.student_id) || 0) + 1);
      });

      // Approaching deadlines per student
      const deadlineMap = new Map<string, string[]>();
      approachingDeadlines?.forEach(d => {
        const arr = deadlineMap.get(d.student_id) || [];
        arr.push(`${d.university_name} (${new Date(d.deadline_date!).toLocaleDateString()})`);
        deadlineMap.set(d.student_id, arr);
      });

      const alerts: StudentAlert[] = [];

      students.forEach(s => {
        const studentAlerts: string[] = [];
        let worstLevel: "green" | "yellow" | "red" = "green";

        // Check days since last meeting
        const lastMeeting = lastConsultationMap.get(s.id);
        if (!lastMeeting) {
          studentAlerts.push("No consultations recorded");
          worstLevel = "yellow";
        } else {
          const daysSince = Math.floor((now.getTime() - lastMeeting.getTime()) / (1000 * 60 * 60 * 24));
          if (daysSince > 30) {
            studentAlerts.push(`${daysSince} days since last meeting`);
            worstLevel = "red";
          } else if (daysSince > 14) {
            studentAlerts.push(`${daysSince} days since last meeting`);
            worstLevel = worstLevel === "green" ? "yellow" : worstLevel;
          }
        }

        // Check overdue items
        const overdueCount = overdueMap.get(s.id) || 0;
        if (overdueCount > 0) {
          studentAlerts.push(`${overdueCount} overdue task${overdueCount > 1 ? "s" : ""}`);
          worstLevel = "red";
        }

        // Check approaching deadlines
        const deadlines = deadlineMap.get(s.id) || [];
        if (deadlines.length > 0) {
          studentAlerts.push(`${deadlines.length} deadline${deadlines.length > 1 ? "s" : ""} in next 14 days`);
          worstLevel = worstLevel === "green" ? "yellow" : worstLevel;
        }

        if (studentAlerts.length > 0) {
          alerts.push({
            studentId: s.id,
            studentName: `${s.first_name} ${s.last_name}`,
            alerts: studentAlerts,
            health: worstLevel,
          });
        }
      });

      // Sort: red first, then yellow
      alerts.sort((a, b) => {
        const order = { red: 0, yellow: 1, green: 2 };
        return order[a.health] - order[b.health];
      });

      setStudentAlerts(alerts);
    } catch (error) {
      console.error("Error computing alerts:", error);
    }
  };

  const statCards = [
    { title: "Active Students", value: stats.totalStudents, icon: Users, color: "text-primary", bgColor: "bg-primary/10" },
    { title: "Active Tasks", value: stats.activeTasks, icon: CheckCircle, color: "text-info", bgColor: "bg-info/10" },
    { title: "Upcoming Consultations", value: stats.upcomingConsultations, icon: Calendar, color: "text-accent", bgColor: "bg-accent/10" },
    { title: "Overdue Items", value: stats.overdueItems, icon: AlertCircle, color: "text-destructive", bgColor: "bg-destructive/10" },
  ];

  const healthIcon = (health: "red" | "yellow" | "green") => {
    if (health === "red") return <ShieldAlert className="w-4 h-4 text-destructive" />;
    if (health === "yellow") return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    return <TrendingUp className="w-4 h-4 text-green-500" />;
  };

  const healthBadge = (health: "red" | "yellow" | "green") => {
    if (health === "red") return <Badge variant="destructive">At Risk</Badge>;
    if (health === "yellow") return <Badge className="bg-yellow-500/10 text-yellow-700 border-yellow-500">Needs Attention</Badge>;
    return <Badge variant="secondary">Healthy</Badge>;
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to UNIKEY Academy CRM</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <div className={`w-10 h-10 rounded-full ${stat.bgColor} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{loading ? "-" : stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* System Health & Alerts */}
      {studentAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5" />
              System Health & Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {studentAlerts.slice(0, 10).map((alert) => (
                <div
                  key={alert.studentId}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/students/${alert.studentId}`)}
                >
                  <div className="flex items-center gap-3">
                    {healthIcon(alert.health)}
                    <div>
                      <p className="font-medium">{alert.studentName}</p>
                      <p className="text-xs text-muted-foreground">{alert.alerts.join(" • ")}</p>
                    </div>
                  </div>
                  {healthBadge(alert.health)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
              <p className="text-sm text-muted-foreground">No students yet. Add your first student to get started.</p>
            ) : (
              <div className="space-y-3">
                {recentStudents.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/students/${student.id}`)}
                  >
                    <div className="flex-1">
                      <p className="font-medium">{student.first_name} {student.last_name}</p>
                      <p className="text-sm text-muted-foreground">{student.current_stage} • Cycle {student.application_cycle}</p>
                    </div>
                    <Button size="sm" variant="ghost"><Eye className="w-4 h-4" /></Button>
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
              <p className="text-sm text-muted-foreground">No upcoming tasks. Create tasks to stay organized.</p>
            ) : (
              <div className="space-y-3">
                {upcomingTasks.map((task) => (
                  <div key={task.id} className="flex items-start justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <p className="font-medium">{task.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-muted-foreground">Due: {new Date(task.due_date).toLocaleDateString()}</p>
                        {task.students && (
                          <p className="text-sm text-muted-foreground">• {task.students.first_name} {task.students.last_name}</p>
                        )}
                      </div>
                    </div>
                    <Badge variant={task.priority === "high" ? "destructive" : task.priority === "medium" ? "default" : "secondary"}>{task.priority}</Badge>
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
