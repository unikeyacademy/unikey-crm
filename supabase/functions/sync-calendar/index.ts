import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function refreshAccessToken(refreshToken: string) {
  const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId!,
      client_secret: clientSecret!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh access token');
  }

  return await response.json();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { consultationId, action } = await req.json();
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Get user's Google tokens
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('google_access_token, google_refresh_token, google_token_expires_at')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.google_access_token) {
      throw new Error('Google Calendar not connected');
    }

    // Check if token needs refresh
    let accessToken = profile.google_access_token;
    const expiresAt = new Date(profile.google_token_expires_at);
    if (expiresAt <= new Date()) {
      const tokens = await refreshAccessToken(profile.google_refresh_token);
      accessToken = tokens.access_token;
      
      // Update stored tokens
      await supabase
        .from('profiles')
        .update({
          google_access_token: tokens.access_token,
          google_token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        })
        .eq('id', user.id);
    }

    // Get consultation details
    const { data: consultation, error: consultationError } = await supabase
      .from('consultations')
      .select('*, students(first_name, last_name)')
      .eq('id', consultationId)
      .single();

    if (consultationError) {
      throw consultationError;
    }

    const student = consultation.students as any;
    const summary = `Consultation: ${student.first_name} ${student.last_name}`;
    const description = `Type: ${consultation.consultation_type}\nDuration: ${consultation.duration_minutes || 60} minutes`;
    const startTime = new Date(consultation.consultation_date).toISOString();
    const endTime = new Date(new Date(consultation.consultation_date).getTime() + (consultation.duration_minutes || 60) * 60000).toISOString();

    if (action === 'create' || (action === 'update' && !consultation.google_calendar_event_id)) {
      // Create calendar event
      const eventResponse = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary,
          description,
          start: { dateTime: startTime, timeZone: 'UTC' },
          end: { dateTime: endTime, timeZone: 'UTC' },
          conferenceData: {
            createRequest: {
              requestId: `meet-${consultationId}`,
              conferenceSolutionKey: { type: 'hangoutsMeet' },
            },
          },
        }),
      });

      if (!eventResponse.ok) {
        const error = await eventResponse.text();
        console.error('Calendar event creation failed:', error);
        throw new Error('Failed to create calendar event');
      }

      const event = await eventResponse.json();
      const meetLink = event.conferenceData?.entryPoints?.find((e: any) => e.entryPointType === 'video')?.uri;

      // Update consultation with event ID and meet link
      await supabase
        .from('consultations')
        .update({
          google_calendar_event_id: event.id,
          meeting_link: meetLink || consultation.meeting_link,
        })
        .eq('id', consultationId);

      return new Response(
        JSON.stringify({ success: true, eventId: event.id, meetLink }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (action === 'update' && consultation.google_calendar_event_id) {
      // Update existing event
      const eventResponse = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${consultation.google_calendar_event_id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            summary,
            description,
            start: { dateTime: startTime, timeZone: 'UTC' },
            end: { dateTime: endTime, timeZone: 'UTC' },
          }),
        }
      );

      if (!eventResponse.ok) {
        throw new Error('Failed to update calendar event');
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (action === 'delete' && consultation.google_calendar_event_id) {
      // Delete calendar event
      await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${consultation.google_calendar_event_id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      // Clear event ID from consultation
      await supabase
        .from('consultations')
        .update({
          google_calendar_event_id: null,
        })
        .eq('id', consultationId);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');
  } catch (error) {
    console.error('Calendar sync error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});