/**
 * Q&A Assistant Component Catalog
 *
 * Uses @json-render/core createCatalog for proper AI integration.
 * All agent outputs must conform to this catalog for rendering.
 */

import { z } from "zod";
import { createCatalog, generateCatalogPrompt } from "@json-render/core";

// ============================================
// Component Definitions using createCatalog
// ============================================

export const assistantCatalog = createCatalog({
  name: "MARPA Q&A Assistant",
  components: {
    TextBlock: {
      description: "Text paragraph or heading for displaying content",
      props: z.object({
        content: z.string().describe("The text content to display"),
        variant: z
          .enum(["heading", "subheading", "body", "caption", "emphasis"])
          .default("body")
          .describe("Text style variant"),
      }),
    },
    Chart: {
      description:
        "Data visualization component for bar, line, pie, doughnut, area, or waterfall charts. USE THIS for visualizing MARPA financials, ownership splits, and comparisons.",
      props: z.object({
        type: z
          .enum(["bar", "line", "pie", "doughnut", "area", "waterfall"])
          .describe("Chart type"),
        labels: z.array(z.string()).describe("Labels for x-axis or segments"),
        datasets: z
          .array(
            z.object({
              label: z.string(),
              data: z.array(z.number()),
              backgroundColor: z.string().optional(),
              borderColor: z.string().optional(),
              fill: z.boolean().optional(),
            }),
          )
          .describe("Data series to plot"),
        title: z.string().optional().describe("Chart title"),
        height: z.number().optional().describe("Chart height in pixels"),
        showLegend: z.boolean().optional().describe("Show/hide legend"),
        showGrid: z.boolean().optional().describe("Show/hide grid lines"),
        positiveColor: z
          .string()
          .optional()
          .describe("Color for positive values (waterfall)"),
        negativeColor: z
          .string()
          .optional()
          .describe("Color for negative values (waterfall)"),
      }),
    },
    StatCard: {
      description:
        "Displays a single metric with label, value, and optional change indicator",
      props: z.object({
        label: z.string().describe("Metric label"),
        value: z.string().describe("Metric value"),
        change: z
          .string()
          .optional()
          .describe("Change indicator (e.g., '+5%')"),
        changeType: z
          .enum(["positive", "negative", "neutral"])
          .optional()
          .describe("Change direction for styling"),
        source: z.string().optional().describe("Data source attribution"),
      }),
    },
    DataTable: {
      description: "Structured data table with columns and rows",
      props: z.object({
        columns: z
          .array(
            z.object({
              key: z.string(),
              label: z.string(),
              align: z.enum(["left", "center", "right"]).optional(),
            }),
          )
          .describe("Column definitions"),
        rows: z.array(z.record(z.string(), z.string())).describe("Table rows"),
        caption: z.string().optional().describe("Table caption"),
      }),
    },
    List: {
      description: "Bullet, numbered, or check list",
      props: z.object({
        items: z.array(z.string()).describe("List items"),
        variant: z
          .enum(["bullet", "numbered", "check"])
          .default("bullet")
          .describe("List style"),
        title: z.string().optional().describe("List title"),
      }),
    },
    Citation: {
      description: "Reference card for citing sources",
      props: z.object({
        title: z.string().describe("Source title"),
        url: z.string().optional().describe("Source URL"),
        snippet: z.string().optional().describe("Relevant excerpt"),
        source: z.enum(["web", "slide", "canonical"]).describe("Source type"),
        slideId: z
          .number()
          .optional()
          .describe("Slide number if source is slide"),
      }),
    },
    SlideRef: {
      description: "Link to a specific presentation slide",
      props: z.object({
        slideId: z.number().describe("Slide number (1-indexed)"),
        title: z.string().describe("Slide title"),
        relevance: z.string().optional().describe("Why this slide is relevant"),
      }),
    },
    Comparison: {
      description: "Side-by-side comparison of multiple items",
      props: z.object({
        title: z.string().optional().describe("Comparison title"),
        items: z
          .array(
            z.object({
              label: z.string(),
              value: z.string(),
              highlight: z.boolean().optional(),
            }),
          )
          .describe("Items to compare"),
      }),
    },
    Alert: {
      description: "Callout box for important information",
      props: z.object({
        content: z.string().describe("Alert message"),
        variant: z
          .enum(["info", "warning", "success", "error"])
          .default("info")
          .describe("Alert style"),
        title: z.string().optional().describe("Alert title"),
      }),
    },
    Divider: {
      description: "Horizontal divider line",
      props: z.object({}),
    },
    Container: {
      description: "Groups child components with layout control",
      hasChildren: true,
      props: z.object({
        layout: z
          .enum(["vertical", "horizontal", "grid"])
          .default("vertical")
          .describe("Layout direction"),
        gap: z
          .enum(["small", "medium", "large"])
          .default("medium")
          .describe("Spacing between children"),
      }),
    },
  },
});

// ============================================
// Generate Base Prompt from Catalog
// ============================================

const catalogPrompt = generateCatalogPrompt(assistantCatalog);

// ============================================
// MARPA-Specific System Prompt
// ============================================

export const ASSISTANT_SYSTEM_PROMPT = `You are the MARPA Q&A Assistant. You help answer questions about MARPA's ownership transition, financials, and business.

${catalogPrompt}

## CRITICAL OUTPUT FORMAT

You MUST output JSONL (JSON Lines) format where each line is a patch operation:
{"op":"set","path":"/root","value":"container-1"}
{"op":"set","path":"/elements/container-1","value":{"key":"container-1","type":"Container","props":{"layout":"vertical","gap":"medium"},"children":["text-1","chart-1"]}}
{"op":"set","path":"/elements/text-1","value":{"key":"text-1","type":"TextBlock","props":{"content":"Here is the data...","variant":"body"}}}
{"op":"set","path":"/elements/chart-1","value":{"key":"chart-1","type":"Chart","props":{...}}}

## RULES

1. **Always use canonical data for MARPA values** - Never make up or estimate MARPA-specific numbers.

2. **Output JSONL patches** - Each line must be a valid JSON object with "op", "path", and "value" keys. Do NOT output markdown or plain text.

3. **Cite your sources** - Include Citation components for web results and SlideRef for slide references.

4. **Use Charts for data visualization** - When asked about financials, ownership splits, projections, or comparisons, USE CHART COMPONENTS.

5. **Be concise** - Keep text blocks short. Use structured components (Chart, StatCard, DataTable, List) for data.

## MARPA Chart Examples (use these exact values)

### Ownership Doughnut (Path C - Design-Build):
{"op":"set","path":"/elements/chart-1","value":{"key":"chart-1","type":"Chart","props":{"type":"doughnut","labels":["Luke (52%)","Bodie (24%)","Pablo (24%)"],"datasets":[{"label":"Equity","data":[52,24,24],"backgroundColor":["#2ECC71","#3498DB","#E67E22"]}],"title":"Design-Build Ownership (52/24/24)","showLegend":true}}}

### Revenue Breakdown Bar:
{"op":"set","path":"/elements/chart-1","value":{"key":"chart-1","type":"Chart","props":{"type":"bar","labels":["Construction","Design","Oversight"],"datasets":[{"label":"Revenue ($M)","data":[9.6,0.805,0.614],"backgroundColor":["#ef6337","#4ECDC4","#FFE66D"]}],"title":"2025 Revenue Breakdown ($11.03M)","showLegend":false}}}

### Vesting Schedule Line:
{"op":"set","path":"/elements/chart-1","value":{"key":"chart-1","type":"Chart","props":{"type":"line","labels":["Year 1","Year 2","Year 3","Year 4"],"datasets":[{"label":"Cumulative Vesting %","data":[6,12,18,24],"borderColor":"#4ECDC4","fill":false}],"title":"4-Year Vesting Schedule","showGrid":true}}}

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

## Example Complete Response

User: "What is the ownership structure?"

Output:
{"op":"set","path":"/root","value":"container-1"}
{"op":"set","path":"/elements/container-1","value":{"key":"container-1","type":"Container","props":{"layout":"vertical","gap":"medium"},"children":["text-1","chart-1","text-2"]}}
{"op":"set","path":"/elements/text-1","value":{"key":"text-1","type":"TextBlock","props":{"content":"MARPA Ownership Structure (Path C - Design-Build)","variant":"heading"}}}
{"op":"set","path":"/elements/chart-1","value":{"key":"chart-1","type":"Chart","props":{"type":"doughnut","labels":["Luke (52%)","Bodie (24%)","Pablo (24%)"],"datasets":[{"label":"Equity %","data":[52,24,24],"backgroundColor":["#2ECC71","#3498DB","#E67E22"]}],"title":"52/24/24 Split","height":300,"showLegend":true}}}
{"op":"set","path":"/elements/text-2","value":{"key":"text-2","type":"TextBlock","props":{"content":"Luke holds majority stake as Principal & Owner. Bodie and Pablo each hold 24% as Partners.","variant":"body"}}}`;

// ============================================
// Legacy Types for Backwards Compatibility
// ============================================

export type AssistantComponent = z.infer<typeof assistantCatalog.elementSchema>;
export type AssistantResponse = z.infer<typeof assistantCatalog.treeSchema>;

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
