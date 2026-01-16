import { z } from "zod";
import type { ComponentDefinition } from "../catalog";

// === CHART SCHEMAS ===

export const ChartDatasetSchema = z.object({
  label: z.string(),
  data: z.array(z.number()),
  backgroundColor: z.string().nullable(),
  borderColor: z.string().nullable(),
  fill: z.boolean().nullable(),
});

export type ChartDataset = z.infer<typeof ChartDatasetSchema>;

export const ChartPropsSchema = z.object({
  type: z.enum(["bar", "line", "pie", "doughnut", "area", "waterfall"]),
  labels: z.array(z.string()),
  datasets: z.array(ChartDatasetSchema),
  title: z.string().nullable(),
  height: z.number().nullable(),
  showLegend: z.boolean().nullable(),
  showGrid: z.boolean().nullable(),
  positiveColor: z.string().nullable(),
  negativeColor: z.string().nullable(),
  dataPath: z.string().nullable(),
});

export type ChartProps = z.infer<typeof ChartPropsSchema>;

// === MARKDOWN SCHEMA ===

export const MarkdownPropsSchema = z.object({
  content: z.string(),
  allowedTags: z.array(z.string()).nullable(),
  className: z.string().nullable(),
});

export type MarkdownProps = z.infer<typeof MarkdownPropsSchema>;

// === RICH HTML SCHEMA ===

export const RichHTMLPropsSchema = z.object({
  html: z.string(),
  allowedTags: z.array(z.string()).nullable(),
  allowedAttributes: z.record(z.string(), z.array(z.string())).nullable(),
  fallback: z.string().nullable(),
});

export type RichHTMLProps = z.infer<typeof RichHTMLPropsSchema>;

// === STRUCTURED TEXT SCHEMAS ===

export const HeadingPropsSchema = z.object({
  text: z.string(),
  level: z.enum(["h1", "h2", "h3", "h4", "h5", "h6"]).nullable(),
  id: z.string().nullable(),
});

export type HeadingProps = z.infer<typeof HeadingPropsSchema>;

export const ParagraphPropsSchema = z.object({
  text: z.string(),
  align: z.enum(["left", "center", "right", "justify"]).nullable(),
});

export type ParagraphProps = z.infer<typeof ParagraphPropsSchema>;

export const CalloutPropsSchema = z.object({
  type: z.enum(["info", "warning", "error", "success", "note"]),
  title: z.string().nullable(),
  content: z.string(),
  icon: z.string().nullable(),
  dismissible: z.boolean().nullable(),
});

export type CalloutProps = z.infer<typeof CalloutPropsSchema>;

export const QuotePropsSchema = z.object({
  text: z.string(),
  author: z.string().nullable(),
  source: z.string().nullable(),
  variant: z.enum(["default", "large", "minimal"]).nullable(),
});

export type QuoteProps = z.infer<typeof QuotePropsSchema>;

export const CodeBlockPropsSchema = z.object({
  code: z.string(),
  language: z.string().nullable(),
  showLineNumbers: z.boolean().nullable(),
  highlightLines: z.array(z.number()).nullable(),
  filename: z.string().nullable(),
  copyable: z.boolean().nullable(),
});

export type CodeBlockProps = z.infer<typeof CodeBlockPropsSchema>;

// === COMPONENT DEFINITIONS (for createCatalog) ===

export const contentComponentDefinitions: Record<string, ComponentDefinition> =
  {
    Chart: {
      props: ChartPropsSchema,
      description:
        "Render Chart.js charts (bar, line, pie, doughnut, area, waterfall)",
    },
    Markdown: {
      props: MarkdownPropsSchema,
      description: "Render markdown content with sanitized HTML output",
    },
    RichHTML: {
      props: RichHTMLPropsSchema,
      description: "Render sanitized HTML content",
    },
    Heading: {
      props: HeadingPropsSchema,
      description: "Section heading (h1-h6)",
    },
    Paragraph: {
      props: ParagraphPropsSchema,
      description: "Text paragraph with alignment options",
    },
    Callout: {
      props: CalloutPropsSchema,
      description: "Highlighted callout box for important information",
    },
    Quote: {
      props: QuotePropsSchema,
      description: "Blockquote with optional attribution",
    },
    CodeBlock: {
      props: CodeBlockPropsSchema,
      description: "Syntax-highlighted code block",
    },
  };
