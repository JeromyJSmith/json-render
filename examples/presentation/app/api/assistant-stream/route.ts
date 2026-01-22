import { gateway, streamText } from "ai";
import { ASSISTANT_SYSTEM_PROMPT } from "@/lib/assistant-catalog";

export async function POST(req: Request) {
  const { prompt, context, model } = await req.json();

  // Use specified model or default to Gemini 3 Flash
  const selectedModel = model || "gemini-3-flash";

  // Determine provider based on model
  const provider = selectedModel.startsWith("gemini") ? "google" : "anthropic";

  // Build the user message with context
  const userMessage = `${prompt}${context ? `\n\nContext: ${JSON.stringify(context)}` : ""}`;

  try {
    // Use Vercel AI SDK gateway with streamText for proper streaming
    const result = streamText({
      model: gateway(`${provider}/${selectedModel}`),
      system: ASSISTANT_SYSTEM_PROMPT,
      prompt: userMessage,
    });

    // Stream the response directly - the AI outputs JSONL patches
    return new Response(result.textStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("API error:", error);

    // Return error as JSONL patches that render an Alert component
    const errorPatches = [
      `{"op":"set","path":"/root","value":"error-1"}`,
      `{"op":"set","path":"/elements/error-1","value":{"key":"error-1","type":"Alert","props":{"variant":"error","title":"API Error","content":"${error instanceof Error ? error.message.replace(/"/g, '\\"') : "Failed to generate response"}"}}}`,
    ].join("\n");

    return new Response(errorPatches, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }
}
