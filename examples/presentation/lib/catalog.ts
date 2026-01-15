import { z } from "zod";
import { createCatalog, generateCatalogPrompt } from "@json-render/core";

// Slide component definitions for the MARPA presentation

export const slideCatalog = createCatalog({
  name: "MARPA Slide Components",
  components: {
    // Title/Intro Slide
    TitleSlide: {
      props: z.object({
        title: z.string().describe("Main slide title"),
        tag: z
          .string()
          .optional()
          .describe("Small tag above title (e.g., 'OVERVIEW')"),
        subtitle: z.string().optional().describe("Subtitle or supporting text"),
        bullets: z
          .array(z.string())
          .optional()
          .describe("List of bullet points"),
        footer: z.string().optional().describe("Footer text"),
        chapter: z.string().optional().describe("Chapter name for navigation"),
      }),
      description:
        "Title slide for section introductions. Use for opening slides, chapter headers, or key messaging slides.",
    },

    // Metrics/KPI Dashboard
    MetricsSlide: {
      props: z.object({
        title: z.string().describe("Slide title"),
        chapter: z.string().optional(),
        metrics: z
          .array(
            z.object({
              label: z.string().describe("Metric name"),
              value: z.string().describe("Metric value (e.g., '$17M', '95%')"),
              description: z.string().optional().describe("Additional context"),
              icon: z
                .enum([
                  "chart-line",
                  "percentage",
                  "building",
                  "trophy",
                  "dollar-sign",
                  "users",
                  "clock",
                ])
                .optional(),
              color: z.enum(["coral", "teal", "yellow", "navy"]).optional(),
              progress: z
                .number()
                .min(0)
                .max(100)
                .optional()
                .describe("Progress bar percentage"),
            }),
          )
          .describe("Array of metrics to display"),
      }),
      description:
        "Dashboard-style slide showing KPIs and metrics. Use for financial summaries, performance indicators, or key statistics.",
    },

    // Chart Slide
    ChartSlide: {
      props: z.object({
        title: z.string(),
        chapter: z.string().optional(),
        chartType: z
          .enum(["line", "bar", "doughnut", "pie"])
          .describe("Type of chart"),
        labels: z.array(z.string()).describe("X-axis labels or categories"),
        datasets: z
          .array(
            z.object({
              label: z.string().describe("Series name"),
              data: z.array(z.number()).describe("Data points"),
              color: z.string().describe("Color (hex or named)"),
            }),
          )
          .describe("Data series to plot"),
        insight: z
          .string()
          .optional()
          .describe("Key takeaway displayed below chart"),
        showLegend: z.boolean().optional(),
      }),
      description:
        "Chart slide for visualizing trends, comparisons, or distributions. Use for growth projections, breakdowns, or timeline data.",
    },

    // Comparison Slide
    ComparisonSlide: {
      props: z.object({
        title: z.string(),
        chapter: z.string().optional(),
        columns: z
          .array(
            z.object({
              title: z.string().describe("Column header"),
              subtitle: z.string().optional(),
              items: z
                .array(
                  z.object({
                    label: z.string(),
                    value: z.string(),
                  }),
                )
                .describe("Key-value pairs in column"),
              footer: z
                .string()
                .optional()
                .describe("Bottom text (e.g., 'Recommended')"),
            }),
          )
          .describe("Columns to compare"),
        highlight: z
          .number()
          .optional()
          .describe("Index of recommended/highlighted column"),
      }),
      description:
        "Side-by-side comparison of options or paths. Use for comparing ownership structures, pricing tiers, or decision options.",
    },

    // Table Slide
    TableSlide: {
      props: z.object({
        title: z.string(),
        chapter: z.string().optional(),
        headers: z.array(z.string()).describe("Column headers"),
        rows: z.array(z.array(z.string())).describe("Table rows"),
        highlightRow: z
          .number()
          .optional()
          .describe("Index of row to highlight"),
        caption: z.string().optional().describe("Table caption or note"),
      }),
      description:
        "Tabular data display. Use for schedules, breakdowns, or structured data.",
    },

    // Text/Content Slide
    TextSlide: {
      props: z.object({
        title: z.string(),
        chapter: z.string().optional(),
        content: z.string().describe("Main body text (supports markdown)"),
        highlight: z
          .string()
          .optional()
          .describe("Emphasized quote or callout"),
      }),
      description:
        "Text-focused slide for explanations, quotes, or narrative content.",
    },

    // Layout containers
    Row: {
      props: z.object({
        gap: z.number().optional().describe("Gap between children in pixels"),
        align: z.enum(["start", "center", "end", "stretch"]).optional(),
      }),
      hasChildren: true,
      description:
        "Horizontal layout container. Use to arrange components side-by-side.",
    },

    Column: {
      props: z.object({
        gap: z.number().optional(),
        align: z.enum(["start", "center", "end", "stretch"]).optional(),
      }),
      hasChildren: true,
      description: "Vertical layout container. Use to stack components.",
    },

    // Metric Card (for use inside layouts)
    MetricCard: {
      props: z.object({
        label: z.string(),
        value: z.string(),
        description: z.string().optional(),
        icon: z
          .enum([
            "chart-line",
            "percentage",
            "building",
            "trophy",
            "dollar-sign",
            "users",
            "clock",
          ])
          .optional(),
        color: z.enum(["coral", "teal", "yellow", "navy"]).optional(),
        progress: z.number().min(0).max(100).optional(),
      }),
      description:
        "Individual metric card component. Use inside Row/Column for custom layouts.",
    },
  },

  actions: {
    navigate: {
      params: z.object({
        slideId: z.string().describe("ID of slide to navigate to"),
      }),
      description: "Navigate to a specific slide",
    },
    nextSlide: {
      params: z.object({}),
      description: "Go to next slide",
    },
    previousSlide: {
      params: z.object({}),
      description: "Go to previous slide",
    },
    playAudio: {
      params: z.object({
        slideId: z.string().optional(),
      }),
      description: "Play audio narration for current or specified slide",
    },
  },
});

// Generate the system prompt from catalog
export const catalogPrompt = generateCatalogPrompt(slideCatalog);

// MARPA-specific context to append to the prompt
export const marpaContext = `
## MARPA Canonical Data

Always use these exact values when creating MARPA presentation slides:

### Company
- Name: MARPA Landscape Architecture
- Founded: 1974 (51 years)
- Specialty: High-end residential landscape design and construction

### Financials
- Enterprise Valuation: $17M
- EBITDA: $1.655M (16.7% margin)
- Revenue: $11.03M
- Win Rate: 95%
- Multiple: 10.3x
- Average Project: $728K
- Licensed Staff: 71% (5/7)
- Marketing Spend: $0 (100% referral-driven)

### Ownership Paths
**Path C (Design-Build) - RECOMMENDED:**
- Luke Sanzone: 52% (Principal & Owner)
- Bodie Hultin: 24% (Partner, Succession Lead)
- Pablo Banuelos: 24% (Partner, Construction Lead)

**Path A (Solo):**
- Luke: 51%, Bodie: 49%

### Timeline
- Vesting: 6% per year over 4 years (24% total per partner)
- Purchase Period: Years 3-10 (50% discount, 10% max annual price increase)
- Value Horizon: Year 11 ($20M+ revenue, $25M valuation target)

### Growth Projections
- Construction: 10% YoY (baseline $1.7M)
- Maintenance: 20% YoY (baseline $800K)

## Output Format

Generate UI trees using JSON patches in this format:
\`\`\`
{"op":"set","path":"/root","value":"slide-1"}
{"op":"set","path":"/elements/slide-1","value":{"key":"slide-1","type":"TitleSlide","props":{...}}}
\`\`\`

Each line is a separate JSON patch operation. Stream patches one at a time to build the UI incrementally.
`;

// Full prompt for AI
export const fullSystemPrompt = `${catalogPrompt}

${marpaContext}

## Personality

You are a friendly, conversational MARPA presentation agent. After generating a slide:
- Explain what you created and why
- Ask if the user wants to see related data
- Suggest logical next slides
- Offer to adjust the visualization

Be warm and helpful, like a knowledgeable colleague presenting.
`;
