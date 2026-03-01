import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, Clock } from "lucide-react";
import { toast } from "sonner";
import AddConsultationDialog from "./AddConsultationDialog";

interface Consultation {
  id: string;
  consultation_date: string;
  duration_minutes: number | null;
  consultation_type: string;
  topics_discussed: string[] | null;
  notes: string | null;
  action_items: string[] | null;
  next_steps: string | null;
  meeting_link: string | null;
  consultant_id: string;
  attendees: string[] | null;
  key_decisions: string | null;
}

interface StudentConsultationsTabProps {
  studentId: string;
}

const StudentConsultationsTab = ({ studentId }: StudentConsultationsTabProps) => {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConsultations();
  }, [studentId]);

  const fetchConsultations = async () => {
    try {
      const { data, error } = await supabase
        .from("consultations")
        .select("*")
        .eq("student_id", studentId)
        .order("consultation_date", { ascending: false });

      if (error) throw error;
      setConsultations(data || []);
    } catch (error: any) {
      toast.error("Error loading consultations");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Consultation History</h3>
        <AddConsultationDialog studentId={studentId} onAdded={fetchConsultations} />
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading consultations...</p>
          </CardContent>
        </Card>
      ) : consultations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No consultations logged yet. Click "Add Consultation" to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {consultations.map((consultation) => (
            <Card key={consultation.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">
                      {consultation.consultation_type}
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(consultation.consultation_date).toLocaleDateString()}
                      </div>
                      {consultation.duration_minutes && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {consultation.duration_minutes} mins
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {consultation.topics_discussed && consultation.topics_discussed.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Topics Discussed</p>
                    <div className="flex flex-wrap gap-2">
                      {consultation.topics_discussed.map((topic, index) => (
                        <Badge key={index} variant="secondary">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {consultation.notes && (
                  <div>
                    <p className="text-sm font-medium mb-2">Notes</p>
                    <p className="text-sm whitespace-pre-wrap">{consultation.notes}</p>
                  </div>
                )}

                {consultation.action_items && consultation.action_items.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Action Items</p>
                    <ul className="list-disc list-inside space-y-1">
                      {consultation.action_items.map((item, index) => (
                        <li key={index} className="text-sm">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {consultation.next_steps && (
                  <div>
                    <p className="text-sm font-medium mb-2">Next Steps</p>
                    <p className="text-sm">{consultation.next_steps}</p>
                  </div>
                )}

                {consultation.attendees && consultation.attendees.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Attendees</p>
                    <div className="flex flex-wrap gap-1">
                      {consultation.attendees.map((a, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{a}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {consultation.key_decisions && (
                  <div>
                    <p className="text-sm font-medium mb-2">Key Decisions</p>
                    <p className="text-sm">{consultation.key_decisions}</p>
                  </div>
                )}

                {consultation.meeting_link && (
                  <div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(consultation.meeting_link!, "_blank")}
                    >
                      Open Meeting Link
                    </Button>
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

export default StudentConsultationsTab;
