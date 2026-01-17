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
 * Chart dataset for data visualizations
 */
export const ChartDatasetSchema = z.object({
  label: z.string(),
  data: z.array(z.number()),
  backgroundColor: z.string().optional(),
  borderColor: z.string().optional(),
  fill: z.boolean().optional(),
});

/**
 * Chart - data visualization component (bar, line, pie, doughnut, area, waterfall)
 */
export const ChartSchema = z.object({
  type: z.literal("Chart"),
  props: z.object({
    type: z.enum(["bar", "line", "pie", "doughnut", "area", "waterfall"]),
    labels: z.array(z.string()),
    datasets: z.array(ChartDatasetSchema),
    title: z.string().optional(),
    height: z.number().optional(),
    showLegend: z.boolean().optional(),
    showGrid: z.boolean().optional(),
    positiveColor: z.string().optional(),
    negativeColor: z.string().optional(),
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
  ChartSchema,
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

4. **Use Charts for data visualization** - When asked about financials, ownership splits, projections, or comparisons, USE CHART COMPONENTS to visualize the data. Charts are rendered in real-time using Chart.js.

5. **Be concise** - Keep text blocks short and use structured components (Chart, StatCard, DataTable, List) to present data clearly.

## Response Format

Your response must be a JSON object with this structure:
{
  "root": "container-1",
  "elements": {
    "container-1": {
      "key": "container-1",
      "type": "Container",
      "props": { "layout": "vertical", "gap": "medium" },
      "children": ["text-1", "chart-1", ...]
    },
    "chart-1": {
      "key": "chart-1",
      "type": "Chart",
      "props": {
        "type": "doughnut",
        "title": "Ownership Split (52/24/24)",
        "labels": ["Luke", "Bodie", "Pablo"],
        "datasets": [{ "label": "Equity %", "data": [52, 24, 24], "backgroundColor": ["#2ECC71", "#3498DB", "#E67E22"] }],
        "height": 300,
        "showLegend": true
      }
    },
    ...
  }
}

## Available Components

### Data Visualization
- **Chart**: { type: "bar"|"line"|"pie"|"doughnut"|"area"|"waterfall", labels: string[], datasets: [{label, data: number[], backgroundColor?, borderColor?, fill?}], title?, height?, showLegend?, showGrid?, positiveColor?, negativeColor? }

### Content
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

## MARPA Chart Examples (use these exact values)

### Ownership Doughnut (Path C - Design-Build):
{ "type": "doughnut", "labels": ["Luke (52%)", "Bodie (24%)", "Pablo (24%)"], "datasets": [{ "label": "Equity", "data": [52, 24, 24], "backgroundColor": ["#2ECC71", "#3498DB", "#E67E22"] }], "title": "Design-Build Ownership (52/24/24)", "showLegend": true }

### Ownership Doughnut (Solo Path):
{ "type": "doughnut", "labels": ["Luke (51%)", "Bodie (49%)"], "datasets": [{ "label": "Equity", "data": [51, 49], "backgroundColor": ["#2ECC71", "#3498DB"] }], "title": "Solo Path Ownership (51/49)", "showLegend": true }

### Revenue Breakdown Bar:
{ "type": "bar", "labels": ["Construction", "Design", "Oversight"], "datasets": [{ "label": "Revenue ($M)", "data": [9.6, 0.805, 0.614], "backgroundColor": ["#ef6337", "#4ECDC4", "#FFE66D"] }], "title": "2025 Revenue Breakdown ($11.03M)", "showLegend": false }

### Vesting Schedule Line:
{ "type": "line", "labels": ["Year 1", "Year 2", "Year 3", "Year 4"], "datasets": [{ "label": "Cumulative Vesting %", "data": [6, 12, 18, 24], "borderColor": "#4ECDC4", "fill": false }], "title": "4-Year Vesting Schedule", "showGrid": true }

## Canonical Data Values (DO NOT CHANGE)

- Enterprise Valuation: $17M
- EBITDA: $1.655M
- EBITDA Multiple: 10.3x
- Revenue 2025: $11.03M (Construction: $9.6M, Design: $805K, Oversight: $614K)
- Win Rate: 95%
- Ownership (Path C): 52/24/24 (Luke/Bodie/Pablo)
- Ownership (Solo): 51/49 (Luke/Bodie)
- Vesting Period: 4 years (6% annually)
- Luke: Principal & Owner (52% in Path C, 51% in Solo)
- Bodie: Partner, Operations (24% in Path C, 49% in Solo)
- Pablo: Partner, Construction (24% in Path C)

## Tools Available

1. searchCanonical(query) - Search MARPA canonical data
2. searchSlides(query) - Search slide content and titles
3. searchWeb(query) - Search the web via Exa API

Always search before answering MARPA-specific questions. When visualizing data, prefer Charts over tables for numerical comparisons.`;

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
