"use client";

import { useState, useRef } from "react";
import { COLORS } from "@/lib/schema";

export default function HtmlGenPage() {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [history, setHistory] = useState<{ prompt: string; html: string }[]>(
    [],
  );
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);

    try {
      const response = await fetch("/api/generate-html", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const html = await response.text();
      setHtmlContent(html);
      setHistory((prev) => [...prev, { prompt, html }]);
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to generate HTML");
    }

    setPrompt("");
    setIsLoading(false);
  };

  const openInNewTab = () => {
    if (!htmlContent) return;
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  const downloadHtml = () => {
    if (!htmlContent) return;
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "generated-slide.html";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#0a0a0a",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "12px 24px",
          background: "rgba(15,20,25,0.95)",
          borderBottom: `1px solid ${COLORS.coral}33`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span
            style={{
              color: COLORS.coral,
              fontWeight: 600,
              letterSpacing: "0.1em",
            }}
          >
            MARPA
          </span>
          <span style={{ color: COLORS.teal, fontSize: 14, fontWeight: 600 }}>
            HTML Generator
          </span>
          <span style={{ color: COLORS.muted, fontSize: 12 }}>
            AI → Raw Animated HTML
          </span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {htmlContent && (
            <>
              <button
                onClick={openInNewTab}
                style={{
                  padding: "6px 12px",
                  background: `${COLORS.teal}22`,
                  border: `1px solid ${COLORS.teal}`,
                  borderRadius: 4,
                  color: COLORS.teal,
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                Open in New Tab
              </button>
              <button
                onClick={downloadHtml}
                style={{
                  padding: "6px 12px",
                  background: `${COLORS.coral}22`,
                  border: `1px solid ${COLORS.coral}`,
                  borderRadius: 4,
                  color: COLORS.coral,
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                Download HTML
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Preview Area */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#000",
            padding: 20,
          }}
        >
          {htmlContent ? (
            <iframe
              ref={iframeRef}
              srcDoc={htmlContent}
              style={{
                width: "100%",
                height: "100%",
                maxWidth: 1280,
                maxHeight: 720,
                border: `1px solid ${COLORS.navy}`,
                borderRadius: 8,
                background: "#0f1419",
              }}
              sandbox="allow-scripts"
            />
          ) : (
            <div
              style={{
                width: "100%",
                maxWidth: 1280,
                height: "100%",
                maxHeight: 720,
                border: `2px dashed ${COLORS.navy}`,
                borderRadius: 8,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: COLORS.muted,
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 16 }}>✨</div>
              <p style={{ fontSize: 18, marginBottom: 8 }}>
                Generate Animated HTML Slides
              </p>
              <p style={{ fontSize: 14 }}>
                Try: "waterfall chart" • "metrics dashboard" • "growth
                projection"
              </p>
            </div>
          )}
        </div>

        {/* History Sidebar */}
        {history.length > 0 && (
          <div
            style={{
              width: 250,
              borderLeft: `1px solid ${COLORS.navy}`,
              background: "rgba(15,20,25,0.95)",
              overflowY: "auto",
              padding: 12,
            }}
          >
            <p
              style={{
                color: COLORS.muted,
                fontSize: 11,
                marginBottom: 12,
                textTransform: "uppercase",
              }}
            >
              History ({history.length})
            </p>
            {history.map((item, i) => (
              <button
                key={i}
                onClick={() => setHtmlContent(item.html)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  marginBottom: 8,
                  background:
                    htmlContent === item.html
                      ? `${COLORS.coral}22`
                      : "rgba(255,255,255,0.05)",
                  border:
                    htmlContent === item.html
                      ? `1px solid ${COLORS.coral}`
                      : "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 4,
                  color: COLORS.text,
                  fontSize: 12,
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                {item.prompt.length > 30
                  ? item.prompt.substring(0, 30) + "..."
                  : item.prompt}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Input Area */}
      <form
        onSubmit={handleSubmit}
        style={{
          padding: "16px 24px",
          background: "rgba(15,20,25,0.95)",
          borderTop: `1px solid ${COLORS.coral}33`,
          display: "flex",
          gap: 12,
        }}
      >
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the slide you want... (e.g., 'animated waterfall chart showing revenue to EBITDA')"
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
            padding: "12px 32px",
            background: isLoading ? COLORS.muted : COLORS.coral,
            border: "none",
            borderRadius: 8,
            color: "#fff",
            fontWeight: 600,
            cursor: isLoading ? "not-allowed" : "pointer",
          }}
        >
          {isLoading ? "Generating..." : "Generate HTML"}
        </button>
      </form>
    </div>
  );
}
