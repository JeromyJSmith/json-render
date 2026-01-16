"use client";

import type { ComponentRenderProps } from "../renderer";
import type { CalloutProps } from "@json-render/core";

const calloutStyles: Record<
  string,
  { bg: string; border: string; text: string }
> = {
  info: { bg: "#eff6ff", border: "#3b82f6", text: "#1e40af" },
  warning: { bg: "#fffbeb", border: "#f59e0b", text: "#92400e" },
  error: { bg: "#fef2f2", border: "#ef4444", text: "#991b1b" },
  success: { bg: "#f0fdf4", border: "#22c55e", text: "#166534" },
  note: { bg: "#f8fafc", border: "#64748b", text: "#334155" },
};

export function Callout({ element }: ComponentRenderProps<CalloutProps>) {
  const { type, title, content } = element.props;
  const styles = calloutStyles[type] ?? calloutStyles.note!;

  return (
    <div
      style={{
        padding: "16px",
        margin: "1em 0",
        background: styles.bg,
        borderLeft: `4px solid ${styles.border}`,
        borderRadius: "4px",
      }}
    >
      {title && (
        <strong
          style={{
            color: styles.text,
            display: "block",
            marginBottom: "8px",
          }}
        >
          {title}
        </strong>
      )}
      <p style={{ color: styles.text, margin: 0 }}>{content}</p>
    </div>
  );
}
