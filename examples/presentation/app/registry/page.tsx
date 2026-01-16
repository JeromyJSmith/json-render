"use client";

import { useState, useEffect } from "react";
import { COLORS } from "@/lib/schema";
import {
  getSlideRegistry,
  type SlideRegistryEntry,
  type SlideRegistry,
} from "@/lib/slide-registry";
import { CANONICAL, DISPLAY } from "@/lib/canonical";

export default function RegistryPage() {
  const [registry, setRegistry] = useState<SlideRegistry | null>(null);
  const [selectedSlide, setSelectedSlide] = useState<SlideRegistryEntry | null>(
    null,
  );
  const [filter, setFilter] = useState<"all" | "invalid" | "viewed">("all");

  useEffect(() => {
    const reg = getSlideRegistry();
    setRegistry(reg.exportRegistry());
  }, []);

  const handleRevalidate = () => {
    const reg = getSlideRegistry();
    reg.revalidate();
    setRegistry(reg.exportRegistry());
  };

  const handleClearHistory = () => {
    if (confirm("Clear all render history?")) {
      const reg = getSlideRegistry();
      reg.clearHistory();
      setRegistry(reg.exportRegistry());
    }
  };

  const filteredSlides = registry?.slides.filter((s) => {
    if (filter === "invalid") return s.validationStatus === "invalid";
    if (filter === "viewed") return s.renderCount > 0;
    return true;
  });

  const invalidCount =
    registry?.slides.filter((s) => s.validationStatus === "invalid").length ||
    0;
  const viewedCount =
    registry?.slides.filter((s) => s.renderCount > 0).length || 0;

  if (!registry) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: COLORS.background,
          color: COLORS.text,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        Loading registry...
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: COLORS.background,
        color: COLORS.text,
        padding: 24,
      }}
    >
      {/* Header */}
      <div
        style={{
          marginBottom: 24,
          borderBottom: `1px solid ${COLORS.navy}`,
          paddingBottom: 16,
        }}
      >
        <h1 style={{ color: COLORS.coral, marginBottom: 8 }}>Slide Registry</h1>
        <p style={{ color: COLORS.muted, fontSize: 14 }}>
          Track slide renders and validate canonical data compliance
        </p>
      </div>

      {/* Stats Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <StatCard label="Total Slides" value={registry.totalSlides} />
        <StatCard label="Total Renders" value={registry.stats.totalRenders} />
        <StatCard label="Slides Viewed" value={viewedCount} />
        <StatCard
          label="Invalid Slides"
          value={invalidCount}
          color={invalidCount > 0 ? COLORS.coral : COLORS.teal}
        />
        <StatCard
          label="Most Viewed"
          value={registry.stats.mostViewedSlide || "-"}
        />
      </div>

      {/* Canonical Values Quick Ref */}
      <div
        style={{
          background: `${COLORS.navy}44`,
          border: `1px solid ${COLORS.navy}`,
          borderRadius: 8,
          padding: 16,
          marginBottom: 24,
        }}
      >
        <h3 style={{ color: COLORS.teal, marginBottom: 12, fontSize: 14 }}>
          Canonical Values Reference
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 12,
            fontSize: 12,
          }}
        >
          <CanonicalItem label="Valuation" value={DISPLAY.enterpriseValue} />
          <CanonicalItem label="EBITDA" value={DISPLAY.ebitda} />
          <CanonicalItem label="Multiple" value={DISPLAY.ebitdaMultiple} />
          <CanonicalItem label="Revenue" value={DISPLAY.revenue} />
          <CanonicalItem label="Win Rate" value={DISPLAY.winRate} />
          <CanonicalItem label="Ownership" value={DISPLAY.ownershipSplit} />
          <CanonicalItem label="Vesting" value={DISPLAY.vestingPeriod} />
          <CanonicalItem label="Year 11" value={DISPLAY.year11Target} />
        </div>
      </div>

      {/* Actions & Filters */}
      <div
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        <button onClick={handleRevalidate} style={buttonStyle}>
          Re-validate All
        </button>
        <button
          onClick={handleClearHistory}
          style={{ ...buttonStyle, background: COLORS.coral }}
        >
          Clear History
        </button>
        <div style={{ flex: 1 }} />
        <FilterButton
          label="All"
          active={filter === "all"}
          onClick={() => setFilter("all")}
        />
        <FilterButton
          label={`Invalid (${invalidCount})`}
          active={filter === "invalid"}
          onClick={() => setFilter("invalid")}
        />
        <FilterButton
          label={`Viewed (${viewedCount})`}
          active={filter === "viewed"}
          onClick={() => setFilter("viewed")}
        />
      </div>

      {/* Main Content */}
      <div style={{ display: "flex", gap: 24 }}>
        {/* Slide List */}
        <div
          style={{
            flex: 1,
            background: `${COLORS.navy}22`,
            border: `1px solid ${COLORS.navy}`,
            borderRadius: 8,
            maxHeight: 600,
            overflow: "auto",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr
                style={{
                  background: COLORS.navy,
                  position: "sticky",
                  top: 0,
                }}
              >
                <th style={thStyle}>ID</th>
                <th style={thStyle}>Title</th>
                <th style={thStyle}>Chapter</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Renders</th>
              </tr>
            </thead>
            <tbody>
              {filteredSlides?.map((slide) => (
                <tr
                  key={slide.id}
                  onClick={() => setSelectedSlide(slide)}
                  style={{
                    cursor: "pointer",
                    background:
                      selectedSlide?.id === slide.id
                        ? `${COLORS.teal}22`
                        : "transparent",
                    borderBottom: `1px solid ${COLORS.navy}44`,
                  }}
                >
                  <td style={tdStyle}>{slide.id}</td>
                  <td style={{ ...tdStyle, maxWidth: 200 }}>
                    <div
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {slide.title}
                    </div>
                  </td>
                  <td style={tdStyle}>{slide.chapter || "-"}</td>
                  <td style={tdStyle}>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: 4,
                        fontSize: 11,
                        background:
                          slide.validationStatus === "valid"
                            ? `${COLORS.teal}33`
                            : `${COLORS.coral}33`,
                        color:
                          slide.validationStatus === "valid"
                            ? COLORS.teal
                            : COLORS.coral,
                      }}
                    >
                      {slide.validationStatus}
                    </span>
                  </td>
                  <td style={tdStyle}>{slide.renderCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Detail Panel */}
        {selectedSlide && (
          <div
            style={{
              width: 350,
              background: `${COLORS.navy}22`,
              border: `1px solid ${COLORS.navy}`,
              borderRadius: 8,
              padding: 16,
            }}
          >
            <h3 style={{ color: COLORS.coral, marginBottom: 16 }}>
              Slide {selectedSlide.id}
            </h3>

            <DetailRow label="Title" value={selectedSlide.title} />
            <DetailRow label="File" value={selectedSlide.key} />
            <DetailRow label="Chapter" value={selectedSlide.chapter || "-"} />
            <DetailRow
              label="Render Count"
              value={selectedSlide.renderCount.toString()}
            />
            <DetailRow
              label="Last Rendered"
              value={
                selectedSlide.lastRendered
                  ? new Date(selectedSlide.lastRendered).toLocaleString()
                  : "Never"
              }
            />

            {selectedSlide.canonicalRefs.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <p
                  style={{
                    color: COLORS.muted,
                    fontSize: 11,
                    marginBottom: 8,
                  }}
                >
                  CANONICAL REFERENCES
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {selectedSlide.canonicalRefs.map((ref) => (
                    <span
                      key={ref}
                      style={{
                        padding: "2px 8px",
                        background: `${COLORS.teal}22`,
                        border: `1px solid ${COLORS.teal}44`,
                        borderRadius: 4,
                        fontSize: 11,
                        color: COLORS.teal,
                      }}
                    >
                      {ref}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedSlide.validationErrors.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <p
                  style={{
                    color: COLORS.coral,
                    fontSize: 11,
                    marginBottom: 8,
                  }}
                >
                  VALIDATION ERRORS
                </p>
                {selectedSlide.validationErrors.map((err, i) => (
                  <p
                    key={i}
                    style={{
                      color: COLORS.coral,
                      fontSize: 12,
                      background: `${COLORS.coral}11`,
                      padding: 8,
                      borderRadius: 4,
                      marginBottom: 4,
                    }}
                  >
                    {err}
                  </p>
                ))}
              </div>
            )}

            {selectedSlide.renderHistory.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <p
                  style={{
                    color: COLORS.muted,
                    fontSize: 11,
                    marginBottom: 8,
                  }}
                >
                  RENDER HISTORY (last 5)
                </p>
                {selectedSlide.renderHistory.slice(-5).map((event, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: 11,
                      color: COLORS.muted,
                      marginBottom: 4,
                    }}
                  >
                    {new Date(event.timestamp).toLocaleString()} -{" "}
                    {event.source}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div
        style={{
          marginTop: 24,
          paddingTop: 16,
          borderTop: `1px solid ${COLORS.navy}`,
        }}
      >
        <a
          href="/"
          style={{ color: COLORS.teal, fontSize: 14, marginRight: 16 }}
        >
          Viewer
        </a>
        <a href="/presenter" style={{ color: COLORS.teal, fontSize: 14 }}>
          Presenter
        </a>
      </div>
    </div>
  );
}

// Helper Components
function StatCard({
  label,
  value,
  color = COLORS.teal,
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div
      style={{
        background: `${COLORS.navy}44`,
        border: `1px solid ${COLORS.navy}`,
        borderRadius: 8,
        padding: 16,
        textAlign: "center",
      }}
    >
      <div style={{ color, fontSize: 28, fontWeight: 700 }}>{value}</div>
      <div style={{ color: COLORS.muted, fontSize: 12 }}>{label}</div>
    </div>
  );
}

function CanonicalItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span style={{ color: COLORS.muted }}>{label}: </span>
      <span style={{ color: COLORS.text, fontWeight: 600 }}>{value}</span>
    </div>
  );
}

function FilterButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "8px 16px",
        background: active ? COLORS.teal : "transparent",
        border: `1px solid ${active ? COLORS.teal : COLORS.navy}`,
        borderRadius: 4,
        color: active ? COLORS.background : COLORS.text,
        cursor: "pointer",
        fontSize: 13,
      }}
    >
      {label}
    </button>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <span style={{ color: COLORS.muted, fontSize: 11 }}>{label}</span>
      <div style={{ color: COLORS.text, fontSize: 13 }}>{value}</div>
    </div>
  );
}

const buttonStyle: React.CSSProperties = {
  padding: "8px 16px",
  background: COLORS.navy,
  border: "none",
  borderRadius: 4,
  color: COLORS.text,
  cursor: "pointer",
  fontSize: 13,
};

const thStyle: React.CSSProperties = {
  padding: "12px 8px",
  textAlign: "left",
  fontSize: 11,
  color: COLORS.muted,
  textTransform: "uppercase",
};

const tdStyle: React.CSSProperties = {
  padding: "10px 8px",
  fontSize: 13,
  color: COLORS.text,
};
