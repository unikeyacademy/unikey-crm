import EmailTemplatesManager from "@/components/email/EmailTemplatesManager";

const EmailTemplates = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Email Templates</h1>
        <p className="text-muted-foreground">
          Create and manage email templates for parent communications
        </p>
      </div>

      <EmailTemplatesManager />
    </div>
  );
};

export default EmailTemplates;
