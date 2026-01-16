"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { PRESENTATION_SCRIPT, CHAPTERS } from "@/lib/presentation-script";
import { COLORS } from "@/lib/schema";
import { getSlideRegistry } from "@/lib/slide-registry";
import { SlideViewport } from "@/components/SlideViewport";

// SpeechRecognition types for Web Speech API
type SpeechRecognition = typeof window extends { SpeechRecognition: infer T }
  ? T extends new () => infer R
    ? R
    : never
  : never;

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

export default function PresenterPage() {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [mode, setMode] = useState<Mode>("paused");
  const [isPushToTalk, setIsPushToTalk] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [showGallery, setShowGallery] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const isSpeakingRef = useRef(false);
  const isPushToTalkRef = useRef(false);

  const currentSlide = PRESENTATION_SCRIPT[currentSlideIndex];

  // Track slide renders in registry
  const slideRenderStartRef = useRef<number>(Date.now());
  useEffect(() => {
    const registry = getSlideRegistry();
    const startTime = Date.now();
    slideRenderStartRef.current = startTime;

    // Record render event
    registry.recordRender(currentSlideIndex + 1, "presenter");

    // Track duration when leaving slide
    return () => {
      const duration = Date.now() - slideRenderStartRef.current;
      // Duration is captured for analytics but not re-recorded
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

    recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.log("[Voice] Recognition error:", event.error);
      setIsPushToTalk(false);
      isPushToTalkRef.current = false;
    };
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
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

      {/* Top-level shell - fixed viewport, no scroll */}
      <div className="h-screen w-screen overflow-hidden flex bg-[#0a0a0a]">
        {/* Left slide gallery / sidebar */}
        {showGallery && (
          <aside className="h-full w-[200px] flex-shrink-0 bg-[rgba(15,20,25,0.95)] border-r border-white/10 overflow-y-auto p-2">
            {CHAPTERS.map((chapter) => (
              <div key={chapter.number} className="mb-4">
                <p
                  className="text-[10px] mb-2 px-2"
                  style={{ color: COLORS.coral }}
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
                      className="w-full px-2 py-1.5 mb-1 text-[11px] text-left cursor-pointer rounded whitespace-nowrap overflow-hidden text-ellipsis"
                      style={{
                        background:
                          index === currentSlideIndex
                            ? `${COLORS.teal}22`
                            : "transparent",
                        border:
                          index === currentSlideIndex
                            ? `1px solid ${COLORS.teal}`
                            : "1px solid transparent",
                        color:
                          index === currentSlideIndex
                            ? COLORS.teal
                            : COLORS.muted,
                      }}
                    >
                      {slideNum}. {slide.title.substring(0, 20)}...
                    </button>
                  );
                })}
              </div>
            ))}
          </aside>
        )}

        {/* Main presenter column */}
        <main className="flex-1 h-full flex flex-col min-w-0">
          {/* Header */}
          <header
            className="h-14 flex-shrink-0 flex items-center justify-between px-6 border-b"
            style={{
              background: "rgba(15,20,25,0.95)",
              borderColor: `${COLORS.coral}33`,
            }}
          >
            <div className="flex items-center gap-4">
              <span
                className="font-semibold tracking-wider"
                style={{ color: COLORS.coral }}
              >
                MARPA
              </span>
              <span
                className="text-sm font-semibold"
                style={{ color: COLORS.teal }}
              >
                AI Presenter
              </span>
              <span
                className="px-3 py-1 rounded-full text-[11px] uppercase"
                style={{
                  background:
                    mode === "presenting"
                      ? `${COLORS.teal}22`
                      : mode === "question"
                        ? `${COLORS.coral}22`
                        : "rgba(255,255,255,0.1)",
                  border: `1px solid ${mode === "presenting" ? COLORS.teal : mode === "question" ? COLORS.coral : "rgba(255,255,255,0.2)"}`,
                  color:
                    mode === "presenting"
                      ? COLORS.teal
                      : mode === "question"
                        ? COLORS.coral
                        : COLORS.muted,
                }}
              >
                {mode}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[13px]" style={{ color: COLORS.muted }}>
                Slide {currentSlideIndex + 1} of {PRESENTATION_SCRIPT.length}
              </span>
              <button
                onClick={() => setShowGallery(!showGallery)}
                className="px-3 py-1.5 rounded text-xs cursor-pointer"
                style={{
                  background: showGallery
                    ? `${COLORS.coral}22`
                    : "rgba(255,255,255,0.05)",
                  border: `1px solid ${showGallery ? COLORS.coral : "rgba(255,255,255,0.1)"}`,
                  color: showGallery ? COLORS.coral : COLORS.text,
                }}
              >
                Gallery
              </button>
            </div>
          </header>

          {/* Middle row: slide viewport + narration */}
          <section className="flex-1 min-h-0 flex">
            {/* Slide viewport column */}
            <div className="flex-1 min-w-0">
              <SlideViewport>
                <iframe
                  ref={iframeRef}
                  src={slideUrl}
                  scrolling="no"
                  className="w-full h-full border-none block"
                  sandbox="allow-scripts"
                />
              </SlideViewport>
            </div>

            {/* Narration panel */}
            <aside
              className="w-[320px] max-w-[30%] h-full flex-shrink-0 flex flex-col border-l overflow-hidden"
              style={{
                background: "rgba(15,20,25,0.98)",
                borderColor: COLORS.navy,
              }}
            >
              {/* Current Slide Info */}
              <div
                className="p-4 flex-shrink-0 border-b"
                style={{ borderColor: COLORS.navy }}
              >
                <p className="text-[11px] mb-1" style={{ color: COLORS.coral }}>
                  Slide {currentSlideIndex + 1}
                </p>
                <h3
                  className="text-base font-semibold mb-2"
                  style={{ color: COLORS.text }}
                >
                  {currentSlide?.title}
                </h3>
              </div>

              {/* Narration - scrollable */}
              <div className="flex-1 min-h-0 overflow-y-auto p-4">
                <p
                  className="text-[11px] mb-2 uppercase"
                  style={{ color: COLORS.muted }}
                >
                  Narration
                </p>
                <p
                  className="text-[13px] leading-relaxed"
                  style={{ color: COLORS.text }}
                >
                  {currentSlide?.narration}
                </p>
              </div>

              {/* Voice Status */}
              <div
                className="p-4 flex-shrink-0 border-t"
                style={{
                  borderColor: COLORS.navy,
                  background: "rgba(0,0,0,0.3)",
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{
                      background: isPushToTalk
                        ? COLORS.coral
                        : isSpeaking
                          ? COLORS.teal
                          : COLORS.muted,
                      animation: isPushToTalk ? "pulse 0.5s infinite" : "none",
                    }}
                  />
                  <span
                    className="text-[11px]"
                    style={{
                      color: isPushToTalk
                        ? COLORS.coral
                        : isSpeaking
                          ? COLORS.teal
                          : COLORS.muted,
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
                    className="text-[13px] px-3 py-2 rounded"
                    style={{
                      color: COLORS.text,
                      background: "rgba(239,99,55,0.1)",
                      border: `1px solid ${COLORS.coral}`,
                    }}
                  >
                    "{transcript}"
                  </p>
                )}
                <p className="text-[10px] mt-2" style={{ color: COLORS.muted }}>
                  SPACE = talk | Arrows = navigate | Say "stop" to interrupt
                </p>
              </div>
            </aside>
          </section>

          {/* Bottom control bar */}
          <footer
            className="h-16 flex-shrink-0 flex items-center justify-center gap-4 px-6 border-t"
            style={{
              background: "rgba(15,20,25,0.95)",
              borderColor: `${COLORS.coral}33`,
            }}
          >
            <button
              onClick={goToPrevious}
              disabled={currentSlideIndex === 0}
              className="px-5 py-2.5 rounded-md cursor-pointer"
              style={{
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: COLORS.text,
                opacity: currentSlideIndex === 0 ? 0.3 : 1,
                cursor: currentSlideIndex === 0 ? "not-allowed" : "pointer",
              }}
            >
              Previous
            </button>

            {mode === "paused" || mode === "question" ? (
              <button
                onClick={startPresentation}
                className="px-8 py-3 rounded-md font-semibold text-sm cursor-pointer"
                style={{
                  background: COLORS.coral,
                  border: "none",
                  color: "#fff",
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
                className="px-8 py-3 rounded-md font-semibold text-sm cursor-pointer"
                style={{
                  background: COLORS.coral,
                  border: "none",
                  color: "#fff",
                }}
              >
                Pause
              </button>
            )}

            <button
              onClick={goToNext}
              disabled={currentSlideIndex === PRESENTATION_SCRIPT.length - 1}
              className="px-5 py-2.5 rounded-md cursor-pointer"
              style={{
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: COLORS.text,
                opacity:
                  currentSlideIndex === PRESENTATION_SCRIPT.length - 1
                    ? 0.3
                    : 1,
                cursor:
                  currentSlideIndex === PRESENTATION_SCRIPT.length - 1
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              Next
            </button>

            {/* Push-to-talk indicator */}
            <div className="ml-6 pl-6 border-l border-white/10 flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{
                  background: isPushToTalk ? COLORS.coral : COLORS.muted,
                  animation: isPushToTalk ? "pulse 0.5s infinite" : "none",
                }}
              />
              <span
                className="text-xs"
                style={{
                  color: isPushToTalk ? COLORS.coral : COLORS.muted,
                }}
              >
                {isPushToTalk ? "Recording..." : "Hold SPACE to talk"}
              </span>
            </div>
          </footer>
        </main>
      </div>
    </>
  );
}
