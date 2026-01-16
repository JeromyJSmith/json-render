"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  PRESENTATION_SCRIPT,
  CHAPTERS,
  getSlide,
  SlideScript,
} from "@/lib/presentation-script";
import { COLORS } from "@/lib/schema";

// Web Speech API types - use same names as presenter/page.tsx to avoid conflict
interface SpeechRecognitionEventResult {
  [index: number]: { transcript: string; confidence: number };
}

interface SpeechRecognitionEventLocal extends Event {
  results: Array<SpeechRecognitionEventResult>;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLocal) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

// Helper to get chapter info for a slide
function getChapterForSlide(
  slideId: number,
): { number: number; name: string } | null {
  for (const chapter of CHAPTERS) {
    if (chapter.slides.includes(slideId)) {
      return { number: chapter.number, name: chapter.name };
    }
  }
  return null;
}

// Presentation State Machine
interface PresentationState {
  currentSlideId: number;
  isPlaying: boolean;
  isPausedForQuestions: boolean;
  isQuestionMode: boolean;
  isSpeaking: boolean;
  currentChapter: number;
}

// ElevenLabs TTS hook
function useSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const onEndCallbackRef = useRef<(() => void) | undefined>(undefined);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      abortControllerRef.current?.abort();
    };
  }, []);

  const speak = useCallback(async (text: string, onEnd?: () => void) => {
    console.log("[TTS] Starting speech:", text.substring(0, 50) + "...");

    // Store callback in ref to persist across renders
    onEndCallbackRef.current = onEnd;

    // Stop any ongoing speech
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setIsLoading(true);

    try {
      console.log("[TTS] Fetching audio from API...");
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[TTS] API Error:", response.status, errorText);
        throw new Error(`TTS request failed: ${response.status}`);
      }

      const audioBlob = await response.blob();
      console.log("[TTS] Audio blob received:", audioBlob.size, "bytes");
      const audioUrl = URL.createObjectURL(audioBlob);

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onloadedmetadata = () => {
        console.log("[TTS] Audio duration:", audio.duration, "seconds");
      };

      audio.onplay = () => {
        console.log("[TTS] Audio started playing");
        setIsLoading(false);
        setIsSpeaking(true);
      };

      audio.onended = () => {
        console.log("[TTS] Audio ended, calling onEnd callback");
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
        // Use the ref to ensure we have the latest callback
        onEndCallbackRef.current?.();
      };

      audio.onerror = (e) => {
        console.error("[TTS] Audio playback error:", e);
        setIsSpeaking(false);
        setIsLoading(false);
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
      };

      await audio.play();
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        console.error("[TTS] Error:", error);
      }
      setIsLoading(false);
      setIsSpeaking(false);
    }
  }, []);

  const stop = useCallback(() => {
    console.log("[TTS] Stopping speech");
    abortControllerRef.current?.abort();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsSpeaking(false);
    setIsLoading(false);
  }, []);

  return { speak, stop, isSpeaking, isLoading };
}

// Speech recognition hook
function useVoiceInput(onResult: (text: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
    ) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SpeechRecognitionClass =
        (window as any).SpeechRecognition ??
        (window as any).webkitSpeechRecognition;
      if (!SpeechRecognitionClass) return;

      recognitionRef.current =
        new SpeechRecognitionClass() as SpeechRecognitionInstance;
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        onResult(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => setIsListening(false);
      recognitionRef.current.onerror = () => setIsListening(false);
    }
  }, [onResult]);

  const startListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.start();
      setIsListening(true);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  return { startListening, stopListening, isListening };
}

// Slide Renderer Component - Uses iframe to display actual HTML slides
function SlideRenderer({ slide }: { slide: SlideScript }) {
  // Load the actual HTML slide via iframe
  const slidePath = `/NEW_UPDATE_PRESENTATION_files/${slide.htmlFile}`;

  return (
    <div
      style={{
        width: 1280,
        height: 720,
        background: "#0a0a0a",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <iframe
        src={slidePath}
        style={{
          width: "100%",
          height: "100%",
          border: "none",
          background: "#0a0a0a",
        }}
        title={slide.title}
      />
    </div>
  );
}

export default function GuidedPresentationPage() {
  const [state, setState] = useState<PresentationState>({
    currentSlideId: 1,
    isPlaying: false,
    isPausedForQuestions: false,
    isQuestionMode: false,
    isSpeaking: false,
    currentChapter: 0,
  });

  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isPlayingRef = useRef(state.isPlaying);

  // Keep ref in sync with state
  useEffect(() => {
    isPlayingRef.current = state.isPlaying;
  }, [state.isPlaying]);

  const currentSlide = getSlide(state.currentSlideId);
  const { speak, stop, isSpeaking, isLoading: isTTSLoading } = useSpeech();

  // Chat for Q&A mode
  const [inputValue, setInputValue] = useState("");

  // Get chapter info for current slide
  const currentChapterInfo = getChapterForSlide(state.currentSlideId);

  // AI SDK v6: Use DefaultChatTransport to configure endpoint and request body
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        prepareSendMessagesRequest: ({ messages }) => {
          console.log(
            "[Transport] Preparing request with",
            messages.length,
            "messages",
          );
          return {
            body: {
              messages,
              slideContext: {
                currentSlide: state.currentSlideId,
                chapter: currentChapterInfo?.name || "Introduction",
                narration: currentSlide?.narration || "",
              },
            },
          };
        },
      }),
    [state.currentSlideId, currentSlide, currentChapterInfo],
  );

  const chatHook = useChat({ transport });

  // Debug: log what useChat returns
  useEffect(() => {
    console.log("[Chat] useChat returned:", Object.keys(chatHook));
  }, []);

  // In AI SDK v6, 'append' was renamed to 'sendMessage'
  const { messages, sendMessage, status, setMessages } = chatHook;
  const isLoading = status === "streaming" || status === "submitted";

  // Voice input handler
  const handleVoiceResult = useCallback(
    (text: string) => {
      const lower = text.toLowerCase();

      // Navigation commands
      if (lower.includes("next") || lower.includes("continue")) {
        advanceSlide();
      } else if (lower.includes("back") || lower.includes("previous")) {
        previousSlide();
      } else if (lower.includes("pause") || lower.includes("stop")) {
        stop();
        setState((s) => ({ ...s, isPlaying: false }));
      } else if (
        (state.isQuestionMode || state.isPausedForQuestions) &&
        sendMessage
      ) {
        // Treat as question - AI SDK v6 sendMessage expects { text: string }
        sendMessage({ text });
      }
    },
    [state.isQuestionMode, state.isPausedForQuestions, sendMessage, stop],
  );

  const { startListening, stopListening, isListening } =
    useVoiceInput(handleVoiceResult);

  // Calculate scale for viewport
  useEffect(() => {
    const calculateScale = () => {
      if (!containerRef.current) return;
      const scaleX = (containerRef.current.clientWidth - 20) / 1280;
      const scaleY = (containerRef.current.clientHeight - 20) / 720;
      setScale(Math.min(scaleX, scaleY, 1));
    };
    calculateScale();
    window.addEventListener("resize", calculateScale);
    return () => window.removeEventListener("resize", calculateScale);
  }, []);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Narrate current slide
  // Pause for questions at end of each chapter (when next slide is first slide of new chapter)
  const shouldPauseForQuestions = useCallback((slideId: number): boolean => {
    const currentIndex = PRESENTATION_SCRIPT.findIndex((s) => s.id === slideId);
    if (currentIndex >= PRESENTATION_SCRIPT.length - 1) return true; // Last slide
    const nextSlideId = PRESENTATION_SCRIPT[currentIndex + 1].id;
    const currentChapter = getChapterForSlide(slideId);
    const nextChapter = getChapterForSlide(nextSlideId);
    return currentChapter?.number !== nextChapter?.number;
  }, []);

  const narrateSlide = useCallback(() => {
    if (!currentSlide) return;

    const pauseForQuestions = shouldPauseForQuestions(currentSlide.id);
    console.log(
      "[Narrate] Starting narration for slide:",
      currentSlide.id,
      "pauseForQuestions:",
      pauseForQuestions,
    );

    speak(currentSlide.narration, () => {
      console.log(
        "[Narrate] Narration ended, isPlayingRef:",
        isPlayingRef.current,
        "pauseForQuestions:",
        pauseForQuestions,
      );

      if (pauseForQuestions) {
        speak("Before we continue, do you have any questions?", () => {
          setState((s) => ({
            ...s,
            isPausedForQuestions: true,
            isQuestionMode: true,
          }));
        });
      } else if (isPlayingRef.current) {
        // Auto-advance after narration (use ref to avoid stale closure)
        console.log("[Narrate] Auto-advancing to next slide in 1 second...");
        setTimeout(() => advanceSlide(), 1000);
      }
    });
  }, [currentSlide, speak, shouldPauseForQuestions]);

  // Advance to next slide
  const advanceSlide = useCallback(() => {
    const currentIndex = PRESENTATION_SCRIPT.findIndex(
      (s) => s.id === state.currentSlideId,
    );
    if (currentIndex < PRESENTATION_SCRIPT.length - 1) {
      const nextSlide = PRESENTATION_SCRIPT[currentIndex + 1];
      const nextChapter = getChapterForSlide(nextSlide.id);
      console.log("[Advance] Moving to slide:", nextSlide.id);
      setState((s) => ({
        ...s,
        currentSlideId: nextSlide.id,
        isPausedForQuestions: false,
        isQuestionMode: false,
        currentChapter: nextChapter?.number || 0,
      }));
    }
  }, [state.currentSlideId]);

  // Auto-narrate when slide changes during playback
  const prevSlideRef = useRef(state.currentSlideId);
  useEffect(() => {
    if (state.currentSlideId !== prevSlideRef.current && isPlayingRef.current) {
      console.log(
        "[Effect] Slide changed to",
        state.currentSlideId,
        "- auto-narrating",
      );
      prevSlideRef.current = state.currentSlideId;
      narrateSlide();
    }
  }, [state.currentSlideId, narrateSlide]);

  // Go to previous slide
  const previousSlide = useCallback(() => {
    const currentIndex = PRESENTATION_SCRIPT.findIndex(
      (s) => s.id === state.currentSlideId,
    );
    if (currentIndex > 0) {
      const prevSlide = PRESENTATION_SCRIPT[currentIndex - 1];
      const prevChapter = getChapterForSlide(prevSlide.id);
      setState((s) => ({
        ...s,
        currentSlideId: prevSlide.id,
        isPausedForQuestions: false,
        isQuestionMode: false,
        currentChapter: prevChapter?.number || 0,
      }));
    }
  }, [state.currentSlideId]);

  // Start presentation
  const startPresentation = () => {
    setState((s) => ({ ...s, isPlaying: true }));
    narrateSlide();
  };

  // Handle user text input
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("[Chat] handleSubmit called, inputValue:", inputValue);
    if (inputValue.trim()) {
      const text = inputValue.trim().toLowerCase();

      if (text === "continue" || text === "next") {
        console.log("[Chat] Navigation command detected");
        setState((s) => ({
          ...s,
          isPausedForQuestions: false,
          isQuestionMode: false,
        }));
        advanceSlide();
      } else if (sendMessage) {
        console.log(
          "[Chat] Sending message via sendMessage:",
          inputValue.trim(),
        );
        // AI SDK v6: sendMessage expects { text: string } format
        sendMessage({ text: inputValue.trim() });
      } else {
        console.log("[Chat] ERROR: sendMessage is not defined!");
      }
      setInputValue("");
    }
  };

  if (!currentSlide) return null;

  return (
    <div
      style={{
        height: "100vh",
        display: "grid",
        gridTemplateColumns: "1fr 400px",
        background: "#0a0a0a",
      }}
    >
      {/* Main Slide Area */}
      <div style={{ display: "flex", flexDirection: "column" }}>
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
              Guided Presentation
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {isTTSLoading && (
              <span style={{ color: COLORS.teal, fontSize: 12 }}>
                Loading voice...
              </span>
            )}
            {isSpeaking && (
              <span style={{ color: COLORS.teal, fontSize: 12 }}>
                Speaking (ElevenLabs)
              </span>
            )}
            {state.isPausedForQuestions && (
              <span style={{ color: COLORS.coral, fontSize: 12 }}>
                Paused for Questions
              </span>
            )}
            <span style={{ color: COLORS.muted, fontSize: 14 }}>
              Slide {state.currentSlideId} of {PRESENTATION_SCRIPT.length}
            </span>
          </div>
        </div>

        {/* Chapter nav */}
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
          {CHAPTERS.map((ch) => (
            <button
              key={ch.number}
              onClick={() => {
                const firstSlide = getSlide(ch.slides[0]);
                if (firstSlide) {
                  setState((s) => ({
                    ...s,
                    currentSlideId: firstSlide.id,
                    currentChapter: ch.number,
                  }));
                }
              }}
              style={{
                padding: "6px 16px",
                background:
                  state.currentChapter === ch.number
                    ? `${COLORS.coral}33`
                    : "rgba(255,255,255,0.05)",
                border:
                  state.currentChapter === ch.number
                    ? `1px solid ${COLORS.coral}`
                    : "1px solid transparent",
                borderRadius: 4,
                color:
                  state.currentChapter === ch.number
                    ? COLORS.coral
                    : COLORS.muted,
                fontSize: 12,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {ch.number}. {ch.name}
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
            <SlideRenderer slide={currentSlide} />
          </div>
        </div>

        {/* Controls */}
        <div
          style={{
            padding: "16px 24px",
            background: "rgba(15,20,25,0.95)",
            display: "flex",
            justifyContent: "center",
            gap: 16,
          }}
        >
          <button
            onClick={previousSlide}
            style={{
              padding: "12px 24px",
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 8,
              color: COLORS.text,
              cursor: "pointer",
            }}
          >
            Previous
          </button>
          {!state.isPlaying ? (
            <button
              onClick={startPresentation}
              style={{
                padding: "12px 32px",
                background: COLORS.coral,
                border: "none",
                borderRadius: 8,
                color: "#fff",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Start Presentation
            </button>
          ) : (
            <button
              onClick={() => {
                stop();
                setState((s) => ({ ...s, isPlaying: false }));
              }}
              style={{
                padding: "12px 32px",
                background: COLORS.teal,
                border: "none",
                borderRadius: 8,
                color: "#000",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Pause
            </button>
          )}
          <button
            onClick={advanceSlide}
            style={{
              padding: "12px 24px",
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 8,
              color: COLORS.text,
              cursor: "pointer",
            }}
          >
            Next
          </button>
          <button
            onClick={isListening ? stopListening : startListening}
            style={{
              padding: "12px 24px",
              background: isListening
                ? `${COLORS.coral}33`
                : "rgba(255,255,255,0.1)",
              border: isListening
                ? `2px solid ${COLORS.coral}`
                : "1px solid rgba(255,255,255,0.2)",
              borderRadius: 8,
              color: isListening ? COLORS.coral : COLORS.text,
              cursor: "pointer",
            }}
          >
            {isListening ? "Listening..." : "Voice"}
          </button>
        </div>
      </div>

      {/* Chat/Q&A Panel */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          borderLeft: `1px solid ${COLORS.navy}`,
          background: "rgba(15,20,25,0.95)",
        }}
      >
        <div
          style={{
            padding: "16px 20px",
            borderBottom: `1px solid ${COLORS.coral}33`,
          }}
        >
          <span style={{ color: COLORS.text, fontWeight: 600 }}>
            Q&A Assistant
          </span>
          {shouldPauseForQuestions(state.currentSlideId) && (
            <span style={{ color: COLORS.muted, fontSize: 12, marginLeft: 8 }}>
              Questions welcome
            </span>
          )}
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
              <p style={{ marginBottom: 16 }}>
                Ask questions during the presentation
              </p>
              <p style={{ fontSize: 12, color: COLORS.teal }}>
                {currentChapterInfo
                  ? `Chapter ${currentChapterInfo.number}: ${currentChapterInfo.name}`
                  : "Introduction"}
              </p>
            </div>
          )}

          {messages.map((msg, i) => {
            // AI SDK v6: messages use parts array, extract text from parts
            const textContent =
              msg.parts
                ?.filter((part: { type: string }) => part.type === "text")
                .map((part: { type: string; text?: string }) => part.text)
                .join("") || "";

            return (
              <div
                key={msg.id || i}
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
                  }}
                >
                  {msg.role === "user" ? "You" : "AI Guide"}
                </div>
                <div
                  style={{ color: COLORS.text, fontSize: 14, lineHeight: 1.5 }}
                >
                  {textContent}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div
              style={{
                padding: "12px 16px",
                borderRadius: 8,
                background: "rgba(255,255,255,0.05)",
                borderLeft: `3px solid ${COLORS.teal}`,
                color: COLORS.teal,
              }}
            >
              Thinking...
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
            value={inputValue || ""}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={
              state.isPausedForQuestions
                ? "Ask a question or type 'continue'..."
                : "Ask a question..."
            }
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
            style={{
              padding: "12px 20px",
              background: COLORS.teal,
              border: "none",
              borderRadius: 8,
              color: "#000",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
