/**
 * Q&A Assistant Component Catalog
 *
 * Defines the JSON schema for AI assistant responses.
 * All agent outputs must conform to this catalog for rendering.
 */

import { z } from "zod";

// ============================================
// Component Schemas
// ============================================

/**
 * Text block - simple paragraph or heading
 */
export const TextBlockSchema = z.object({
  type: z.literal("TextBlock"),
  props: z.object({
    content: z.string(),
    variant: z
      .enum(["heading", "subheading", "body", "caption", "emphasis"])
      .default("body"),
  }),
});

/**
 * Stat card - displays a metric with label
 */
export const StatCardSchema = z.object({
  type: z.literal("StatCard"),
  props: z.object({
    label: z.string(),
    value: z.string(),
    change: z.string().optional(),
    changeType: z.enum(["positive", "negative", "neutral"]).optional(),
    source: z.string().optional(),
  }),
});

/**
 * Data table - structured data display
 */
export const DataTableSchema = z.object({
  type: z.literal("DataTable"),
  props: z.object({
    columns: z.array(
      z.object({
        key: z.string(),
        label: z.string(),
        align: z.enum(["left", "center", "right"]).optional(),
      }),
    ),
    rows: z.array(z.record(z.string(), z.string())),
    caption: z.string().optional(),
  }),
});

/**
 * List - bullet or numbered list
 */
export const ListSchema = z.object({
  type: z.literal("List"),
  props: z.object({
    items: z.array(z.string()),
    variant: z.enum(["bullet", "numbered", "check"]).default("bullet"),
    title: z.string().optional(),
  }),
});

/**
 * Citation card - reference to a source
 */
export const CitationSchema = z.object({
  type: z.literal("Citation"),
  props: z.object({
    title: z.string(),
    url: z.string().optional(),
    snippet: z.string().optional(),
    source: z.enum(["web", "slide", "canonical"]),
    slideId: z.number().optional(),
  }),
});

/**
 * Slide reference - link to a specific slide
 */
export const SlideRefSchema = z.object({
  type: z.literal("SlideRef"),
  props: z.object({
    slideId: z.number(),
    title: z.string(),
    relevance: z.string().optional(),
  }),
});

/**
 * Comparison card - compare two values/options
 */
export const ComparisonSchema = z.object({
  type: z.literal("Comparison"),
  props: z.object({
    title: z.string().optional(),
    items: z.array(
      z.object({
        label: z.string(),
        value: z.string(),
        highlight: z.boolean().optional(),
      }),
    ),
  }),
});

/**
 * Alert/callout box
 */
export const AlertSchema = z.object({
  type: z.literal("Alert"),
  props: z.object({
    content: z.string(),
    variant: z.enum(["info", "warning", "success", "error"]).default("info"),
    title: z.string().optional(),
  }),
});

/**
 * Divider
 */
export const DividerSchema = z.object({
  type: z.literal("Divider"),
  props: z.object({}).optional(),
});

/**
 * Container - groups other components
 */
export const ContainerSchema = z.object({
  type: z.literal("Container"),
  props: z.object({
    layout: z.enum(["vertical", "horizontal", "grid"]).default("vertical"),
    gap: z.enum(["small", "medium", "large"]).default("medium"),
  }),
  children: z.array(z.string()), // Keys of child elements
});

// ============================================
// Union of all component types
// ============================================

export const AssistantComponentSchema = z.discriminatedUnion("type", [
  TextBlockSchema,
  StatCardSchema,
  DataTableSchema,
  ListSchema,
  CitationSchema,
  SlideRefSchema,
  ComparisonSchema,
  AlertSchema,
  DividerSchema,
  ContainerSchema,
]);

export type AssistantComponent = z.infer<typeof AssistantComponentSchema>;

// ============================================
// Response Schema (UITree format)
// ============================================

export const AssistantResponseSchema = z.object({
  root: z.string(),
  elements: z.record(
    z.string(),
    z.object({
      key: z.string(),
      type: z.string(),
      props: z.record(z.string(), z.any()),
      children: z.array(z.string()).optional(),
    }),
  ),
});

export type AssistantResponse = z.infer<typeof AssistantResponseSchema>;

// ============================================
// Tool Schemas for AI Agent
// ============================================

export const SearchCanonicalResultSchema = z.object({
  found: z.boolean(),
  path: z.string(),
  value: z.any(),
  display: z.string().optional(),
  context: z.string().optional(),
});

export const SearchSlidesResultSchema = z.object({
  slides: z.array(
    z.object({
      id: z.number(),
      title: z.string(),
      chapter: z.string().optional(),
      relevance: z.number(), // 0-1 score
      excerpt: z.string().optional(),
    }),
  ),
});

export const SearchWebResultSchema = z.object({
  results: z.array(
    z.object({
      title: z.string(),
      url: z.string(),
      snippet: z.string(),
      score: z.number().optional(),
    }),
  ),
  query: z.string(),
});

// ============================================
// System Prompt for AI Agent
// ============================================

export const ASSISTANT_SYSTEM_PROMPT = `You are the MARPA Q&A Assistant. You help answer questions about MARPA's ownership transition, financials, and business.

## CRITICAL RULES

1. **Always use canonical data for MARPA values** - Never make up or estimate MARPA-specific numbers. Use the searchCanonical tool.

2. **Output JSON for UI rendering** - Your response MUST be valid JSON matching the UITree schema. Do not output markdown or plain text.

3. **Cite your sources** - Include Citation components for web results and SlideRef components for slide references.

4. **Be concise** - Keep text blocks short and use structured components (StatCard, DataTable, List) to present data clearly.

## Response Format

Your response must be a JSON object with this structure:
{
  "root": "container-1",
  "elements": {
    "container-1": {
      "key": "container-1",
      "type": "Container",
      "props": { "layout": "vertical", "gap": "medium" },
      "children": ["text-1", "stat-1", ...]
    },
    "text-1": {
      "key": "text-1",
      "type": "TextBlock",
      "props": { "content": "...", "variant": "body" }
    },
    ...
  }
}

## Available Components

- TextBlock: { content: string, variant: "heading"|"subheading"|"body"|"caption"|"emphasis" }
- StatCard: { label: string, value: string, change?: string, changeType?: "positive"|"negative"|"neutral", source?: string }
- DataTable: { columns: [{key, label, align?}], rows: [{...}], caption?: string }
- List: { items: string[], variant: "bullet"|"numbered"|"check", title?: string }
- Citation: { title: string, url?: string, snippet?: string, source: "web"|"slide"|"canonical", slideId?: number }
- SlideRef: { slideId: number, title: string, relevance?: string }
- Comparison: { title?: string, items: [{label, value, highlight?}] }
- Alert: { content: string, variant: "info"|"warning"|"success"|"error", title?: string }
- Divider: {}
- Container: { layout: "vertical"|"horizontal"|"grid", gap: "small"|"medium"|"large", children: [...] }

## Canonical Data Values (DO NOT CHANGE)

- Enterprise Valuation: $17M
- EBITDA: $1.655M
- EBITDA Multiple: 10.3x
- Revenue 2025: $11.03M
- Win Rate: 95%
- Ownership (Path C): 52/24/24 (Luke/Bodie/Pablo)
- Ownership (Solo): 51/49 (Luke/Bodie)
- Vesting Period: 4 years
- Annual Vesting: 6%

## Tools Available

1. searchCanonical(query) - Search MARPA canonical data
2. searchSlides(query) - Search slide content and titles
3. searchWeb(query) - Search the web via Exa API

Always search before answering MARPA-specific questions.`;

// ============================================
// Helper to build simple responses
// ============================================

export function buildResponse(
  components: Array<{
    key: string;
    type: string;
    props: Record<string, unknown>;
    children?: string[];
  }>,
): AssistantResponse {
  const root = components[0]?.key || "root";
  const elements: AssistantResponse["elements"] = {};

  for (const comp of components) {
    elements[comp.key] = {
      key: comp.key,
      type: comp.type,
      props: comp.props,
      children: comp.children,
    };
  }

  return { root, elements };
}
