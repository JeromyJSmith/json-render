"use client";

import {
  SlideData,
  TitleContent,
  MetricsContent,
  ChartContent,
  ComparisonContent,
  TableContent,
} from "@/lib/schema";
import { TitleSlide } from "./TitleSlide";
import { MetricsSlide } from "./MetricsSlide";
import { ChartSlide } from "./ChartSlide";
import { ComparisonSlide } from "./ComparisonSlide";
import { TableSlide } from "./TableSlide";

export { TitleSlide, MetricsSlide, ChartSlide, ComparisonSlide, TableSlide };

// Main SlideRenderer component - renders any slide type from JSON
export function SlideRenderer({ slide }: { slide: SlideData }) {
  switch (slide.type) {
    case "title":
      return (
        <TitleSlide
          title={slide.title}
          content={slide.content as TitleContent}
        />
      );
    case "metrics":
      return (
        <MetricsSlide
          title={slide.title}
          chapter={slide.chapter}
          content={slide.content as MetricsContent}
        />
      );
    case "chart":
      return (
        <ChartSlide
          title={slide.title}
          chapter={slide.chapter}
          content={slide.content as ChartContent}
        />
      );
    case "comparison":
      return (
        <ComparisonSlide
          title={slide.title}
          chapter={slide.chapter}
          content={slide.content as ComparisonContent}
        />
      );
    case "table":
      return (
        <TableSlide
          title={slide.title}
          chapter={slide.chapter}
          content={slide.content as TableContent}
        />
      );
    default:
      return (
        <div
          style={{
            width: 1280,
            height: 720,
            background: "#0f1419",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#f5f7fa",
            fontSize: 24,
          }}
        >
          Unknown slide type: {slide.type}
        </div>
      );
  }
}
