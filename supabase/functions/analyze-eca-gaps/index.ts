import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Required environment variables not configured');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch student data to analyze
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('academic_interests, region_interest, curriculum, grade_level')
      .eq('status', 'active');

    if (studentsError) {
      throw new Error(`Failed to fetch students: ${studentsError.message}`);
    }

    // Fetch existing ECAs
    const { data: existingEcas, error: ecasError } = await supabase
      .from('eca_opportunities')
      .select('type, subject_areas, prestige_level');

    if (ecasError) {
      throw new Error(`Failed to fetch ECAs: ${ecasError.message}`);
    }

    // Fetch student ECAs to see what's successful
    const { data: studentEcas, error: studentEcasError } = await supabase
      .from('student_ecas')
      .select('eca_name, eca_type, status, outcomes');

    if (studentEcasError) {
      throw new Error(`Failed to fetch student ECAs: ${studentEcasError.message}`);
    }

    console.log(`Analyzing ${students?.length || 0} students, ${existingEcas?.length || 0} opportunities, ${studentEcas?.length || 0} student activities`);

    // Aggregate data for analysis
    const studentInterests = students?.flatMap(s => s.academic_interests || []) || [];
    const regionInterests = students?.flatMap(s => s.region_interest || []) || [];
    const curriculums = students?.map(s => s.curriculum).filter(Boolean) || [];
    const ecaTypes = existingEcas?.map(e => e.type) || [];
    const ecaSubjects = existingEcas?.flatMap(e => e.subject_areas || []) || [];
    const successfulEcas = studentEcas?.filter(e => e.status === 'completed' && e.outcomes) || [];

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-5',
        messages: [
          {
            role: 'system',
            content: 'You are an expert education consultant analyzing ECA portfolios for gaps and opportunities.'
          },
          {
            role: 'user',
            content: `Analyze this educational consultancy's ECA database and provide strategic recommendations:

STUDENT PROFILE:
- Total active students: ${students?.length || 0}
- Top academic interests: ${[...new Set(studentInterests)].slice(0, 10).join(', ')}
- Target regions: ${[...new Set(regionInterests)].slice(0, 5).join(', ')}
- Curriculums: ${[...new Set(curriculums)].join(', ')}

CURRENT ECA DATABASE:
- Total opportunities: ${existingEcas?.length || 0}
- Types: ${[...new Set(ecaTypes)].join(', ')}
- Subject coverage: ${[...new Set(ecaSubjects)].slice(0, 15).join(', ')}

STUDENT SUCCESS DATA:
- Completed ECAs: ${successfulEcas.length}
- Types of successful activities: ${[...new Set(successfulEcas.map(e => e.eca_type))].join(', ')}

Provide strategic recommendations for:
1. Missing opportunity categories based on student interests
2. Underrepresented subjects or program types
3. Trending opportunities to add
4. Geographic gaps (opportunities in specific regions)
5. Prestige level balance recommendations`
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "analyze_gaps",
            description: "Analyze gaps in ECA database and provide recommendations",
            parameters: {
              type: "object",
              properties: {
                missing_categories: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      category: { type: "string" },
                      reason: { type: "string" },
                      priority: { type: "string", enum: ["high", "medium", "low"] },
                      example_opportunities: {
                        type: "array",
                        items: { type: "string" }
                      }
                    }
                  }
                },
                underrepresented_subjects: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      subject: { type: "string" },
                      current_count: { type: "number" },
                      student_demand: { type: "string" },
                      recommended_additions: { type: "number" }
                    }
                  }
                },
                trending_opportunities: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      type: { type: "string" },
                      relevance: { type: "string" }
                    }
                  }
                },
                geographic_gaps: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      region: { type: "string" },
                      gap_description: { type: "string" },
                      suggested_focus: { type: "string" }
                    }
                  }
                },
                overall_recommendations: {
                  type: "array",
                  items: { type: "string" }
                }
              },
              required: ["missing_categories", "overall_recommendations"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "analyze_gaps" } }
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall || toolCall.function?.name !== 'analyze_gaps') {
      throw new Error('Invalid AI response format');
    }

    const analysis = JSON.parse(toolCall.function.arguments);
    console.log('Analysis complete');

    return new Response(
      JSON.stringify({ success: true, analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-eca-gaps:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
