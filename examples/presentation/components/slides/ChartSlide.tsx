"use client";

import { useEffect, useRef } from "react";
import { ChartContent, COLORS } from "@/lib/schema";

interface ChartSlideProps {
  title: string;
  chapter?: string;
  content: ChartContent;
}

export function ChartSlide({ title, chapter, content }: ChartSlideProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Dynamic import Chart.js to avoid SSR issues
    import("chart.js/auto").then((ChartModule) => {
      const Chart = ChartModule.default;

      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) return;

      // Destroy existing chart if any
      const existingChart = Chart.getChart(canvasRef.current!);
      if (existingChart) existingChart.destroy();

      // Handle waterfall chart specially (rendered as bar with custom colors)
      const isWaterfall = content.chartType === "waterfall";
      const chartType = isWaterfall ? "bar" : content.chartType;

      // For waterfall, calculate cumulative values and colors
      let waterfallData: { data: number[]; colors: string[] } | null = null;
      if (isWaterfall && content.datasets[0]) {
        const ds = content.datasets[0];
        const data = ds.data;
        const colors: string[] = [];
        const adjustedData: number[] = [];
        let cumulative = 0;

        data.forEach((val, i) => {
          if (i === 0 || i === data.length - 1) {
            // First and last are totals
            adjustedData.push(val);
            colors.push(ds.color);
          } else {
            adjustedData.push(val);
            colors.push(
              val >= 0
                ? ds.color || COLORS.teal
                : ds.negativeColor || COLORS.coral,
            );
          }
          cumulative += val;
        });
        waterfallData = { data: adjustedData, colors };
      }

      new Chart(ctx, {
        type: chartType as "line" | "bar" | "doughnut" | "pie",
        data: {
          labels: content.labels,
          datasets: content.datasets.map((ds) => ({
            label: ds.label,
            data: waterfallData ? waterfallData.data : ds.data,
            borderColor: waterfallData ? waterfallData.colors : ds.color,
            backgroundColor: waterfallData
              ? waterfallData.colors.map((c) => c + "80")
              : content.chartType === "line"
                ? "transparent"
                : ds.color + "80",
            borderWidth: isWaterfall ? 1 : 3,
            pointBackgroundColor: COLORS.background,
            pointBorderColor: ds.color,
            pointBorderWidth: 2,
            pointRadius: 4,
            tension: 0.4,
            fill: content.chartType !== "line",
          })),
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: content.showLegend,
              position: "bottom",
              labels: {
                color: COLORS.muted,
                font: { family: "Inter" },
                padding: 20,
              },
            },
            tooltip: {
              backgroundColor: "rgba(15, 20, 25, 0.95)",
              titleColor: "#fff",
              bodyColor: COLORS.muted,
              padding: 12,
              borderColor: "rgba(255,255,255,0.1)",
              borderWidth: 1,
            },
          },
          scales:
            content.chartType === "line" || content.chartType === "bar"
              ? {
                  x: {
                    grid: { color: "rgba(4, 76, 115, 0.2)" },
                    ticks: {
                      color: COLORS.muted,
                      font: { family: "monospace", size: 11 },
                    },
                  },
                  y: {
                    grid: { color: "rgba(4, 76, 115, 0.2)" },
                    ticks: {
                      color: COLORS.muted,
                      font: { family: "monospace", size: 11 },
                      callback: (value) => "$" + value + "M",
                    },
                  },
                }
              : undefined,
        },
      });
    });
  }, [content]);

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
          marginBottom: 24,
          paddingBottom: 16,
          borderBottom: `1px solid ${COLORS.navy}`,
        }}
      >
        <div>
          {chapter && (
            <div
              style={{ display: "flex", alignItems: "center", marginBottom: 8 }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  background: COLORS.coral,
                  borderRadius: "50%",
                  marginRight: 8,
                }}
              />
              <p
                style={{
                  color: COLORS.coral,
                  fontWeight: 700,
                  letterSpacing: "0.2em",
                  fontSize: 12,
                  textTransform: "uppercase",
                }}
              >
                {chapter}
              </p>
            </div>
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

      {/* Chart Area */}
      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: 40,
          minHeight: 0,
        }}
      >
        {/* Chart Panel */}
        <div
          style={{
            background: "rgba(4, 76, 115, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.05)",
            borderRadius: 12,
            padding: 24,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
            <canvas ref={canvasRef} />
          </div>
        </div>

        {/* Data Panel */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          {/* Legend Cards */}
          {content.datasets.map((ds, i) => (
            <div
              key={i}
              style={{
                background: "rgba(4, 76, 115, 0.1)",
                border: "1px solid rgba(255, 255, 255, 0.05)",
                borderLeft: `4px solid ${ds.color}`,
                padding: 20,
                borderRadius: "0 8px 8px 0",
              }}
            >
              <p style={{ color: COLORS.muted, fontSize: 12, marginBottom: 4 }}>
                {ds.label}
              </p>
              <p
                style={{
                  color: ds.color,
                  fontSize: 28,
                  fontWeight: 700,
                  fontFamily: "monospace",
                }}
              >
                ${ds.data[ds.data.length - 1].toFixed(2)}M
              </p>
              <p style={{ color: COLORS.muted, fontSize: 12 }}>
                by {content.labels[content.labels.length - 1]}
              </p>
            </div>
          ))}

          {/* Insight Box */}
          {content.insight && (
            <div
              style={{
                marginTop: "auto",
                borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                paddingTop: 20,
              }}
            >
              <p
                style={{
                  color: COLORS.muted,
                  fontSize: 14,
                  lineHeight: 1.6,
                  fontStyle: "italic",
                }}
              >
                {content.insight}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
