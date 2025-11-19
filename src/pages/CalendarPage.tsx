import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const CalendarPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Calendar</h1>
          <p className="text-muted-foreground">
            Schedule and view consultations
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          New Event
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Calendar View</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Calendar and consultation scheduling features coming soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default CalendarPage;
