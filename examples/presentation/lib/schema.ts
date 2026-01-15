// JSON Schema for MARPA Generative UI Slides

export interface SlideData {
  id: string;
  type: "title" | "metrics" | "chart" | "comparison" | "table" | "text";
  title: string;
  chapter?: string;
  content:
    | TitleContent
    | MetricsContent
    | ChartContent
    | ComparisonContent
    | TableContent
    | TextContent;
}

// Title Slide
export interface TitleContent {
  tag?: string;
  subtitle?: string;
  bullets?: string[];
  footer?: string;
}

// Metrics Dashboard
export interface MetricsContent {
  metrics: MetricItem[];
}

export interface MetricItem {
  label: string;
  value: string | number;
  description?: string;
  icon?: string;
  color?: "coral" | "teal" | "yellow" | "navy";
  progress?: number; // 0-100
}

// Chart Slide
export interface ChartContent {
  chartType: "line" | "bar" | "doughnut" | "pie" | "waterfall";
  labels: string[];
  datasets: ChartDataset[];
  insight?: string;
  showLegend?: boolean;
}

export interface ChartDataset {
  label: string;
  data: number[];
  color: string;
  negativeColor?: string; // For waterfall charts
}

// Comparison Slide
export interface ComparisonContent {
  columns: ComparisonColumn[];
  highlight?: number; // index of highlighted column
}

export interface ComparisonColumn {
  title: string;
  subtitle?: string;
  items: { label: string; value: string }[];
  footer?: string;
}

// Table Slide
export interface TableContent {
  headers: string[];
  rows: (string | number)[][];
  highlightRow?: number;
  caption?: string;
}

// Text Slide
export interface TextContent {
  paragraphs: string[];
  highlight?: string;
}

// Theme colors
export const COLORS = {
  coral: "#ef6337",
  teal: "#4ECDC4",
  yellow: "#FFE66D",
  navy: "#044c73",
  mint: "#95E1D3",
  background: "#0f1419",
  text: "#f5f7fa",
  muted: "#b0b8c1",
};

// Sample slide data extracted from MARPA presentation
export const sampleSlides: SlideData[] = [
  {
    id: "slide-1",
    type: "title",
    title: "MARPA Equity Pathway 2026",
    chapter: "Introduction",
    content: {
      tag: "Succession Strategy",
      subtitle: "Ownership Transition Analysis",
      bullets: [
        "Financial Assessment",
        "Principal Offering Framework",
        "Integrated Design Plan",
        "Construction Partnership",
      ],
      footer: "Confidential Presentation · For Review · December 2024",
    } as TitleContent,
  },
  {
    id: "slide-2",
    type: "metrics",
    title: "MARPA's Financial Dashboard",
    chapter: "Foundation",
    content: {
      metrics: [
        {
          label: "Trailing EBITDA",
          value: "$1.655M",
          description: "Base foundation for all valuation multiples",
          icon: "chart-line",
          color: "coral",
          progress: 83,
        },
        {
          label: "EBITDA Margin",
          value: "16.7%",
          description: "Premium territory vs. industry 8-12%",
          icon: "percentage",
          color: "teal",
          progress: 84,
        },
        {
          label: "Enterprise Valuation",
          value: "$17M",
          description: "10.3x multiple applied to EBITDA",
          icon: "building",
          color: "yellow",
          progress: 100,
        },
        {
          label: "Win Rate",
          value: "95%",
          description: "Exceptional close rate on qualified leads",
          icon: "trophy",
          color: "coral",
          progress: 95,
        },
        {
          label: "2025 Revenue",
          value: "$11.03M",
          description: "Total annual revenue across all service lines",
          icon: "dollar-sign",
          color: "navy",
          progress: 73,
        },
      ],
    } as MetricsContent,
  },
  {
    id: "slide-3",
    type: "chart",
    title: "11-Year Growth Projection",
    chapter: "Design-Build",
    content: {
      chartType: "line",
      labels: [
        "2026",
        "2027",
        "2028",
        "2029",
        "2030",
        "2031",
        "2032",
        "2033",
        "2034",
        "2035",
        "2036",
      ],
      datasets: [
        {
          label: "Construction (+10%)",
          data: [
            1.7, 1.87, 2.06, 2.26, 2.49, 2.74, 3.01, 3.31, 3.64, 4.01, 4.41,
          ],
          color: "#ef6337",
        },
        {
          label: "Maintenance (+20%)",
          data: [
            0.8, 0.96, 1.15, 1.38, 1.66, 1.99, 2.39, 2.87, 3.44, 4.13, 4.96,
          ],
          color: "#4ECDC4",
        },
      ],
      insight:
        "Maintenance revenue overtakes construction by Year 8, creating diversified income streams.",
      showLegend: true,
    } as ChartContent,
  },
  {
    id: "slide-4",
    type: "comparison",
    title: "Three Paths Compare",
    chapter: "Decision",
    content: {
      columns: [
        {
          title: "Path A: Solo",
          subtitle: "Bodie as sole successor",
          items: [
            { label: "Luke", value: "51%" },
            { label: "Bodie", value: "49%" },
            { label: "Pablo", value: "0%" },
          ],
          footer: "Traditional succession",
        },
        {
          title: "Path B: Shared",
          subtitle: "Equal partnership",
          items: [
            { label: "Luke", value: "52%" },
            { label: "Bodie", value: "24%" },
            { label: "Pablo", value: "24%" },
          ],
          footer: "Balanced transition",
        },
        {
          title: "Path C: Design-Build",
          subtitle: "Recommended path",
          items: [
            { label: "Luke", value: "52%" },
            { label: "Bodie", value: "24%" },
            { label: "Pablo", value: "24%" },
          ],
          footer: "Maximum growth potential",
        },
      ],
      highlight: 2,
    } as ComparisonContent,
  },
  {
    id: "slide-5",
    type: "table",
    title: "Equity Vesting Schedule",
    chapter: "Partnership Timeline",
    content: {
      headers: ["Year", "Annual Gift", "Cumulative", "Notes"],
      rows: [
        ["1", "6%", "6%", "Initial commitment"],
        ["2", "6%", "12%", "+ Pablo equipment conversion"],
        ["3", "6%", "18%", "Purchase period begins"],
        ["4", "6%", "24%", "Full partnership achieved"],
      ],
      highlightRow: 3,
      caption: "Partners vest 6% annually over 4 years",
    } as TableContent,
  },
];
