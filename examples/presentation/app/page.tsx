"use client";

import { useState } from "react";
import Link from "next/link";

export default function WelcomePage() {
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0f1419 100%)",
        color: "#fff",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Header */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px 40px",
          borderBottom: "1px solid rgba(239,99,55,0.2)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              background: "linear-gradient(135deg, #ef6337, #ff8c5a)",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 18,
            }}
          >
            M
          </div>
          <span
            style={{ fontSize: 24, fontWeight: 600, letterSpacing: "0.05em" }}
          >
            MARPA
          </span>
        </div>
        <div style={{ color: "#8db6b0", fontSize: 14 }}>
          Strategic Ownership Transition
        </div>
      </header>

      {/* Hero Section */}
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "60px 40px" }}>
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <h1
            style={{
              fontSize: 48,
              fontWeight: 700,
              marginBottom: 20,
              background: "linear-gradient(135deg, #fff, #8db6b0)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              lineHeight: 1.2,
            }}
          >
            AI-Powered Presentation System
          </h1>
          <p
            style={{
              fontSize: 20,
              color: "#8b949e",
              maxWidth: 600,
              margin: "0 auto",
              lineHeight: 1.6,
            }}
          >
            Interactive slide presentation with ElevenLabs narration, AI
            assistant for Q&A, and intelligent slide navigation.
          </p>
        </div>

        {/* App Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
            gap: 24,
            marginBottom: 60,
          }}
        >
          {/* Presenter Card */}
          <Link href="/presenter" style={{ textDecoration: "none" }}>
            <div
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(239,99,55,0.3)",
                borderRadius: 16,
                padding: 32,
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(239,99,55,0.1)";
                e.currentTarget.style.borderColor = "#ef6337";
                e.currentTarget.style.transform = "translateY(-4px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                e.currentTarget.style.borderColor = "rgba(239,99,55,0.3)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  background: "linear-gradient(135deg, #ef6337, #ff8c5a)",
                  borderRadius: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 20,
                  fontSize: 24,
                }}
              >
                🎬
              </div>
              <h2
                style={{
                  fontSize: 24,
                  fontWeight: 600,
                  marginBottom: 12,
                  color: "#fff",
                }}
              >
                Presenter Mode
              </h2>
              <p
                style={{ color: "#8b949e", lineHeight: 1.6, marginBottom: 20 }}
              >
                Full presentation experience with 78 slides across 8 chapters.
                Features ElevenLabs voice narration, chapter navigation, and
                keyboard controls.
              </p>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  color: "#ef6337",
                  fontWeight: 500,
                }}
              >
                Launch Presenter
                <span style={{ fontSize: 18 }}>→</span>
              </div>
            </div>
          </Link>

          {/* Assistant Card */}
          <Link href="/assistant" style={{ textDecoration: "none" }}>
            <div
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(141,182,176,0.3)",
                borderRadius: 16,
                padding: 32,
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(141,182,176,0.1)";
                e.currentTarget.style.borderColor = "#8db6b0";
                e.currentTarget.style.transform = "translateY(-4px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                e.currentTarget.style.borderColor = "rgba(141,182,176,0.3)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  background: "linear-gradient(135deg, #8db6b0, #a8d4cd)",
                  borderRadius: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 20,
                  fontSize: 24,
                }}
              >
                💬
              </div>
              <h2
                style={{
                  fontSize: 24,
                  fontWeight: 600,
                  marginBottom: 12,
                  color: "#fff",
                }}
              >
                Q&A Assistant
              </h2>
              <p
                style={{ color: "#8b949e", lineHeight: 1.6, marginBottom: 20 }}
              >
                AI-powered assistant that can answer questions about MARPA,
                search slide content, lookup canonical business data, and search
                the web for context.
              </p>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  color: "#8db6b0",
                  fontWeight: 500,
                }}
              >
                Open Assistant
                <span style={{ fontSize: 18 }}>→</span>
              </div>
            </div>
          </Link>
        </div>

        {/* How to Use Section */}
        <div
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 16,
            padding: 40,
            marginBottom: 40,
          }}
        >
          <h2
            style={{
              fontSize: 28,
              fontWeight: 600,
              marginBottom: 24,
              textAlign: "center",
            }}
          >
            How to Use
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 32,
            }}
          >
            {/* Presenter Instructions */}
            <div>
              <h3 style={{ color: "#ef6337", fontSize: 18, marginBottom: 16 }}>
                Presenter Mode
              </h3>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  color: "#8b949e",
                  lineHeight: 2,
                }}
              >
                <li>• Use arrow keys or buttons to navigate slides</li>
                <li>
                  • Press <kbd style={kbdStyle}>Space</kbd> to play/pause
                  narration
                </li>
                <li>• Click chapter tabs for quick navigation</li>
                <li>• Enable auto-advance for hands-free playback</li>
                <li>
                  • Press <kbd style={kbdStyle}>Home</kbd>/
                  <kbd style={kbdStyle}>End</kbd> for first/last slide
                </li>
              </ul>
            </div>

            {/* Assistant Instructions */}
            <div>
              <h3 style={{ color: "#8db6b0", fontSize: 18, marginBottom: 16 }}>
                Q&A Assistant
              </h3>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  color: "#8b949e",
                  lineHeight: 2,
                }}
              >
                <li>• Ask questions about MARPA&apos;s ownership transition</li>
                <li>• Query financial metrics and valuations</li>
                <li>• Search for specific slide content</li>
                <li>• Get web search results for context</li>
                <li>• All answers cite their data sources</li>
              </ul>
            </div>
          </div>

          {/* Keyboard Shortcuts Toggle */}
          <div style={{ textAlign: "center", marginTop: 32 }}>
            <button
              onClick={() => setShowKeyboardShortcuts(!showKeyboardShortcuts)}
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 8,
                padding: "10px 20px",
                color: "#fff",
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              {showKeyboardShortcuts ? "Hide" : "Show"} Keyboard Shortcuts
            </button>
          </div>

          {showKeyboardShortcuts && (
            <div
              style={{
                marginTop: 24,
                padding: 24,
                background: "rgba(0,0,0,0.3)",
                borderRadius: 12,
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: 16,
                }}
              >
                {[
                  { key: "← / →", action: "Previous / Next slide" },
                  { key: "↑ / ↓", action: "Previous / Next slide" },
                  { key: "Space", action: "Play / Pause audio" },
                  { key: "Home", action: "Go to first slide" },
                  { key: "End", action: "Go to last slide" },
                ].map((shortcut) => (
                  <div
                    key={shortcut.key}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <kbd
                      style={{ ...kbdStyle, minWidth: 60, textAlign: "center" }}
                    >
                      {shortcut.key}
                    </kbd>
                    <span style={{ color: "#8b949e", fontSize: 14 }}>
                      {shortcut.action}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 16,
            marginBottom: 40,
          }}
        >
          {[
            { value: "78", label: "Slides" },
            { value: "8", label: "Chapters" },
            { value: "$17M", label: "Valuation" },
            { value: "95%", label: "Win Rate" },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                textAlign: "center",
                padding: 24,
                background: "rgba(255,255,255,0.02)",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 700,
                  color: "#ef6337",
                  marginBottom: 4,
                }}
              >
                {stat.value}
              </div>
              <div style={{ color: "#8b949e", fontSize: 14 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          textAlign: "center",
          padding: "24px 40px",
          borderTop: "1px solid rgba(255,255,255,0.1)",
          color: "#8b949e",
          fontSize: 13,
        }}
      >
        MARPA Strategic Ownership Transition • Powered by JSON-Render & AI SDK
      </footer>
    </div>
  );
}

const kbdStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.1)",
  border: "1px solid rgba(255,255,255,0.2)",
  borderRadius: 4,
  padding: "2px 8px",
  fontFamily: "monospace",
  fontSize: 12,
  color: "#fff",
};
