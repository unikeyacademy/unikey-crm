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
    const { url } = await req.json();
    console.log('Enriching ECA opportunity from URL:', url);

    if (!url) {
      throw new Error('URL is required');
    }

    const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY');
    if (!PERPLEXITY_API_KEY) {
      throw new Error('PERPLEXITY_API_KEY not configured');
    }

    console.log('Calling Perplexity sonar for enrichment...');

    const aiResponse = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: `You are an expert at extracting information about extracurricular activities, competitions, and academic programs. Extract all relevant details accurately from the given URL. Always respond with valid JSON only, no markdown.`
          },
          {
            role: 'user',
            content: `Look up this URL and extract detailed ECA opportunity information: ${url}

Return a JSON object with these fields:
- name: Full name of the opportunity/competition/program
- type: One of "Competition", "Research Program", "Summer Program", "Olympiad", "Conference", "Workshop", "Internship", "Publication", "Online Course", "Leadership Program", "Other"
- subject_areas: Array of subject areas (e.g., Mathematics, Physics, Computer Science)
- prestige_level: One of "Local", "National", "International", "Tier 1 International", "Highly Selective"
- cost: Cost or fee information (e.g., "Free", "$500")
- registration_fee: Specific registration fee if different from cost
- time_commitment: Time commitment (e.g., "2 weeks", "6 months")
- deadline_date: Deadline date in YYYY-MM-DD format if available
- deadline_type: One of "annual", "rolling", "one-time"
- eligibility: Eligibility requirements
- best_for: Array of who this is best for
- required_documents: Array of required documents for application
- internal_notes: Key highlights, application tips, or important notes`
          }
        ],
        search_domain_filter: [new URL(url).hostname],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'eca_info',
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                type: { type: 'string' },
                subject_areas: { type: 'array', items: { type: 'string' } },
                prestige_level: { type: 'string' },
                cost: { type: 'string' },
                registration_fee: { type: 'string' },
                time_commitment: { type: 'string' },
                deadline_date: { type: 'string' },
                deadline_type: { type: 'string' },
                eligibility: { type: 'string' },
                best_for: { type: 'array', items: { type: 'string' } },
                required_documents: { type: 'array', items: { type: 'string' } },
                internal_notes: { type: 'string' }
              },
              required: ['name', 'type', 'subject_areas']
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
      throw new Error(`Perplexity API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('No content in Perplexity response');
    }

    const extractedData = JSON.parse(content);
    console.log('Extracted data:', extractedData);

    const enrichedData = {
      ...extractedData,
      website: url
    };

    return new Response(
      JSON.stringify({ success: true, data: enrichedData, citations: aiData.citations || [] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in enrich-eca-opportunity:', error);
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
