import { gateway, streamText, convertToModelMessages, generateId } from "ai";

const SYSTEM_PROMPT = `You are a helpful visualization assistant for MARPA's financial presentation.

## YOUR STYLE
- Be brief and friendly
- Say "Sure!" or "Got it!" and immediately generate what they asked for
- NO clarifying questions - just make your best guess
- Keep responses to 1-2 sentences max

## TO GENERATE - use this exact format:
[GENERATE]
Type: bar_chart
Title: Revenue Growth
Data: description of what to show
[/GENERATE]

## MARPA DATA (use these exact values)
- Valuation: $17M, EBITDA: $1.655M, Revenue: $11.03M
- Win Rate: 95%, Multiple: 10.3x
- Ownership (Path C): Luke 52%, Bodie 24%, Pablo 24%
- Ownership (Path A/Solo): Luke 51%, Bodie 49%
- Vesting: 6% per year over 4 years
- Year 11 targets: $20M+ revenue, $25M valuation

## VISUALIZATION TYPES
bar_chart, line_chart, pie_chart, waterfall, metrics_grid, timeline, comparison

## KEY RULES
- Just generate what they ask for
- Keep it simple and brief
- After generating, offer: "Want me to adjust anything?"`;

export async function POST(req: Request) {
  const { messages } = await req.json();

  // Handle empty messages
  if (!messages || messages.length === 0) {
    return new Response(JSON.stringify({ error: "No messages provided" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Convert UI messages to model format
  const modelMessages = await convertToModelMessages(messages);

  const result = streamText({
    model: gateway("anthropic/claude-sonnet-4-20250514"),
    system: SYSTEM_PROMPT,
    messages: modelMessages,
    maxTokens: 1024,
  });

  // Return streaming response
  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    generateMessageId: generateId,
  });
}
