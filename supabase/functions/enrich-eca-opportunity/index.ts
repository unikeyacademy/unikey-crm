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
    const { url } = await req.json();
    console.log('Enriching ECA opportunity from URL:', url);

    if (!url) {
      throw new Error('URL is required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Fetch the webpage content
    console.log('Fetching webpage content...');
    const webpageResponse = await fetch(url);
    const htmlContent = await webpageResponse.text();
    
    // Extract text content (simple extraction, removing most HTML)
    const textContent = htmlContent
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 15000); // Limit to avoid token limits

    console.log('Analyzing content with AI...');

    // Call Lovable AI to extract structured data
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
            content: `You are an expert at extracting information about extracurricular activities, competitions, and academic programs from website content. Extract all relevant details accurately.`
          },
          {
            role: 'user',
            content: `Analyze this webpage content and extract ECA opportunity information:

URL: ${url}

Content:
${textContent}

Extract as much information as possible about this opportunity.`
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "extract_eca_info",
            description: "Extract structured ECA opportunity information from webpage content",
            parameters: {
              type: "object",
              properties: {
                name: { type: "string", description: "Full name of the opportunity/competition/program" },
                type: { 
                  type: "string", 
                  description: "Type of opportunity",
                  enum: ["Competition", "Research Program", "Summer Program", "Olympiad", "Conference", "Workshop", "Internship", "Publication", "Online Course", "Leadership Program", "Other"]
                },
                subject_areas: {
                  type: "array",
                  items: { type: "string" },
                  description: "Subject areas (e.g., Mathematics, Physics, Computer Science, Biology, etc.)"
                },
                prestige_level: {
                  type: "string",
                  enum: ["Local", "National", "International", "Tier 1 International", "Highly Selective"],
                  description: "Prestige/recognition level"
                },
                cost: { type: "string", description: "Cost or fee information (e.g., 'Free', '$500', '$1000-2000')" },
                registration_fee: { type: "string", description: "Specific registration fee if different from cost" },
                time_commitment: { type: "string", description: "Time commitment (e.g., '2 weeks', '6 months', 'Weekend')" },
                deadline_date: { type: "string", description: "Deadline date in YYYY-MM-DD format if available" },
                deadline_type: { 
                  type: "string", 
                  enum: ["annual", "rolling", "one-time"],
                  description: "Type of deadline"
                },
                eligibility: { type: "string", description: "Eligibility requirements (grade level, age, qualifications)" },
                best_for: {
                  type: "array",
                  items: { type: "string" },
                  description: "Who this is best for (e.g., 'STEM students', 'Grade 9-12', 'Beginners')"
                },
                required_documents: {
                  type: "array",
                  items: { type: "string" },
                  description: "Required documents for application"
                },
                internal_notes: { type: "string", description: "Key highlights, application tips, or important notes about the opportunity" }
              },
              required: ["name", "type", "subject_areas"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "extract_eca_info" } }
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI response received:', JSON.stringify(aiData, null, 2));

    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function?.name !== 'extract_eca_info') {
      console.error('Invalid AI response format:', JSON.stringify(aiData));
      throw new Error('Invalid AI response format');
    }

    const extractedData = JSON.parse(toolCall.function.arguments);
    console.log('Extracted data:', extractedData);

    // Add the website URL to the extracted data
    const enrichedData = {
      ...extractedData,
      website: url
    };

    return new Response(
      JSON.stringify({ success: true, data: enrichedData }),
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
