"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { TestLayout } from "@/components/test-layout";
import { TestResults } from "@/components/test-results";

type TestState = "waiting" | "ready" | "active" | "too-early" | "completed";

export default function SimpleReactionTest() {
  const [results, setResults] = useState<number[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);

  const stateRef = useRef<TestState>("waiting");
  const startTimeRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);

  const maxAttempts = 5;

  const drawCanvas = useCallback((color: string, text: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    // Fill background
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw text
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 48px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  }, []);

  const updateUI = useCallback((state: TestState, text: string) => {
    const colors = {
      waiting: "#ef4444",
      ready: "#ef4444",
      active: "#22c55e",
      "too-early": "#eab308",
      completed: ""
    };

    // Use RAF for immediate visual update synchronized with display refresh
    cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = requestAnimationFrame(() => {
      drawCanvas(colors[state], text);
    });
  }, [drawCanvas]);

  const startTest = useCallback(() => {
    stateRef.current = "ready";
    updateUI("ready", "Wait for green...");

    const delay = 2000 + Math.random() * 3000;

    timeoutRef.current = setTimeout(() => {
      startTimeRef.current = performance.now();
      stateRef.current = "active";
      updateUI("active", "Click now!");
    }, delay);
  }, [updateUI]);

  const handleMouseDown = useCallback(() => {
    const currentState = stateRef.current;

    if (currentState === "waiting") {
      startTest();
    } else if (currentState === "ready") {
      clearTimeout(timeoutRef.current);
      stateRef.current = "too-early";
      updateUI("too-early", "Too early! Wait for green");
      setTimeout(() => {
        stateRef.current = "waiting";
        updateUI("waiting", "Click to start");
      }, 2000);
    } else if (currentState === "active") {
      const reactionTime = performance.now() - startTimeRef.current;

      setResults(prev => {
        const newResults = [...prev, reactionTime];

        if (newResults.length >= maxAttempts) {
          setIsCompleted(true);
        } else {
          stateRef.current = "waiting";
          updateUI("waiting", "Click to start");
        }

        return newResults;
      });
    }
  }, [startTest, updateUI]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Initial draw
    drawCanvas("#ef4444", "Click to start");

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [drawCanvas]);

  const resetTest = () => {
    setResults([]);
    setIsCompleted(false);
    stateRef.current = "waiting";
    drawCanvas("#ef4444", "Click to start");
  };

  const average = results.length > 0
    ? Math.round(results.reduce((a, b) => a + b, 0) / results.length)
    : 0;

  if (isCompleted) {
    return (
      <TestResults
        title="Test Complete!"
        description="Your reaction time results"
        onReset={resetTest}
      >
        <div>
          <h3 className="text-4xl font-bold text-center mb-2">{average}ms</h3>
          <p className="text-center text-muted-foreground">Average reaction time</p>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold">Individual attempts:</h4>
          <div className="space-y-1">
            {results.map((time, i) => (
              <div key={i} className="flex justify-between text-sm p-2 rounded hover:bg-muted/50">
                <span>Attempt {i + 1}</span>
                <span className="font-mono">{Math.round(time)}ms</span>
              </div>
            ))}
          </div>
        </div>
      </TestResults>
    );
  }

  return (
    <TestLayout
      title="Simple Reaction Time Test"
      description="Click as soon as the screen turns green"
      progress={{ current: results.length + 1, total: maxAttempts }}
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        className="w-full h-96 rounded-lg cursor-pointer border shadow-sm"
      />

      {results.length > 0 && (
        <div className="mt-8 space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground">Results:</h3>
          <div className="flex flex-wrap gap-3">
            {results.map((time, i) => (
              <div key={i} className="px-4 py-3 bg-card border rounded-lg shadow-sm">
                <div className="text-xs text-muted-foreground mb-1">Attempt {i + 1}</div>
                <div className="text-xl font-bold font-mono">{Math.round(time)}ms</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </TestLayout>
  );
}
