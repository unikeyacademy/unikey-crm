import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Globe } from "lucide-react";
import { toast } from "sonner";
import AddUniversityDialog from "./AddUniversityDialog";

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
}

interface StudentUniversitiesTabProps {
  studentId: string;
}

const StudentUniversitiesTab = ({ studentId }: StudentUniversitiesTabProps) => {
  const [universities, setUniversities] = useState<UniversityTarget[]>([]);
  const [loading, setLoading] = useState(true);

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

            <div className="grid grid-cols-2 gap-4 text-sm">
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
              {uni.deadline_date && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>Deadline: {new Date(uni.deadline_date).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            {uni.notes && (
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground">{uni.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
        </div>
      )}
    </div>
  );
};

export default StudentUniversitiesTab;
