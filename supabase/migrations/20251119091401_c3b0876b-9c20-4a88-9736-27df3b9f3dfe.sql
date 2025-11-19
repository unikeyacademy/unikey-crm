-- Add Google Calendar integration fields to consultations table
ALTER TABLE public.consultations 
ADD COLUMN IF NOT EXISTS google_calendar_event_id text;

-- Add Google OAuth tokens to profiles table for storing user's Google credentials
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS google_access_token text,
ADD COLUMN IF NOT EXISTS google_refresh_token text,
ADD COLUMN IF NOT EXISTS google_token_expires_at timestamp with time zone;