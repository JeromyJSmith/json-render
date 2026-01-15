import { gateway, generateText } from "ai";
import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are a slide generator for MARPA, a landscape architecture company. Generate JSON for presentation slides.

IMPORTANT: You must respond with ONLY valid JSON, no markdown, no explanation.

Slide types and their JSON structure:

1. TITLE slide:
{
  "id": "unique-id",
  "type": "title",
  "title": "Main Title Here",
  "chapter": "Chapter Name",
  "content": {
    "tag": "Small tag above title",
    "subtitle": "Subtitle text",
    "bullets": ["Point 1", "Point 2", "Point 3"],
    "footer": "Footer text"
  }
}

2. METRICS slide (for KPIs, financial data):
{
  "id": "unique-id",
  "type": "metrics",
  "title": "Dashboard Title",
  "chapter": "Chapter Name",
  "content": {
    "metrics": [
      { "label": "Metric Name", "value": "$1.655M", "description": "What it means", "icon": "chart-line", "color": "coral", "progress": 83 }
    ]
  }
}
Colors: "coral" (#ef6337), "teal" (#4ECDC4), "yellow" (#FFE66D), "navy" (#044c73)
Icons: "chart-line", "percentage", "building", "trophy", "dollar-sign", "users", "clock"

3. CHART slide (for line/bar charts):
{
  "id": "unique-id",
  "type": "chart",
  "title": "Chart Title",
  "chapter": "Chapter Name",
  "content": {
    "chartType": "line",
    "labels": ["2026", "2027", "2028"],
    "datasets": [
      { "label": "Series Name", "data": [1.7, 1.87, 2.06], "color": "#ef6337" }
    ],
    "insight": "Key takeaway text",
    "showLegend": true
  }
}
chartType options: "line", "bar", "doughnut", "pie", "waterfall"

For WATERFALL charts specifically, use this structure:
{
  "chartType": "waterfall",
  "labels": ["Start", "Step 1", "Step 2", "Step 3", "End"],
  "datasets": [
    {
      "label": "Changes",
      "data": [100, 20, -30, 15, 105],
      "color": "#4ECDC4",
      "negativeColor": "#ef6337"
    }
  ],
  "insight": "Shows flow from start to end value"
}

4. COMPARISON slide (side-by-side):
{
  "id": "unique-id",
  "type": "comparison",
  "title": "Comparison Title",
  "chapter": "Chapter Name",
  "content": {
    "columns": [
      {
        "title": "Option A",
        "subtitle": "Description",
        "items": [{ "label": "Item", "value": "51%" }],
        "footer": "Footer note"
      }
    ],
    "highlight": 2
  }
}

5. TABLE slide:
{
  "id": "unique-id",
  "type": "table",
  "title": "Table Title",
  "chapter": "Chapter Name",
  "content": {
    "headers": ["Col1", "Col2", "Col3"],
    "rows": [["Row1", "Data", "Data"]],
    "highlightRow": 3,
    "caption": "Table description"
  }
}

MARPA CANONICAL DATA (use these exact values):
- Enterprise Valuation: $17M
- EBITDA: $1.655M (16.7% margin)
- Revenue: $11.03M
- Win Rate: 95%
- Multiple: 10.3x
- Ownership Split (Design-Build): Luke 52%, Bodie 24%, Pablo 24%
- Ownership Split (Solo): Luke 51%, Bodie 49%
- Vesting: 6% per year over 4 years
- Construction Growth: 10% YoY
- Maintenance Growth: 20% YoY

Respond with ONLY the JSON object for the slide.`;

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 },
      );
    }

    // Use AI Gateway instead of direct Anthropic
    const result = await generateText({
      model: gateway("anthropic/claude-sonnet-4-20250514"),
      system: SYSTEM_PROMPT,
      prompt: `Generate a slide for: ${prompt}`,
      maxTokens: 1024,
    });

    const responseText = result.text;

    // Parse JSON from response
    let slideJson;
    try {
      // Try to extract JSON from the response (in case there's any wrapper text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        slideJson = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse JSON:", responseText);
      return NextResponse.json(
        { error: "Failed to parse slide JSON", raw: responseText },
        { status: 500 },
      );
    }

    return NextResponse.json({ slide: slideJson });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
