"use client";

import { useState, useRef, useEffect } from "react";
import { SlideRenderer } from "@/components/slides";
import { sampleSlides, SlideData, COLORS } from "@/lib/schema";

export default function GenerativePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [slides, setSlides] = useState<SlideData[]>(sampleSlides);
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate scale to fit viewport
  useEffect(() => {
    const calculateScale = () => {
      if (!containerRef.current) return;
      const container = containerRef.current;
      const availableWidth = container.clientWidth - 40;
      const availableHeight = container.clientHeight - 20;
      const scaleX = availableWidth / 1280;
      const scaleY = availableHeight / 720;
      setScale(Math.min(scaleX, scaleY, 1));
    };

    calculateScale();
    window.addEventListener("resize", calculateScale);
    return () => window.removeEventListener("resize", calculateScale);
  }, []);

  // Handle prompt submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);

    // Parse simple commands
    const lowerPrompt = prompt.toLowerCase().trim();

    // "show slide X" or "slide X"
    const slideMatch = lowerPrompt.match(/(?:show\s+)?slide\s+(\d+)/);
    if (slideMatch) {
      const num = parseInt(slideMatch[1], 10) - 1;
      if (num >= 0 && num < slides.length) {
        setCurrentSlide(num);
      }
      setPrompt("");
      setIsLoading(false);
      return;
    }

    // "next" or "previous"
    if (lowerPrompt === "next") {
      setCurrentSlide((i) => Math.min(slides.length - 1, i + 1));
      setPrompt("");
      setIsLoading(false);
      return;
    }
    if (
      lowerPrompt === "previous" ||
      lowerPrompt === "prev" ||
      lowerPrompt === "back"
    ) {
      setCurrentSlide((i) => Math.max(0, i - 1));
      setPrompt("");
      setIsLoading(false);
      return;
    }

    // Search by title keyword
    const foundIndex = slides.findIndex(
      (s) =>
        s.title.toLowerCase().includes(lowerPrompt) ||
        s.chapter?.toLowerCase().includes(lowerPrompt),
    );
    if (foundIndex >= 0) {
      setCurrentSlide(foundIndex);
      setPrompt("");
      setIsLoading(false);
      return;
    }

    // Call AI to generate a new slide
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      if (data.error) {
        alert(`Error: ${data.error}`);
        setPrompt("");
        setIsLoading(false);
        return;
      }

      if (data.slide) {
        // Add the new slide and show it
        const newSlide = data.slide as SlideData;
        setSlides((prev) => [...prev, newSlide]);
        setCurrentSlide(slides.length); // Show the new slide
      }
    } catch (error) {
      alert(`Failed to generate slide: ${error}`);
    }

    setPrompt("");
    setIsLoading(false);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;

      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        setCurrentSlide((i) => Math.max(0, i - 1));
      } else if (
        e.key === "ArrowRight" ||
        e.key === "ArrowDown" ||
        e.key === " "
      ) {
        e.preventDefault();
        setCurrentSlide((i) => Math.min(slides.length - 1, i + 1));
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [slides.length]);

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#0a0a0a",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "12px 24px",
          background: "rgba(15,20,25,0.95)",
          borderBottom: `1px solid ${COLORS.coral}33`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span
            style={{
              color: COLORS.coral,
              fontWeight: 600,
              letterSpacing: "0.1em",
            }}
          >
            MARPA
          </span>
          <span style={{ color: COLORS.muted, fontSize: 14 }}>
            Generative UI
          </span>
        </div>
        <div style={{ color: COLORS.text, fontSize: 14 }}>
          {slides[currentSlide]?.title}
        </div>
        <div style={{ color: COLORS.muted, fontSize: 14 }}>
          Slide {currentSlide + 1} of {slides.length}
        </div>
      </div>

      {/* Slide thumbnails */}
      <div
        style={{
          padding: "8px 24px",
          background: "rgba(10,10,10,0.95)",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          display: "flex",
          gap: 8,
          overflowX: "auto",
        }}
      >
        {slides.map((slide, i) => (
          <button
            key={slide.id}
            onClick={() => setCurrentSlide(i)}
            style={{
              padding: "6px 12px",
              background:
                currentSlide === i
                  ? `${COLORS.coral}33`
                  : "rgba(255,255,255,0.05)",
              border:
                currentSlide === i
                  ? `1px solid ${COLORS.coral}`
                  : "1px solid rgba(255,255,255,0.1)",
              borderRadius: 4,
              color: currentSlide === i ? COLORS.coral : COLORS.muted,
              fontSize: 11,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {i + 1}. {slide.type}
          </button>
        ))}
      </div>

      {/* Slide Viewer */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          background: "#000",
        }}
      >
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "center center",
          }}
        >
          <SlideRenderer slide={slides[currentSlide]} />
        </div>
      </div>

      {/* Prompt Input */}
      <form
        onSubmit={handleSubmit}
        style={{
          padding: "16px 24px",
          background: "rgba(15,20,25,0.95)",
          borderTop: `1px solid ${COLORS.coral}33`,
          display: "flex",
          gap: 12,
        }}
      >
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask for a slide... (e.g., 'show slide 2', 'financial dashboard', 'growth projection')"
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
          disabled={isLoading}
          style={{
            padding: "12px 24px",
            background: COLORS.coral,
            border: "none",
            borderRadius: 8,
            color: "#fff",
            fontWeight: 600,
            cursor: "pointer",
            opacity: isLoading ? 0.5 : 1,
          }}
        >
          {isLoading ? "Loading..." : "Go"}
        </button>
      </form>

      {/* Navigation buttons */}
      <div
        style={{
          padding: "12px 24px",
          background: "rgba(15,20,25,0.95)",
          display: "flex",
          justifyContent: "center",
          gap: 16,
        }}
      >
        <button
          onClick={() => setCurrentSlide((i) => Math.max(0, i - 1))}
          disabled={currentSlide === 0}
          style={{
            padding: "8px 20px",
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: 6,
            color: COLORS.text,
            cursor: "pointer",
            opacity: currentSlide === 0 ? 0.3 : 1,
          }}
        >
          Previous
        </button>
        <button
          onClick={() =>
            setCurrentSlide((i) => Math.min(slides.length - 1, i + 1))
          }
          disabled={currentSlide === slides.length - 1}
          style={{
            padding: "8px 20px",
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: 6,
            color: COLORS.text,
            cursor: "pointer",
            opacity: currentSlide === slides.length - 1 ? 0.3 : 1,
          }}
        >
          Next
        </button>
      </div>
    </div>
  );
}
