"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  DataProvider,
  ActionProvider,
  VisibilityProvider,
  Renderer,
} from "@json-render/react";
import type { UITree, UIElement } from "@json-render/core";
import { slides, chapters, TOTAL_SLIDES } from "@/lib/slides";

// Helper to get audio filename from slide index
function getAudioFile(slideIndex: number): string {
  const num = String(slideIndex + 1).padStart(3, "0");
  return `/audio/slide_${num}.mp3`;
}

// Component registry for json-render
const componentRegistry = {
  SlideViewer: ({ element }: { element: UIElement }) => {
    const slideIndex = element.props.slideIndex as number;
    const slide = slides[slideIndex];
    const basePath = "/slides/";
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);

    // Calculate scale to fit viewport
    useEffect(() => {
      const calculateScale = () => {
        if (!containerRef.current) return;
        const container = containerRef.current;
        const availableWidth = container.clientWidth - 40; // padding
        const availableHeight = container.clientHeight - 20;
        const scaleX = availableWidth / 1280;
        const scaleY = availableHeight / 720;
        setScale(Math.min(scaleX, scaleY, 1)); // don't scale up, only down
      };

      calculateScale();
      window.addEventListener("resize", calculateScale);
      return () => window.removeEventListener("resize", calculateScale);
    }, []);

    return (
      <div
        ref={containerRef}
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "#000",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: 1280,
            height: 720,
            transform: `scale(${scale})`,
            transformOrigin: "center center",
          }}
        >
          <iframe
            src={`${basePath}${slide.file}`}
            style={{
              width: 1280,
              height: 720,
              border: "none",
              background: "#0f1419",
              boxShadow: "0 10px 40px rgba(0,0,0,0.8)",
            }}
            title={slide.title}
          />
        </div>
      </div>
    );
  },

  SlideNav: ({
    element,
    onAction,
  }: {
    element: UIElement;
    onAction: (action: { name: string }) => void;
  }) => {
    const current = element.props.current as number;
    const total = element.props.total as number;

    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 20,
          padding: "16px 24px",
          background: "rgba(15,20,25,0.95)",
          borderTop: "1px solid rgba(239,99,55,0.3)",
        }}
      >
        <button
          onClick={() => onAction({ name: "prev" })}
          disabled={current === 0}
          className="nav-btn"
        >
          Previous
        </button>

        <div className="slide-counter">
          {current + 1} / {total}
        </div>

        <button
          onClick={() => onAction({ name: "next" })}
          disabled={current === total - 1}
          className="nav-btn"
        >
          Next
        </button>
      </div>
    );
  },

  SlideInfo: ({ element }: { element: UIElement }) => {
    const title = element.props.title as string;
    const chapter = element.props.chapter as string | undefined;

    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 24px",
          background: "rgba(15,20,25,0.95)",
          borderBottom: "1px solid rgba(239,99,55,0.3)",
        }}
      >
        <div
          style={{ color: "#ef6337", fontWeight: 600, letterSpacing: "0.1em" }}
        >
          MARPA
        </div>
        <div style={{ color: "#8db6b0", fontSize: 14 }}>{title}</div>
        {chapter && (
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>
            {chapter}
          </div>
        )}
      </div>
    );
  },

  ChapterNav: ({
    element,
    onAction,
  }: {
    element: UIElement;
    onAction: (action: {
      name: string;
      params?: Record<string, unknown>;
    }) => void;
  }) => {
    const currentChapter = element.props.currentChapter as string | undefined;

    return (
      <div
        style={{
          display: "flex",
          gap: 8,
          padding: "8px 24px",
          background: "rgba(10,10,10,0.95)",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          overflowX: "auto",
        }}
      >
        {chapters.map((ch) => (
          <button
            key={ch.id}
            onClick={() =>
              onAction({
                name: "goto_chapter",
                params: { slideIndex: ch.startSlide },
              })
            }
            style={{
              padding: "6px 12px",
              background:
                currentChapter === ch.name
                  ? "rgba(239,99,55,0.3)"
                  : "rgba(255,255,255,0.05)",
              border:
                currentChapter === ch.name
                  ? "1px solid #ef6337"
                  : "1px solid rgba(255,255,255,0.1)",
              borderRadius: 4,
              color: currentChapter === ch.name ? "#ef6337" : "#8b949e",
              fontSize: 12,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {ch.name}
          </button>
        ))}
      </div>
    );
  },

  ProgressBar: ({ element }: { element: UIElement }) => {
    const current = element.props.current as number;
    const total = element.props.total as number;
    const progress = ((current + 1) / total) * 100;

    return (
      <div
        style={{
          width: "100%",
          maxWidth: 600,
          height: 4,
          background: "rgba(255,255,255,0.1)",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: "100%",
            background: "#ef6337",
            transition: "width 0.3s ease",
          }}
        />
      </div>
    );
  },

  AudioPlayer: ({
    element,
    onAction,
  }: {
    element: UIElement;
    onAction: (action: { name: string }) => void;
  }) => {
    const isPlaying = element.props.isPlaying as boolean;
    const autoAdvance = element.props.autoAdvance as boolean;

    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <button
          onClick={() => onAction({ name: "toggle_audio" })}
          style={{
            padding: "8px 16px",
            background: isPlaying ? "#ef6337" : "rgba(255,255,255,0.1)",
            border: "1px solid rgba(239,99,55,0.5)",
            borderRadius: 4,
            color: "#fff",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          {isPlaying ? "Pause" : "Play Audio"}
        </button>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            color: "#8b949e",
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={autoAdvance}
            onChange={() => onAction({ name: "toggle_auto_advance" })}
            style={{ accentColor: "#ef6337" }}
          />
          Auto-advance
        </label>
      </div>
    );
  },
};

function buildUITree(
  slideIndex: number,
  isPlaying: boolean,
  autoAdvance: boolean,
): UITree {
  const slide = slides[slideIndex];

  return {
    root: "container",
    elements: {
      container: {
        type: "Stack",
        props: { direction: "column", gap: 0 },
        children: ["info", "chapterNav", "viewer", "controlsRow"],
      },
      info: {
        type: "SlideInfo",
        props: { title: slide.title, chapter: slide.chapter },
      },
      chapterNav: {
        type: "ChapterNav",
        props: { currentChapter: slide.chapter },
      },
      viewer: {
        type: "SlideViewer",
        props: { slideIndex },
      },
      controlsRow: {
        type: "ControlsRow",
        props: {
          current: slideIndex,
          total: TOTAL_SLIDES,
          isPlaying,
          autoAdvance,
        },
      },
    },
  };
}

// Simple Stack component for layout
componentRegistry.Stack = ({
  element,
  children,
}: {
  element: UIElement;
  children?: React.ReactNode;
}) => {
  const direction = (element.props.direction as "row" | "column") || "column";
  const gap = (element.props.gap as number) || 0;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: direction,
        gap,
        height: direction === "column" ? "100vh" : undefined,
      }}
    >
      {children}
    </div>
  );
};

// Combined controls row with nav and audio
componentRegistry.ControlsRow = ({
  element,
  onAction,
}: {
  element: UIElement;
  onAction: (action: { name: string }) => void;
}) => {
  const current = element.props.current as number;
  const total = element.props.total as number;
  const isPlaying = element.props.isPlaying as boolean;
  const autoAdvance = element.props.autoAdvance as boolean;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 24px",
        background: "rgba(15,20,25,0.95)",
        borderTop: "1px solid rgba(239,99,55,0.3)",
      }}
    >
      {/* Audio controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={() => onAction({ name: "toggle_audio" })}
          style={{
            padding: "8px 16px",
            background: isPlaying ? "#ef6337" : "rgba(255,255,255,0.1)",
            border: "1px solid rgba(239,99,55,0.5)",
            borderRadius: 4,
            color: "#fff",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          {isPlaying ? "Pause" : "Play"}
        </button>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            color: "#8b949e",
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={autoAdvance}
            onChange={() => onAction({ name: "toggle_auto_advance" })}
            style={{ accentColor: "#ef6337" }}
          />
          Auto-advance
        </label>
      </div>

      {/* Navigation */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <button
          onClick={() => onAction({ name: "prev" })}
          disabled={current === 0}
          className="nav-btn"
        >
          Previous
        </button>
        <div className="slide-counter">
          {current + 1} / {total}
        </div>
        <button
          onClick={() => onAction({ name: "next" })}
          disabled={current === total - 1}
          className="nav-btn"
        >
          Next
        </button>
      </div>

      {/* Progress bar */}
      <div
        style={{
          width: 200,
          height: 4,
          background: "rgba(255,255,255,0.1)",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${((current + 1) / total) * 100}%`,
            height: "100%",
            background: "#ef6337",
            transition: "width 0.3s ease",
          }}
        />
      </div>
    </div>
  );
};

function PresentationContent() {
  const [slideIndex, setSlideIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);

  const [tree, setTree] = useState<UITree>(buildUITree(0, false, true));

  // Update tree when state changes
  useEffect(() => {
    setTree(buildUITree(slideIndex, isPlaying, autoAdvance));
  }, [slideIndex, isPlaying, autoAdvance]);

  // Load and play audio when slide changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const audioFile = getAudioFile(slideIndex);
    audio.src = audioFile;
    audio.load();

    if (isPlaying) {
      audio.play().catch(console.error);
    }
  }, [slideIndex]);

  // Handle play state changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.play().catch(console.error);
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  // Auto-advance when audio ends
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      if (autoAdvance && slideIndex < TOTAL_SLIDES - 1) {
        setSlideIndex((i) => i + 1);
      } else {
        setIsPlaying(false);
      }
    };

    audio.addEventListener("ended", handleEnded);
    return () => audio.removeEventListener("ended", handleEnded);
  }, [autoAdvance, slideIndex]);

  // Action handlers for json-render components
  const handleAction = useCallback(
    (action: { name: string; params?: Record<string, unknown> }) => {
      switch (action.name) {
        case "prev":
          setSlideIndex((i) => Math.max(0, i - 1));
          break;
        case "next":
          setSlideIndex((i) => Math.min(TOTAL_SLIDES - 1, i + 1));
          break;
        case "goto_chapter":
          const idx = action.params?.slideIndex as number;
          if (typeof idx === "number") setSlideIndex(idx);
          break;
        case "toggle_audio":
          setIsPlaying((p) => !p);
          break;
        case "toggle_auto_advance":
          setAutoAdvance((a) => !a);
          break;
      }
    },
    [],
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        setSlideIndex((i) => Math.max(0, i - 1));
      } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        setSlideIndex((i) => Math.min(TOTAL_SLIDES - 1, i + 1));
      } else if (e.key === " ") {
        e.preventDefault();
        setIsPlaying((p) => !p);
      } else if (e.key === "Home") {
        setSlideIndex(0);
      } else if (e.key === "End") {
        setSlideIndex(TOTAL_SLIDES - 1);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // Create registry with action handler
  const registryWithActions = Object.fromEntries(
    Object.entries(componentRegistry).map(([key, Component]) => [
      key,
      (props: { element: UIElement; children?: React.ReactNode }) => (
        <Component {...props} onAction={handleAction} />
      ),
    ]),
  );

  return (
    <>
      <audio ref={audioRef} />
      <Renderer tree={tree} registry={registryWithActions} />
    </>
  );
}

export default function PresentationPage() {
  return (
    <DataProvider initialData={{ slideIndex: 0 }}>
      <VisibilityProvider>
        <ActionProvider handlers={{}}>
          <PresentationContent />
        </ActionProvider>
      </VisibilityProvider>
    </DataProvider>
  );
}
