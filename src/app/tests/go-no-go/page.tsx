"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { TestLayout } from "@/components/test-layout";
import { TestResults } from "@/components/test-results";

type TestState = "waiting" | "ready" | "active-go" | "active-no-go" | "wrong" | "completed";

interface Result {
  type: "go" | "no-go";
  time: number | null;
  correct: boolean;
}

const SHAPES = ["circle", "square", "triangle"];
const GO_SHAPE = "circle";

export default function GoNoGoTest() {
  const [results, setResults] = useState<Result[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);

  const stateRef = useRef<TestState>("waiting");
  const startTimeRef = useRef<number>(0);
  const currentShapeRef = useRef<string>("");
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const noGoTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);

  const maxAttempts = 15;

  const drawCanvas = useCallback((color: string, shape?: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (shape) {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const size = 100;

      ctx.fillStyle = "#ffffff";
      ctx.beginPath();

      if (shape === "circle") {
        ctx.arc(centerX, centerY, size, 0, Math.PI * 2);
      } else if (shape === "square") {
        ctx.rect(centerX - size, centerY - size, size * 2, size * 2);
      } else if (shape === "triangle") {
        ctx.moveTo(centerX, centerY - size);
        ctx.lineTo(centerX - size, centerY + size);
        ctx.lineTo(centerX + size, centerY + size);
        ctx.closePath();
      }

      ctx.fill();
    } else {
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 32px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Press any key to start", canvas.width / 2, canvas.height / 2);
    }
  }, []);

  const startTest = useCallback(() => {
    stateRef.current = "ready";

    cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = requestAnimationFrame(() => {
      drawCanvas("#6b7280");
    });

    const delay = 500 + Math.random() * 1500;

    timeoutRef.current = setTimeout(() => {
      const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
      currentShapeRef.current = shape;
      const isGo = shape === GO_SHAPE;
      stateRef.current = isGo ? "active-go" : "active-no-go";

      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = requestAnimationFrame(() => {
        drawCanvas(isGo ? "#22c55e" : "#ef4444", shape);
        startTimeRef.current = performance.now();
      });

      // Auto-record correct no-go after 1 second
      if (!isGo) {
        noGoTimeoutRef.current = setTimeout(() => {
          if (stateRef.current === "active-no-go") {
            setResults(prev => {
              const newResults = [...prev, { type: "no-go" as const, time: null, correct: true }];

              if (newResults.length >= maxAttempts) {
                setIsCompleted(true);
              } else {
                stateRef.current = "waiting";
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = requestAnimationFrame(() => {
                  drawCanvas("#6b7280");
                });
              }

              return newResults;
            });
          }
        }, 1000);
      }
    }, delay);
  }, [drawCanvas]);

  const handleKeyPress = useCallback(() => {
    const currentState = stateRef.current;

    if (currentState === "waiting") {
      startTest();
    } else if (currentState === "active-go") {
      const reactionTime = performance.now() - startTimeRef.current;

      setResults(prev => {
        const newResults = [...prev, { type: "go" as const, time: reactionTime, correct: true }];

        if (newResults.length >= maxAttempts) {
          setIsCompleted(true);
        } else {
          stateRef.current = "waiting";
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = requestAnimationFrame(() => {
            drawCanvas("#6b7280");
          });
        }

        return newResults;
      });
    } else if (currentState === "active-no-go") {
      clearTimeout(noGoTimeoutRef.current);

      setResults(prev => {
        const newResults = [...prev, { type: "no-go" as const, time: null, correct: false }];

        if (newResults.length >= maxAttempts) {
          setIsCompleted(true);
        } else {
          stateRef.current = "wrong";
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = requestAnimationFrame(() => {
            drawCanvas("#eab308");
          });

          setTimeout(() => {
            stateRef.current = "waiting";
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = requestAnimationFrame(() => {
              drawCanvas("#6b7280");
            });
          }, 1000);
        }

        return newResults;
      });
    }
  }, [startTest, drawCanvas]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    drawCanvas("#6b7280");

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      handleKeyPress();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (noGoTimeoutRef.current) clearTimeout(noGoTimeoutRef.current);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [drawCanvas, handleKeyPress]);

  const resetTest = () => {
    setResults([]);
    setIsCompleted(false);
    stateRef.current = "waiting";
    drawCanvas("#6b7280");
  };

  const goResults = results.filter(r => r.type === "go");
  const noGoResults = results.filter(r => r.type === "no-go");
  const correctGo = goResults.filter(r => r.correct).length;
  const correctNoGo = noGoResults.filter(r => r.correct).length;
  const goAccuracy = goResults.length > 0 ? Math.round((correctGo / goResults.length) * 100) : 0;
  const noGoAccuracy = noGoResults.length > 0 ? Math.round((correctNoGo / noGoResults.length) * 100) : 0;
  const averageGoTime = correctGo > 0
    ? Math.round(goResults.filter(r => r.correct && r.time).reduce((a, b) => a + (b.time || 0), 0) / correctGo)
    : 0;

  if (isCompleted) {
    return (
      <TestResults
        title="Test Complete!"
        description="Your Go/No-Go test results"
        onReset={resetTest}
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-4xl font-bold text-center mb-2">{goAccuracy}%</h3>
            <p className="text-center text-muted-foreground text-sm">Go Accuracy</p>
          </div>
          <div>
            <h3 className="text-4xl font-bold text-center mb-2">{noGoAccuracy}%</h3>
            <p className="text-center text-muted-foreground text-sm">No-Go Accuracy</p>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold">Statistics:</h4>
          <div className="text-sm space-y-1">
            <div className="flex justify-between p-2 rounded hover:bg-muted/50">
              <span className="text-muted-foreground">Avg Go Time:</span>
              <span className="font-mono">{averageGoTime}ms</span>
            </div>
            <div className="flex justify-between p-2 rounded hover:bg-muted/50">
              <span className="text-muted-foreground">Go Trials:</span>
              <span className="font-mono">{correctGo} / {goResults.length}</span>
            </div>
            <div className="flex justify-between p-2 rounded hover:bg-muted/50">
              <span className="text-muted-foreground">No-Go Trials:</span>
              <span className="font-mono">{correctNoGo} / {noGoResults.length}</span>
            </div>
          </div>
        </div>
      </TestResults>
    );
  }

  return (
    <TestLayout
      title="Go/No-Go Test"
      description="Press any key when you see a CIRCLE (green). Do NOT press for other shapes (red)"
      progress={{ current: results.length + 1, total: maxAttempts }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-96 rounded-lg border shadow-sm"
      />

      {results.length > 0 && (
        <div className="mt-8 space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground">Results:</h3>
          <div className="flex flex-wrap gap-3">
            {results.map((result, i) => (
              <div key={i} className="px-4 py-3 bg-card border rounded-lg shadow-sm">
                <div className="text-xs text-muted-foreground mb-1">
                  {result.type === "go" ? "Go" : "No-Go"} #{i + 1}
                </div>
                <div className={`text-xl font-bold font-mono ${result.correct ? "text-green-600" : "text-destructive"}`}>
                  {result.correct
                    ? (result.time ? `${Math.round(result.time)}ms` : "✓")
                    : "✗"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </TestLayout>
  );
}
