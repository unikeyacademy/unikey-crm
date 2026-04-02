import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Clock } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AddConsultationCalendarDialog from "@/components/calendar/AddConsultationCalendarDialog";

interface Consultation {
  id: string;
  consultation_date: string;
  consultation_type: string;
  duration_minutes: number | null;
  meeting_link: string | null;
  students: {
    first_name: string;
    last_name: string;
  } | null;
}

const CalendarPage = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const { toast } = useToast();

  const fetchConsultations = async () => {
    try {
      const { data, error } = await supabase
        .from('consultations')
        .select(`
          *,
          students:student_id!inner (
            first_name,
            last_name,
            application_cycle
          )
        `)
        .neq("students.application_cycle", "2026")
        .gte('consultation_date', new Date().toISOString())
        .order('consultation_date', { ascending: true })
        .limit(10);

      if (error) throw error;
      setConsultations(data as any || []);
    } catch (error: any) {
      toast({
        title: "Error fetching consultations",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchConsultations();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground">
            View and manage consultation schedules
          </p>
        </div>
        <AddConsultationCalendarDialog
          selectedDate={date}
          onConsultationAdded={fetchConsultations}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Calendar View</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Consultations</CardTitle>
          </CardHeader>
          <CardContent>
            {consultations.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No upcoming consultations scheduled
              </p>
            ) : (
              <div className="space-y-4">
                {consultations.map((consultation) => (
                  <Card key={consultation.id}>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">
                            {consultation.students?.first_name} {consultation.students?.last_name}
                          </h4>
                          <Badge>{consultation.consultation_type}</Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {format(new Date(consultation.consultation_date), "PPp")}
                          {consultation.duration_minutes && ` (${consultation.duration_minutes} min)`}
                        </div>
                        {consultation.meeting_link && (
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="w-full"
                          >
                            <a
                              href={consultation.meeting_link}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="mr-2 h-4 w-4" />
                              Join Meeting
                            </a>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CalendarPage;
