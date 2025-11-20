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

    let databaseSuggestions: any[] = [];
    let aiGeneratedSuggestions: any[] = [];

    // ===== STAGE 1: Database-based suggestions =====
    if (opportunities && opportunities.length > 0) {
      console.log("STAGE 1: Analyzing database opportunities...");
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
        model: "google/gemini-2.5-flash",
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

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
          
          if (toolCall) {
            const suggestions = JSON.parse(toolCall.function.arguments).suggestions;
            
            // Enrich with full opportunity data and mark as database source
            databaseSuggestions = suggestions.map((suggestion: any) => {
              const opportunity = opportunities.find(
                (opp) => opp.name.toLowerCase() === suggestion.opportunity_name.toLowerCase()
              );
              return {
                ...suggestion,
                source: "database",
                opportunity: opportunity || null
              };
            }).filter((s: any) => s.opportunity !== null);

            console.log(`Stage 1: Found ${databaseSuggestions.length} database suggestions`);
          }
        } else {
          console.error("Stage 1 AI call failed:", aiResponse.status);
        }
      } catch (error) {
        console.error("Stage 1 error:", error);
      }
    }

    // ===== STAGE 2: Gap Analysis and AI Discovery =====
    const shouldRunStage2 = databaseSuggestions.length < 3 || 
      (student.academic_interests && student.academic_interests.length > 0);

    if (shouldRunStage2) {
      console.log("STAGE 2: Generating AI-discovered opportunities...");

      const discoveryPrompt = `You are a university admissions consultant with expertise in discovering innovative extracurricular opportunities.

Analyze this student's profile and generate 2-3 NEW, creative ECA opportunities that would strengthen their application. These should be real opportunities that exist (competitions, programs, research, projects) but may not be in our current database.

${studentContext}

Generate opportunities that:
1. Fill gaps in their current profile
2. Align with their academic interests and target universities
3. Are appropriate for their grade level and timeline
4. Stand out and demonstrate initiative
5. Are actually accessible/available to students

For each opportunity, provide complete details as if you were adding it to a database.`;

      try {
        const discoveryResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: "You are a university admissions consultant specializing in discovering and recommending extracurricular opportunities." },
              { role: "user", content: discoveryPrompt }
            ],
            tools: [{
              type: "function",
              function: {
                name: "generate_eca_opportunities",
                description: "Generate new ECA opportunities with complete details",
                parameters: {
                  type: "object",
                  properties: {
                    opportunities: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          name: { type: "string", description: "Name of the opportunity" },
                          type: { type: "string", description: "Type of ECA (e.g., Competition, Research, Project, Volunteering)" },
                          subject_areas: { 
                            type: "array", 
                            items: { type: "string" },
                            description: "Relevant subject areas"
                          },
                          eligibility: { type: "string", description: "Who can participate" },
                          time_commitment: { type: "string", description: "Expected time commitment" },
                          cost: { type: "string", description: "Cost information" },
                          prestige_level: { type: "string", description: "Prestige level (High/Medium/Low)" },
                          deadline_type: { type: "string", description: "Deadline type (annual/rolling/seasonal)" },
                          website: { type: "string", description: "Official website URL if known" },
                          fit_score: { type: "number", minimum: 1, maximum: 10, description: "Fit for this specific student" },
                          reasoning: { type: "string", description: "Why this is recommended for this student" },
                          key_benefits: {
                            type: "array",
                            items: { type: "string" },
                            description: "Key benefits for this student"
                          }
                        },
                        required: ["name", "type", "subject_areas", "eligibility", "time_commitment", "cost", "prestige_level", "fit_score", "reasoning", "key_benefits"],
                        additionalProperties: false
                      }
                    }
                  },
                  required: ["opportunities"],
                  additionalProperties: false
                }
              }
            }],
            tool_choice: { type: "function", function: { name: "generate_eca_opportunities" } }
          }),
        });

        if (discoveryResponse.ok) {
          const discoveryData = await discoveryResponse.json();
          const toolCall = discoveryData.choices?.[0]?.message?.tool_calls?.[0];
          
          if (toolCall) {
            const generatedOpps = JSON.parse(toolCall.function.arguments).opportunities;
            
            // Mark as AI-generated and structure for UI
            aiGeneratedSuggestions = generatedOpps.map((opp: any) => ({
              opportunity_name: opp.name,
              fit_score: opp.fit_score,
              reasoning: opp.reasoning,
              key_benefits: opp.key_benefits,
              action_items: [
                "Research this opportunity online",
                "Check eligibility requirements",
                "Mark application deadline in calendar"
              ],
              source: "ai_generated",
              opportunity: {
                id: null,
                name: opp.name,
                type: opp.type,
                subject_areas: opp.subject_areas,
                eligibility: opp.eligibility,
                time_commitment: opp.time_commitment,
                cost: opp.cost,
                prestige_level: opp.prestige_level,
                deadline_type: opp.deadline_type,
                deadline_date: null,
                website: opp.website || null,
                is_active: true,
                is_recommended: false
              }
            }));

            console.log(`Stage 2: Generated ${aiGeneratedSuggestions.length} AI opportunities`);
          }
        } else {
          console.error("Stage 2 AI call failed:", discoveryResponse.status);
        }
      } catch (error) {
        console.error("Stage 2 error:", error);
        // Continue with Stage 1 results even if Stage 2 fails
      }
    }

    // ===== Combine and Return Results =====
    const allSuggestions = [...databaseSuggestions, ...aiGeneratedSuggestions];
    
    console.log(`Returning ${allSuggestions.length} total suggestions (${databaseSuggestions.length} database, ${aiGeneratedSuggestions.length} AI-generated)`);

    return new Response(
      JSON.stringify({ 
        suggestions: allSuggestions,
        database_count: databaseSuggestions.length,
        ai_generated_count: aiGeneratedSuggestions.length
      }),
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