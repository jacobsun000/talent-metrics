"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { TestLayout } from "@/components/test-layout";
import { TestResults } from "@/components/test-results";

type Direction = "left" | "right";

interface Result {
  direction: Direction;
  distance: number;
  correct: boolean;
  responseTime: number;
}

export default function PeripheralVisionTest() {
  const [results, setResults] = useState<Result[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);
  const currentDirectionRef = useRef<Direction>("left");
  const currentDistanceRef = useRef<number>(150);
  const startTimeRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const isActiveRef = useRef<boolean>(false);

  const maxAttempts = 10;

  const drawCanvas = useCallback((showStimulus: boolean = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Center fixation point
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
    ctx.fill();

    if (showStimulus) {
      const direction = currentDirectionRef.current;
      const distance = currentDistanceRef.current;
      const targetX = direction === "left" ? centerX - distance : centerX + distance;

      ctx.fillStyle = "#22c55e";
      ctx.beginPath();
      ctx.arc(targetX, centerY, 15, 0, Math.PI * 2);
      ctx.fill();
    } else if (!isRunning) {
      ctx.fillStyle = "#94a3b8";
      ctx.font = "20px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Keep your eyes on the center dot", centerX, centerY - 60);
      ctx.fillText("Press arrow keys when you see peripheral flash", centerX, centerY - 35);
    }
  }, [isRunning]);

  const startTrial = useCallback(() => {
    const direction: Direction = Math.random() > 0.5 ? "left" : "right";
    currentDirectionRef.current = direction;

    const delay = 1000 + Math.random() * 2000;

    timeoutRef.current = setTimeout(() => {
      isActiveRef.current = true;
      startTimeRef.current = performance.now();

      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = requestAnimationFrame(() => {
        drawCanvas(true);
      });

      setTimeout(() => {
        if (isActiveRef.current) {
          // Timeout - no response
          isActiveRef.current = false;
          setResults(prev => {
            const newResults = [...prev, {
              direction,
              distance: currentDistanceRef.current,
              correct: false,
              responseTime: 0
            }];

            if (newResults.length >= maxAttempts) {
              setIsCompleted(true);
              setIsRunning(false);
            } else {
              currentDistanceRef.current = Math.max(100, currentDistanceRef.current - 20);
              cancelAnimationFrame(animationFrameRef.current);
              animationFrameRef.current = requestAnimationFrame(() => {
                drawCanvas(false);
              });
              setTimeout(startTrial, 500);
            }

            return newResults;
          });
        }
      }, 300);
    }, delay);
  }, [drawCanvas]);

  const handleKeyPress = useCallback((pressedDirection: Direction) => {
    if (!isActiveRef.current) return;

    isActiveRef.current = false;
    const responseTime = performance.now() - startTimeRef.current;
    const correct = pressedDirection === currentDirectionRef.current;

    setResults(prev => {
      const newResults = [...prev, {
        direction: currentDirectionRef.current,
        distance: currentDistanceRef.current,
        correct,
        responseTime
      }];

      if (newResults.length >= maxAttempts) {
        setIsCompleted(true);
        setIsRunning(false);
      } else {
        // Adaptive difficulty
        const recentResults = newResults.slice(-3);
        const recentCorrect = recentResults.filter(r => r.correct).length;

        if (recentCorrect === 3) {
          currentDistanceRef.current = Math.min(400, currentDistanceRef.current + 30);
        } else if (recentCorrect === 0) {
          currentDistanceRef.current = Math.max(100, currentDistanceRef.current - 30);
        }

        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = requestAnimationFrame(() => {
          drawCanvas(false);
        });

        setTimeout(startTrial, 500);
      }

      return newResults;
    });
  }, [startTrial, drawCanvas]);

  const startTest = () => {
    setIsRunning(true);
    setResults([]);
    setIsCompleted(false);
    currentDistanceRef.current = 150;
    startTrial();
  };

  const resetTest = () => {
    setResults([]);
    setIsCompleted(false);
    setIsRunning(false);
    isActiveRef.current = false;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    cancelAnimationFrame(animationFrameRef.current);
    drawCanvas(false);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    drawCanvas(false);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handleKeyPress("left");
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleKeyPress("right");
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [drawCanvas, handleKeyPress]);

  const correctCount = results.filter(r => r.correct).length;
  const accuracy = results.length > 0 ? Math.round((correctCount / results.length) * 100) : 0;
  const avgResponseTime = correctCount > 0
    ? Math.round(results.filter(r => r.correct).reduce((sum, r) => sum + r.responseTime, 0) / correctCount)
    : 0;
  const maxDistance = Math.max(...results.map(r => r.distance), 0);

  if (isCompleted) {
    return (
      <TestResults
        title="Test Complete!"
        description="Your peripheral vision results"
        onReset={resetTest}
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-4xl font-bold text-center mb-2">{accuracy}%</h3>
            <p className="text-center text-muted-foreground text-sm">Accuracy</p>
          </div>
          <div>
            <h3 className="text-4xl font-bold text-center mb-2">{maxDistance}px</h3>
            <p className="text-center text-muted-foreground text-sm">Max Distance</p>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold">Statistics:</h4>
          <div className="text-sm space-y-1">
            <div className="flex justify-between p-2 rounded hover:bg-muted/50">
              <span className="text-muted-foreground">Avg Response:</span>
              <span className="font-mono">{avgResponseTime}ms</span>
            </div>
            <div className="flex justify-between p-2 rounded hover:bg-muted/50">
              <span className="text-muted-foreground">Correct:</span>
              <span className="font-mono">{correctCount} / {maxAttempts}</span>
            </div>
          </div>
        </div>
      </TestResults>
    );
  }

  return (
    <TestLayout
      title="Peripheral Vision Test"
      description="Keep your eyes on the center dot. Press arrow keys when you detect peripheral flashes"
      progress={{ current: results.length + 1, total: maxAttempts }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-[400px] rounded-lg border shadow-sm"
      />

      <div className="flex gap-4 mt-6">
        <Button onClick={startTest} disabled={isRunning} size="lg">
          {isRunning ? "Running..." : "Start Test"}
        </Button>
        <Button onClick={resetTest} variant="outline" disabled={isRunning} size="lg">
          Reset
        </Button>
      </div>

      {results.length > 0 && (
        <div className="mt-8 space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground">Results:</h3>
          <div className="flex flex-wrap gap-3">
            {results.map((result, i) => (
              <div key={i} className="px-4 py-3 bg-card border rounded-lg shadow-sm">
                <div className="text-xs text-muted-foreground mb-1">
                  {result.direction === "left" ? "←" : "→"} {result.distance}px
                </div>
                <div className={`text-xl font-bold font-mono ${result.correct ? "text-green-600" : "text-destructive"}`}>
                  {result.correct ? `${Math.round(result.responseTime)}ms` : "✗"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </TestLayout>
  );
}
