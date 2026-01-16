"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { COLORS } from "@/lib/schema";
import type { UITree, UIElement } from "@json-render/core";
import { DataProvider, Renderer } from "@json-render/react";

// ============================================
// Component Registry for Assistant Responses
// ============================================

const componentRegistry = {
  // Text block component
  TextBlock: ({ element }: { element: UIElement }) => {
    const { content, variant = "body" } = element.props as {
      content: string;
      variant?: string;
    };

    const styles: Record<string, React.CSSProperties> = {
      heading: {
        fontSize: 24,
        fontWeight: 700,
        color: COLORS.text,
        marginBottom: 12,
      },
      subheading: {
        fontSize: 18,
        fontWeight: 600,
        color: COLORS.text,
        marginBottom: 8,
      },
      body: {
        fontSize: 14,
        color: COLORS.text,
        lineHeight: 1.6,
        marginBottom: 8,
      },
      caption: { fontSize: 12, color: COLORS.muted, marginBottom: 4 },
      emphasis: {
        fontSize: 14,
        color: COLORS.coral,
        fontWeight: 500,
        marginBottom: 8,
      },
    };

    return <p style={styles[variant] || styles.body}>{content}</p>;
  },

  // Stat card component
  StatCard: ({ element }: { element: UIElement }) => {
    const { label, value, change, changeType, source } = element.props as {
      label: string;
      value: string;
      change?: string;
      changeType?: string;
      source?: string;
    };

    return (
      <div
        style={{
          background: `${COLORS.navy}44`,
          border: `1px solid ${COLORS.navy}`,
          borderRadius: 8,
          padding: 16,
          minWidth: 140,
        }}
      >
        <div style={{ color: COLORS.muted, fontSize: 11, marginBottom: 4 }}>
          {label}
        </div>
        <div style={{ color: COLORS.teal, fontSize: 28, fontWeight: 700 }}>
          {value}
        </div>
        {change && (
          <div
            style={{
              color:
                changeType === "positive"
                  ? "#4ade80"
                  : changeType === "negative"
                    ? COLORS.coral
                    : COLORS.muted,
              fontSize: 12,
              marginTop: 4,
            }}
          >
            {change}
          </div>
        )}
        {source && (
          <div style={{ color: COLORS.muted, fontSize: 10, marginTop: 8 }}>
            Source: {source}
          </div>
        )}
      </div>
    );
  },

  // Data table component
  DataTable: ({ element }: { element: UIElement }) => {
    const { columns, rows, caption } = element.props as {
      columns: Array<{ key: string; label: string; align?: string }>;
      rows: Array<Record<string, string>>;
      caption?: string;
    };

    return (
      <div style={{ marginBottom: 16, overflowX: "auto" }}>
        {caption && (
          <div style={{ color: COLORS.muted, fontSize: 12, marginBottom: 8 }}>
            {caption}
          </div>
        )}
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: COLORS.navy }}>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{
                    padding: "10px 12px",
                    textAlign:
                      (col.align as "left" | "center" | "right") || "left",
                    color: COLORS.muted,
                    fontSize: 11,
                    textTransform: "uppercase",
                  }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={i}
                style={{ borderBottom: `1px solid ${COLORS.navy}44` }}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    style={{
                      padding: "10px 12px",
                      textAlign:
                        (col.align as "left" | "center" | "right") || "left",
                      color: COLORS.text,
                      fontSize: 13,
                    }}
                  >
                    {row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  },

  // List component
  List: ({ element }: { element: UIElement }) => {
    const {
      items,
      variant = "bullet",
      title,
    } = element.props as {
      items: string[];
      variant?: string;
      title?: string;
    };

    const ListTag = variant === "numbered" ? "ol" : "ul";

    return (
      <div style={{ marginBottom: 12 }}>
        {title && (
          <div
            style={{
              color: COLORS.text,
              fontSize: 14,
              fontWeight: 600,
              marginBottom: 8,
            }}
          >
            {title}
          </div>
        )}
        <ListTag style={{ margin: 0, paddingLeft: 20 }}>
          {items.map((item, i) => (
            <li
              key={i}
              style={{
                color: COLORS.text,
                fontSize: 13,
                marginBottom: 4,
                listStyleType: variant === "check" ? "none" : undefined,
              }}
            >
              {variant === "check" ? "✓ " : ""}
              {item}
            </li>
          ))}
        </ListTag>
      </div>
    );
  },

  // Citation component
  Citation: ({ element }: { element: UIElement }) => {
    const { title, url, snippet, source, slideId } = element.props as {
      title: string;
      url?: string;
      snippet?: string;
      source: string;
      slideId?: number;
    };

    const sourceColors: Record<string, string> = {
      web: COLORS.teal,
      slide: COLORS.coral,
      canonical: "#a78bfa",
    };

    return (
      <div
        style={{
          background: `${COLORS.navy}33`,
          border: `1px solid ${COLORS.navy}`,
          borderLeft: `3px solid ${sourceColors[source] || COLORS.muted}`,
          borderRadius: 4,
          padding: 12,
          marginBottom: 8,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 4,
          }}
        >
          <span
            style={{
              fontSize: 10,
              textTransform: "uppercase",
              color: sourceColors[source] || COLORS.muted,
              fontWeight: 600,
            }}
          >
            {source}
            {slideId && ` #${slideId}`}
          </span>
        </div>
        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: COLORS.text,
              fontSize: 13,
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            {title}
          </a>
        ) : (
          <div style={{ color: COLORS.text, fontSize: 13, fontWeight: 500 }}>
            {title}
          </div>
        )}
        {snippet && (
          <div style={{ color: COLORS.muted, fontSize: 12, marginTop: 4 }}>
            {snippet}
          </div>
        )}
      </div>
    );
  },

  // Slide reference component
  SlideRef: ({ element }: { element: UIElement }) => {
    const { slideId, title, relevance } = element.props as {
      slideId: number;
      title: string;
      relevance?: string;
    };

    return (
      <a
        href={`/?slide=${slideId - 1}`}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          background: `${COLORS.coral}22`,
          border: `1px solid ${COLORS.coral}44`,
          borderRadius: 6,
          padding: 12,
          marginBottom: 8,
          textDecoration: "none",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 4,
            background: COLORS.coral,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          {slideId}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: COLORS.text, fontSize: 13, fontWeight: 500 }}>
            {title}
          </div>
          {relevance && (
            <div style={{ color: COLORS.muted, fontSize: 11 }}>{relevance}</div>
          )}
        </div>
      </a>
    );
  },

  // Comparison component
  Comparison: ({ element }: { element: UIElement }) => {
    const { title, items } = element.props as {
      title?: string;
      items: Array<{ label: string; value: string; highlight?: boolean }>;
    };

    return (
      <div style={{ marginBottom: 16 }}>
        {title && (
          <div
            style={{
              color: COLORS.text,
              fontSize: 14,
              fontWeight: 600,
              marginBottom: 12,
            }}
          >
            {title}
          </div>
        )}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {items.map((item, i) => (
            <div
              key={i}
              style={{
                flex: "1 1 150px",
                background: item.highlight
                  ? `${COLORS.teal}22`
                  : `${COLORS.navy}44`,
                border: `1px solid ${item.highlight ? COLORS.teal : COLORS.navy}`,
                borderRadius: 8,
                padding: 12,
                textAlign: "center",
              }}
            >
              <div
                style={{ color: COLORS.muted, fontSize: 11, marginBottom: 4 }}
              >
                {item.label}
              </div>
              <div
                style={{
                  color: item.highlight ? COLORS.teal : COLORS.text,
                  fontSize: 18,
                  fontWeight: 700,
                }}
              >
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  },

  // Alert component
  Alert: ({ element }: { element: UIElement }) => {
    const {
      content,
      variant = "info",
      title,
    } = element.props as {
      content: string;
      variant?: string;
      title?: string;
    };

    const variantStyles: Record<
      string,
      { bg: string; border: string; color: string }
    > = {
      info: { bg: `${COLORS.teal}22`, border: COLORS.teal, color: COLORS.teal },
      warning: { bg: "#fbbf2422", border: "#fbbf24", color: "#fbbf24" },
      success: { bg: "#4ade8022", border: "#4ade80", color: "#4ade80" },
      error: {
        bg: `${COLORS.coral}22`,
        border: COLORS.coral,
        color: COLORS.coral,
      },
    };

    const style = variantStyles[variant] || variantStyles.info;

    return (
      <div
        style={{
          background: style.bg,
          border: `1px solid ${style.border}`,
          borderRadius: 8,
          padding: 12,
          marginBottom: 12,
        }}
      >
        {title && (
          <div
            style={{
              color: style.color,
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            {title}
          </div>
        )}
        <div style={{ color: COLORS.text, fontSize: 13 }}>{content}</div>
      </div>
    );
  },

  // Divider component
  Divider: () => (
    <hr
      style={{
        border: "none",
        borderTop: `1px solid ${COLORS.navy}`,
        margin: "16px 0",
      }}
    />
  ),

  // Container component
  Container: ({
    element,
    children,
  }: {
    element: UIElement;
    children?: React.ReactNode;
  }) => {
    const { layout = "vertical", gap = "medium" } = element.props as {
      layout?: string;
      gap?: string;
    };

    const gapSizes: Record<string, number> = {
      small: 8,
      medium: 16,
      large: 24,
    };

    return (
      <div
        style={{
          display:
            layout === "horizontal" || layout === "grid" ? "flex" : "block",
          flexDirection: layout === "horizontal" ? "row" : "column",
          flexWrap: layout === "grid" ? "wrap" : undefined,
          gap: gapSizes[gap] || 16,
        }}
      >
        {children}
      </div>
    );
  },
};

// ============================================
// Helper to parse JSON from AI response
// ============================================

function parseJsonResponse(text: string): UITree | null {
  try {
    // Try to extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*"root"[\s\S]*"elements"[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.root && parsed.elements) {
        return parsed as UITree;
      }
    }
  } catch {
    // Not valid JSON
  }
  return null;
}

// ============================================
// Message Component
// ============================================

function Message({ role, content }: { role: string; content: string }) {
  const isUser = role === "user";

  // Try to parse JSON response for assistant messages
  const parsedTree = !isUser ? parseJsonResponse(content) : null;

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        marginBottom: 16,
      }}
    >
      <div
        style={{
          maxWidth: isUser ? "70%" : "90%",
          background: isUser ? COLORS.coral : `${COLORS.navy}66`,
          borderRadius: 12,
          borderTopRightRadius: isUser ? 4 : 12,
          borderTopLeftRadius: isUser ? 12 : 4,
          padding: 16,
        }}
      >
        {parsedTree ? (
          <DataProvider initialData={{}}>
            <Renderer tree={parsedTree} registry={componentRegistry} />
          </DataProvider>
        ) : (
          <div
            style={{
              color: COLORS.text,
              fontSize: 14,
              lineHeight: 1.6,
              whiteSpace: "pre-wrap",
            }}
          >
            {content}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// Helper to extract text content from AI SDK v3 messages
// ============================================

function getMessageContent(message: {
  parts?: Array<{ type: string; text?: string }>;
}): string {
  if (!message.parts) return "";
  return message.parts
    .filter((part) => part.type === "text" && part.text)
    .map((part) => part.text)
    .join("");
}

// ============================================
// Main Page Component
// ============================================

export default function AssistantPage() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState("");

  // AI SDK v3: Use DefaultChatTransport to configure endpoint
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/assistant",
      }),
    [],
  );

  const chatHelpers = useChat({ transport });
  const messages = chatHelpers.messages || [];
  const { sendMessage, status } = chatHelpers;
  const isLoading = status === "streaming" || status === "submitted";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    // AI SDK v3: sendMessage expects { text: string } format
    sendMessage({ text: inputValue.trim() });
    setInputValue("");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const input = inputValue;

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const exampleQuestions = [
    "What is MARPA's enterprise valuation?",
    "Explain the 52/24/24 ownership structure",
    "What is the vesting schedule?",
    "How does the solo path differ from design-build?",
    "What is the win rate?",
  ];

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: COLORS.background,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 24px",
          borderBottom: `1px solid ${COLORS.navy}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ color: COLORS.coral, fontWeight: 700, fontSize: 18 }}>
            MARPA
          </span>
          <span style={{ color: COLORS.teal, fontSize: 14 }}>
            Q&A Assistant
          </span>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <a
            href="/"
            style={{
              color: COLORS.muted,
              fontSize: 13,
              textDecoration: "none",
            }}
          >
            Viewer
          </a>
          <a
            href="/presenter"
            style={{
              color: COLORS.muted,
              fontSize: 13,
              textDecoration: "none",
            }}
          >
            Presenter
          </a>
          <a
            href="/registry"
            style={{
              color: COLORS.muted,
              fontSize: 13,
              textDecoration: "none",
            }}
          >
            Registry
          </a>
        </div>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 24,
        }}
      >
        {messages.length === 0 ? (
          <div style={{ textAlign: "center", paddingTop: 60 }}>
            <h2 style={{ color: COLORS.text, fontSize: 24, marginBottom: 8 }}>
              Ask anything about MARPA
            </h2>
            <p style={{ color: COLORS.muted, fontSize: 14, marginBottom: 32 }}>
              I can search slides, canonical data, and the web to answer your
              questions.
            </p>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                justifyContent: "center",
              }}
            >
              {exampleQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    const fakeEvent = {
                      target: { value: q },
                    } as React.ChangeEvent<HTMLInputElement>;
                    handleInputChange(fakeEvent);
                    setTimeout(() => {
                      const form = document.querySelector("form");
                      if (form) {
                        form.dispatchEvent(
                          new Event("submit", { bubbles: true }),
                        );
                      }
                    }, 100);
                  }}
                  style={{
                    padding: "8px 16px",
                    background: `${COLORS.navy}66`,
                    border: `1px solid ${COLORS.navy}`,
                    borderRadius: 20,
                    color: COLORS.text,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <Message
                key={msg.id}
                role={msg.role}
                content={getMessageContent(msg)}
              />
            ))}
            {isLoading && (
              <div style={{ color: COLORS.muted, fontSize: 13, padding: 16 }}>
                Searching and thinking...
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        style={{
          padding: 24,
          borderTop: `1px solid ${COLORS.navy}`,
          display: "flex",
          gap: 12,
        }}
      >
        <input
          ref={inputRef}
          value={input}
          onChange={handleInputChange}
          placeholder="Ask about valuation, ownership, financials, or search the web..."
          style={{
            flex: 1,
            padding: "14px 20px",
            background: `${COLORS.navy}66`,
            border: `1px solid ${COLORS.navy}`,
            borderRadius: 8,
            color: COLORS.text,
            fontSize: 14,
            outline: "none",
          }}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          style={{
            padding: "14px 28px",
            background: COLORS.coral,
            border: "none",
            borderRadius: 8,
            color: "#fff",
            fontSize: 14,
            fontWeight: 600,
            cursor: isLoading || !input.trim() ? "not-allowed" : "pointer",
            opacity: isLoading || !input.trim() ? 0.5 : 1,
          }}
        >
          {isLoading ? "..." : "Ask"}
        </button>
      </form>
    </div>
  );
}
