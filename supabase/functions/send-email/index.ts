import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SendEmailRequest {
  to: string;
  toName?: string;
  subject: string;
  body: string;
  studentId?: string;
  templateId?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting send-email function");

    // Get auth token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user is authenticated
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error("Authentication error:", userError);
      throw new Error("Unauthorized");
    }

    console.log("User authenticated:", user.id);

    const {
      to,
      toName,
      subject,
      body,
      studentId,
      templateId,
    }: SendEmailRequest = await req.json();

    // Validate input
    if (!to || !subject || !body) {
      throw new Error("Missing required fields: to, subject, or body");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      throw new Error("Invalid email address format");
    }

    console.log("Sending email to:", to);

    // Send email using Resend
    const emailResponse = await resend.emails.send({
      from: "UNIKEY Academy <onboarding@resend.dev>",
      to: [to],
      subject: subject,
      html: body.replace(/\n/g, "<br>"),
    });

    console.log("Email sent successfully:", emailResponse);

    // Log email in database
    const { error: logError } = await supabase
      .from("email_logs")
      .insert({
        student_id: studentId || null,
        recipient_email: to,
        recipient_name: toName || null,
        subject: subject,
        body: body,
        template_id: templateId || null,
        sent_by: user.id,
        status: "sent",
        metadata: { resend_id: emailResponse.data?.id },
      });

    if (logError) {
      console.error("Error logging email:", logError);
    }

    // Log parent communication if studentId provided
    if (studentId) {
      await supabase
        .from("parent_communications_log")
        .insert({
          student_id: studentId,
          communication_type: "email",
          subject: subject,
          content: body,
          recipient: to,
          sent_by: user.id,
        });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email sent successfully",
        emailId: emailResponse.data?.id,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-email function:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to send email",
      }),
      {
        status: error.message === "Unauthorized" ? 401 : 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
