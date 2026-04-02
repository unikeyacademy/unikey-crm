import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function refreshGoogleToken(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
  const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');

  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth credentials not configured');
  }

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

  if (!response.ok) {
    const error = await response.text();
    console.error('Token refresh failed:', error);
    throw new Error('Failed to refresh Google token. Please reconnect Google in Settings.');
  }

  return await response.json();
}

function extractFolderId(url: string): string | null {
  // Handle formats:
  // https://drive.google.com/drive/folders/FOLDER_ID
  // https://drive.google.com/drive/u/0/folders/FOLDER_ID
  // https://drive.google.com/drive/folders/FOLDER_ID?...
  const match = url.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { folderUrl } = await req.json();

    if (!folderUrl) {
      return new Response(
        JSON.stringify({ error: 'No folder URL provided' }),
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

    // Get user's Google tokens
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Use service role to read tokens
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: profile, error: profileError } = await serviceClient
      .from('profiles')
      .select('google_access_token, google_refresh_token, google_token_expires_at')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.google_access_token) {
      return new Response(
        JSON.stringify({ error: 'Google not connected. Please connect Google in Settings.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let accessToken = profile.google_access_token;

    // Refresh token if expired
    const isExpired = profile.google_token_expires_at
      ? new Date(profile.google_token_expires_at) <= new Date()
      : true;

    if (isExpired && profile.google_refresh_token) {
      const newTokens = await refreshGoogleToken(profile.google_refresh_token);
      accessToken = newTokens.access_token;
      const expiresAt = new Date(Date.now() + newTokens.expires_in * 1000).toISOString();

      await serviceClient
        .from('profiles')
        .update({
          google_access_token: accessToken,
          google_token_expires_at: expiresAt,
        })
        .eq('id', user.id);
    }

    // List files in the folder
    const driveUrl = `https://www.googleapis.com/drive/v3/files?` +
      `q='${folderId}'+in+parents+and+trashed=false&` +
      `fields=files(id,name,mimeType,size,modifiedTime,webViewLink,iconLink,thumbnailLink)&` +
      `orderBy=modifiedTime+desc&` +
      `pageSize=100`;

    const driveResponse = await fetch(driveUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!driveResponse.ok) {
      const errText = await driveResponse.text();
      console.error('Drive API error:', driveResponse.status, errText);

      if (driveResponse.status === 403 || driveResponse.status === 401) {
        return new Response(
          JSON.stringify({ 
            error: 'Google Drive access denied. Please reconnect Google in Settings with Drive permissions.',
            needsReconnect: true 
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`Drive API error [${driveResponse.status}]: ${errText}`);
    }

    const driveData = await driveResponse.json();

    return new Response(
      JSON.stringify({ files: driveData.files || [] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error listing Drive files:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
