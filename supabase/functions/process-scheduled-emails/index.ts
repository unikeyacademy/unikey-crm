import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get pending scheduled emails that are due
    const now = new Date().toISOString();
    const { data: scheduledEmails, error: fetchError } = await supabaseAdmin
      .from('scheduled_emails')
      .select(`
        *,
        email_schedules(*, email_templates(*)),
        students(first_name, last_name, email, parent_email, parent_names)
      `)
      .eq('status', 'pending')
      .lte('scheduled_for', now)
      .limit(50);

    if (fetchError) throw fetchError;

    const results = [];
    for (const scheduledEmail of scheduledEmails || []) {
      try {
        const template = scheduledEmail.email_schedules.email_templates;
        const student = scheduledEmail.students;
        const schedule = scheduledEmail.email_schedules;

        // Prepare recipients
        const recipients = [];
        if (schedule.send_to_student && student.email) {
          recipients.push(student.email);
        }
        if (schedule.send_to_parent && student.parent_email) {
          recipients.push(student.parent_email);
        }

        if (recipients.length === 0) {
          throw new Error('No valid recipients');
        }

        // Replace merge fields
        let emailBody = template.body;
        let emailSubject = template.subject;
        
        const mergeData = {
          student_first_name: student.first_name,
          student_last_name: student.last_name,
          student_full_name: `${student.first_name} ${student.last_name}`,
          parent_names: student.parent_names || 'Parents',
        };

        Object.entries(mergeData).forEach(([key, value]) => {
          const regex = new RegExp(`{{${key}}}`, 'g');
          emailBody = emailBody.replace(regex, value);
          emailSubject = emailSubject.replace(regex, value);
        });

        // Send email
        const { data: emailData, error: emailError } = await resend.emails.send({
          from: 'UNIKEY Academy <onboarding@resend.dev>',
          to: recipients,
          subject: emailSubject,
          html: emailBody,
        });

        if (emailError) throw emailError;

        // Log email
        const { data: emailLog, error: logError } = await supabaseAdmin
          .from('email_logs')
          .insert({
            subject: emailSubject,
            body: emailBody,
            recipient_email: recipients[0],
            recipient_name: schedule.send_to_student ? `${student.first_name} ${student.last_name}` : student.parent_names,
            student_id: student.id,
            template_id: template.id,
            sent_by: scheduledEmail.email_schedules.created_by || '00000000-0000-0000-0000-000000000000',
            status: 'sent',
            metadata: { scheduled_email_id: scheduledEmail.id, recipients },
          })
          .select()
          .single();

        if (logError) console.error('Log error:', logError);

        // Update scheduled email status
        await supabaseAdmin
          .from('scheduled_emails')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            email_log_id: emailLog?.id,
          })
          .eq('id', scheduledEmail.id);

        results.push({ id: scheduledEmail.id, status: 'sent' });
      } catch (error) {
        console.error(`Error sending email ${scheduledEmail.id}:`, error);
        
        // Update scheduled email with error
        await supabaseAdmin
          .from('scheduled_emails')
          .update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error',
          })
          .eq('id', scheduledEmail.id);

        results.push({ id: scheduledEmail.id, status: 'failed', error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    return new Response(
      JSON.stringify({ processed: results.length, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Process scheduled emails error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});