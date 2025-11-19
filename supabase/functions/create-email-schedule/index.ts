import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { scheduleId } = await req.json();
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get the schedule details
    const { data: schedule, error: scheduleError } = await supabase
      .from('email_schedules')
      .select('*, email_templates(*)')
      .eq('id', scheduleId)
      .single();

    if (scheduleError) throw scheduleError;

    if (!schedule.is_active) {
      return new Response(
        JSON.stringify({ message: 'Schedule is inactive' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get students based on trigger type
    let studentsQuery = supabase.from('students').select('id, current_stage');
    
    if (schedule.trigger_stage) {
      studentsQuery = studentsQuery.eq('current_stage', schedule.trigger_stage);
    }

    const { data: students, error: studentsError } = await studentsQuery;
    if (studentsError) throw studentsError;

    // Create scheduled emails for each student
    const scheduledEmails = [];
    for (const student of students || []) {
      let scheduledFor = new Date();

      // Calculate scheduled time based on trigger type
      if (schedule.trigger_type === 'deadline_reminder' && schedule.trigger_days_before) {
        // Get next deadline for student
        const { data: targets } = await supabase
          .from('student_university_targets')
          .select('deadline_date')
          .eq('student_id', student.id)
          .not('deadline_date', 'is', null)
          .gte('deadline_date', new Date().toISOString())
          .order('deadline_date', { ascending: true })
          .limit(1);

        if (targets && targets.length > 0) {
          const deadline = new Date(targets[0].deadline_date);
          scheduledFor = new Date(deadline);
          scheduledFor.setDate(scheduledFor.getDate() - schedule.trigger_days_before);
        } else {
          continue; // Skip if no upcoming deadline
        }
      }

      scheduledEmails.push({
        email_schedule_id: scheduleId,
        student_id: student.id,
        scheduled_for: scheduledFor.toISOString(),
        status: 'pending',
      });
    }

    if (scheduledEmails.length > 0) {
      const { error: insertError } = await supabase
        .from('scheduled_emails')
        .insert(scheduledEmails);

      if (insertError) throw insertError;
    }

    return new Response(
      JSON.stringify({ created: scheduledEmails.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Create email schedule error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});