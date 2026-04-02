import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function refreshGoogleToken(refreshToken: string): Promise<string> {
  const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
  if (!clientId || !clientSecret) throw new Error('Google OAuth credentials not configured');

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) throw new Error('Failed to refresh Google token');
  const tokens = await response.json();
  return tokens.access_token;
}

async function getAccessToken(userId: string, serviceClient: any): Promise<string> {
  const { data: profile } = await serviceClient
    .from('profiles')
    .select('google_access_token, google_refresh_token, google_token_expires_at')
    .eq('id', userId)
    .single();

  if (!profile?.google_access_token) {
    throw new Error('Google not connected. Please connect Google in Settings.');
  }

  const isExpired = profile.google_token_expires_at
    ? new Date(profile.google_token_expires_at) <= new Date()
    : true;

  if (isExpired && profile.google_refresh_token) {
    const newToken = await refreshGoogleToken(profile.google_refresh_token);
    await serviceClient.from('profiles').update({
      google_access_token: newToken,
      google_token_expires_at: new Date(Date.now() + 3500 * 1000).toISOString(),
    }).eq('id', userId);
    return newToken;
  }

  return profile.google_access_token;
}

function extractFolderId(url: string): string | null {
  const match = url.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

// Parse filename format: YYMMDD [Student Name] [Nature of Meeting] with [Consultant Name]
function parseFilename(filename: string): { date: string | null; studentName: string | null; meetingType: string | null; consultantName: string | null } {
  // Remove file extension
  const name = filename.replace(/\.[^.]+$/, '').trim();
  
  // Match: YYMMDD followed by content, with "with" separating consultant
  const match = name.match(/^(\d{6})\s+(.+?)\s+with\s+(.+)$/i);
  if (!match) {
    return { date: null, studentName: null, meetingType: null, consultantName: null };
  }

  const dateStr = match[1]; // YYMMDD
  const middlePart = match[2].trim(); // "[Student Name] [Nature of Meeting]"
  const consultantName = match[3].trim();

  // Parse YYMMDD to ISO date
  const yy = parseInt(dateStr.substring(0, 2));
  const mm = parseInt(dateStr.substring(2, 4));
  const dd = parseInt(dateStr.substring(4, 6));
  const year = yy >= 50 ? 1900 + yy : 2000 + yy;
  const date = `${year}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;

  // Try to split middle part into student name and meeting type
  // Common meeting types to look for
  const meetingTypes = [
    'Progress Review', 'Progress Report', 'Strategy Session', 'Application Review',
    'Initial Consultation', 'Follow-up', 'Follow Up', 'Check-in', 'Check In',
    'University Review', 'Essay Review', 'ECA Review', 'Interview Prep',
    'Kickoff', 'Kick-off', 'Meeting', 'Session', 'Review', 'Consultation',
    'Catch-up', 'Catch Up', 'Debrief', 'Planning', 'Brainstorm',
  ];

  let studentName = middlePart;
  let meetingType: string | null = null;

  // Try to find a known meeting type at the end of the middle part
  for (const mt of meetingTypes) {
    if (middlePart.toLowerCase().endsWith(mt.toLowerCase())) {
      studentName = middlePart.substring(0, middlePart.length - mt.length).trim();
      meetingType = mt;
      break;
    }
  }

  // If no known type found, try splitting on last space-separated word group
  if (!meetingType) {
    // Assume format is "FirstName LastName MeetingType" — take last 1-2 words as type
    const words = middlePart.split(/\s+/);
    if (words.length >= 3) {
      // Try last 2 words as meeting type
      meetingType = words.slice(-2).join(' ');
      studentName = words.slice(0, -2).join(' ');
    } else if (words.length === 2) {
      meetingType = words[1];
      studentName = words[0];
    }
  }

  return { date, studentName, meetingType, consultantName };
}

async function exportGoogleDoc(fileId: string, accessToken: string): Promise<string> {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!response.ok) throw new Error(`Failed to export Google Doc ${fileId}`);
  return await response.text();
}

async function downloadFile(fileId: string, accessToken: string): Promise<string> {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!response.ok) throw new Error(`Failed to download file ${fileId}`);
  return await response.text();
}

async function parseReportWithAI(content: string, fileName: string): Promise<any> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

  const systemPrompt = `You are a document parser for educational consulting progress reports. Extract structured data from the report content.
Return a JSON object with these fields:
- consultation_date: ISO 8601 date string (try to extract from filename or content, e.g. "2026-03-15"). If not found, use null.
- duration_minutes: number or null
- consultation_type: string (e.g. "Progress Review", "Strategy Session", "Application Review")
- topics_discussed: array of short topic strings
- notes: string - a concise summary of the report content (2-3 sentences)
- action_items: array of action item strings
- next_steps: string summarizing what should happen next
- key_decisions: string or null - any key decisions made
- attendees: array of attendee names mentioned, or empty array
- progress_summary: string - overall progress assessment

IMPORTANT: Return ONLY valid JSON, no markdown or extra text.`;

  const response = await fetch('https://ai.lovable.dev/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Filename: ${fileName}\n\nDocument content:\n${content.substring(0, 15000)}` },
      ],
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`AI parsing failed [${response.status}]: ${err}`);
  }

  const result = await response.json();
  const text = result.choices?.[0]?.message?.content || '';
  
  try {
    return JSON.parse(text);
  } catch {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) return JSON.parse(jsonMatch[1].trim());
    throw new Error('Failed to parse AI response as JSON');
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { studentId, folderUrl } = await req.json();

    if (!studentId || !folderUrl) {
      return new Response(
        JSON.stringify({ error: 'studentId and folderUrl are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const folderId = extractFolderId(folderUrl);
    if (!folderId) {
      return new Response(
        JSON.stringify({ error: 'Invalid Google Drive folder URL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('User not authenticated');

    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const accessToken = await getAccessToken(user.id, serviceClient);

    // Search for progress reports in the folder
    const searchQuery = `'${folderId}' in parents and trashed=false and (name contains 'Progress Report' or name contains 'progress report' or name contains 'Consultation' or name contains 'consultation')`;
    const driveUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(searchQuery)}&fields=files(id,name,mimeType,modifiedTime,webViewLink)&orderBy=modifiedTime desc&pageSize=50`;

    const driveResponse = await fetch(driveUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!driveResponse.ok) {
      const errText = await driveResponse.text();
      throw new Error(`Drive API error [${driveResponse.status}]: ${errText}`);
    }

    const driveData = await driveResponse.json();
    const files = driveData.files || [];

    if (files.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No progress reports found in the Drive folder', imported: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check which files have already been imported (by matching meeting_link to webViewLink)
    const { data: existingConsultations } = await supabase
      .from('consultations')
      .select('meeting_link')
      .eq('student_id', studentId)
      .not('meeting_link', 'is', null);

    const existingLinks = new Set((existingConsultations || []).map(c => c.meeting_link));
    const newFiles = files.filter((f: any) => !existingLinks.has(f.webViewLink));

    if (newFiles.length === 0) {
      return new Response(
        JSON.stringify({ message: 'All progress reports have already been imported', imported: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = [];

    for (const file of newFiles.slice(0, 10)) { // Limit to 10 at a time
      try {
        let content: string;
        if (file.mimeType === 'application/vnd.google-apps.document') {
          content = await exportGoogleDoc(file.id, accessToken);
        } else {
          content = await downloadFile(file.id, accessToken);
        }

        const parsed = await parseReportWithAI(content, file.name);

        // Insert as consultation
        const { error: insertError } = await supabase
          .from('consultations')
          .insert({
            student_id: studentId,
            consultant_id: user.id,
            consultation_date: parsed.consultation_date || file.modifiedTime,
            duration_minutes: parsed.duration_minutes,
            consultation_type: parsed.consultation_type || 'Progress Review',
            topics_discussed: parsed.topics_discussed || [],
            notes: parsed.notes ? `${parsed.notes}${parsed.progress_summary ? '\n\nProgress Summary: ' + parsed.progress_summary : ''}` : null,
            action_items: parsed.action_items || [],
            next_steps: parsed.next_steps,
            key_decisions: parsed.key_decisions,
            attendees: parsed.attendees || [],
            meeting_link: file.webViewLink, // Store Drive link to prevent re-import
          });

        if (insertError) {
          console.error(`Error inserting consultation for ${file.name}:`, insertError);
          results.push({ file: file.name, status: 'error', error: insertError.message });
        } else {
          results.push({ file: file.name, status: 'imported' });
        }
      } catch (fileError) {
        console.error(`Error processing ${file.name}:`, fileError);
        results.push({ file: file.name, status: 'error', error: fileError instanceof Error ? fileError.message : 'Unknown error' });
      }
    }

    const importedCount = results.filter(r => r.status === 'imported').length;

    return new Response(
      JSON.stringify({ 
        message: `Imported ${importedCount} of ${newFiles.length} progress reports`,
        imported: importedCount,
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error syncing progress reports:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
