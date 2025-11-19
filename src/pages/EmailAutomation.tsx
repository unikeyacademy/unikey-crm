import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AddEmailScheduleDialog } from "@/components/email/AddEmailScheduleDialog";

const EmailAutomation = () => {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      const { data, error } = await supabase
        .from('email_schedules')
        .select('*, email_templates(template_name)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSchedules(data || []);
    } catch (error: any) {
      toast.error('Failed to load email schedules');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSchedule = async (scheduleId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('email_schedules')
        .update({ is_active: !currentStatus })
        .eq('id', scheduleId);

      if (error) throw error;
      
      fetchSchedules();
      toast.success(`Schedule ${!currentStatus ? 'activated' : 'deactivated'}`);
    } catch (error: any) {
      toast.error('Failed to update schedule');
    }
  };

  const getTriggerDescription = (schedule: any) => {
    switch (schedule.trigger_type) {
      case 'deadline_reminder':
        return `${schedule.trigger_days_before} days before deadline`;
      case 'stage_change':
        return `When student enters ${schedule.trigger_stage}`;
      case 'consultation_reminder':
        return `${schedule.trigger_days_before} days before consultation`;
      case 'manual':
        return 'Manual trigger';
      default:
        return schedule.trigger_type;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Email Automation</h1>
          <p className="text-muted-foreground mt-2">
            Set up automated email schedules and reminders
          </p>
        </div>
        <AddEmailScheduleDialog onAdded={fetchSchedules} />
      </div>

      <div className="grid gap-4">
        {schedules.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              No email schedules configured yet
            </CardContent>
          </Card>
        ) : (
          schedules.map((schedule) => (
            <Card key={schedule.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-lg">
                      {schedule.email_templates?.template_name}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="outline">{getTriggerDescription(schedule)}</Badge>
                      {schedule.send_to_student && <Badge variant="secondary">To Student</Badge>}
                      {schedule.send_to_parent && <Badge variant="secondary">To Parent</Badge>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={schedule.is_active}
                      onCheckedChange={() => toggleSchedule(schedule.id, schedule.is_active)}
                    />
                    <Badge variant={schedule.is_active ? "default" : "outline"}>
                      {schedule.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default EmailAutomation;