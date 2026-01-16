"use client";

import type { ComponentRenderProps } from "../renderer";
import type { QuoteProps } from "@json-render/core";

export function Quote({ element }: ComponentRenderProps<QuoteProps>) {
  const { text, author, source, variant } = element.props;
  const isLarge = variant === "large";
  const isMinimal = variant === "minimal";

  return (
    <blockquote
      style={{
        margin: "1.5em 0",
        padding: isLarge ? "24px 32px" : "16px 24px",
        borderLeft: isMinimal ? "none" : "4px solid #e5e7eb",
        fontStyle: "italic",
        fontSize: isLarge ? "1.25rem" : "1rem",
        background: isMinimal ? "transparent" : "#f9fafb",
        borderRadius: isMinimal ? 0 : "0 8px 8px 0",
      }}
    >
      <p style={{ margin: 0 }}>{text}</p>
      {(author || source) && (
        <footer
          style={{
            marginTop: "12px",
            fontSize: "0.875rem",
            color: "#6b7280",
            fontStyle: "normal",
          }}
        >
          {author && <cite>{author}</cite>}
          {author && source && " - "}
          {source && <span>{source}</span>}
        </footer>
      )}
    </blockquote>
  );
}
