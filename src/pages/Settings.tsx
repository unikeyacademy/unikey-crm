import { GoogleCalendarSettings } from "@/components/settings/GoogleCalendarSettings";

const Settings = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your integrations and preferences
        </p>
      </div>
      
      <GoogleCalendarSettings />
    </div>
  );
};

export default Settings;