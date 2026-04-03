import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function callPerplexity(apiKey: string, model: string, systemPrompt: string, userPrompt: string, jsonSchema?: any) {
  const body: any = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    search_recency_filter: 'year',
  };

  if (jsonSchema) {
    body.response_format = {
      type: 'json_schema',
      json_schema: jsonSchema,
    };
  }

  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Perplexity API error:', response.status, errorText);
    if (response.status === 429) {
      throw { status: 429, message: 'Rate limit exceeded. Please try again later.' };
    }
    if (response.status === 402) {
      throw { status: 402, message: 'Perplexity API payment required. Please check your account.' };
    }
    throw new Error(`Perplexity API error: ${response.status}`);
  }

  const data = await response.json();
  return {
    content: data.choices?.[0]?.message?.content,
    citations: data.citations || [],
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY');
    if (!PERPLEXITY_API_KEY) {
      throw new Error('PERPLEXITY_API_KEY not configured');
    }

    const body = await req.json();

    // --- VERIFICATION PASS ---
    if (body.action === 'verify') {
      console.log('Running verification pass on', body.opportunities?.length, 'opportunities');
      const opportunities = body.opportunities || [];

      const verificationPrompt = `Verify the following extracurricular opportunities. For each one, check:
1. Is the programme/competition still active and running?
2. Is the website URL correct and accessible?
3. Are the deadlines roughly accurate (within the current or next cycle)?
4. Are the eligibility requirements correct?

Opportunities to verify:
${opportunities.map((o: any, i: number) => `${i + 1}. "${o.name}" - Website: ${o.website || 'unknown'} - Deadline: ${o.deadline_date || 'unknown'}`).join('\n')}

For each opportunity, return:
- index: the 0-based index
- status: "verified" if everything checks out, "flagged" if something seems wrong or outdated
- notes: brief explanation of what you found

Return a JSON object with a "results" array.`;

      const verifyResult = await callPerplexity(
        PERPLEXITY_API_KEY,
        'sonar',
        'You are a fact-checker verifying extracurricular opportunities for students. Check that programmes are real, active, and have correct details. Be strict — flag anything uncertain. Respond with valid JSON only.',
        verificationPrompt,
        {
          name: 'verification_results',
          schema: {
            type: 'object',
            properties: {
              results: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    index: { type: 'number' },
                    status: { type: 'string' },
                    notes: { type: 'string' },
                  },
                  required: ['index', 'status', 'notes'],
                },
              },
            },
            required: ['results'],
          },
        }
      );

      const verifyData = JSON.parse(verifyResult.content);
      const enrichedOpps = opportunities.map((opp: any, i: number) => {
        const result = verifyData.results?.find((r: any) => r.index === i);
        return {
          ...opp,
          verification_status: result?.status || 'unverified',
          verification_notes: result?.notes || '',
        };
      });

      return new Response(
        JSON.stringify({ success: true, opportunities: enrichedOpps }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // --- DISCOVERY PASS ---
    const { subject, interests, gradeLevel, studentAge, schoolLocation, preferredLocations, selectedCategories, additionalRequirements } = body;
    console.log('Discovering ECAs for:', { subject, interests, gradeLevel, studentAge, schoolLocation, preferredLocations, selectedCategories });

    const profileParts: string[] = [];
    if (studentAge) profileParts.push(`The student is ${studentAge} years old.`);
    if (gradeLevel) profileParts.push(`Grade level: ${gradeLevel}.`);
    if (schoolLocation) {
      profileParts.push(`The student currently studies at a ${schoolLocation}.`);
      if (schoolLocation.toLowerCase().includes('uk boarding')) {
        profileParts.push(`Because the student is at a UK boarding school, include UK-based opportunities they can access locally (e.g. university outreach programmes, regional competitions, school-based research schemes, and programmes that prioritise UK-resident students).`);
      }
    }
    if (preferredLocations && preferredLocations.length > 0) {
      profileParts.push(`Preferred programme locations: ${preferredLocations.join(', ')}. Prioritise opportunities available in or accessible from these locations.`);
    }
    if (additionalRequirements) {
      profileParts.push(`Additional requirements from the consultant: ${additionalRequirements}`);
    }

    const studentProfile = profileParts.length > 0 ? `\n\nStudent Profile:\n${profileParts.join('\n')}` : '';

    const categoryFilter = selectedCategories && selectedCategories.length > 0
      ? `\n\nFocus specifically on these opportunity types: ${selectedCategories.join(', ')}. Find at least 2 opportunities per selected category.`
      : `\n\nInclude a mix of: International competitions, Research programs, Summer programs, Online courses, Olympiads, Leadership programs.`;

    const searchPrompt = `Find 10-12 extracurricular opportunities for students interested in: ${subject} ${interests ? `with focus on ${interests}` : ''}.${studentProfile}${categoryFilter}

IMPORTANT:
- Only include opportunities the student is actually eligible for based on their age${schoolLocation ? ', school location' : ''} and profile.
- If an opportunity has age restrictions, verify the student meets them.
- Prioritise well-known, prestigious, and verifiable programmes with real websites.
- Include a range of selectivity levels from accessible to highly competitive.

For each opportunity, provide the following in valid JSON format:
- name: Full name of the opportunity
- type: One of "Competition", "Research Program", "Summer Program", "Olympiad", "Conference", "Workshop", "Internship", "Publication", "Online Course", "Leadership Program", "Other"
- subject_areas: Array of subject areas
- prestige_level: One of "Local", "National", "International", "Tier 1 International", "Highly Selective"
- cost: Cost information
- time_commitment: Time commitment
- deadline_date: Deadline in YYYY-MM-DD format if known
- deadline_type: One of "annual", "rolling", "one-time"
- eligibility: Eligibility requirements including age range and location restrictions
- best_for: Array of who this is best for
- website: Official website URL
- internal_notes: Key highlights and why this suits the student's specific profile

Return a JSON object with an "opportunities" array containing these objects.`;

    console.log('Calling Perplexity sonar-reasoning-pro for deep discovery...');

    const discoveryResult = await callPerplexity(
      PERPLEXITY_API_KEY,
      'sonar-reasoning-pro',
      `You are an expert at discovering extracurricular activities, competitions, and academic programs for students. Find real, verifiable opportunities with actual websites. Focus on prestigious and well-known programs. Pay close attention to the student's age, school location, and preferred programme locations to ensure all suggestions are genuinely accessible and eligible for them. Always respond with valid JSON only, no markdown.`,
      searchPrompt,
      {
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
                  internal_notes: { type: 'string' },
                },
                required: ['name', 'type', 'subject_areas', 'website'],
              },
            },
          },
          required: ['opportunities'],
        },
      }
    );

    const discoveredData = JSON.parse(discoveryResult.content);
    console.log('Discovered opportunities:', discoveredData.opportunities?.length || 0, 'with', discoveryResult.citations.length, 'citations');

    return new Response(
      JSON.stringify({
        success: true,
        opportunities: discoveredData.opportunities || [],
        citations: discoveryResult.citations,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in discover-eca-opportunities:', error);
    const status = error?.status || 500;
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : error?.message || 'Unknown error',
      }),
      {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
