import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { subject, interests, gradeLevel } = await req.json();
    console.log('Discovering ECAs for:', { subject, interests, gradeLevel });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Create search query based on inputs
    const searchQuery = `extracurricular activities competitions programs for students interested in ${subject} ${interests} grade ${gradeLevel}`;
    console.log('Search query:', searchQuery);

    // Call Lovable AI to discover opportunities
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an expert at discovering extracurricular activities, competitions, and academic programs for students. 
            Find real, verifiable opportunities with actual websites. Focus on prestigious and well-known programs.`
          },
          {
            role: 'user',
            content: `Find 8-10 extracurricular opportunities (competitions, programs, summer schools, etc.) for students interested in: ${subject} ${interests ? `with focus on ${interests}` : ''} (Grade ${gradeLevel || '9-12'}).

Include a mix of:
- International competitions
- Research programs
- Summer programs
- Online courses
- Olympiads

For each opportunity, provide complete and accurate information including the website URL.`
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "discover_opportunities",
            description: "Return a list of discovered ECA opportunities",
            parameters: {
              type: "object",
              properties: {
                opportunities: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string", description: "Full name of the opportunity" },
                      type: { 
                        type: "string", 
                        enum: ["Competition", "Research Program", "Summer Program", "Olympiad", "Conference", "Workshop", "Internship", "Publication", "Online Course", "Leadership Program", "Other"]
                      },
                      subject_areas: {
                        type: "array",
                        items: { type: "string" },
                        description: "Subject areas"
                      },
                      prestige_level: {
                        type: "string",
                        enum: ["Local", "National", "International", "Tier 1 International", "Highly Selective"]
                      },
                      cost: { type: "string", description: "Cost information" },
                      time_commitment: { type: "string", description: "Time commitment" },
                      deadline_date: { type: "string", description: "Deadline in YYYY-MM-DD format if known" },
                      deadline_type: { 
                        type: "string", 
                        enum: ["annual", "rolling", "one-time"]
                      },
                      eligibility: { type: "string", description: "Eligibility requirements" },
                      best_for: {
                        type: "array",
                        items: { type: "string" },
                        description: "Who this is best for"
                      },
                      website: { type: "string", description: "Official website URL" },
                      internal_notes: { type: "string", description: "Key highlights and notes" }
                    },
                    required: ["name", "type", "subject_areas", "website"]
                  }
                }
              },
              required: ["opportunities"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "discover_opportunities" } }
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI response received');

    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function?.name !== 'discover_opportunities') {
      console.error('Invalid AI response format');
      throw new Error('Invalid AI response format');
    }

    const discoveredData = JSON.parse(toolCall.function.arguments);
    console.log('Discovered opportunities:', discoveredData.opportunities?.length || 0);

    return new Response(
      JSON.stringify({ success: true, opportunities: discoveredData.opportunities || [] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in discover-eca-opportunities:', error);
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
