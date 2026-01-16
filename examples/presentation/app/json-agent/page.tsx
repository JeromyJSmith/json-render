"use client";

import { useState, useRef, useEffect } from "react";
import { useUIStream } from "@json-render/react";
import { Renderer } from "@json-render/react";
import { slideCatalog } from "@/lib/catalog";
import { COLORS } from "@/lib/schema";

// Component map for rendering UITree elements
const componentMap = {
  TitleSlide: ({ props }: { props: Record<string, unknown> }) => (
    <div
      style={{
        width: 1280,
        height: 720,
        background: `linear-gradient(135deg, ${COLORS.navy} 0%, #0a0a0a 100%)`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: 80,
        position: "relative",
      }}
    >
      {typeof props.tag === "string" && props.tag && (
        <div
          style={{
            position: "absolute",
            top: 40,
            left: 40,
            background: `${COLORS.coral}22`,
            border: `1px solid ${COLORS.coral}`,
            padding: "8px 16px",
            borderRadius: 4,
            color: COLORS.coral,
            fontSize: 12,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
          }}
        >
          {props.tag}
        </div>
      )}
      <h1
        style={{
          fontSize: 64,
          fontWeight: 700,
          color: COLORS.text,
          textAlign: "center",
          marginBottom: 24,
          lineHeight: 1.2,
        }}
      >
        {props.title as string}
      </h1>
      {typeof props.subtitle === "string" && props.subtitle && (
        <p
          style={{
            fontSize: 24,
            color: COLORS.muted,
            textAlign: "center",
            maxWidth: 800,
          }}
        >
          {props.subtitle}
        </p>
      )}
      {Array.isArray(props.bullets) && (
        <ul
          style={{
            marginTop: 40,
            listStyle: "none",
            padding: 0,
          }}
        >
          {(props.bullets as string[]).map((bullet, i) => (
            <li
              key={i}
              style={{
                fontSize: 20,
                color: COLORS.text,
                marginBottom: 12,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <span style={{ color: COLORS.coral }}>*</span>
              {bullet}
            </li>
          ))}
        </ul>
      )}
    </div>
  ),

  MetricsSlide: ({ props }: { props: Record<string, unknown> }) => {
    const metrics = props.metrics as Array<{
      label: string;
      value: string;
      description?: string;
      color?: string;
      progress?: number;
    }>;

    return (
      <div
        style={{
          width: 1280,
          height: 720,
          background: "#0a0a0a",
          padding: 60,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <h2
          style={{
            fontSize: 40,
            fontWeight: 600,
            color: COLORS.text,
            marginBottom: 40,
            borderBottom: `2px solid ${COLORS.coral}`,
            paddingBottom: 16,
          }}
        >
          {props.title as string}
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${Math.min(metrics.length, 4)}, 1fr)`,
            gap: 24,
            flex: 1,
            alignContent: "center",
          }}
        >
          {metrics.map((metric, i) => (
            <div
              key={i}
              style={{
                background: "#111",
                borderRadius: 12,
                padding: 32,
                border: `1px solid ${COLORS[metric.color as keyof typeof COLORS] || COLORS.teal}33`,
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  color: COLORS.muted,
                  marginBottom: 8,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                {metric.label}
              </div>
              <div
                style={{
                  fontSize: 48,
                  fontWeight: 700,
                  color:
                    COLORS[metric.color as keyof typeof COLORS] || COLORS.teal,
                  marginBottom: 8,
                }}
              >
                {metric.value}
              </div>
              {metric.description && (
                <div style={{ fontSize: 14, color: COLORS.muted }}>
                  {metric.description}
                </div>
              )}
              {metric.progress !== undefined && (
                <div
                  style={{
                    marginTop: 16,
                    height: 6,
                    background: "#222",
                    borderRadius: 3,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${metric.progress}%`,
                      background:
                        COLORS[metric.color as keyof typeof COLORS] ||
                        COLORS.teal,
                      borderRadius: 3,
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  },

  ChartSlide: ({ props }: { props: Record<string, unknown> }) => {
    const labels = props.labels as string[];
    const datasets = props.datasets as Array<{
      label: string;
      data: number[];
      color: string;
    }>;
    const maxValue = Math.max(...datasets.flatMap((d) => d.data));

    return (
      <div
        style={{
          width: 1280,
          height: 720,
          background: "#0a0a0a",
          padding: 60,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <h2
          style={{
            fontSize: 40,
            fontWeight: 600,
            color: COLORS.text,
            marginBottom: 40,
          }}
        >
          {props.title as string}
        </h2>
        <div
          style={{ flex: 1, display: "flex", alignItems: "flex-end", gap: 8 }}
        >
          {labels.map((label, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: 4,
                  alignItems: "flex-end",
                  height: 400,
                }}
              >
                {datasets.map((dataset, j) => (
                  <div
                    key={j}
                    style={{
                      width: 30,
                      height: `${(dataset.data[i] / maxValue) * 100}%`,
                      background: dataset.color || COLORS.teal,
                      borderRadius: "4px 4px 0 0",
                    }}
                  />
                ))}
              </div>
              <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 8 }}>
                {label}
              </div>
            </div>
          ))}
        </div>
        {typeof props.insight === "string" && props.insight && (
          <div
            style={{
              marginTop: 24,
              padding: 16,
              background: `${COLORS.teal}11`,
              borderLeft: `3px solid ${COLORS.teal}`,
              color: COLORS.text,
              fontSize: 16,
            }}
          >
            {props.insight}
          </div>
        )}
        <div style={{ display: "flex", gap: 24, marginTop: 16 }}>
          {datasets.map((d, i) => (
            <div
              key={i}
              style={{ display: "flex", alignItems: "center", gap: 8 }}
            >
              <div
                style={{
                  width: 12,
                  height: 12,
                  background: d.color,
                  borderRadius: 2,
                }}
              />
              <span style={{ fontSize: 14, color: COLORS.muted }}>
                {d.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  },

  ComparisonSlide: ({ props }: { props: Record<string, unknown> }) => {
    const columns = props.columns as Array<{
      title: string;
      subtitle?: string;
      items: Array<{ label: string; value: string }>;
      footer?: string;
    }>;
    const highlight = props.highlight as number | undefined;

    return (
      <div
        style={{
          width: 1280,
          height: 720,
          background: "#0a0a0a",
          padding: 60,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <h2
          style={{
            fontSize: 40,
            fontWeight: 600,
            color: COLORS.text,
            marginBottom: 40,
          }}
        >
          {props.title as string}
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${columns.length}, 1fr)`,
            gap: 24,
            flex: 1,
          }}
        >
          {columns.map((col, i) => (
            <div
              key={i}
              style={{
                background: i === highlight ? `${COLORS.coral}11` : "#111",
                borderRadius: 12,
                padding: 32,
                border: `2px solid ${i === highlight ? COLORS.coral : "transparent"}`,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <h3
                style={{
                  fontSize: 24,
                  fontWeight: 600,
                  color: i === highlight ? COLORS.coral : COLORS.text,
                  marginBottom: 8,
                }}
              >
                {col.title}
              </h3>
              {col.subtitle && (
                <p
                  style={{
                    fontSize: 14,
                    color: COLORS.muted,
                    marginBottom: 24,
                  }}
                >
                  {col.subtitle}
                </p>
              )}
              <div style={{ flex: 1 }}>
                {col.items.map((item, j) => (
                  <div
                    key={j}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "12px 0",
                      borderBottom: `1px solid #222`,
                    }}
                  >
                    <span style={{ color: COLORS.muted, fontSize: 14 }}>
                      {item.label}
                    </span>
                    <span style={{ color: COLORS.text, fontWeight: 600 }}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
              {col.footer && (
                <div
                  style={{
                    marginTop: 16,
                    padding: 12,
                    background:
                      i === highlight ? `${COLORS.coral}22` : "#1a1a1a",
                    borderRadius: 6,
                    textAlign: "center",
                    color: i === highlight ? COLORS.coral : COLORS.muted,
                    fontWeight: 600,
                    fontSize: 14,
                  }}
                >
                  {col.footer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  },

  TableSlide: ({ props }: { props: Record<string, unknown> }) => {
    const headers = props.headers as string[];
    const rows = props.rows as string[][];

    return (
      <div
        style={{
          width: 1280,
          height: 720,
          background: "#0a0a0a",
          padding: 60,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <h2
          style={{
            fontSize: 40,
            fontWeight: 600,
            color: COLORS.text,
            marginBottom: 40,
          }}
        >
          {props.title as string}
        </h2>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr>
              {headers.map((h, i) => (
                <th
                  key={i}
                  style={{
                    padding: "16px 20px",
                    textAlign: "left",
                    background: COLORS.navy,
                    color: COLORS.text,
                    fontWeight: 600,
                    fontSize: 14,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={i}
                style={{
                  background:
                    i === (props.highlightRow as number)
                      ? `${COLORS.coral}11`
                      : i % 2
                        ? "#111"
                        : "#0a0a0a",
                }}
              >
                {row.map((cell, j) => (
                  <td
                    key={j}
                    style={{
                      padding: "16px 20px",
                      color: COLORS.text,
                      borderBottom: "1px solid #222",
                    }}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {typeof props.caption === "string" && props.caption && (
          <p
            style={{
              marginTop: 16,
              fontSize: 14,
              color: COLORS.muted,
              fontStyle: "italic",
            }}
          >
            {props.caption}
          </p>
        )}
      </div>
    );
  },

  TextSlide: ({ props }: { props: Record<string, unknown> }) => (
    <div
      style={{
        width: 1280,
        height: 720,
        background: "#0a0a0a",
        padding: 80,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <h2
        style={{
          fontSize: 48,
          fontWeight: 600,
          color: COLORS.text,
          marginBottom: 40,
        }}
      >
        {props.title as string}
      </h2>
      <p
        style={{
          fontSize: 24,
          color: COLORS.text,
          lineHeight: 1.8,
          maxWidth: 900,
        }}
      >
        {props.content as string}
      </p>
      {typeof props.highlight === "string" && props.highlight && (
        <blockquote
          style={{
            marginTop: 40,
            padding: 32,
            background: `${COLORS.coral}11`,
            borderLeft: `4px solid ${COLORS.coral}`,
            fontSize: 28,
            fontStyle: "italic",
            color: COLORS.coral,
          }}
        >
          {props.highlight}
        </blockquote>
      )}
    </div>
  ),

  Row: ({
    props,
    children,
  }: {
    props: Record<string, unknown>;
    children?: React.ReactNode;
  }) => (
    <div
      style={{
        display: "flex",
        gap: (props.gap as number) || 16,
        alignItems: (props.align as string) || "stretch",
      }}
    >
      {children}
    </div>
  ),

  Column: ({
    props,
    children,
  }: {
    props: Record<string, unknown>;
    children?: React.ReactNode;
  }) => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: (props.gap as number) || 16,
        alignItems: (props.align as string) || "stretch",
      }}
    >
      {children}
    </div>
  ),

  MetricCard: ({ props }: { props: Record<string, unknown> }) => (
    <div
      style={{
        background: "#111",
        borderRadius: 12,
        padding: 24,
        border: `1px solid ${COLORS[(props.color as keyof typeof COLORS) || "teal"]}33`,
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: COLORS.muted,
          marginBottom: 4,
          textTransform: "uppercase",
        }}
      >
        {props.label as string}
      </div>
      <div
        style={{
          fontSize: 36,
          fontWeight: 700,
          color: COLORS[(props.color as keyof typeof COLORS) || "teal"],
        }}
      >
        {props.value as string}
      </div>
    </div>
  ),
};

// Tree renderer component
function TreeRenderer({
  tree,
}: {
  tree: { root: string; elements: Record<string, unknown> } | null;
}) {
  if (!tree || !tree.root || !tree.elements[tree.root]) {
    return (
      <div
        style={{
          width: 1280,
          height: 720,
          background: "#0a0a0a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: COLORS.muted,
          fontSize: 24,
        }}
      >
        No slide generated yet
      </div>
    );
  }

  const renderElement = (key: string): React.ReactNode => {
    const element = tree.elements[key] as {
      type: string;
      props: Record<string, unknown>;
      children?: string[];
    };
    if (!element) return null;

    const Component = componentMap[element.type as keyof typeof componentMap];
    if (!Component) {
      console.warn(`Unknown component type: ${element.type}`);
      return null;
    }

    const children = element.children?.map(renderElement);
    return (
      <Component key={key} props={element.props}>
        {children}
      </Component>
    );
  };

  return <>{renderElement(tree.root)}</>;
}

export default function JsonAgentPage() {
  const [messages, setMessages] = useState<
    Array<{ role: "user" | "assistant"; content: string }>
  >([]);
  const [input, setInput] = useState("");
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { tree, isStreaming, error, send, clear } = useUIStream({
    api: "/api/stream",
    onComplete: (completedTree) => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Slide generated! It shows: ${JSON.stringify(completedTree.elements[completedTree.root]?.type || "unknown")}`,
        },
      ]);
    },
    onError: (err) => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Error: ${err.message}` },
      ]);
    },
  });

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Calculate scale
  useEffect(() => {
    const calculateScale = () => {
      if (!containerRef.current) return;
      const container = containerRef.current;
      const scaleX = (container.clientWidth - 20) / 1280;
      const scaleY = (container.clientHeight - 20) / 720;
      setScale(Math.min(scaleX, scaleY, 1));
    };
    calculateScale();
    window.addEventListener("resize", calculateScale);
    return () => window.removeEventListener("resize", calculateScale);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);

    await send(userMessage);
  };

  return (
    <div
      style={{
        height: "100vh",
        display: "grid",
        gridTemplateColumns: "400px 1fr",
        background: "#0a0a0a",
      }}
    >
      {/* Chat Panel */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          borderRight: `1px solid ${COLORS.navy}`,
          background: "rgba(15,20,25,0.95)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: `1px solid ${COLORS.coral}33`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <span
              style={{
                color: COLORS.coral,
                fontWeight: 600,
                letterSpacing: "0.1em",
              }}
            >
              MARPA
            </span>
            <span style={{ color: COLORS.muted, fontSize: 14, marginLeft: 8 }}>
              json-render Agent
            </span>
          </div>
          <button
            onClick={clear}
            style={{
              padding: "6px 12px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 4,
              color: COLORS.muted,
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            Clear
          </button>
        </div>

        {/* Messages */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {messages.length === 0 && (
            <div
              style={{
                color: COLORS.muted,
                fontSize: 14,
                textAlign: "center",
                marginTop: 40,
              }}
            >
              <p style={{ marginBottom: 16 }}>Ask me to create slides!</p>
              <p style={{ fontSize: 12 }}>Using json-render streaming UI</p>
              <ul
                style={{
                  fontSize: 12,
                  listStyle: "none",
                  padding: 0,
                  marginTop: 16,
                }}
              >
                <li style={{ marginBottom: 8 }}>
                  "Create a title slide for MARPA 2026"
                </li>
                <li style={{ marginBottom: 8 }}>
                  "Show me the financial metrics"
                </li>
                <li style={{ marginBottom: 8 }}>
                  "Compare the ownership paths"
                </li>
              </ul>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                padding: "12px 16px",
                borderRadius: 8,
                background:
                  msg.role === "user"
                    ? `${COLORS.coral}22`
                    : "rgba(255,255,255,0.05)",
                borderLeft: `3px solid ${msg.role === "user" ? COLORS.coral : COLORS.teal}`,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: COLORS.muted,
                  marginBottom: 6,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                {msg.role === "user" ? "You" : "Agent"}
              </div>
              <div
                style={{ color: COLORS.text, fontSize: 14, lineHeight: 1.5 }}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {isStreaming && (
            <div
              style={{
                padding: "12px 16px",
                borderRadius: 8,
                background: "rgba(255,255,255,0.05)",
                borderLeft: `3px solid ${COLORS.teal}`,
              }}
            >
              <div style={{ color: COLORS.teal, fontSize: 14 }}>
                Streaming UI...
              </div>
            </div>
          )}

          {error && (
            <div
              style={{
                padding: "12px 16px",
                borderRadius: 8,
                background: `${COLORS.coral}22`,
                borderLeft: `3px solid ${COLORS.coral}`,
                color: COLORS.coral,
                fontSize: 14,
              }}
            >
              Error: {error.message}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          style={{
            padding: 16,
            borderTop: `1px solid ${COLORS.navy}`,
            display: "flex",
            gap: 8,
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask for a slide..."
            disabled={isStreaming}
            style={{
              flex: 1,
              padding: "12px 16px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              color: COLORS.text,
              fontSize: 14,
              outline: "none",
            }}
          />
          <button
            type="submit"
            disabled={isStreaming}
            style={{
              padding: "12px 20px",
              background: COLORS.coral,
              border: "none",
              borderRadius: 8,
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
              opacity: isStreaming ? 0.5 : 1,
            }}
          >
            Send
          </button>
        </form>
      </div>

      {/* Slide Panel */}
      <div
        ref={containerRef}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#000",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "center center",
          }}
        >
          <TreeRenderer
            tree={
              tree as { root: string; elements: Record<string, unknown> } | null
            }
          />
        </div>
      </div>
    </div>
  );
}
