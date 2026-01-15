"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  PRESENTATION_SCRIPT,
  CHAPTERS,
  SlideScript,
} from "@/lib/presentation-script";
import { COLORS } from "@/lib/schema";

type Mode = "presenting" | "paused" | "question" | "generating" | "conversing";

export default function PresenterPage() {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [mode, setMode] = useState<Mode>("paused");
  const [isPushToTalk, setIsPushToTalk] = useState(false); // Push-to-talk active (CTRL key)
  const [transcript, setTranscript] = useState("");
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
  const [showGallery, setShowGallery] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showConversation, setShowConversation] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const showConversationRef = useRef(false); // Ref to avoid stale closure

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const slideContainerRef = useRef<HTMLDivElement>(null);
  const isSpeakingRef = useRef(false); // Ref to check speaking state in callbacks
  const isPushToTalkRef = useRef(false); // Track push-to-talk state for keyup

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

    // Also observe container size changes (gallery open/close)
    const resizeObserver = new ResizeObserver(updateScale);
    if (slideContainerRef.current) {
      resizeObserver.observe(slideContainerRef.current);
    }

    return () => {
      window.removeEventListener("resize", updateScale);
      resizeObserver.disconnect();
    };
  }, [showGallery, showConversation]);

  const currentSlide = PRESENTATION_SCRIPT[currentSlideIndex];

  // Conversational generation chat
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/clarify-and-generate",
      }),
    [],
  );

  const { messages, sendMessage, setMessages, status } = useChat({ transport });
  const isChatLoading = status === "streaming" || status === "submitted";
  const sendMessageRef = useRef(sendMessage);

  // Keep refs in sync with state
  useEffect(() => {
    showConversationRef.current = showConversation;
  }, [showConversation]);

  useEffect(() => {
    sendMessageRef.current = sendMessage;
  }, [sendMessage]);

  // Auto-scroll messages - speech is handled separately to avoid loops
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Ref for welcome tutorial tracking
  const hasPlayedWelcomeRef = useRef(false);

  // Handle speaking new assistant messages - with debouncing to prevent loops
  const lastSpokenRef = useRef<string | null>(null);
  const speakingQueueRef = useRef<boolean>(false);

  useEffect(() => {
    // Only process when chat is done loading and conversation is shown
    if (isChatLoading || !showConversation) return;

    // Find the latest assistant message
    const lastAssistant = [...messages]
      .reverse()
      .find((m) => m.role === "assistant");
    if (!lastAssistant || lastAssistant.id === lastSpokenRef.current) return;

    // Prevent multiple speak calls
    if (speakingQueueRef.current) return;

    // Extract text content from message parts
    const textContent =
      lastAssistant.parts
        ?.filter((part: { type: string }) => part.type === "text")
        .map((part: { type: string; text?: string }) => part.text)
        .join("") || "";

    // Check for [GENERATE] tags in response and trigger HTML generation
    const generateMatch = textContent.match(
      /\[GENERATE\]([\s\S]*?)\[\/GENERATE\]/,
    );
    if (generateMatch) {
      const generateBlock = generateMatch[1];
      const typeMatch = generateBlock.match(/Type:\s*(.+)/);
      const titleMatch = generateBlock.match(/Title:\s*(.+)/);
      const dataMatch = generateBlock.match(/Data:\s*(.+)/);

      if (typeMatch && titleMatch && dataMatch) {
        // Build prompt for generation
        const prompt = `Create a ${typeMatch[1].trim()} visualization titled "${titleMatch[1].trim()}".
Data to show: ${dataMatch[1].trim()}
Style: dark theme (#0a0a0a background), animated, professional with MARPA brand colors (teal #4ecdc4, coral #ef6337).

Use MARPA canonical values:
- Valuation: $17M, EBITDA: $1.655M, Revenue: $11.03M
- Win Rate: 95%, Multiple: 10.3x
- Ownership Path C: Luke 52%, Bodie 24%, Pablo 24%
- Construction: $1.7M (10% YoY), Maintenance: $800K (20% YoY)

Generate complete, animated HTML with Chart.js.`;

        // Trigger generation
        fetch("/api/generate-html", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
        })
          .then((res) => res.text())
          .then((html) => setGeneratedHtml(html))
          .catch((err) => console.error("Failed to generate:", err));
      }
    }

    // Speak the text (excluding the generate block)
    const speakableText = textContent
      .replace(/\[GENERATE\][\s\S]*?\[\/GENERATE\]/g, "")
      .trim();

    if (speakableText && speakableText.length > 0) {
      lastSpokenRef.current = lastAssistant.id;
      speakingQueueRef.current = true;

      // Speak with a small delay to ensure state is stable
      setTimeout(() => {
        speak(speakableText);
        speakingQueueRef.current = false;
      }, 200);
    }
  }, [messages, isChatLoading, showConversation]);

  // Capture user's name from their messages
  useEffect(() => {
    if (!userNameRef.current && messages.length > 0) {
      // Look for user messages that might contain their name
      const userMessages = messages.filter((m) => m.role === "user");
      for (const msg of userMessages) {
        const text =
          msg.parts?.find((p: { type: string }) => p.type === "text")?.text ||
          "";
        // Check for name patterns
        const namePatterns = [
          /(?:I'm|I am|my name is|call me|it's|this is)\s+(\w+)/i,
          /^(\w+)$/i, // Single word response (likely a name)
        ];
        for (const pattern of namePatterns) {
          const match = text.match(pattern);
          if (match && match[1]) {
            const name = match[1];
            // Validate it's a reasonable name (not a common word)
            const commonWords = [
              "hi",
              "hey",
              "hello",
              "yes",
              "no",
              "show",
              "me",
              "the",
              "a",
              "an",
              "please",
              "thanks",
              "ok",
              "okay",
            ];
            if (
              !commonWords.includes(name.toLowerCase()) &&
              name.length > 1 &&
              name.length < 20
            ) {
              userNameRef.current =
                name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
              console.log("[Name captured]", userNameRef.current);
              break;
            }
          }
        }
        if (userNameRef.current) break;
      }
    }
  }, [messages]);

  // Initialize speech recognition - PUSH-TO-TALK ONLY (no continuous listening)
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
    ) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false; // CRITICAL: Single utterance only
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onresult = (event) => {
        // CRITICAL: Ignore ALL input if AI is speaking (prevents feedback loop)
        if (isSpeakingRef.current) {
          console.log("[Voice] BLOCKED - AI is speaking, ignoring input");
          return;
        }

        // Also ignore if push-to-talk is not active
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

          // Check for interrupt commands
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
          } else if (
            text.includes("show me") ||
            text.includes("can you") ||
            text.includes("generate")
          ) {
            handleGenerateRequest(text);
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

  // Push-to-talk keyboard handler (CTRL = hold to talk)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // CTRL key = push-to-talk (hold to talk, release to stop)
      // Using Control instead of CapsLock because CapsLock is a toggle key with inconsistent behavior
      if (e.key === "Control" && !isPushToTalkRef.current && !e.repeat) {
        e.preventDefault();

        // MUST stop audio first to prevent feedback
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          audioRef.current = null;
        }
        setIsSpeaking(false);
        isSpeakingRef.current = false;
        ttsLockRef.current = false;

        // Small delay to ensure audio is fully stopped before starting mic
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
          setGeneratedHtml(null);
        }
      }
      if (e.code === "ArrowLeft" || e.code === "ArrowUp") {
        e.preventDefault();
        if (currentSlideIndex > 0) {
          setCurrentSlideIndex((i) => i - 1);
          setGeneratedHtml(null);
        }
      }

      // Space bar for manual slide advance (no conflict now)
      if (e.code === "Space") {
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
        e.preventDefault();
        if (currentSlideIndex < PRESENTATION_SCRIPT.length - 1) {
          setCurrentSlideIndex((i) => i + 1);
          setGeneratedHtml(null);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Control" && isPushToTalkRef.current) {
        e.preventDefault();
        isPushToTalkRef.current = false;
        setIsPushToTalk(false);

        try {
          recognitionRef.current?.stop();
        } catch (e) {
          // Ignore
        }

        // Send transcript to chat - auto-open conversation if needed
        setTranscript((currentTranscript) => {
          if (currentTranscript && currentTranscript.trim()) {
            // Always open conversation panel and send message
            setShowConversation(true);
            showConversationRef.current = true;
            setMode("conversing");

            // Small delay to ensure state is updated
            setTimeout(() => {
              if (sendMessageRef.current) {
                sendMessageRef.current({ text: currentTranscript.trim() });
              }
            }, 100);
          }
          return ""; // Clear transcript
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [currentSlideIndex]);

  // TTS function using ElevenLabs - with lock to prevent multiple simultaneous calls
  const ttsLockRef = useRef(false);
  const speak = useCallback(async (text: string, onEnd?: () => void) => {
    // Prevent multiple simultaneous TTS calls
    if (ttsLockRef.current) {
      console.log("[TTS] BLOCKED - already speaking");
      return;
    }
    ttsLockRef.current = true;

    // CRITICAL: Stop any listening before speaking to prevent feedback
    try {
      recognitionRef.current?.stop();
    } catch (e) {
      // Ignore
    }
    setIsPushToTalk(false);
    isPushToTalkRef.current = false;
    setTranscript("");

    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    try {
      setIsSpeaking(true);
      isSpeakingRef.current = true;

      console.log("[TTS] Fetching audio for:", text.substring(0, 50) + "...");
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) throw new Error("TTS failed");

      const audioBlob = await response.blob();
      console.log("[TTS] Got audio blob:", audioBlob.size, "bytes");
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        console.log("[TTS] Audio ended");
        setIsSpeaking(false);
        isSpeakingRef.current = false;
        ttsLockRef.current = false;
        URL.revokeObjectURL(audioUrl);
        onEnd?.();
      };

      audio.onerror = (e) => {
        console.error("[TTS] Audio error:", e);
        setIsSpeaking(false);
        isSpeakingRef.current = false;
        ttsLockRef.current = false;
        URL.revokeObjectURL(audioUrl);
      };

      console.log("[TTS] Playing audio...");
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
    ttsLockRef.current = false; // Release lock when stopping
  }, []);

  // Welcome tutorial - plays on first user interaction (click or keydown)
  useEffect(() => {
    if (hasPlayedWelcomeRef.current) return;

    const playWelcome = (e: Event) => {
      if (hasPlayedWelcomeRef.current) return;

      // Don't block CTRL key - let it work immediately
      const keyEvent = e as KeyboardEvent;
      if (keyEvent.key === "Control") {
        hasPlayedWelcomeRef.current = true; // Mark as done but don't play welcome
        cleanup();
        return;
      }

      hasPlayedWelcomeRef.current = true;

      // Small delay after interaction
      setTimeout(() => {
        const welcomeText =
          "Welcome! Hold Control to ask questions, or click Start.";
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
    speak("Of course. Hold Control to ask your question.");
  }, [stopSpeaking, speak]);

  // Handle continue
  const handleContinue = useCallback(() => {
    setGeneratedHtml(null);
    setMode("presenting");
    if (currentSlideIndex < PRESENTATION_SCRIPT.length - 1) {
      setCurrentSlideIndex((i) => i + 1);
    }
  }, [currentSlideIndex]);

  // Track if we know the user's name
  const userNameRef = useRef<string | null>(null);

  // Handle generate request - starts a conversation instead of immediately generating
  const handleGenerateRequest = useCallback(
    async (text: string) => {
      setMode("conversing");
      setShowConversation(true);
      setMessages([]); // Clear previous conversation
      lastSpokenRef.current = null;

      // If we know their name, include it. Otherwise, just say hi to trigger name ask.
      if (userNameRef.current) {
        sendMessage({
          text: `Hi, I'm ${userNameRef.current}. I'd like to see: ${text}`,
        });
      } else {
        // Send a greeting first - AI will ask for name
        sendMessage({ text: `Hi! ${text}` });
      }
    },
    [sendMessage, setMessages],
  );

  // Handle sending a message in the conversation
  const handleSendChatMessage = useCallback(
    (text: string) => {
      if (text.trim() && sendMessage) {
        sendMessage({ text: text.trim() });
        setChatInput("");
      }
    },
    [sendMessage],
  );

  // Close conversation panel
  const closeConversation = useCallback(() => {
    setShowConversation(false);
    setMode("question");
    setMessages([]);
    lastSpokenRef.current = null;
  }, [setMessages]);

  // Navigate
  const goToSlide = useCallback((index: number) => {
    setCurrentSlideIndex(index);
    setGeneratedHtml(null);
    setShowGallery(false);
  }, []);

  // Ref to track manual navigation (defined here, used in effect below)
  const manualNavRef = useRef(false);

  const goToPrevious = useCallback(() => {
    if (currentSlideIndex > 0) {
      // Stop current audio immediately
      stopSpeaking();
      manualNavRef.current = true; // Signal manual navigation
      setCurrentSlideIndex((i) => i - 1);
      setGeneratedHtml(null);
    }
  }, [currentSlideIndex, stopSpeaking]);

  const goToNext = useCallback(() => {
    if (currentSlideIndex < PRESENTATION_SCRIPT.length - 1) {
      // Stop current audio immediately
      stopSpeaking();
      manualNavRef.current = true; // Signal manual navigation
      setCurrentSlideIndex((i) => i + 1);
      setGeneratedHtml(null);
    }
  }, [currentSlideIndex, stopSpeaking]);

  // Start presentation - narrates current slide
  const startPresentation = useCallback(() => {
    setMode("presenting");
    speak(currentSlide.narration, () => {
      // After narration, auto-advance or pause
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
      // Small delay to ensure stopSpeaking has completed
      const timer = setTimeout(() => {
        const wasManualNav = manualNavRef.current;
        manualNavRef.current = false; // Reset flag

        speak(currentSlide.narration, () => {
          // Only auto-advance if NOT manually navigated
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
              {mode === "generating" ? "Creating..." : mode}
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
                src={generatedHtml ? undefined : slideUrl}
                srcDoc={generatedHtml || undefined}
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

          {/* Info Panel - or Conversation Panel when active */}
          <div
            style={{
              width: showConversation ? 400 : 320,
              minWidth: showConversation ? 400 : 320,
              flexShrink: 0,
              background: "rgba(15,20,25,0.98)",
              borderLeft: `1px solid ${COLORS.navy}`,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              transition: "width 0.3s ease",
              zIndex: 10,
              position: "relative",
            }}
          >
            {showConversation ? (
              /* Conversation Panel */
              <>
                <div
                  style={{
                    padding: "12px 16px",
                    borderBottom: `1px solid ${COLORS.coral}33`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <span style={{ color: COLORS.coral, fontWeight: 600 }}>
                      Visualization Assistant
                    </span>
                    {isChatLoading && (
                      <span
                        style={{
                          padding: "2px 8px",
                          background: `${COLORS.teal}22`,
                          borderRadius: 10,
                          color: COLORS.teal,
                          fontSize: 10,
                        }}
                      >
                        Thinking...
                      </span>
                    )}
                  </div>
                  <button
                    onClick={closeConversation}
                    style={{
                      padding: "4px 12px",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 4,
                      color: COLORS.muted,
                      fontSize: 11,
                      cursor: "pointer",
                    }}
                  >
                    Close
                  </button>
                </div>

                {/* Messages */}
                <div
                  style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: 12,
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                  }}
                >
                  {messages.length === 0 && (
                    <div
                      style={{
                        color: COLORS.muted,
                        fontSize: 13,
                        textAlign: "center",
                        marginTop: 40,
                      }}
                    >
                      <p>Starting conversation...</p>
                    </div>
                  )}
                  {messages.map((msg, i) => {
                    const textContent =
                      msg.parts
                        ?.filter(
                          (part: { type: string }) => part.type === "text",
                        )
                        .map(
                          (part: { type: string; text?: string }) => part.text,
                        )
                        .join("") ||
                      (typeof msg.content === "string" ? msg.content : "");

                    // Check for tool invocations
                    const toolPart = msg.parts?.find(
                      (part: { type: string }) =>
                        part.type === "tool-invocation",
                    );

                    return (
                      <div key={`${msg.id || "msg"}-${msg.role}-${i}`}>
                        {textContent && (
                          <div
                            style={{
                              padding: "10px 14px",
                              borderRadius: 8,
                              background:
                                msg.role === "user"
                                  ? `${COLORS.coral}15`
                                  : "rgba(255,255,255,0.05)",
                              borderLeft: `3px solid ${msg.role === "user" ? COLORS.coral : COLORS.teal}`,
                            }}
                          >
                            <div
                              style={{
                                fontSize: 9,
                                color: COLORS.muted,
                                marginBottom: 4,
                                textTransform: "uppercase",
                              }}
                            >
                              {msg.role === "user" ? "You" : "Assistant"}
                            </div>
                            <div
                              style={{
                                color: COLORS.text,
                                fontSize: 13,
                                lineHeight: 1.5,
                              }}
                            >
                              {textContent}
                            </div>
                          </div>
                        )}
                        {toolPart && (toolPart as any).result?.success && (
                          <div
                            style={{
                              marginTop: 8,
                              padding: "8px 12px",
                              background: `${COLORS.teal}15`,
                              borderRadius: 6,
                              border: `1px solid ${COLORS.teal}33`,
                            }}
                          >
                            <span style={{ color: COLORS.teal, fontSize: 11 }}>
                              ✓{" "}
                              {(toolPart as any).result?.summary ||
                                "Visualization created!"}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Chat Input */}
                <div
                  style={{ padding: 12, borderTop: `1px solid ${COLORS.navy}` }}
                >
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendChatMessage(chatInput);
                        }
                      }}
                      placeholder="Type or hold CTRL to speak..."
                      style={{
                        flex: 1,
                        padding: "10px 14px",
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 6,
                        color: COLORS.text,
                        fontSize: 13,
                        outline: "none",
                      }}
                    />
                    <button
                      onClick={() => handleSendChatMessage(chatInput)}
                      disabled={!chatInput.trim() || isChatLoading}
                      style={{
                        padding: "10px 16px",
                        background: chatInput.trim()
                          ? COLORS.teal
                          : "rgba(255,255,255,0.1)",
                        border: "none",
                        borderRadius: 6,
                        color: chatInput.trim() ? "#000" : COLORS.muted,
                        fontWeight: 600,
                        fontSize: 12,
                        cursor: chatInput.trim() ? "pointer" : "not-allowed",
                      }}
                    >
                      Send
                    </button>
                  </div>
                  <p
                    style={{ color: COLORS.muted, fontSize: 10, marginTop: 8 }}
                  >
                    Hold CTRL to speak your response
                  </p>
                </div>
              </>
            ) : (
              /* Normal Info Panel */
              <>
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

                {/* Voice Status - Push-to-Talk */}
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
                        animation: isPushToTalk
                          ? "pulse 0.5s infinite"
                          : "none",
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
                          : "Hold CTRL to talk"}
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
                  <p
                    style={{ color: COLORS.muted, fontSize: 10, marginTop: 8 }}
                  >
                    CTRL = talk | Arrows/Space = navigate | Say "stop" to
                    interrupt
                  </p>
                </div>
              </>
            )}
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

          {mode === "paused" ? (
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
              {isPushToTalk ? "Recording..." : "Hold CTRL to talk"}
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
