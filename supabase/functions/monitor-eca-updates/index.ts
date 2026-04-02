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
    const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!PERPLEXITY_API_KEY) {
      throw new Error('PERPLEXITY_API_KEY not configured');
    }
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase environment variables not configured');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch all active opportunities with websites
    const { data: opportunities, error: fetchError } = await supabase
      .from('eca_opportunities')
      .select('*')
      .eq('is_active', true)
      .not('website', 'is', null)
      .limit(20);

    if (fetchError) {
      throw new Error(`Failed to fetch opportunities: ${fetchError.message}`);
    }

    console.log(`Monitoring ${opportunities?.length || 0} opportunities`);

    const updates = [];

    for (const opp of opportunities || []) {
      try {
        console.log(`Checking ${opp.name}...`);

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
                content: 'You are an expert at detecting changes in ECA opportunity information. Compare current web data with stored data and identify important updates. Always respond with valid JSON only.'
              },
              {
                role: 'user',
                content: `Check the current information for this ECA opportunity and compare with our stored data:

STORED DATA:
Name: ${opp.name}
Website: ${opp.website}
Deadline: ${opp.deadline_date || 'Not specified'}
Cost: ${opp.cost || 'Not specified'}
Eligibility: ${opp.eligibility || 'Not specified'}

Look up the website and identify any significant changes in deadlines, costs, or eligibility requirements.

Return a JSON object with:
- has_changes: boolean
- changes: array of { field: "deadline"|"cost"|"eligibility"|"other", old_value: string, new_value: string, description: string }
- recommended_updates: { deadline_date?: string (YYYY-MM-DD), cost?: string, eligibility?: string }`
              }
            ],
            search_domain_filter: [new URL(opp.website).hostname],
            search_recency_filter: 'month',
            response_format: {
              type: 'json_schema',
              json_schema: {
                name: 'eca_changes',
                schema: {
                  type: 'object',
                  properties: {
                    has_changes: { type: 'boolean' },
                    changes: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          field: { type: 'string' },
                          old_value: { type: 'string' },
                          new_value: { type: 'string' },
                          description: { type: 'string' }
                        }
                      }
                    },
                    recommended_updates: {
                      type: 'object',
                      properties: {
                        deadline_date: { type: 'string' },
                        cost: { type: 'string' },
                        eligibility: { type: 'string' }
                      }
                    }
                  },
                  required: ['has_changes']
                }
              }
            }
          })
        });

        if (!aiResponse.ok) {
          console.log(`Perplexity check failed for ${opp.name}: ${aiResponse.status}`);
          continue;
        }

        const aiData = await aiResponse.json();
        const content = aiData.choices?.[0]?.message?.content;

        if (content) {
          const changeData = JSON.parse(content);

          if (changeData.has_changes) {
            updates.push({
              id: opp.id,
              name: opp.name,
              website: opp.website,
              changes: changeData.changes || [],
              recommended_updates: changeData.recommended_updates || {},
              citations: aiData.citations || []
            });
          }
        }

      } catch (error) {
        console.error(`Error checking ${opp.name}:`, error);
      }
    }

    console.log(`Found ${updates.length} opportunities with changes`);

    return new Response(
      JSON.stringify({ success: true, updates }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in monitor-eca-updates:', error);
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
