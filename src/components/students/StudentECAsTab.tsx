import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "lucide-react";
import { toast } from "sonner";
import AddECADialog from "./AddECADialog";

interface ECA {
  id: string;
  eca_name: string;
  eca_type: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  completion_percentage: number;
  description: string | null;
  outcomes: string | null;
  lead_consultant_id: string | null;
}

interface StudentECAsTabProps {
  studentId: string;
}

const StudentECAsTab = ({ studentId }: StudentECAsTabProps) => {
  const [ecas, setEcas] = useState<ECA[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchECAs();
  }, [studentId]);

  const fetchECAs = async () => {
    try {
      const { data, error } = await supabase
        .from("student_ecas")
        .select("*")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEcas(data || []);
    } catch (error: any) {
      toast.error("Error loading ECAs");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-success">Completed</Badge>;
      case "in_progress":
        return <Badge className="bg-info">In Progress</Badge>;
      case "planning":
        return <Badge variant="secondary">Planning</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Extra-Curricular Activities</h3>
        <AddECADialog studentId={studentId} onAdded={fetchECAs} />
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading ECAs...</p>
          </CardContent>
        </Card>
      ) : ecas.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No ECAs recorded yet. Click "Add ECA" to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
      {ecas.map((eca) => (
        <Card key={eca.id}>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-semibold text-lg mb-1">{eca.eca_name}</h4>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="outline">{eca.eca_type}</Badge>
                  {getStatusBadge(eca.status)}
                </div>
              </div>
            </div>

            {eca.description && (
              <p className="text-sm">{eca.description}</p>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{eca.completion_percentage}%</span>
              </div>
              <Progress value={eca.completion_percentage} />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              {eca.start_date && (
                <div>
                  <p className="text-muted-foreground">Start Date</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(eca.start_date).toLocaleDateString()}
                  </div>
                </div>
              )}
              {eca.end_date && (
                <div>
                  <p className="text-muted-foreground">End Date</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(eca.end_date).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>

            {eca.outcomes && (
              <div>
                <p className="text-sm font-medium mb-1">Outcomes</p>
                <p className="text-sm text-muted-foreground">{eca.outcomes}</p>
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

export default StudentECAsTab;
