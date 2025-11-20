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

    // Fetch all active opportunities with websites
    const { data: opportunities, error: fetchError } = await supabase
      .from('eca_opportunities')
      .select('*')
      .eq('is_active', true)
      .not('website', 'is', null)
      .limit(20); // Monitor 20 at a time to avoid timeouts

    if (fetchError) {
      throw new Error(`Failed to fetch opportunities: ${fetchError.message}`);
    }

    console.log(`Monitoring ${opportunities?.length || 0} opportunities`);

    const updates = [];

    for (const opp of opportunities || []) {
      try {
        console.log(`Checking ${opp.name}...`);

        // Fetch current webpage content
        const webpageResponse = await fetch(opp.website, { 
          headers: { 'User-Agent': 'Mozilla/5.0' },
          signal: AbortSignal.timeout(10000) // 10 second timeout
        });
        
        if (!webpageResponse.ok) {
          console.log(`Skipping ${opp.name} - website not accessible`);
          continue;
        }

        const htmlContent = await webpageResponse.text();
        const textContent = htmlContent
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 15000);

        // Use AI to detect changes
        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-pro',
            messages: [
              {
                role: 'system',
                content: 'You are an expert at detecting changes in ECA opportunity information. Compare current and stored data to identify important updates.'
              },
              {
                role: 'user',
                content: `Compare this ECA information:

STORED DATA:
Name: ${opp.name}
Deadline: ${opp.deadline_date || 'Not specified'}
Cost: ${opp.cost || 'Not specified'}
Eligibility: ${opp.eligibility || 'Not specified'}

CURRENT WEBPAGE:
${textContent}

Identify any significant changes in deadlines, costs, or eligibility requirements.`
              }
            ],
            tools: [{
              type: "function",
              function: {
                name: "detect_changes",
                description: "Detect changes in ECA opportunity details",
                parameters: {
                  type: "object",
                  properties: {
                    has_changes: { type: "boolean", description: "Whether significant changes were detected" },
                    changes: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          field: { type: "string", enum: ["deadline", "cost", "eligibility", "other"] },
                          old_value: { type: "string" },
                          new_value: { type: "string" },
                          description: { type: "string" }
                        }
                      }
                    },
                    recommended_updates: {
                      type: "object",
                      properties: {
                        deadline_date: { type: "string" },
                        cost: { type: "string" },
                        eligibility: { type: "string" }
                      }
                    }
                  },
                  required: ["has_changes"],
                  additionalProperties: false
                }
              }
            }],
            tool_choice: { type: "function", function: { name: "detect_changes" } }
          })
        });

        if (!aiResponse.ok) {
          console.log(`AI check failed for ${opp.name}`);
          continue;
        }

        const aiData = await aiResponse.json();
        const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
        
        if (toolCall && toolCall.function?.name === 'detect_changes') {
          const changeData = JSON.parse(toolCall.function.arguments);
          
          if (changeData.has_changes) {
            updates.push({
              id: opp.id,
              name: opp.name,
              website: opp.website,
              changes: changeData.changes || [],
              recommended_updates: changeData.recommended_updates || {}
            });
          }
        }

      } catch (error) {
        console.error(`Error checking ${opp.name}:`, error);
        // Continue to next opportunity
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
