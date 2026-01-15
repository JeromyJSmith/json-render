import Anthropic from "@anthropic-ai/sdk";
import { fullSystemPrompt } from "@/lib/catalog";

const anthropic = new Anthropic();

export async function POST(req: Request) {
  const { prompt, context, currentTree } = await req.json();

  // Build messages with context
  const messages: Anthropic.MessageParam[] = [
    {
      role: "user",
      content: `${prompt}${context ? `\n\nContext: ${JSON.stringify(context)}` : ""}${currentTree?.root ? `\n\nCurrent UI tree has root: ${currentTree.root}` : ""}`,
    },
  ];

  // Create streaming response
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Use Claude to generate the UI
        const response = await anthropic.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4096,
          system: fullSystemPrompt,
          messages,
        });

        // Extract text content
        const textContent = response.content.find((c) => c.type === "text");
        if (!textContent || textContent.type !== "text") {
          throw new Error("No text response from Claude");
        }

        const text = textContent.text;

        // Parse and stream JSON patches from response
        // Claude should return newline-delimited JSON patches
        const lines = text.split("\n");

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          // Skip markdown code fences
          if (trimmed.startsWith("```")) continue;

          // Try to parse as JSON patch
          if (trimmed.startsWith("{") && trimmed.includes('"op"')) {
            try {
              JSON.parse(trimmed); // Validate JSON
              controller.enqueue(encoder.encode(trimmed + "\n"));
              // Small delay for visual streaming effect
              await new Promise((r) => setTimeout(r, 50));
            } catch {
              // Skip invalid JSON
              console.warn("Invalid JSON patch:", trimmed);
            }
          }
        }

        controller.close();
      } catch (error) {
        console.error("Stream error:", error);
        controller.error(error);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
    },
  });
}
