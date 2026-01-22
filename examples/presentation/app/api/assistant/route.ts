import { gateway, streamText, convertToModelMessages, generateId } from "ai";
import { z } from "zod";
import canonicalTruth from "@/lib/canonical-truth.json";
import { CANONICAL } from "@/lib/canonical";
import { PRESENTATION_SCRIPT } from "@/lib/presentation-script";
import { slides } from "@/lib/slides";
import { ASSISTANT_SYSTEM_PROMPT } from "@/lib/assistant-catalog";

// Exa API for web search
const EXA_API_KEY = process.env.EXA_API_KEY;

/**
 * Validate that CANONICAL data matches canonicalTruth
 * This ensures all assistant responses align with the single source of truth
 */
function validateCanonicalData(): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];

  // Validate valuation
  if (
    CANONICAL.valuation.enterpriseValue !==
    canonicalTruth.valuation.enterprise_value
  ) {
    warnings.push(
      `Valuation mismatch: ${CANONICAL.valuation.enterpriseValue} vs ${canonicalTruth.valuation.enterprise_value}`,
    );
  }

  // Validate ownership structure
  if (CANONICAL.ownership.structure !== canonicalTruth.ownership.structure) {
    warnings.push(
      `Ownership mismatch: ${CANONICAL.ownership.structure} vs ${canonicalTruth.ownership.structure}`,
    );
  }

  if (warnings.length > 0) {
    console.warn("[Canonical Validation]", warnings);
  }

  return { valid: warnings.length === 0, warnings };
}

// Validate canonical data on startup
validateCanonicalData();

/**
 * Search canonical data by path or keyword
 */
function searchCanonical(query: string): {
  found: boolean;
  results: Array<{ path: string; value: unknown; display?: string }>;
} {
  const results: Array<{ path: string; value: unknown; display?: string }> = [];
  const queryLower = query.toLowerCase();

  // Search mappings
  const searchMappings: Record<
    string,
    { path: string; value: unknown; display: string }
  > = {
    valuation: {
      path: "valuation.enterpriseValue",
      value: CANONICAL.valuation.enterpriseValue,
      display: "$17M",
    },
    "enterprise value": {
      path: "valuation.enterpriseValue",
      value: CANONICAL.valuation.enterpriseValue,
      display: "$17M",
    },
    $17m: {
      path: "valuation.enterpriseValue",
      value: CANONICAL.valuation.enterpriseValue,
      display: "$17M",
    },
    ebitda: {
      path: "financials.ebitda",
      value: CANONICAL.financials.ebitda.amount,
      display: "$1.655M",
    },
    multiple: {
      path: "financials.ebitdaMultiple",
      value: CANONICAL.financials.ebitdaMultiple.value,
      display: "10.3x",
    },
    revenue: {
      path: "financials.revenue2025",
      value: CANONICAL.financials.revenue2025.total,
      display: "$11.03M",
    },
    "win rate": {
      path: "performance.winRate",
      value: CANONICAL.performance.winRate.value,
      display: "95%",
    },
    ownership: {
      path: "ownership.structure",
      value: CANONICAL.ownership.structure,
      display: "52/24/24",
    },
    "52/24/24": {
      path: "ownership.structure",
      value: CANONICAL.ownership.structure,
      display: "52/24/24 (Luke/Bodie/Pablo)",
    },
    luke: {
      path: "ownership.partners.luke_sanzone",
      value: CANONICAL.ownership.partners.luke_sanzone,
      display: "52% - Principal & Owner",
    },
    bodie: {
      path: "ownership.partners.bodie_hultin",
      value: CANONICAL.ownership.partners.bodie_hultin,
      display: "24% - Partner, Operations",
    },
    pablo: {
      path: "ownership.partners.pablo_banuelos",
      value: CANONICAL.ownership.partners.pablo_banuelos,
      display: "24% - Partner, Construction",
    },
    vesting: {
      path: "transition.vestingSchedule",
      value: CANONICAL.transition.vestingSchedule,
      display: "6% annually over 4 years",
    },
    transition: {
      path: "transition",
      value: CANONICAL.transition,
      display: "4-year vesting period",
    },
    "solo path": {
      path: "soloPath",
      value: CANONICAL.soloPath,
      display: "51/49 (Luke/Bodie)",
    },
    "year 11": {
      path: "financials.year11Target",
      value: CANONICAL.financials.year11Target,
      display: "$20M+ revenue target",
    },
    growth: {
      path: "growthRates",
      value: CANONICAL.growthRates,
      display: "10% construction, 20% maintenance YoY",
    },
  };

  // Find matches
  for (const [keyword, data] of Object.entries(searchMappings)) {
    if (queryLower.includes(keyword)) {
      results.push(data);
    }
  }

  // If no specific match, return full canonical object for reference
  if (results.length === 0 && queryLower.length > 2) {
    // Return a summary
    results.push({
      path: "summary",
      value: {
        valuation: "$17M",
        ebitda: "$1.655M",
        multiple: "10.3x",
        revenue: "$11.03M",
        winRate: "95%",
        ownership: "52/24/24",
        vesting: "4 years",
      },
      display: "MARPA canonical data summary",
    });
  }

  return { found: results.length > 0, results };
}

/**
 * Search slides by keyword
 */
function searchSlides(query: string): Array<{
  id: number;
  title: string;
  chapter?: string;
  relevance: number;
  excerpt?: string;
}> {
  const queryLower = query.toLowerCase();
  const results: Array<{
    id: number;
    title: string;
    chapter?: string;
    relevance: number;
    excerpt?: string;
  }> = [];

  for (let i = 0; i < PRESENTATION_SCRIPT.length; i++) {
    const script = PRESENTATION_SCRIPT[i];
    const slide = slides[i];

    if (!script || !slide) continue;

    const titleMatch = slide.title.toLowerCase().includes(queryLower);
    const narrationMatch = script.narration.toLowerCase().includes(queryLower);
    const chapterMatch = slide.chapter?.toLowerCase().includes(queryLower);

    if (titleMatch || narrationMatch || chapterMatch) {
      let relevance = 0;
      if (titleMatch) relevance += 0.5;
      if (narrationMatch) relevance += 0.3;
      if (chapterMatch) relevance += 0.2;

      // Extract excerpt around match
      let excerpt: string | undefined;
      if (narrationMatch) {
        const idx = script.narration.toLowerCase().indexOf(queryLower);
        const start = Math.max(0, idx - 50);
        const end = Math.min(
          script.narration.length,
          idx + queryLower.length + 50,
        );
        excerpt = "..." + script.narration.slice(start, end) + "...";
      }

      results.push({
        id: i + 1,
        title: slide.title,
        chapter: slide.chapter,
        relevance,
        excerpt,
      });
    }
  }

  // Sort by relevance
  return results.sort((a, b) => b.relevance - a.relevance).slice(0, 5);
}

/**
 * Search web via Exa API
 */
async function searchWeb(query: string): Promise<
  Array<{
    title: string;
    url: string;
    snippet: string;
    score?: number;
  }>
> {
  if (!EXA_API_KEY) {
    return [
      {
        title: "Web search unavailable",
        url: "",
        snippet: "EXA_API_KEY not configured. Add it to your .env.local file.",
        score: 0,
      },
    ];
  }

  try {
    const response = await fetch("https://api.exa.ai/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": EXA_API_KEY,
      },
      body: JSON.stringify({
        query,
        numResults: 5,
        useAutoprompt: true,
        type: "neural",
      }),
    });

    if (!response.ok) {
      throw new Error(`Exa API error: ${response.status}`);
    }

    const data = await response.json();

    return (data.results || []).map(
      (r: { title?: string; url?: string; text?: string; score?: number }) => ({
        title: r.title || "Untitled",
        url: r.url || "",
        snippet: r.text?.slice(0, 200) || "",
        score: r.score,
      }),
    );
  } catch (error) {
    console.error("[Exa] Search error:", error);
    return [
      {
        title: "Web search error",
        url: "",
        snippet: String(error),
        score: 0,
      },
    ];
  }
}

export async function POST(req: Request) {
  const { messages, model } = await req.json();

  // Default to Gemini 3 Flash if no model specified
  const selectedModel = model || "gemini-3-flash";

  // Determine provider based on model
  const provider = selectedModel.startsWith("gemini") ? "google" : "anthropic";

  const modelMessages = await convertToModelMessages(messages);

  const result = streamText({
    model: gateway(`${provider}/${selectedModel}`),
    system: ASSISTANT_SYSTEM_PROMPT,
    messages: modelMessages,
    tools: {
      searchCanonical: {
        description:
          "Search MARPA canonical business data (valuation, ownership, financials, etc). Use this for any MARPA-specific numbers or facts.",
        inputSchema: z.object({
          query: z
            .string()
            .describe(
              "Search query for canonical data (e.g., 'valuation', 'ownership', 'ebitda')",
            ),
        }),
        execute: async ({ query }: { query: string }) => {
          const result = searchCanonical(query);
          return result;
        },
      },
      searchSlides: {
        description:
          "Search presentation slides by keyword. Returns matching slides with titles and excerpts.",
        inputSchema: z.object({
          query: z.string().describe("Search query for slide content"),
        }),
        execute: async ({ query }: { query: string }) => {
          const results = searchSlides(query);
          return { slides: results, query };
        },
      },
      searchWeb: {
        description:
          "Search the web for general information. Use for non-MARPA-specific questions about industry, market trends, or general business concepts.",
        inputSchema: z.object({
          query: z.string().describe("Web search query"),
        }),
        execute: async ({ query }: { query: string }) => {
          const results = await searchWeb(query);
          return { results, query };
        },
      },
    },
  });

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    generateMessageId: generateId,
  });
}
