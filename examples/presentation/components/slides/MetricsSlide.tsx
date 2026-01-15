"use client";

import { MetricsContent, COLORS } from "@/lib/schema";

interface MetricsSlideProps {
  title: string;
  chapter?: string;
  content: MetricsContent;
}

const iconMap: Record<string, string> = {
  "chart-line": "📈",
  percentage: "%",
  building: "🏢",
  trophy: "🏆",
  "dollar-sign": "$",
  users: "👥",
  clock: "⏱",
};

export function MetricsSlide({ title, chapter, content }: MetricsSlideProps) {
  return (
    <div
      style={{
        width: 1280,
        height: 720,
        background: COLORS.background,
        display: "flex",
        flexDirection: "column",
        padding: "25px 40px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: 24,
          paddingBottom: 16,
          borderBottom: `1px solid ${COLORS.navy}`,
        }}
      >
        <div>
          {chapter && (
            <h2
              style={{
                color: COLORS.coral,
                fontWeight: 700,
                letterSpacing: "0.2em",
                fontSize: 12,
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              {chapter}
            </h2>
          )}
          <h1
            style={{
              fontFamily: "Playfair Display, serif",
              fontSize: 36,
              fontWeight: 700,
              color: COLORS.text,
            }}
          >
            {title}
          </h1>
        </div>
        <div style={{ textAlign: "right" }}>
          <p
            style={{
              color: COLORS.muted,
              fontSize: 12,
              fontFamily: "monospace",
            }}
          >
            DATA SOURCE: DEC 2025 REVIEW
          </p>
          <div
            style={{
              width: 128,
              height: 4,
              background: COLORS.navy,
              marginTop: 8,
              marginLeft: "auto",
            }}
          />
        </div>
      </div>

      {/* Metrics Grid */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 12,
        }}
      >
        {content.metrics.map((metric, i) => {
          const color = COLORS[metric.color || "coral"];
          return (
            <div
              key={i}
              style={{
                background: "#161b22",
                borderRadius: "0 8px 8px 0",
                padding: 16,
                display: "flex",
                alignItems: "center",
                borderLeft: `4px solid ${color}`,
                transition: "transform 0.2s",
              }}
            >
              {/* Icon */}
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: `${COLORS.navy}33`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 24,
                  fontSize: 20,
                }}
              >
                {iconMap[metric.icon || "chart-line"] || "📊"}
              </div>

              {/* Label & Description */}
              <div style={{ flex: 1, paddingRight: 32 }}>
                <h3
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: COLORS.text,
                    marginBottom: 4,
                  }}
                >
                  {metric.label}
                </h3>
                {metric.description && (
                  <p style={{ fontSize: 14, color: COLORS.muted }}>
                    {metric.description}
                  </p>
                )}
              </div>

              {/* Value */}
              <div style={{ textAlign: "right", minWidth: 120 }}>
                <p
                  style={{
                    fontSize: 32,
                    fontWeight: 700,
                    color: color,
                    fontFamily: "monospace",
                  }}
                >
                  {metric.value}
                </p>
              </div>

              {/* Progress Bar */}
              {metric.progress !== undefined && (
                <div
                  style={{
                    width: 200,
                    marginLeft: 24,
                  }}
                >
                  <div
                    style={{
                      height: 8,
                      background: "rgba(141, 182, 176, 0.1)",
                      borderRadius: 4,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${metric.progress}%`,
                        height: "100%",
                        background: color,
                        borderRadius: 4,
                        transition: "width 1s ease-out",
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
