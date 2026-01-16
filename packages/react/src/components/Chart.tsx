"use client";

import { useEffect, useRef } from "react";
import type { ComponentRenderProps } from "../renderer";
import { useData } from "../contexts/data";
import { getByPath, type ChartProps } from "@json-render/core";

function getDefaultColor(index: number, alpha: number): string {
  const colors = [
    `rgba(59, 130, 246, ${alpha})`, // blue
    `rgba(239, 68, 68, ${alpha})`, // red
    `rgba(34, 197, 94, ${alpha})`, // green
    `rgba(234, 179, 8, ${alpha})`, // yellow
    `rgba(168, 85, 247, ${alpha})`, // purple
    `rgba(236, 72, 153, ${alpha})`, // pink
    `rgba(20, 184, 166, ${alpha})`, // teal
    `rgba(249, 115, 22, ${alpha})`, // orange
  ];
  return colors[index % colors.length]!;
}

export function Chart({ element }: ComponentRenderProps<ChartProps>) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<unknown>(null);
  const { data } = useData();

  const props = element.props;

  // Support both inline data and dataPath binding
  const chartData = props.dataPath
    ? (getByPath(data, props.dataPath) as
        | {
            labels: string[];
            datasets: ChartProps["datasets"];
          }
        | undefined)
    : { labels: props.labels, datasets: props.datasets };

  useEffect(() => {
    if (!canvasRef.current || !chartData) return;

    // Dynamic import to avoid SSR issues
    import("chart.js/auto").then((ChartModule) => {
      const ChartJS = ChartModule.default;

      // Destroy existing chart
      if (chartRef.current) {
        (chartRef.current as { destroy: () => void }).destroy();
      }

      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) return;

      // Handle waterfall chart (rendered as stacked bar)
      const isWaterfall = props.type === "waterfall";
      const chartType = isWaterfall
        ? "bar"
        : props.type === "area"
          ? "line"
          : props.type;

      // Process datasets
      const processedDatasets = chartData.datasets.map((ds, idx) => {
        const baseConfig = {
          label: ds.label,
          data: ds.data,
          backgroundColor: ds.backgroundColor || getDefaultColor(idx, 0.6),
          borderColor: ds.borderColor || getDefaultColor(idx, 1),
          borderWidth: 2,
        };

        if (props.type === "area" || ds.fill) {
          return { ...baseConfig, fill: true };
        }

        if (props.type === "line") {
          return { ...baseConfig, tension: 0.4, pointRadius: 4 };
        }

        if (isWaterfall) {
          // Waterfall: color positive/negative differently
          const colors = ds.data.map((val) =>
            val >= 0
              ? props.positiveColor || "rgba(34, 197, 94, 0.8)"
              : props.negativeColor || "rgba(239, 68, 68, 0.8)",
          );
          return { ...baseConfig, backgroundColor: colors };
        }

        return baseConfig;
      });

      chartRef.current = new ChartJS(ctx, {
        type: chartType as "bar" | "line" | "pie" | "doughnut",
        data: {
          labels: chartData.labels,
          datasets: processedDatasets,
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: props.showLegend ?? true,
              position: "bottom",
            },
            title: props.title
              ? {
                  display: true,
                  text: props.title,
                }
              : undefined,
          },
          scales: ["bar", "line", "area", "waterfall"].includes(props.type)
            ? {
                x: { grid: { display: props.showGrid ?? true } },
                y: { grid: { display: props.showGrid ?? true } },
              }
            : undefined,
        },
      });
    });

    return () => {
      if (chartRef.current) {
        (chartRef.current as { destroy: () => void }).destroy();
      }
    };
  }, [
    chartData,
    props.type,
    props.title,
    props.showLegend,
    props.showGrid,
    props.positiveColor,
    props.negativeColor,
  ]);

  return (
    <div style={{ height: props.height ?? 300, position: "relative" }}>
      <canvas ref={canvasRef} />
    </div>
  );
}
