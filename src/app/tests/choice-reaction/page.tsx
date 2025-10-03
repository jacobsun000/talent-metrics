"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { TestLayout } from "@/components/test-layout";
import { TestResults } from "@/components/test-results";

type Direction = "left" | "right" | "up" | "down";
type TestState = "waiting" | "ready" | "active" | "wrong" | "completed";

interface Result {
  direction: Direction;
  time: number;
  correct: boolean;
}

const DIRECTIONS: Direction[] = ["left", "right", "up", "down"];
const ARROW_SYMBOLS: Record<Direction, string> = {
  left: "←",
  right: "→",
  up: "↑",
  down: "↓",
};

const KEY_MAP: Record<string, Direction> = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "up",
  ArrowDown: "down",
  a: "left",
  d: "right",
  w: "up",
  s: "down",
};

export default function ChoiceReactionTest() {
  const [results, setResults] = useState<Result[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);

  const stateRef = useRef<TestState>("waiting");
  const startTimeRef = useRef<number>(0);
  const currentDirectionRef = useRef<Direction>("left");
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);

  const maxAttempts = 10;

  const drawCanvas = useCallback((color: string, text: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 72px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  }, []);

  const updateUI = useCallback((state: TestState, text: string) => {
    const colors = {
      waiting: "#6b7280",
      ready: "#ef4444",
      active: "#22c55e",
      wrong: "#eab308",
      completed: ""
    };

    cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = requestAnimationFrame(() => {
      drawCanvas(colors[state], text);
    });
  }, [drawCanvas]);

  const startTest = useCallback(() => {
    stateRef.current = "ready";
    updateUI("ready", "Get ready...");

    const delay = 1000 + Math.random() * 2000;

    timeoutRef.current = setTimeout(() => {
      const direction = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
      currentDirectionRef.current = direction;
      stateRef.current = "active";

      // Draw immediately and set start time in the same RAF callback to minimize latency
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = requestAnimationFrame(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d", { alpha: false });
        if (!ctx) return;

        ctx.fillStyle = "#22c55e";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 72px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(ARROW_SYMBOLS[direction], canvas.width / 2, canvas.height / 2);

        // Set start time immediately after drawing
        startTimeRef.current = performance.now();
      });
    }, delay);
  }, [updateUI]);

  const handleKeyPress = useCallback((direction: Direction) => {
    const currentState = stateRef.current;

    if (currentState === "waiting") {
      startTest();
    } else if (currentState === "active") {
      const reactionTime = performance.now() - startTimeRef.current;
      const correct = direction === currentDirectionRef.current;

      if (!correct) {
        stateRef.current = "wrong";
        updateUI("wrong", "Wrong key!");
        setTimeout(() => {
          stateRef.current = "waiting";
          updateUI("waiting", "Press arrow or WASD to start");
        }, 1500);
        return;
      }

      setResults(prev => {
        const newResults = [...prev, { direction, time: reactionTime, correct }];

        if (newResults.length >= maxAttempts) {
          setIsCompleted(true);
        } else {
          stateRef.current = "waiting";
          updateUI("waiting", "Press arrow or WASD to start");
        }

        return newResults;
      });
    }
  }, [startTest, updateUI]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    drawCanvas("#6b7280", "Press arrow or WASD to start");

    const handleKeyDown = (e: KeyboardEvent) => {
      const direction = KEY_MAP[e.key];
      if (direction) {
        e.preventDefault();
        handleKeyPress(direction);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [drawCanvas, handleKeyPress]);

  const resetTest = () => {
    setResults([]);
    setIsCompleted(false);
    stateRef.current = "waiting";
    drawCanvas("#6b7280", "Press arrow or WASD to start");
  };

  const correctResults = results.filter(r => r.correct);
  const average = correctResults.length > 0
    ? Math.round(correctResults.reduce((a, b) => a + b.time, 0) / correctResults.length)
    : 0;

  if (isCompleted) {
    return (
      <TestResults
        title="Test Complete!"
        description="Your choice reaction time results"
        onReset={resetTest}
      >
        <div>
          <h3 className="text-4xl font-bold text-center mb-2">{average}ms</h3>
          <p className="text-center text-muted-foreground">Average reaction time</p>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold">Individual attempts:</h4>
          <div className="space-y-1">
            {results.map((result, i) => (
              <div key={i} className="flex justify-between text-sm p-2 rounded hover:bg-muted/50">
                <span>
                  Attempt {i + 1} {ARROW_SYMBOLS[result.direction]}
                </span>
                <span className={result.correct ? "font-mono" : "text-destructive font-mono"}>
                  {result.correct ? `${Math.round(result.time)}ms` : "Wrong"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </TestResults>
    );
  }

  return (
    <TestLayout
      title="Choice Reaction Time Test"
      description="Press the arrow key or WASD that matches the direction shown"
      progress={{ current: results.length + 1, total: maxAttempts }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-96 rounded-lg cursor-pointer border shadow-sm"
      />

      {results.length > 0 && (
        <div className="mt-8 space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground">Results:</h3>
          <div className="flex flex-wrap gap-3">
            {results.map((result, i) => (
              <div key={i} className="px-4 py-3 bg-card border rounded-lg shadow-sm">
                <div className="text-xs text-muted-foreground mb-1">
                  {ARROW_SYMBOLS[result.direction]} Attempt {i + 1}
                </div>
                <div className={`text-xl font-bold font-mono ${result.correct ? "" : "text-destructive"}`}>
                  {result.correct ? `${Math.round(result.time)}ms` : "Wrong"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </TestLayout>
  );
}
