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

    const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY');
    if (!PERPLEXITY_API_KEY) {
      throw new Error('PERPLEXITY_API_KEY not configured');
    }

    const searchPrompt = `Find 8-10 extracurricular opportunities (competitions, programs, summer schools, etc.) for students interested in: ${subject} ${interests ? `with focus on ${interests}` : ''} (Grade ${gradeLevel || '9-12'}).

Include a mix of:
- International competitions
- Research programs
- Summer programs
- Online courses
- Olympiads

For each opportunity, provide the following in valid JSON format:
- name: Full name of the opportunity
- type: One of "Competition", "Research Program", "Summer Program", "Olympiad", "Conference", "Workshop", "Internship", "Publication", "Online Course", "Leadership Program", "Other"
- subject_areas: Array of subject areas
- prestige_level: One of "Local", "National", "International", "Tier 1 International", "Highly Selective"
- cost: Cost information
- time_commitment: Time commitment
- deadline_date: Deadline in YYYY-MM-DD format if known
- deadline_type: One of "annual", "rolling", "one-time"
- eligibility: Eligibility requirements
- best_for: Array of who this is best for
- website: Official website URL
- internal_notes: Key highlights and notes

Return a JSON object with an "opportunities" array containing these objects.`;

    console.log('Calling Perplexity sonar-pro for discovery...');

    const aiResponse = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [
          {
            role: 'system',
            content: `You are an expert at discovering extracurricular activities, competitions, and academic programs for students. Find real, verifiable opportunities with actual websites. Focus on prestigious and well-known programs. Always respond with valid JSON only, no markdown.`
          },
          {
            role: 'user',
            content: searchPrompt
          }
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'eca_opportunities',
            schema: {
              type: 'object',
              properties: {
                opportunities: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      type: { type: 'string' },
                      subject_areas: { type: 'array', items: { type: 'string' } },
                      prestige_level: { type: 'string' },
                      cost: { type: 'string' },
                      time_commitment: { type: 'string' },
                      deadline_date: { type: 'string' },
                      deadline_type: { type: 'string' },
                      eligibility: { type: 'string' },
                      best_for: { type: 'array', items: { type: 'string' } },
                      website: { type: 'string' },
                      internal_notes: { type: 'string' }
                    },
                    required: ['name', 'type', 'subject_areas', 'website']
                  }
                }
              },
              required: ['opportunities']
            }
          }
        }
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Perplexity API error:', aiResponse.status, errorText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ success: false, error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ success: false, error: 'Perplexity API payment required. Please check your account.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      throw new Error(`Perplexity API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('Perplexity response received');

    const content = aiData.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('No content in Perplexity response');
    }

    const discoveredData = JSON.parse(content);
    const citations = aiData.citations || [];
    console.log('Discovered opportunities:', discoveredData.opportunities?.length || 0, 'with', citations.length, 'citations');

    return new Response(
      JSON.stringify({ 
        success: true, 
        opportunities: discoveredData.opportunities || [],
        citations 
      }),
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
