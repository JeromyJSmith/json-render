"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { PRESENTATION_SCRIPT, CHAPTERS } from "@/lib/presentation-script";
import { COLORS } from "@/lib/schema";

type Mode = "presenting" | "paused" | "question";

export default function PresenterPage() {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [mode, setMode] = useState<Mode>("paused");
  const [isPushToTalk, setIsPushToTalk] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [showGallery, setShowGallery] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const slideContainerRef = useRef<HTMLDivElement>(null);
  const isSpeakingRef = useRef(false);
  const isPushToTalkRef = useRef(false);

  // Slide scaling - base dimensions match slide design
  const BASE_WIDTH = 1280;
  const BASE_HEIGHT = 720;
  const [slideScale, setSlideScale] = useState(1);

  // Calculate scale to fit slides in container
  useEffect(() => {
    const updateScale = () => {
      if (!slideContainerRef.current) return;
      const container = slideContainerRef.current;
      const availableWidth = container.clientWidth;
      const availableHeight = container.clientHeight;
      const scaleX = availableWidth / BASE_WIDTH;
      const scaleY = availableHeight / BASE_HEIGHT;
      setSlideScale(Math.min(scaleX, scaleY));
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

  const currentSlide = PRESENTATION_SCRIPT[currentSlideIndex];

  // Ref for welcome tutorial tracking
  const hasPlayedWelcomeRef = useRef(false);

  // Initialize speech recognition - PUSH-TO-TALK ONLY
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
    ) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onresult = (event) => {
        // Ignore input if AI is speaking
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

        // Only process final results
        if (event.results[last].isFinal) {
          console.log("[Voice] Final transcript:", text);

          // Check for commands
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

      recognitionRef.current.onerror = (event) => {
        console.log("[Voice] Recognition error:", event.error);
        setIsPushToTalk(false);
        isPushToTalkRef.current = false;
      };
    }
  }, []);

  // Push-to-talk keyboard handler (SPACE = hold to talk)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Spacebar for push-to-talk (hold to talk)
      if (e.code === "Space" && !isPushToTalkRef.current && !e.repeat) {
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
        e.preventDefault();

        // Stop audio first to prevent feedback
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          audioRef.current = null;
        }
        setIsSpeaking(false);
        isSpeakingRef.current = false;
        ttsLockRef.current = false;

        setTimeout(() => {
          isPushToTalkRef.current = true;
          setIsPushToTalk(true);
          setTranscript("");

          try {
            recognitionRef.current?.start();
          } catch (e) {
            // Ignore if already started
          }
        }, 50);
      }

      // Arrow keys for navigation
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

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space" && isPushToTalkRef.current) {
        e.preventDefault();
        isPushToTalkRef.current = false;
        setIsPushToTalk(false);

        try {
          recognitionRef.current?.stop();
        } catch (e) {
          // Ignore
        }

        // Clear transcript after processing
        setTranscript("");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [currentSlideIndex]);

  // ElevenLabs TTS
  const ttsLockRef = useRef(false);
  const speak = useCallback(async (text: string, onEnd?: () => void) => {
    // Prevent concurrent TTS calls
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

  // Welcome tutorial - plays on first user interaction
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
          "Welcome! Hold Spacebar to give voice commands, or click Start.";
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

  // Handle interrupt (user says "question", "stop", etc.)
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

  // Ref to track manual navigation
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

  // Start presentation - narrates current slide
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
      `}</style>
      <div
        style={{
          height: "100vh",
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

        {/* Main Area */}
        <div
          style={{ flex: 1, display: "flex", overflow: "hidden", minWidth: 0 }}
        >
          {/* Slide Gallery (collapsible) */}
          {showGallery && (
            <div
              style={{
                width: 200,
                background: "rgba(15,20,25,0.95)",
                borderRight: `1px solid ${COLORS.navy}`,
                overflowY: "auto",
                padding: 8,
                scrollbarWidth: "none",
                msOverflowStyle: "none",
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

          {/* Slide Viewer */}
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

          {/* Info Panel */}
          <div
            style={{
              width: 320,
              minWidth: 320,
              flexShrink: 0,
              background: "rgba(15,20,25,0.98)",
              borderLeft: `1px solid ${COLORS.navy}`,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              zIndex: 10,
              position: "relative",
            }}
          >
            {/* Current Slide Info */}
            <div
              style={{
                padding: 16,
                borderBottom: `1px solid ${COLORS.navy}`,
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

            {/* Narration */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: 16,
                scrollbarWidth: "none",
                msOverflowStyle: "none",
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
                  {isPushToTalk
                    ? "RECORDING..."
                    : isSpeaking
                      ? "Speaking..."
                      : "Hold SPACE to talk"}
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
                SPACE = talk | Arrows = navigate | Say "stop" to interrupt
              </p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div
          style={{
            padding: "16px 24px",
            background: "rgba(15,20,25,0.95)",
            borderTop: `1px solid ${COLORS.coral}33`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
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

          {/* Push-to-talk indicator */}
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
                background: isPushToTalk ? COLORS.coral : COLORS.muted,
                animation: isPushToTalk ? "pulse 0.5s infinite" : "none",
              }}
            />
            <span
              style={{
                color: isPushToTalk ? COLORS.coral : COLORS.muted,
                fontSize: 12,
              }}
            >
              {isPushToTalk ? "Recording..." : "Hold SPACE to talk"}
            </span>
          </div>
        </div>

        <style jsx>{`
          @keyframes pulse {
            0%,
            100% {
              opacity: 1;
            }
            50% {
              opacity: 0.4;
            }
          }
        `}</style>
      </div>
    </>
  );
}
