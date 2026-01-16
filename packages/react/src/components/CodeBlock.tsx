"use client";

import { useState } from "react";
import type { ComponentRenderProps } from "../renderer";
import type { CodeBlockProps } from "@json-render/core";

export function CodeBlock({ element }: ComponentRenderProps<CodeBlockProps>) {
  const {
    code,
    language,
    showLineNumbers,
    highlightLines,
    filename,
    copyable,
  } = element.props;
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code.split("\n");
  const highlightSet = new Set(highlightLines || []);

  return (
    <div
      style={{
        margin: "1em 0",
        borderRadius: "8px",
        overflow: "hidden",
        border: "1px solid #e5e7eb",
      }}
    >
      {(filename || language || copyable !== false) && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "8px 16px",
            background: "#f3f4f6",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>
            {filename || language || ""}
          </span>
          {copyable !== false && (
            <button
              onClick={handleCopy}
              style={{
                fontSize: "0.75rem",
                padding: "4px 8px",
                cursor: "pointer",
                border: "1px solid #d1d5db",
                borderRadius: "4px",
                background: copied ? "#dcfce7" : "#ffffff",
                color: copied ? "#166534" : "#374151",
              }}
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          )}
        </div>
      )}
      <pre
        style={{
          margin: 0,
          padding: "16px",
          background: "#1f2937",
          color: "#e5e7eb",
          overflow: "auto",
          fontSize: "0.875rem",
          lineHeight: 1.6,
        }}
      >
        <code>
          {lines.map((line, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                background: highlightSet.has(i + 1)
                  ? "rgba(59, 130, 246, 0.2)"
                  : "transparent",
                marginLeft: highlightSet.has(i + 1) ? "-16px" : 0,
                marginRight: highlightSet.has(i + 1) ? "-16px" : 0,
                paddingLeft: highlightSet.has(i + 1) ? "16px" : 0,
                paddingRight: highlightSet.has(i + 1) ? "16px" : 0,
              }}
            >
              {showLineNumbers && (
                <span
                  style={{
                    width: "3em",
                    color: "#6b7280",
                    userSelect: "none",
                    textAlign: "right",
                    paddingRight: "1em",
                    flexShrink: 0,
                  }}
                >
                  {i + 1}
                </span>
              )}
              <span style={{ flex: 1 }}>{line || " "}</span>
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
}
