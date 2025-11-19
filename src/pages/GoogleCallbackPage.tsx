import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const GoogleCallbackPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const error = params.get('error');

        if (error) {
          throw new Error('Authorization cancelled');
        }

        if (!code) {
          throw new Error('No authorization code received');
        }

        const redirectUri = `${window.location.origin}/auth/google/callback`;

        const { data: { session } } = await supabase.auth.getSession();
        
        const { data, error: functionError } = await supabase.functions.invoke('google-oauth', {
          body: { code, redirectUri },
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        });

        if (functionError) throw functionError;

        toast({
          title: "Connected!",
          description: "Google Calendar has been connected successfully",
        });

        navigate('/settings');
      } catch (error) {
        console.error('OAuth callback error:', error);
        toast({
          title: "Connection Failed",
          description: error instanceof Error ? error.message : "Failed to connect Google Calendar",
          variant: "destructive",
        });
        navigate('/settings');
      }
    };

    handleCallback();
  }, [navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-muted-foreground">Connecting Google Calendar...</p>
      </div>
    </div>
  );
};

export default GoogleCallbackPage;