import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, FolderSync, Loader2, ExternalLink, FileText } from "lucide-react";
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

interface NotionReport {
  id: string;
  session_date: string | null;
  session_type: string | null;
  consultant_name: string | null;
  summary: string | null;
  notion_url: string | null;
}

type TimelineItem =
  | { source: "drive"; date: string; data: Consultation }
  | { source: "notion"; date: string; data: NotionReport };

interface StudentConsultationsTabProps {
  studentId: string;
}

const StudentConsultationsTab = ({ studentId }: StudentConsultationsTabProps) => {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [notionReports, setNotionReports] = useState<NotionReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [driveUrl, setDriveUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchAll();
    fetchDriveUrl();
  }, [studentId]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [c, n] = await Promise.all([
        supabase
          .from("consultations")
          .select("*")
          .eq("student_id", studentId)
          .order("consultation_date", { ascending: false }),
        supabase
          .from("notion_session_reports")
          .select("id, session_date, session_type, consultant_name, summary, notion_url")
          .eq("student_id", studentId)
          .order("session_date", { ascending: false }),
      ]);
      if (c.error) throw c.error;
      if (n.error) throw n.error;
      setConsultations((c.data as any) || []);
      setNotionReports((n.data as any) || []);
    } catch (error: any) {
      toast.error("Error loading consultations");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDriveUrl = async () => {
    const { data } = await supabase
      .from("students")
      .select("google_drive_folder_url")
      .eq("id", studentId)
      .single();
    setDriveUrl((data as any)?.google_drive_folder_url || null);
  };

  const handleSyncFromDrive = async () => {
    if (!driveUrl) {
      toast.error("No Google Drive folder linked. Add one in the Profile tab.");
      return;
    }

    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("sync-progress-reports", {
        body: { studentId, folderUrl: driveUrl },
      });

      if (error) throw error;

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      toast.success(data?.message || "Sync complete");

      if (data?.imported > 0) {
        fetchAll();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to sync progress reports");
      console.error(error);
    } finally {
      setSyncing(false);
    }
  };

  const isDriveLink = (link: string | null) => {
    return link?.includes("drive.google.com") || link?.includes("docs.google.com");
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Consultation History</h3>
        <div className="flex gap-2">
          {driveUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncFromDrive}
              disabled={syncing}
              className="gap-2"
            >
              {syncing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FolderSync className="h-4 w-4" />
              )}
              {syncing ? "Syncing..." : "Sync from Drive"}
            </Button>
          )}
          <AddConsultationDialog studentId={studentId} onAdded={fetchAll} />
        </div>
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
          <CardContent className="py-12 text-center space-y-3">
            <p className="text-muted-foreground">
              No consultations logged yet.
            </p>
            {driveUrl ? (
              <p className="text-sm text-muted-foreground">
                Click "Sync from Drive" to import progress reports, or "Add Consultation" to log one manually.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Link a Google Drive folder in the Profile tab to sync progress reports, or add one manually.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {consultations.map((consultation) => (
            <Card key={consultation.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">
                        {consultation.consultation_type}
                      </CardTitle>
                      {isDriveLink(consultation.meeting_link) && (
                        <Badge variant="outline" className="text-xs gap-1">
                          <FolderSync className="h-3 w-3" />
                          From Drive
                        </Badge>
                      )}
                    </div>
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
                  {isDriveLink(consultation.meeting_link) && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={consultation.meeting_link!} target="_blank" rel="noopener noreferrer" className="gap-1">
                        <ExternalLink className="h-3 w-3" />
                        View Report
                      </a>
                    </Button>
                  )}
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

                {consultation.meeting_link && !isDriveLink(consultation.meeting_link) && (
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
