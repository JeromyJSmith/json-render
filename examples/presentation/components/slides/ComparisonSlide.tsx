"use client";

import { ComparisonContent, COLORS } from "@/lib/schema";

interface ComparisonSlideProps {
  title: string;
  chapter?: string;
  content: ComparisonContent;
}

export function ComparisonSlide({
  title,
  chapter,
  content,
}: ComparisonSlideProps) {
  return (
    <div
      style={{
        width: 1280,
        height: 720,
        background: COLORS.background,
        display: "flex",
        flexDirection: "column",
        padding: "40px 60px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: 32,
          paddingBottom: 16,
          borderBottom: `1px solid ${COLORS.navy}`,
        }}
      >
        <div>
          {chapter && (
            <p
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
            </p>
          )}
          <h1
            style={{
              fontFamily: "Playfair Display, serif",
              fontSize: 36,
              fontWeight: 400,
              color: COLORS.text,
            }}
          >
            {title}
          </h1>
        </div>
      </div>

      {/* Columns */}
      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: `repeat(${content.columns.length}, 1fr)`,
          gap: 24,
        }}
      >
        {content.columns.map((col, i) => {
          const isHighlighted = content.highlight === i;
          return (
            <div
              key={i}
              style={{
                background: isHighlighted
                  ? "rgba(239, 99, 55, 0.1)"
                  : "rgba(4, 76, 115, 0.05)",
                border: isHighlighted
                  ? `2px solid ${COLORS.coral}`
                  : "1px solid rgba(255, 255, 255, 0.05)",
                borderRadius: 12,
                padding: 24,
                display: "flex",
                flexDirection: "column",
                position: "relative",
              }}
            >
              {isHighlighted && (
                <div
                  style={{
                    position: "absolute",
                    top: -12,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: COLORS.coral,
                    color: "#fff",
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "4px 12px",
                    borderRadius: 4,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  Recommended
                </div>
              )}

              {/* Column Title */}
              <h3
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: isHighlighted ? COLORS.coral : COLORS.text,
                  marginBottom: 8,
                  textAlign: "center",
                }}
              >
                {col.title}
              </h3>

              {col.subtitle && (
                <p
                  style={{
                    fontSize: 13,
                    color: COLORS.muted,
                    textAlign: "center",
                    marginBottom: 24,
                  }}
                >
                  {col.subtitle}
                </p>
              )}

              {/* Items */}
              <div style={{ flex: 1 }}>
                {col.items.map((item, j) => (
                  <div
                    key={j}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "16px 0",
                      borderBottom:
                        j < col.items.length - 1
                          ? "1px solid rgba(255, 255, 255, 0.05)"
                          : "none",
                    }}
                  >
                    <span style={{ color: COLORS.muted, fontSize: 14 }}>
                      {item.label}
                    </span>
                    <span
                      style={{
                        color: isHighlighted ? COLORS.coral : COLORS.teal,
                        fontSize: 24,
                        fontWeight: 700,
                        fontFamily: "monospace",
                      }}
                    >
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Footer */}
              {col.footer && (
                <p
                  style={{
                    fontSize: 12,
                    color: COLORS.muted,
                    textAlign: "center",
                    marginTop: 16,
                    paddingTop: 16,
                    borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                  }}
                >
                  {col.footer}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
