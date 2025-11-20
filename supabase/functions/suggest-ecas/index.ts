import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { studentId } = await req.json();

    if (!studentId) {
      return new Response(JSON.stringify({ error: "Student ID is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Fetching student data for:", studentId);

    // Fetch student data
    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("*, student_ecas(*), student_university_targets(*)")
      .eq("id", studentId)
      .single();

    if (studentError || !student) {
      console.error("Student fetch error:", studentError);
      return new Response(JSON.stringify({ error: "Student not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Fetching ECA opportunities...");

    // Fetch all active ECA opportunities
    const { data: opportunities, error: ecaError } = await supabase
      .from("eca_opportunities")
      .select("*")
      .eq("is_active", true)
      .order("is_recommended", { ascending: false });

    if (ecaError) {
      console.error("ECA fetch error:", ecaError);
      return new Response(JSON.stringify({ error: "Failed to fetch opportunities" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Found ${opportunities?.length || 0} opportunities`);

    // Prepare context for AI
    const studentContext = `
Student Profile:
- Name: ${student.first_name} ${student.last_name}
- Grade Level: Year ${student.grade_level || "Unknown"}
- Current Stage: ${student.current_stage || "Unknown"}
- Curriculum: ${student.curriculum || "Unknown"}
- Subject Choices: ${student.subject_choices?.map((s: any) => `${s.subject} (Grade: ${s.predicted_grade})`).join(", ") || "None"}
- Academic Interests: ${student.academic_interests?.join(", ") || "None"}
- Region Interests: ${student.region_interest?.join(", ") || "None"}
- Current ECAs: ${student.student_ecas?.map((e: any) => e.eca_name).join(", ") || "None"}
- University Targets: ${student.student_university_targets?.map((u: any) => `${u.university_name} (${u.country})`).join(", ") || "None"}
`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    let databaseSuggestions = [];

    // STAGE 1: Database-based suggestions (only if opportunities exist)
    if (opportunities && opportunities.length > 0) {
      const opportunitiesContext = opportunities.map((opp) => `
- ${opp.name}
  Type: ${opp.type}
  Subject Areas: ${opp.subject_areas?.join(", ")}
  Prestige: ${opp.prestige_level}
  Time Commitment: ${opp.time_commitment}
  Best For: ${opp.best_for?.join(", ")}
  Cost: ${opp.cost || "Free"}
  Deadline: ${opp.deadline_date ? new Date(opp.deadline_date).toLocaleDateString() : "Rolling"}
  ${opp.past_success_notes ? `Past Success: ${opp.past_success_notes}` : ""}
`).join("\n");

      const systemPrompt = `You are a university admissions consultant specializing in extracurricular activities (ECAs).

Your task is to analyze a student's profile and the available ECA opportunities from our database,
then suggest 3-5 opportunities that would best strengthen their university applications.

Focus on:
1. Academic alignment with their subject choices and interests
2. Fit with their target universities and regions
3. Time commitment feasibility
4. Prestige and competitiveness appropriate for their profile
5. Balance across different types of activities
6. Filling gaps in their current ECA portfolio`;

      const userPrompt = `${studentContext}

Available ECA Opportunities:
${opportunitiesContext}

Based on this student's profile and the available opportunities, suggest 3-5 ECAs that would be most beneficial.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-5",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        tools: [{
          type: "function",
          function: {
            name: "suggest_ecas",
            description: "Return 3-5 ECA opportunity suggestions with detailed reasoning",
            parameters: {
              type: "object",
              properties: {
                suggestions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      opportunity_name: { type: "string", description: "Exact name of the ECA opportunity" },
                      fit_score: { type: "number", minimum: 1, maximum: 10, description: "How well this matches the student (1-10)" },
                      reasoning: { type: "string", description: "Why this opportunity is a good fit" },
                      key_benefits: { 
                        type: "array",
                        items: { type: "string" },
                        description: "List of specific benefits for this student"
                      },
                      action_items: {
                        type: "array",
                        items: { type: "string" },
                        description: "Next steps the student should take"
                      }
                    },
                    required: ["opportunity_name", "fit_score", "reasoning", "key_benefits"],
                    additionalProperties: false
                  }
                }
              },
              required: ["suggestions"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "suggest_ecas" } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to your workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "AI processing failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    console.log("AI response received:", JSON.stringify(aiData, null, 2));
    
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      console.error("No tool call in AI response");
      console.error("Full AI response:", JSON.stringify(aiData, null, 2));
      
      // Try to extract content directly if no tool call
      const content = aiData.choices?.[0]?.message?.content;
      if (content) {
        console.log("Attempting to parse content directly:", content);
        try {
          const parsed = JSON.parse(content);
          if (parsed.suggestions) {
            console.log("Successfully parsed suggestions from content");
            const suggestions = parsed.suggestions;
            
            // Enrich suggestions with full opportunity data
            const enrichedSuggestions = suggestions.map((suggestion: any) => {
              const opportunity = opportunities?.find(
                (opp) => opp.name.toLowerCase() === suggestion.opportunity_name.toLowerCase()
              );
              return {
                ...suggestion,
                opportunity: opportunity || null
              };
            }).filter((s: any) => s.opportunity !== null);

            return new Response(
              JSON.stringify({ suggestions: enrichedSuggestions }),
              {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              }
            );
          }
        } catch (e) {
          console.error("Failed to parse content as JSON:", e);
        }
      }
      
      return new Response(JSON.stringify({ error: "Invalid AI response format" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const suggestions = JSON.parse(toolCall.function.arguments).suggestions;

    // Enrich suggestions with full opportunity data
    const enrichedSuggestions = suggestions.map((suggestion: any) => {
      const opportunity = opportunities?.find(
        (opp) => opp.name.toLowerCase() === suggestion.opportunity_name.toLowerCase()
      );
      return {
        ...suggestion,
        opportunity: opportunity || null
      };
    }).filter((s: any) => s.opportunity !== null);

    console.log(`Returning ${enrichedSuggestions.length} suggestions`);

    return new Response(
      JSON.stringify({ suggestions: enrichedSuggestions }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // If no opportunities in database, return empty result
  return new Response(
    JSON.stringify({ suggestions: [], database_count: 0, ai_generated_count: 0 }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
  } catch (error) {
    console.error("Error in suggest-ecas function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});