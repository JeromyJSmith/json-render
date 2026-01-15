"use client";

import { useChat } from "@ai-sdk/react";
import { useState, useRef, useEffect } from "react";
import { SlideRenderer } from "@/components/slides";
import { SlideData, COLORS } from "@/lib/schema";

export default function AgentPage() {
  const [slides, setSlides] = useState<SlideData[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [scale, setScale] = useState(1);
  const [model, setModel] = useState<"anthropic" | "google">("anthropic");
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({
      api: "/api/chat",
      body: { model },
      onFinish: (message) => {
        // Extract tool results from the message
        if (message.toolInvocations) {
          for (const invocation of message.toolInvocations) {
            if (invocation.state === "result" && invocation.result) {
              const slide = invocation.result as SlideData;
              if (slide.type && slide.title) {
                setSlides((prev) => {
                  const newSlides = [...prev, slide];
                  setCurrentSlide(newSlides.length - 1);
                  return newSlides;
                });
              }
            }
          }
        }
      },
    });

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Calculate scale
  useEffect(() => {
    const calculateScale = () => {
      if (!containerRef.current) return;
      const container = containerRef.current;
      const availableWidth = container.clientWidth - 20;
      const availableHeight = container.clientHeight - 20;
      const scaleX = availableWidth / 1280;
      const scaleY = availableHeight / 720;
      setScale(Math.min(scaleX, scaleY, 1));
    };

    calculateScale();
    window.addEventListener("resize", calculateScale);
    return () => window.removeEventListener("resize", calculateScale);
  }, []);

  return (
    <div
      style={{
        height: "100vh",
        display: "grid",
        gridTemplateColumns: "400px 1fr",
        background: "#0a0a0a",
      }}
    >
      {/* Chat Panel */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          borderRight: `1px solid ${COLORS.navy}`,
          background: "rgba(15,20,25,0.95)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: `1px solid ${COLORS.coral}33`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <span
              style={{
                color: COLORS.coral,
                fontWeight: 600,
                letterSpacing: "0.1em",
              }}
            >
              MARPA
            </span>
            <span style={{ color: COLORS.muted, fontSize: 14, marginLeft: 8 }}>
              Agent
            </span>
          </div>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value as "anthropic" | "google")}
            style={{
              padding: "6px 12px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 4,
              color: COLORS.text,
              fontSize: 12,
            }}
          >
            <option value="anthropic">Claude</option>
            <option value="google">Gemini</option>
          </select>
        </div>

        {/* Messages */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {messages.length === 0 && (
            <div
              style={{
                color: COLORS.muted,
                fontSize: 14,
                textAlign: "center",
                marginTop: 40,
              }}
            >
              <p style={{ marginBottom: 16 }}>Ask me to create slides!</p>
              <p style={{ fontSize: 12 }}>Try:</p>
              <ul
                style={{
                  fontSize: 12,
                  listStyle: "none",
                  padding: 0,
                  marginTop: 8,
                }}
              >
                <li style={{ marginBottom: 8 }}>
                  "Create a title slide for MARPA 2026"
                </li>
                <li style={{ marginBottom: 8 }}>
                  "Show me the financial metrics"
                </li>
                <li style={{ marginBottom: 8 }}>
                  "Make a chart of growth projections"
                </li>
                <li style={{ marginBottom: 8 }}>
                  "Compare the three ownership paths"
                </li>
              </ul>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              style={{
                padding: "12px 16px",
                borderRadius: 8,
                background:
                  message.role === "user"
                    ? `${COLORS.coral}22`
                    : "rgba(255,255,255,0.05)",
                borderLeft: `3px solid ${message.role === "user" ? COLORS.coral : COLORS.teal}`,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: COLORS.muted,
                  marginBottom: 6,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                {message.role === "user" ? "You" : "Agent"}
              </div>
              <div
                style={{ color: COLORS.text, fontSize: 14, lineHeight: 1.5 }}
              >
                {message.content}
              </div>

              {/* Show tool invocations */}
              {message.toolInvocations?.map((tool, i) => (
                <div
                  key={i}
                  style={{
                    marginTop: 12,
                    padding: "8px 12px",
                    background: "rgba(78, 205, 196, 0.1)",
                    borderRadius: 4,
                    fontSize: 12,
                  }}
                >
                  <span style={{ color: COLORS.teal }}>
                    {tool.state === "result" ? "✓" : "⏳"} {tool.toolName}
                  </span>
                  {tool.state === "result" && (
                    <span style={{ color: COLORS.muted, marginLeft: 8 }}>
                      → Slide created
                    </span>
                  )}
                </div>
              ))}
            </div>
          ))}

          {isLoading && (
            <div
              style={{
                padding: "12px 16px",
                borderRadius: 8,
                background: "rgba(255,255,255,0.05)",
                borderLeft: `3px solid ${COLORS.teal}`,
              }}
            >
              <div style={{ color: COLORS.teal, fontSize: 14 }}>
                Thinking...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          style={{
            padding: 16,
            borderTop: `1px solid ${COLORS.navy}`,
            display: "flex",
            gap: 8,
          }}
        >
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="Ask me to create a slide..."
            disabled={isLoading}
            style={{
              flex: 1,
              padding: "12px 16px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              color: COLORS.text,
              fontSize: 14,
              outline: "none",
            }}
          />
          <button
            type="submit"
            disabled={isLoading}
            style={{
              padding: "12px 20px",
              background: COLORS.coral,
              border: "none",
              borderRadius: 8,
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
              opacity: isLoading ? 0.5 : 1,
            }}
          >
            Send
          </button>
        </form>
      </div>

      {/* Slide Panel */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          background: "#000",
        }}
      >
        {/* Slide thumbnails */}
        {slides.length > 0 && (
          <div
            style={{
              padding: "8px 16px",
              background: "rgba(15,20,25,0.95)",
              borderBottom: "1px solid rgba(255,255,255,0.1)",
              display: "flex",
              gap: 8,
              overflowX: "auto",
            }}
          >
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                onClick={() => setCurrentSlide(i)}
                style={{
                  padding: "6px 12px",
                  background:
                    currentSlide === i
                      ? `${COLORS.coral}33`
                      : "rgba(255,255,255,0.05)",
                  border:
                    currentSlide === i
                      ? `1px solid ${COLORS.coral}`
                      : "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 4,
                  color: currentSlide === i ? COLORS.coral : COLORS.muted,
                  fontSize: 11,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {i + 1}. {slide.type}
              </button>
            ))}
          </div>
        )}

        {/* Slide Viewer */}
        <div
          ref={containerRef}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {slides.length > 0 ? (
            <div
              style={{
                transform: `scale(${scale})`,
                transformOrigin: "center center",
              }}
            >
              <SlideRenderer slide={slides[currentSlide]} />
            </div>
          ) : (
            <div
              style={{
                color: COLORS.muted,
                fontSize: 18,
                textAlign: "center",
              }}
            >
              <p style={{ marginBottom: 8 }}>No slides yet</p>
              <p style={{ fontSize: 14 }}>Ask the agent to create one!</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        {slides.length > 1 && (
          <div
            style={{
              padding: "12px 16px",
              background: "rgba(15,20,25,0.95)",
              display: "flex",
              justifyContent: "center",
              gap: 16,
            }}
          >
            <button
              onClick={() => setCurrentSlide((i) => Math.max(0, i - 1))}
              disabled={currentSlide === 0}
              style={{
                padding: "8px 20px",
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 6,
                color: COLORS.text,
                cursor: "pointer",
                opacity: currentSlide === 0 ? 0.3 : 1,
              }}
            >
              Previous
            </button>
            <span
              style={{ color: COLORS.muted, fontSize: 14, lineHeight: "36px" }}
            >
              {currentSlide + 1} / {slides.length}
            </span>
            <button
              onClick={() =>
                setCurrentSlide((i) => Math.min(slides.length - 1, i + 1))
              }
              disabled={currentSlide === slides.length - 1}
              style={{
                padding: "8px 20px",
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 6,
                color: COLORS.text,
                cursor: "pointer",
                opacity: currentSlide === slides.length - 1 ? 0.3 : 1,
              }}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
