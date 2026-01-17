"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { PRESENTATION_SCRIPT, CHAPTERS } from "@/lib/presentation-script";
import { COLORS } from "@/lib/schema";
import { getSlideRegistry } from "@/lib/slide-registry";

// SpeechRecognition types for Web Speech API
interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

type Mode = "presenting" | "paused" | "question";

// Slide base dimensions
const BASE_WIDTH = 1280;
const BASE_HEIGHT = 720;

// Welcome Modal Component - removed, now on landing page

export default function PresenterPage() {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [mode, setMode] = useState<Mode>("paused");
  const [isPushToTalk, setIsPushToTalk] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [showGallery, setShowGallery] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [slideScale, setSlideScale] = useState(1);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const slideContainerRef = useRef<HTMLDivElement>(null);
  const isSpeakingRef = useRef(false);
  const isPushToTalkRef = useRef(false);

  const currentSlide = PRESENTATION_SCRIPT[currentSlideIndex];

  // Calculate scale to fit slides in container
  useEffect(() => {
    const updateScale = () => {
      if (!slideContainerRef.current) return;
      const container = slideContainerRef.current;
      const availableWidth = container.clientWidth;
      const availableHeight = container.clientHeight;
      const scaleX = availableWidth / BASE_WIDTH;
      const scaleY = availableHeight / BASE_HEIGHT;
      setSlideScale(Math.min(scaleX, scaleY, 1));
    };

    updateScale();
    window.addEventListener("resize", updateScale);

    const resizeObserver = new ResizeObserver(updateScale);
    if (slideContainerRef.current) {
      resizeObserver.observe(slideContainerRef.current);
    }

    return () => {
      window.removeEventListener("resize", updateScale);
      resizeObserver.disconnect();
    };
  }, [showGallery]);

  // Track slide renders in registry
  const slideRenderStartRef = useRef<number>(Date.now());
  useEffect(() => {
    const registry = getSlideRegistry();
    const startTime = Date.now();
    slideRenderStartRef.current = startTime;

    registry.recordRender(currentSlideIndex + 1, "presenter");

    return () => {
      const duration = Date.now() - slideRenderStartRef.current;
      console.log(
        `[Registry] Slide ${currentSlideIndex + 1} viewed for ${duration}ms`,
      );
    };
  }, [currentSlideIndex]);

  // Ref for welcome tutorial tracking
  const hasPlayedWelcomeRef = useRef(false);

  // Initialize speech recognition - PUSH-TO-TALK ONLY
  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognitionCtor =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return;

    recognitionRef.current = new SpeechRecognitionCtor();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = "en-US";

    recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
      if (isSpeakingRef.current) {
        console.log("[Voice] BLOCKED - AI is speaking, ignoring input");
        return;
      }

      if (!isPushToTalkRef.current) {
        console.log("[Voice] BLOCKED - Push-to-talk not active");
        return;
      }

      const last = event.results.length - 1;
      const text = event.results[last][0].transcript.toLowerCase();
      setTranscript(text);

      if (event.results[last].isFinal) {
        console.log("[Voice] Final transcript:", text);

        if (
          text.includes("question") ||
          text.includes("stop") ||
          text.includes("wait") ||
          text.includes("hold on")
        ) {
          handleInterrupt();
        } else if (
          text.includes("continue") ||
          text.includes("next") ||
          text.includes("go on")
        ) {
          handleContinue();
        } else if (text.includes("back") || text.includes("previous")) {
          goToPrevious();
        }
      }
    };

    recognitionRef.current.onend = () => {
      console.log("[Voice] Recognition ended");
      setIsPushToTalk(false);
      isPushToTalkRef.current = false;
    };

    recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.log("[Voice] Recognition error:", event.error);
      setIsPushToTalk(false);
      isPushToTalkRef.current = false;
    };
  }, []);

  // Keyboard handler: SPACE = play/pause, Arrows = navigate
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

      if (e.code === "Space" && !e.repeat) {
        e.preventDefault();

        if (mode === "presenting") {
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
          }
          setIsSpeaking(false);
          isSpeakingRef.current = false;
          ttsLockRef.current = false;
          setMode("paused");
        } else {
          setMode("presenting");
        }
      }

      if (e.code === "ArrowRight" || e.code === "ArrowDown") {
        e.preventDefault();
        if (currentSlideIndex < PRESENTATION_SCRIPT.length - 1) {
          setCurrentSlideIndex((i) => i + 1);
        }
      }
      if (e.code === "ArrowLeft" || e.code === "ArrowUp") {
        e.preventDefault();
        if (currentSlideIndex > 0) {
          setCurrentSlideIndex((i) => i - 1);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentSlideIndex, mode]);

  // ElevenLabs TTS
  const ttsLockRef = useRef(false);
  const speak = useCallback(async (text: string, onEnd?: () => void) => {
    if (ttsLockRef.current) {
      console.log("[TTS] Blocked - already speaking");
      return;
    }

    ttsLockRef.current = true;
    setIsSpeaking(true);
    isSpeakingRef.current = true;

    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        console.error("[TTS] API error:", response.status);
        throw new Error("TTS failed");
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        setIsSpeaking(false);
        isSpeakingRef.current = false;
        ttsLockRef.current = false;
        audioRef.current = null;
        onEnd?.();
      };

      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        setIsSpeaking(false);
        isSpeakingRef.current = false;
        ttsLockRef.current = false;
        audioRef.current = null;
        onEnd?.();
      };

      await audio.play();
    } catch (error) {
      console.error("[TTS] Error:", error);
      setIsSpeaking(false);
      isSpeakingRef.current = false;
      ttsLockRef.current = false;
      onEnd?.();
    }
  }, []);

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsSpeaking(false);
    isSpeakingRef.current = false;
    ttsLockRef.current = false;
  }, []);

  // Welcome tutorial
  useEffect(() => {
    if (hasPlayedWelcomeRef.current) return;

    const playWelcome = (e: Event) => {
      if (hasPlayedWelcomeRef.current) return;

      const keyEvent = e as KeyboardEvent;
      if (keyEvent.code === "Space") {
        hasPlayedWelcomeRef.current = true;
        cleanup();
        return;
      }

      hasPlayedWelcomeRef.current = true;

      setTimeout(() => {
        const welcomeText =
          "Welcome to the MARPA presentation. Press Spacebar or click Start to begin.";
        speak(welcomeText);
      }, 300);

      cleanup();
    };

    const cleanup = () => {
      document.removeEventListener("click", playWelcome);
      document.removeEventListener("keydown", playWelcome);
    };

    document.addEventListener("click", playWelcome);
    document.addEventListener("keydown", playWelcome);
    return cleanup;
  }, [speak]);

  // Handle interrupt
  const handleInterrupt = useCallback(() => {
    stopSpeaking();
    setMode("question");
    speak("Of course. What would you like to know?");
  }, [stopSpeaking, speak]);

  // Handle continue
  const handleContinue = useCallback(() => {
    setMode("presenting");
    if (currentSlideIndex < PRESENTATION_SCRIPT.length - 1) {
      setCurrentSlideIndex((i) => i + 1);
    }
  }, [currentSlideIndex]);

  // Navigate
  const goToSlide = useCallback((index: number) => {
    setCurrentSlideIndex(index);
    setShowGallery(false);
  }, []);

  const manualNavRef = useRef(false);

  const goToPrevious = useCallback(() => {
    if (currentSlideIndex > 0) {
      stopSpeaking();
      manualNavRef.current = true;
      setCurrentSlideIndex((i) => i - 1);
    }
  }, [currentSlideIndex, stopSpeaking]);

  const goToNext = useCallback(() => {
    if (currentSlideIndex < PRESENTATION_SCRIPT.length - 1) {
      stopSpeaking();
      manualNavRef.current = true;
      setCurrentSlideIndex((i) => i + 1);
    }
  }, [currentSlideIndex, stopSpeaking]);

  // Start presentation
  const startPresentation = useCallback(() => {
    setMode("presenting");
    speak(currentSlide.narration, () => {
      setTimeout(() => {
        if (currentSlideIndex < PRESENTATION_SCRIPT.length - 1) {
          setCurrentSlideIndex((i) => i + 1);
        } else {
          setMode("paused");
        }
      }, 1500);
    });
  }, [currentSlide, currentSlideIndex, speak]);

  // Effect to narrate when slide changes during presentation
  useEffect(() => {
    if (mode === "presenting" && currentSlide) {
      const timer = setTimeout(() => {
        const wasManualNav = manualNavRef.current;
        manualNavRef.current = false;

        speak(currentSlide.narration, () => {
          if (!wasManualNav) {
            setTimeout(() => {
              if (currentSlideIndex < PRESENTATION_SCRIPT.length - 1) {
                setCurrentSlideIndex((i) => i + 1);
              } else {
                setMode("paused");
              }
            }, 1500);
          }
        });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [currentSlideIndex, mode, currentSlide, speak]);

  // Stop listening when component unmounts
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      stopSpeaking();
    };
  }, [stopSpeaking]);

  // Build slide URL
  const slideUrl = `/slides/${currentSlide?.htmlFile}`;

  return (
    <>
      <style>{`
        *::-webkit-scrollbar { display: none; }
        * { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

      {/* Full viewport container */}
      <div
        style={{
          height: "100vh",
          width: "100vw",
          display: "flex",
          flexDirection: "column",
          background: "#0a0a0a",
          overflow: "hidden",
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
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <img
              src="/marpa_logo_darkmode_transparent.png"
              alt="MARPA"
              style={{ height: 28, width: "auto" }}
            />
            <span style={{ color: COLORS.teal, fontSize: 14, fontWeight: 600 }}>
              AI Presenter
            </span>
            <span
              style={{
                padding: "4px 12px",
                background:
                  mode === "presenting"
                    ? `${COLORS.teal}22`
                    : mode === "question"
                      ? `${COLORS.coral}22`
                      : "rgba(255,255,255,0.1)",
                border: `1px solid ${mode === "presenting" ? COLORS.teal : mode === "question" ? COLORS.coral : "rgba(255,255,255,0.2)"}`,
                borderRadius: 20,
                color:
                  mode === "presenting"
                    ? COLORS.teal
                    : mode === "question"
                      ? COLORS.coral
                      : COLORS.muted,
                fontSize: 11,
                textTransform: "uppercase",
              }}
            >
              {mode}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ color: COLORS.muted, fontSize: 13 }}>
              Slide {currentSlideIndex + 1} of {PRESENTATION_SCRIPT.length}
            </span>
            <button
              onClick={() => setShowGallery(!showGallery)}
              style={{
                padding: "6px 12px",
                background: showGallery
                  ? `${COLORS.coral}22`
                  : "rgba(255,255,255,0.05)",
                border: `1px solid ${showGallery ? COLORS.coral : "rgba(255,255,255,0.1)"}`,
                borderRadius: 4,
                color: showGallery ? COLORS.coral : COLORS.text,
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              Gallery
            </button>
          </div>
        </div>

        {/* Main Area - 3 column layout */}
        <div
          style={{
            flex: 1,
            display: "flex",
            overflow: "hidden",
            minHeight: 0,
          }}
        >
          {/* Left: Slide Gallery (collapsible) */}
          {showGallery && (
            <div
              style={{
                width: 200,
                flexShrink: 0,
                background: "rgba(15,20,25,0.95)",
                borderRight: `1px solid ${COLORS.navy}`,
                overflowY: "auto",
                padding: 8,
              }}
            >
              {CHAPTERS.map((chapter) => (
                <div key={chapter.number} style={{ marginBottom: 16 }}>
                  <p
                    style={{
                      color: COLORS.coral,
                      fontSize: 10,
                      marginBottom: 8,
                      padding: "0 8px",
                    }}
                  >
                    CH {chapter.number}: {chapter.name}
                  </p>
                  {chapter.slides.map((slideNum) => {
                    const slide = PRESENTATION_SCRIPT.find(
                      (s) => s.id === slideNum,
                    );
                    const index = PRESENTATION_SCRIPT.findIndex(
                      (s) => s.id === slideNum,
                    );
                    if (!slide) return null;
                    return (
                      <button
                        key={slideNum}
                        onClick={() => goToSlide(index)}
                        style={{
                          width: "100%",
                          padding: "6px 8px",
                          marginBottom: 4,
                          background:
                            index === currentSlideIndex
                              ? `${COLORS.teal}22`
                              : "transparent",
                          border:
                            index === currentSlideIndex
                              ? `1px solid ${COLORS.teal}`
                              : "1px solid transparent",
                          borderRadius: 4,
                          color:
                            index === currentSlideIndex
                              ? COLORS.teal
                              : COLORS.muted,
                          fontSize: 11,
                          textAlign: "left",
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {slideNum}. {slide.title.substring(0, 20)}...
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          {/* Center: Slide Viewer */}
          <div
            ref={slideContainerRef}
            style={{
              flex: 1,
              minWidth: 0,
              minHeight: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#000",
              overflow: "hidden",
              position: "relative",
            }}
          >
            <div
              style={{
                width: BASE_WIDTH,
                height: BASE_HEIGHT,
                transform: `scale(${slideScale})`,
                transformOrigin: "center center",
                flexShrink: 0,
              }}
            >
              <iframe
                ref={iframeRef}
                src={slideUrl}
                scrolling="no"
                style={{
                  width: "100%",
                  height: "100%",
                  border: "none",
                  display: "block",
                }}
                sandbox="allow-scripts"
              />
            </div>
          </div>

          {/* Right: Info/Narration Panel */}
          <div
            style={{
              width: 320,
              flexShrink: 0,
              background: "rgba(15,20,25,0.98)",
              borderLeft: `1px solid ${COLORS.navy}`,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Current Slide Info */}
            <div
              style={{
                padding: 16,
                borderBottom: `1px solid ${COLORS.navy}`,
                flexShrink: 0,
              }}
            >
              <p
                style={{
                  color: COLORS.coral,
                  fontSize: 11,
                  marginBottom: 4,
                }}
              >
                Slide {currentSlideIndex + 1}
              </p>
              <h3
                style={{
                  color: COLORS.text,
                  fontSize: 16,
                  fontWeight: 600,
                  marginBottom: 8,
                }}
              >
                {currentSlide?.title}
              </h3>
            </div>

            {/* Narration - scrollable */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: 16,
                minHeight: 0,
              }}
            >
              <p
                style={{
                  color: COLORS.muted,
                  fontSize: 11,
                  marginBottom: 8,
                  textTransform: "uppercase",
                }}
              >
                Narration
              </p>
              <p
                style={{
                  color: COLORS.text,
                  fontSize: 13,
                  lineHeight: 1.6,
                }}
              >
                {currentSlide?.narration}
              </p>
            </div>

            {/* Voice Status */}
            <div
              style={{
                padding: 16,
                borderTop: `1px solid ${COLORS.navy}`,
                background: "rgba(0,0,0,0.3)",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: isPushToTalk
                      ? COLORS.coral
                      : isSpeaking
                        ? COLORS.teal
                        : COLORS.muted,
                    animation: isPushToTalk ? "pulse 0.5s infinite" : "none",
                  }}
                />
                <span
                  style={{
                    color: isPushToTalk
                      ? COLORS.coral
                      : isSpeaking
                        ? COLORS.teal
                        : COLORS.muted,
                    fontSize: 11,
                  }}
                >
                  {isSpeaking ? "Speaking..." : "Ready"}
                </span>
              </div>
              {isPushToTalk && transcript && (
                <p
                  style={{
                    color: COLORS.text,
                    fontSize: 13,
                    background: "rgba(239,99,55,0.1)",
                    padding: "8px 12px",
                    borderRadius: 4,
                    border: `1px solid ${COLORS.coral}`,
                  }}
                >
                  "{transcript}"
                </p>
              )}
              <p style={{ color: COLORS.muted, fontSize: 10, marginTop: 8 }}>
                SPACE = play/pause | Arrows = navigate
              </p>
            </div>
          </div>
        </div>

        {/* Footer Controls */}
        <div
          style={{
            padding: "16px 24px",
            background: "rgba(15,20,25,0.95)",
            borderTop: `1px solid ${COLORS.coral}33`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            flexShrink: 0,
          }}
        >
          <button
            onClick={goToPrevious}
            disabled={currentSlideIndex === 0}
            style={{
              padding: "10px 20px",
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 6,
              color: COLORS.text,
              cursor: currentSlideIndex === 0 ? "not-allowed" : "pointer",
              opacity: currentSlideIndex === 0 ? 0.3 : 1,
            }}
          >
            Previous
          </button>

          {mode === "paused" || mode === "question" ? (
            <button
              onClick={startPresentation}
              style={{
                padding: "12px 32px",
                background: COLORS.coral,
                border: "none",
                borderRadius: 6,
                color: "#fff",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              {currentSlideIndex === 0 ? "Start Presentation" : "Continue"}
            </button>
          ) : (
            <button
              onClick={() => {
                stopSpeaking();
                setMode("paused");
                setIsPushToTalk(false);
                isPushToTalkRef.current = false;
                recognitionRef.current?.stop();
              }}
              style={{
                padding: "12px 32px",
                background: COLORS.coral,
                border: "none",
                borderRadius: 6,
                color: "#fff",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              Pause
            </button>
          )}

          <button
            onClick={goToNext}
            disabled={currentSlideIndex === PRESENTATION_SCRIPT.length - 1}
            style={{
              padding: "10px 20px",
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 6,
              color: COLORS.text,
              cursor:
                currentSlideIndex === PRESENTATION_SCRIPT.length - 1
                  ? "not-allowed"
                  : "pointer",
              opacity:
                currentSlideIndex === PRESENTATION_SCRIPT.length - 1 ? 0.3 : 1,
            }}
          >
            Next
          </button>

          {/* Status indicator */}
          <div
            style={{
              marginLeft: 24,
              borderLeft: "1px solid rgba(255,255,255,0.1)",
              paddingLeft: 24,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: isSpeaking ? COLORS.teal : COLORS.muted,
                animation: isSpeaking ? "pulse 0.5s infinite" : "none",
              }}
            />
            <span
              style={{
                color: isSpeaking ? COLORS.teal : COLORS.muted,
                fontSize: 12,
              }}
            >
              {isSpeaking ? "Playing..." : "SPACE = play/pause"}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
