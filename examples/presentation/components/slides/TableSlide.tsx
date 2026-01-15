"use client";

import { TableContent, COLORS } from "@/lib/schema";

interface TableSlideProps {
  title: string;
  chapter?: string;
  content: TableContent;
}

export function TableSlide({ title, chapter, content }: TableSlideProps) {
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

      {/* Table */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            background: "rgba(4, 76, 115, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.05)",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr>
                {content.headers.map((header, i) => (
                  <th
                    key={i}
                    style={{
                      textAlign: "left",
                      padding: "16px 24px",
                      color: COLORS.muted,
                      fontFamily: "monospace",
                      textTransform: "uppercase",
                      fontSize: 12,
                      letterSpacing: "0.1em",
                      borderBottom: `2px solid ${COLORS.navy}`,
                      background: "rgba(4, 76, 115, 0.1)",
                    }}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {content.rows.map((row, i) => {
                const isHighlighted = content.highlightRow === i;
                return (
                  <tr
                    key={i}
                    style={{
                      background: isHighlighted
                        ? "rgba(239, 99, 55, 0.1)"
                        : "transparent",
                    }}
                  >
                    {row.map((cell, j) => (
                      <td
                        key={j}
                        style={{
                          padding: "16px 24px",
                          color: isHighlighted
                            ? COLORS.coral
                            : j === 0
                              ? COLORS.text
                              : COLORS.muted,
                          fontFamily: j > 0 ? "monospace" : "inherit",
                          fontSize: 15,
                          fontWeight: isHighlighted ? 600 : j === 0 ? 500 : 400,
                          borderBottom:
                            i < content.rows.length - 1
                              ? "1px solid rgba(255, 255, 255, 0.05)"
                              : "none",
                        }}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Caption */}
        {content.caption && (
          <p
            style={{
              color: COLORS.muted,
              fontSize: 14,
              textAlign: "center",
              marginTop: 24,
              fontStyle: "italic",
            }}
          >
            {content.caption}
          </p>
        )}
      </div>
    </div>
  );
}
