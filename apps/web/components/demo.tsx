"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Renderer, useUIStream, JSONUIProvider } from "@json-render/react";
import type { UITree } from "@json-render/core";
import { toast } from "sonner";
import { CodeBlock } from "./code-block";
import { Toaster } from "./ui/sonner";
import { demoRegistry, fallbackComponent, useInteractiveState } from "./demo/index";

const SIMULATION_PROMPT = "Create a contact form with name, email, and message";

interface SimulationStage {
  tree: UITree;
  stream: string;
}

const SIMULATION_STAGES: SimulationStage[] = [
  {
    tree: { root: "card", elements: { card: { key: "card", type: "Card", props: { title: "Contact Us", maxWidth: "md" }, children: [] } } },
    stream: '{"op":"set","path":"/root","value":"card"}',
  },
  {
    tree: { root: "card", elements: { card: { key: "card", type: "Card", props: { title: "Contact Us", maxWidth: "md" }, children: ["name"] }, name: { key: "name", type: "Input", props: { label: "Name", name: "name" } } } },
    stream: '{"op":"add","path":"/elements/card","value":{"key":"card","type":"Card","props":{"title":"Contact Us","maxWidth":"md"},"children":["name"]}}',
  },
  {
    tree: { root: "card", elements: { card: { key: "card", type: "Card", props: { title: "Contact Us", maxWidth: "md" }, children: ["name", "email"] }, name: { key: "name", type: "Input", props: { label: "Name", name: "name" } }, email: { key: "email", type: "Input", props: { label: "Email", name: "email" } } } },
    stream: '{"op":"add","path":"/elements/email","value":{"key":"email","type":"Input","props":{"label":"Email","name":"email"}}}',
  },
  {
    tree: { root: "card", elements: { card: { key: "card", type: "Card", props: { title: "Contact Us", maxWidth: "md" }, children: ["name", "email", "message"] }, name: { key: "name", type: "Input", props: { label: "Name", name: "name" } }, email: { key: "email", type: "Input", props: { label: "Email", name: "email" } }, message: { key: "message", type: "Textarea", props: { label: "Message", name: "message" } } } },
    stream: '{"op":"add","path":"/elements/message","value":{"key":"message","type":"Textarea","props":{"label":"Message","name":"message"}}}',
  },
  {
    tree: { root: "card", elements: { card: { key: "card", type: "Card", props: { title: "Contact Us", maxWidth: "md" }, children: ["name", "email", "message", "submit"] }, name: { key: "name", type: "Input", props: { label: "Name", name: "name" } }, email: { key: "email", type: "Input", props: { label: "Email", name: "email" } }, message: { key: "message", type: "Textarea", props: { label: "Message", name: "message" } }, submit: { key: "submit", type: "Button", props: { label: "Send Message", variant: "primary" } } } },
    stream: '{"op":"add","path":"/elements/submit","value":{"key":"submit","type":"Button","props":{"label":"Send Message","variant":"primary"}}}',
  },
];

const CODE_EXAMPLE = `import { Renderer, useUIStream } from '@json-render/react';
import { registry } from './registry';

function App() {
  const { tree, isStreaming, send } = useUIStream({
    api: '/api/generate',
  });

  return (
    <Renderer
      tree={tree}
      registry={registry}
      loading={isStreaming}
    />
  );
}`;

type Mode = "simulation" | "interactive";
type Phase = "typing" | "streaming" | "complete";
type Tab = "stream" | "json" | "code";

export function Demo() {
  const [mode, setMode] = useState<Mode>("simulation");
  const [phase, setPhase] = useState<Phase>("typing");
  const [typedPrompt, setTypedPrompt] = useState("");
  const [userPrompt, setUserPrompt] = useState("");
  const [stageIndex, setStageIndex] = useState(-1);
  const [streamLines, setStreamLines] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("json");
  const [simulationTree, setSimulationTree] = useState<UITree | null>(null);

  // Use the library's useUIStream hook for real API calls
  const {
    tree: apiTree,
    isStreaming,
    send,
    clear,
  } = useUIStream({
    api: "/api/generate",
    onError: (err: Error) => console.error("Generation error:", err),
  } as Parameters<typeof useUIStream>[0]);

  // Initialize interactive state for Select components
  useInteractiveState();

  const currentSimulationStage = stageIndex >= 0 ? SIMULATION_STAGES[stageIndex] : null;

  // Determine which tree to display - keep simulation tree until new API response
  const currentTree = mode === "simulation" 
    ? (currentSimulationStage?.tree || simulationTree) 
    : (apiTree || simulationTree);

  const stopGeneration = useCallback(() => {
    if (mode === "simulation") {
      setMode("interactive");
      setPhase("complete");
      setTypedPrompt(SIMULATION_PROMPT);
      setUserPrompt("");
    }
    clear();
  }, [mode, clear]);

  // Typing effect for simulation
  useEffect(() => {
    if (mode !== "simulation" || phase !== "typing") return;

    let i = 0;
    const interval = setInterval(() => {
      if (i < SIMULATION_PROMPT.length) {
        setTypedPrompt(SIMULATION_PROMPT.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
        setTimeout(() => setPhase("streaming"), 500);
      }
    }, 20);

    return () => clearInterval(interval);
  }, [mode, phase]);

  // Streaming effect for simulation
  useEffect(() => {
    if (mode !== "simulation" || phase !== "streaming") return;

    let i = 0;
    const interval = setInterval(() => {
      if (i < SIMULATION_STAGES.length) {
        const stage = SIMULATION_STAGES[i];
        if (stage) {
          setStageIndex(i);
          setStreamLines((prev) => [...prev, stage.stream]);
          setSimulationTree(stage.tree);
        }
        i++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setPhase("complete");
          setMode("interactive");
          setUserPrompt("");
        }, 500);
      }
    }, 600);

    return () => clearInterval(interval);
  }, [mode, phase]);

  // Track stream lines from real API
  useEffect(() => {
    if (mode === "interactive" && apiTree) {
      // Convert tree to stream line for display
      const streamLine = JSON.stringify({ tree: apiTree });
      if (!streamLines.includes(streamLine) && Object.keys(apiTree.elements).length > 0) {
        setStreamLines((prev) => {
          const lastLine = prev[prev.length - 1];
          if (lastLine !== streamLine) {
            return [...prev, streamLine];
          }
          return prev;
        });
      }
    }
  }, [mode, apiTree, streamLines]);

  const handleSubmit = useCallback(async () => {
    if (!userPrompt.trim() || isStreaming) return;
    setStreamLines([]);
    await send(userPrompt);
  }, [userPrompt, isStreaming, send]);

  // Expose action handler for registry components - shows toast with text
  useEffect(() => {
    (window as unknown as { __demoAction?: (text: string) => void }).__demoAction = (text: string) => {
      toast(text);
    };
    return () => {
      delete (window as unknown as { __demoAction?: (text: string) => void }).__demoAction;
    };
  }, []);

  const jsonCode = currentTree ? JSON.stringify(currentTree, null, 2) : "// waiting...";

  const isTypingSimulation = mode === "simulation" && phase === "typing";
  const isStreamingSimulation = mode === "simulation" && phase === "streaming";
  const showLoadingDots = isStreamingSimulation || isStreaming;

  return (
    <div className="w-full max-w-4xl mx-auto text-left">
      {/* Prompt input */}
      <div className="mb-6">
        <div className="border border-border rounded p-3 bg-background font-mono text-sm min-h-[44px] flex items-center justify-between">
          {mode === "simulation" ? (
            <div className="flex items-center flex-1">
              <span className="inline-flex items-center h-5">{typedPrompt}</span>
              {isTypingSimulation && (
                <span className="inline-block w-2 h-4 bg-foreground ml-0.5 animate-pulse" />
              )}
            </div>
          ) : (
            <form
              className="flex items-center flex-1"
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
            >
              <input
                type="text"
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                placeholder="Describe what you want to build..."
                className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground/50"
                disabled={isStreaming}
                maxLength={140}
                autoFocus
              />
            </form>
          )}
          {(mode === "simulation" || isStreaming) ? (
            <button
              onClick={stopGeneration}
              className="ml-2 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors"
              aria-label="Stop"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
                stroke="none"
              >
                <rect x="6" y="6" width="12" height="12" />
              </svg>
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!userPrompt.trim()}
              className="ml-2 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-30"
              aria-label="Submit"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 5v14" />
                <path d="M19 12l-7 7-7-7" />
              </svg>
            </button>
          )}
        </div>
        <div className="mt-2 text-xs text-muted-foreground text-center">
          Try: &quot;Create a login form&quot; or &quot;Build a feedback form with rating&quot;
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Tabbed code/stream/json panel */}
        <div>
          <div className="flex gap-4 mb-2">
            {(["json", "stream", "code"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-xs font-mono transition-colors ${
                  activeTab === tab ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="border border-border rounded p-3 bg-background font-mono text-xs h-96 overflow-auto text-left">
            <div className={activeTab === "stream" ? "" : "hidden"}>
              {streamLines.length > 0 ? (
                <>
                  <CodeBlock code={streamLines.join("\n")} lang="json" />
                  {showLoadingDots && (
                    <div className="flex gap-1 mt-2">
                      <span className="w-1 h-1 bg-muted-foreground rounded-full animate-pulse" />
                      <span className="w-1 h-1 bg-muted-foreground rounded-full animate-pulse [animation-delay:75ms]" />
                      <span className="w-1 h-1 bg-muted-foreground rounded-full animate-pulse [animation-delay:150ms]" />
                    </div>
                  )}
                </>
              ) : (
                <div className="text-muted-foreground/50">
                  {showLoadingDots ? "streaming..." : "waiting..."}
                </div>
              )}
            </div>
            <div className={activeTab === "json" ? "" : "hidden"}>
              <CodeBlock code={jsonCode} lang="json" />
            </div>
            <div className={activeTab === "code" ? "" : "hidden"}>
              <CodeBlock code={CODE_EXAMPLE} lang="tsx" />
            </div>
          </div>
        </div>

        {/* Rendered output using json-render */}
        <div>
          <div className="text-xs text-muted-foreground mb-2 font-mono">render</div>
          <div className="border border-border rounded p-3 bg-background h-96 overflow-auto">
            {currentTree && currentTree.root ? (
              <div className="animate-in fade-in duration-200 w-full min-h-full flex items-center justify-center py-4">
                <JSONUIProvider registry={demoRegistry as Parameters<typeof JSONUIProvider>[0]['registry']}>
                  <Renderer
                    tree={currentTree}
                    registry={demoRegistry as Parameters<typeof Renderer>[0]['registry']}
                    loading={isStreaming || isStreamingSimulation}
                    fallback={fallbackComponent as Parameters<typeof Renderer>[0]['fallback']}
                  />
                </JSONUIProvider>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground/50 text-sm">
                {isStreaming ? "generating..." : "waiting..."}
              </div>
            )}
          </div>
          <Toaster position="bottom-right" />
        </div>
      </div>
    </div>
  );
}
