import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  LayoutDashboard,
  Users,
  Calendar,
  CheckSquare,
  FileText,
  LogOut,
  GraduationCap,
  Mail,
  Settings as SettingsIcon,
  Zap,
  MessageSquare,
  Lightbulb,
  ChevronDown,
  ChevronRight,
  User,
} from "lucide-react";
import { toast } from "sonner";

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [students, setStudents] = useState<{ id: string; first_name: string; last_name: string; preferred_name: string | null }[]>([]);
  const [studentsOpen, setStudentsOpen] = useState(true);

  useEffect(() => {
    const fetchStudents = async () => {
      const { data } = await supabase
        .from("students")
        .select("id, first_name, last_name, preferred_name")
        .eq("status", "active")
        .order("first_name");
      if (data) setStudents(data);
    };
    fetchStudents();
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error logging out");
    } else {
      toast.success("Logged out successfully");
      navigate("/auth");
    }
  };

  const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Students", href: "/students", icon: Users },
    { name: "Calendar", href: "/calendar", icon: Calendar },
    { name: "Tasks", href: "/tasks", icon: CheckSquare },
    { name: "Documents", href: "/documents", icon: FileText },
    { name: "ECA Database", href: "/eca-database", icon: Lightbulb },
    { name: "ECA Discovery", href: "/eca-discovery", icon: Lightbulb },
    { name: "Email Templates", href: "/email-templates", icon: Mail },
    { name: "Email Automation", href: "/email-automation", icon: Zap },
    { name: "Requests", href: "/requests", icon: MessageSquare },
    { name: "Co-Consultants", href: "/co-consultants", icon: Users },
    { name: "Settings", href: "/settings", icon: SettingsIcon },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-2 p-6 border-b border-sidebar-border">
            <div className="w-10 h-10 bg-sidebar-primary rounded-lg flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-sidebar-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-sidebar-foreground">UNIKEY</h1>
              <p className="text-xs text-sidebar-foreground/70">Academy CRM</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive(item.href)
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Current Students */}
          <div className="px-4 pb-2">
            <Collapsible open={studentsOpen} onOpenChange={setStudentsOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 text-sm font-semibold text-sidebar-foreground/80 hover:text-sidebar-foreground rounded-lg transition-colors">
                <span className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Current Students
                  <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0">
                    {students.length}
                  </Badge>
                </span>
                {studentsOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </CollapsibleTrigger>
              <CollapsibleContent>
                <ScrollArea className="max-h-48">
                  <div className="space-y-0.5 pt-1">
                    {students.map((student) => (
                      <Link
                        key={student.id}
                        to={`/students/${student.id}`}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                          location.pathname === `/students/${student.id}`
                            ? "bg-sidebar-accent text-sidebar-accent-foreground"
                            : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                        }`}
                      >
                        <span className="truncate">
                          {student.preferred_name || student.first_name} {student.last_name}
                        </span>
                      </Link>
                    ))}
                    {students.length === 0 && (
                      <p className="px-3 py-2 text-xs text-sidebar-foreground/50">No active students</p>
                    )}
                  </div>
                </ScrollArea>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Logout */}
          <div className="p-4 border-t border-sidebar-border">
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/50"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="pl-64">
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
