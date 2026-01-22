"use client";

import type { UIElement, UITree } from "@json-render/core";
import {
  contentComponentRegistry,
  DataProvider,
  VisibilityProvider,
  ActionProvider,
  Renderer,
  useUIStream,
} from "@json-render/react";
import Image from "next/image";
import Link from "next/link";
import { memo, useEffect, useRef, useState } from "react";
import { COLORS } from "@/lib/schema";

// ============================================
// Component Registry for Assistant Responses
// Uses contentComponentRegistry from @json-render/react as base
// ============================================

// Hoisted styles for performance (Vercel best practice: rendering-hoist-jsx)
const textBlockStyles: Record<string, React.CSSProperties> = {
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
  body: { fontSize: 14, color: COLORS.text, lineHeight: 1.6, marginBottom: 8 },
  caption: { fontSize: 12, color: COLORS.muted, marginBottom: 4 },
  emphasis: {
    fontSize: 14,
    color: COLORS.coral,
    fontWeight: 500,
    marginBottom: 8,
  },
};

const alertVariantStyles: Record<
  string,
  { bg: string; border: string; color: string }
> = {
  info: { bg: `${COLORS.teal}22`, border: COLORS.teal, color: COLORS.teal },
  warning: { bg: "#fbbf2422", border: "#fbbf24", color: "#fbbf24" },
  success: { bg: "#4ade8022", border: "#4ade80", color: "#4ade80" },
  error: { bg: `${COLORS.coral}22`, border: COLORS.coral, color: COLORS.coral },
};

const sourceColors: Record<string, string> = {
  web: COLORS.teal,
  slide: COLORS.coral,
  canonical: "#a78bfa",
};

const gapSizes: Record<string, number> = { small: 8, medium: 16, large: 24 };

// Memoized assistant-specific components (Vercel best practice: rerender-memo)
const TextBlock = memo(function TextBlock({ element }: { element: UIElement }) {
  const { content, variant = "body" } = element.props as {
    content: string;
    variant?: string;
  };
  return (
    <p style={textBlockStyles[variant] || textBlockStyles.body}>{content}</p>
  );
});

const StatCard = memo(function StatCard({ element }: { element: UIElement }) {
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
});

const DataTable = memo(function DataTable({ element }: { element: UIElement }) {
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
          {rows.map((row, idx) => (
            <tr
              key={idx}
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
});

const List = memo(function List({ element }: { element: UIElement }) {
  const {
    items,
    variant = "bullet",
    title,
  } = element.props as { items: string[]; variant?: string; title?: string };
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
        {items.map((item, idx) => (
          <li
            key={idx}
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
});

const Citation = memo(function Citation({ element }: { element: UIElement }) {
  const { title, url, snippet, source, slideId } = element.props as {
    title: string;
    url?: string;
    snippet?: string;
    source: string;
    slideId?: number;
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
});

const SlideRef = memo(function SlideRef({ element }: { element: UIElement }) {
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
});

const Comparison = memo(function Comparison({
  element,
}: {
  element: UIElement;
}) {
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
        {items.map((item, idx) => (
          <div
            key={idx}
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
            <div style={{ color: COLORS.muted, fontSize: 11, marginBottom: 4 }}>
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
});

const Alert = memo(function Alert({ element }: { element: UIElement }) {
  const {
    content,
    variant = "info",
    title,
  } = element.props as { content: string; variant?: string; title?: string };
  const style = alertVariantStyles[variant] || alertVariantStyles.info;
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
});

const Divider = memo(function Divider() {
  return (
    <hr
      style={{
        border: "none",
        borderTop: `1px solid ${COLORS.navy}`,
        margin: "16px 0",
      }}
    />
  );
});

const Container = memo(function Container({
  element,
  children,
}: {
  element: UIElement;
  children?: React.ReactNode;
}) {
  const { layout = "vertical", gap = "medium" } = element.props as {
    layout?: string;
    gap?: string;
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
});

// Chart wrapper with MARPA styling (uses Chart from @json-render/react)
const ChartWrapper = memo(function ChartWrapper({
  element,
}: {
  element: UIElement;
}) {
  // Cast to the expected type for contentComponentRegistry.Chart
  // The Chart component handles validation internally
  return (
    <div
      style={{
        background: `${COLORS.navy}22`,
        border: `1px solid ${COLORS.navy}`,
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
      }}
    >
      <contentComponentRegistry.Chart
        element={
          element as Parameters<
            typeof contentComponentRegistry.Chart
          >[0]["element"]
        }
      />
    </div>
  );
});

// Combined registry: contentComponentRegistry + assistant-specific components
const componentRegistry = {
  // Include all components from @json-render/react
  ...contentComponentRegistry,
  // Override/add assistant-specific components
  TextBlock,
  StatCard,
  DataTable,
  List,
  Citation,
  SlideRef,
  Comparison,
  Alert,
  Divider,
  Container,
  // Chart with MARPA styling wrapper
  Chart: ChartWrapper,
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

function Message({
  sender,
  content,
  tree,
}: {
  sender: "user" | "assistant";
  content?: string;
  tree?: UITree | null;
}) {
  const isUser = sender === "user";

  // Try to parse JSON response for assistant messages
  const parsedTree =
    !isUser && !tree && content ? parseJsonResponse(content) : null;
  const renderTree = tree ?? parsedTree;

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
        {renderTree ? (
          <DataProvider initialData={{}}>
            <VisibilityProvider>
              <ActionProvider handlers={{}}>
                <Renderer tree={renderTree} registry={componentRegistry} />
              </ActionProvider>
            </VisibilityProvider>
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
// Main Page Component
// ============================================

export default function AssistantPage() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const nextMessageIdRef = useRef(0);
  const [messages, setMessages] = useState<
    Array<{
      id: string;
      sender: "user" | "assistant";
      content?: string;
      tree?: UITree | null;
    }>
  >([]);
  const [inputValue, setInputValue] = useState("");
  // Hardcoded to Gemini 3 Flash
  const selectedModel = "gemini-3-flash";

  const { tree, isStreaming, send, clear } = useUIStream({
    api: "/api/assistant-stream",
    onComplete: (completedTree) => {
      setMessages((prev) => [
        ...prev,
        {
          id: String(nextMessageIdRef.current++),
          sender: "assistant",
          tree: completedTree,
        },
      ]);
      clear();
    },
    onError: (err) => {
      setMessages((prev) => [
        ...prev,
        {
          id: String(nextMessageIdRef.current++),
          sender: "assistant",
          content: `Error: ${err.message}`,
        },
      ]);
    },
  });
  const isLoading = isStreaming;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    const prompt = inputValue.trim();
    setMessages((prev) => [
      ...prev,
      {
        id: String(nextMessageIdRef.current++),
        sender: "user",
        content: prompt,
      },
    ]);
    await send(prompt, { model: selectedModel });
    setInputValue("");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const input = inputValue;

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messages.length === 0 && !tree) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, tree]);

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
          <Image
            src="/marpa_logo_darkmode_transparent.png"
            alt="MARPA"
            width={160}
            height={48}
            style={{ height: 48, width: "auto" }}
            priority
          />
          <span style={{ color: COLORS.teal, fontSize: 14 }}>
            Q&A Assistant
          </span>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Link
            href="/"
            style={{
              color: COLORS.muted,
              fontSize: 13,
              textDecoration: "none",
            }}
          >
            Viewer
          </Link>
          <Link
            href="/presenter"
            style={{
              color: COLORS.muted,
              fontSize: 13,
              textDecoration: "none",
            }}
          >
            Presenter
          </Link>
          <Link
            href="/registry"
            style={{
              color: COLORS.muted,
              fontSize: 13,
              textDecoration: "none",
            }}
          >
            Registry
          </Link>
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
                  type="button"
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
                sender={msg.sender}
                content={msg.content}
                tree={msg.tree}
              />
            ))}
            {isLoading && tree && <Message sender="assistant" tree={tree} />}
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
