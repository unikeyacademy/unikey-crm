

## How AI ECA Discovery Currently Works

You have **two separate AI-powered ECA features**, both using the Lovable AI Gateway (Gemini 2.5 Flash):

### 1. ECA Discovery Page (`/eca-discovery`)
- **Function**: `discover-eca-opportunities`
- **How it works**: You enter a subject, interests, and grade level. The AI generates 8-10 ECA opportunities purely from its training data (no live web search). Results include name, type, prestige level, eligibility, cost, deadlines, and website URLs.
- **Limitation**: The AI is generating opportunities from memory — it does not search the internet. URLs may be outdated or hallucinated. No real-time data.

### 2. Student-Specific Suggestions (from student profile)
- **Function**: `suggest-ecas`
- **How it works**: Two stages:
  - **Stage 1**: Matches the student's profile against your existing `eca_opportunities` database table and ranks the best fits.
  - **Stage 2**: If fewer than 3 database matches are found, the AI generates additional opportunities from its training data (again, no live search).
- **Same limitation**: Stage 2 also relies on AI memory, not real-time web data.

### The Core Problem
Both functions ask an LLM to "find opportunities" — but LLMs don't search the web. They recall training data, which can be stale or inaccurate. This is why results may feel generic or have broken links.

---

## How Perplexity Would Help

**Perplexity is the ideal integration here.** Unlike a standard LLM, Perplexity performs real-time web search and returns grounded, cited results. This would dramatically improve discovery quality.

Perplexity is already available as a connector — no custom API key setup needed. You just connect it.

### Proposed Integration Plan

**Upgrade `discover-eca-opportunities` to use Perplexity for real-time search:**

1. **Connect Perplexity** via the connector system (one click).
2. **Replace the Gemini AI call** in `discover-eca-opportunities/index.ts` with a Perplexity `sonar-pro` call that performs actual web search for ECA opportunities.
3. **Use structured output** from Perplexity to get results in the same schema (name, type, subject areas, website, eligibility, etc.).
4. **Keep Gemini as a fallback** for structuring/ranking if Perplexity returns raw results that need post-processing.
5. **Optionally upgrade Stage 2 of `suggest-ecas`** to also use Perplexity for the AI-generated suggestions, so student-specific gap-filling is also grounded in real data.

### What About Claude?
Claude (Anthropic) is a standard LLM like Gemini — it doesn't do live web search. It would not improve result freshness or accuracy for discovery. Perplexity is the right tool for this use case because it combines search + AI.

### Technical Changes

**File: `supabase/functions/discover-eca-opportunities/index.ts`**
- Add Perplexity API call using `PERPLEXITY_API_KEY` from connector
- Use `sonar-pro` model with search for real-time ECA discovery
- Use `search_recency_filter` to get recent/current opportunities
- Then pass Perplexity results through Gemini with tool calling to structure into the existing schema
- Keep existing error handling and CORS

**File: `supabase/functions/suggest-ecas/index.ts`**
- Optionally replace Stage 2 AI discovery with Perplexity-powered search
- Stage 1 (database matching) remains unchanged

**No UI changes needed** — the response format stays the same.

