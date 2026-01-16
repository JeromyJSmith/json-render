"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Welcome Modal Component
function WelcomeModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.92)",
        backdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 20,
      }}
    >
      <div
        style={{
          background: "linear-gradient(135deg, #0f1419 0%, #1a1f26 100%)",
          borderRadius: 20,
          border: "1px solid rgba(78,205,196,0.3)",
          maxWidth: 620,
          width: "100%",
          boxShadow: "0 30px 100px rgba(0,0,0,0.8)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "40px 40px 32px",
            textAlign: "center",
            background:
              "linear-gradient(180deg, rgba(78,205,196,0.08) 0%, transparent 100%)",
          }}
        >
          <div style={{ marginBottom: 20 }}>
            <img
              src="/marpa_logo_darkmode_transparent.png"
              alt="MARPA"
              style={{ height: 48, width: "auto" }}
            />
          </div>
          <h1
            style={{
              color: "#f5f7fa",
              fontSize: 28,
              fontWeight: 600,
              marginBottom: 8,
              lineHeight: 1.3,
            }}
          >
            Have a question?
          </h1>
          <p
            style={{
              color: "#4ecdc4",
              fontSize: 18,
              fontWeight: 500,
            }}
          >
            This presentation answers back.
          </p>
        </div>

        {/* Main Content */}
        <div style={{ padding: "0 40px 40px" }}>
          <p
            style={{
              color: "#c9d1d9",
              fontSize: 16,
              lineHeight: 1.7,
              marginBottom: 28,
              textAlign: "center",
            }}
          >
            Ask anything about MARPA's financial situation—valuation, equity
            splits, growth projections, vesting schedules—and watch the AI
            generate custom charts and visualizations{" "}
            <span style={{ color: "#4ecdc4" }}>right on screen</span>, then
            continue with the presentation.
          </p>

          {/* How to use */}
          <div
            style={{
              background: "rgba(78,205,196,0.08)",
              border: "1px solid rgba(78,205,196,0.2)",
              borderRadius: 12,
              padding: "20px 24px",
              marginBottom: 28,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 12,
                  background: "rgba(78,205,196,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: 24, color: "#4ecdc4" }}>⌃</span>
              </div>
              <div>
                <p
                  style={{
                    color: "#4ecdc4",
                    fontSize: 15,
                    fontWeight: 600,
                    marginBottom: 4,
                  }}
                >
                  Hold CTRL and ask
                </p>
                <p style={{ color: "#8b949e", fontSize: 14, lineHeight: 1.5 }}>
                  "Show me ownership breakdown" • "What's the vesting schedule?"
                  • "Compare revenue paths"
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={onClose}
            style={{
              display: "block",
              width: "100%",
              padding: "16px 32px",
              background: "linear-gradient(135deg, #4ecdc4 0%, #3db9b0 100%)",
              border: "none",
              borderRadius: 12,
              color: "#0a0a0a",
              fontSize: 16,
              fontWeight: 600,
              cursor: "pointer",
              textAlign: "center",
              boxShadow: "0 4px 20px rgba(78,205,196,0.3)",
            }}
          >
            Start Presentation →
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);

  const handleEnter = () => {
    setShowModal(true);
  };

  const handleStartPresentation = () => {
    router.push("/presenter");
  };

  return (
    <>
      {showModal && <WelcomeModal onClose={handleStartPresentation} />}
      <div
        style={{
          minHeight: "100vh",
          background:
            "linear-gradient(135deg, #0a0a0a 0%, #0f1419 50%, #0a0a0a 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        {/* Hero Section */}
        <div
          style={{
            textAlign: "center",
            maxWidth: 900,
            padding: "60px 40px",
          }}
        >
          {/* Logo - Big and centered */}
          <div
            style={{
              marginBottom: 56,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <img
              src="/marpa_logo_darkmode_transparent.png"
              alt="MARPA"
              style={{
                height: "auto",
                width: "min(95vw, 800px)",
                maxHeight: "280px",
                objectFit: "contain",
              }}
            />
          </div>

          {/* Tagline */}
          <h1
            style={{
              fontSize: 48,
              fontWeight: 700,
              color: "#f5f7fa",
              marginBottom: 16,
              lineHeight: 1.2,
              letterSpacing: "-0.02em",
            }}
          >
            Strategic Ownership Transition
          </h1>
          <p
            style={{
              fontSize: 20,
              color: "#8b949e",
              marginBottom: 48,
              lineHeight: 1.6,
            }}
          >
            Building the next generation of landscape architecture excellence
          </p>

          {/* Stats Row */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 48,
              marginBottom: 56,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div style={{ fontSize: 36, fontWeight: 700, color: "#4ecdc4" }}>
                $17M
              </div>
              <div style={{ fontSize: 14, color: "#8b949e", marginTop: 4 }}>
                Valuation
              </div>
            </div>
            <div>
              <div style={{ fontSize: 36, fontWeight: 700, color: "#4ecdc4" }}>
                51 Years
              </div>
              <div style={{ fontSize: 14, color: "#8b949e", marginTop: 4 }}>
                Legacy
              </div>
            </div>
            <div>
              <div style={{ fontSize: 36, fontWeight: 700, color: "#4ecdc4" }}>
                95%
              </div>
              <div style={{ fontSize: 14, color: "#8b949e", marginTop: 4 }}>
                Win Rate
              </div>
            </div>
            <div>
              <div style={{ fontSize: 36, fontWeight: 700, color: "#4ecdc4" }}>
                10.3x
              </div>
              <div style={{ fontSize: 14, color: "#8b949e", marginTop: 4 }}>
                EBITDA Multiple
              </div>
            </div>
          </div>

          {/* Enter Button */}
          <button
            onClick={handleEnter}
            style={{
              padding: "18px 48px",
              fontSize: 18,
              fontWeight: 600,
              background: "linear-gradient(135deg, #4ecdc4 0%, #3db9b0 100%)",
              color: "#0a0a0a",
              border: "none",
              borderRadius: 12,
              cursor: "pointer",
              boxShadow: "0 8px 32px rgba(78,205,196,0.3)",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow =
                "0 12px 40px rgba(78,205,196,0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow =
                "0 8px 32px rgba(78,205,196,0.3)";
            }}
          >
            Enter Presentation
          </button>

          {/* Subtitle */}
          <p
            style={{
              marginTop: 24,
              fontSize: 14,
              color: "#6e7681",
            }}
          >
            AI-powered interactive presentation experience
          </p>
        </div>

        {/* Footer */}
        <div
          style={{
            position: "absolute",
            bottom: 24,
            color: "#4d5560",
            fontSize: 12,
          }}
        >
          © 2025 MARPA Landscape Architecture
        </div>
      </div>
    </>
  );
}
