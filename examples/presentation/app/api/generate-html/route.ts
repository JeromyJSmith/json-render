import { gateway, generateText } from "ai";
import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are an HTML slide generator for MARPA. Generate COMPLETE, self-contained HTML that renders beautiful animated charts and slides.

IMPORTANT: Return ONLY the HTML code, no markdown, no explanation. The HTML must be complete and self-contained.

Include these in your HTML:
1. <script src="https://cdn.jsdelivr.net/npm/chart.js"></script> for charts
2. <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Playfair+Display:wght@400;700&display=swap" rel="stylesheet">
3. Inline CSS with animations using @keyframes
4. Dark theme: background #0f1419, text #f5f7fa

COLOR PALETTE:
- coral: #ef6337 (primary accent)
- teal: #4ECDC4 (secondary accent)
- navy: #044c73 (borders, headers)
- yellow: #FFE66D (highlights)
- muted: #b0b8c1 (secondary text)

ANIMATION IDEAS:
- fadeIn: opacity 0 to 1
- slideUp: transform translateY(20px) to 0
- countUp: animate numbers from 0 to final value
- drawLine: stroke-dashoffset animation for SVG
- pulse: subtle scale animation for emphasis

MARPA CANONICAL DATA (use these exact values):
- Enterprise Valuation: $17M
- EBITDA: $1.655M (16.7% margin)
- Revenue: $11.03M
- Win Rate: 95%
- Multiple: 10.3x
- Ownership (Design-Build): Luke 52%, Bodie 24%, Pablo 24%
- Vesting: 6% per year over 4 years
- Construction Growth: 10% YoY
- Maintenance Growth: 20% YoY

For WATERFALL charts, render as stacked bars with connectors showing flow from revenue to EBITDA.

Example structure:
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #0f1419; color: #f5f7fa; font-family: 'Inter', sans-serif; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .animated { animation: fadeIn 0.8s ease-out forwards; }
  </style>
</head>
<body>
  <!-- Your slide content here -->
  <script>
    // Chart.js initialization and animations
  </script>
</body>
</html>

Return ONLY the complete HTML.`;

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 },
      );
    }

    const result = await generateText({
      model: gateway("anthropic/claude-sonnet-4-20250514"),
      system: SYSTEM_PROMPT,
      prompt: `Generate an animated HTML slide for: ${prompt}`,
    });

    const html = result.text;

    // Extract just the HTML if there's any wrapper
    const htmlMatch =
      html.match(/<!DOCTYPE html>[\s\S]*<\/html>/i) ||
      html.match(/<html[\s\S]*<\/html>/i);

    const cleanHtml = htmlMatch ? htmlMatch[0] : html;

    return new NextResponse(cleanHtml, {
      headers: { "Content-Type": "text/html" },
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
