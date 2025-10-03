"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { TestLayout } from "@/components/test-layout";
import { TestResults } from "@/components/test-results";

interface Result {
  clicks: number;
  cps: number;
}

export default function ClickSpeedTest() {
  const [results, setResults] = useState<Result[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [currentClicks, setCurrentClicks] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);
  const clickCountRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const lastClickTimesRef = useRef<number[]>([]);

  const maxAttempts = 3;
  const testDuration = 10000; // 10 seconds

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (isRunning) {
      // Draw click counter
      ctx.fillStyle = "#22c55e";
      ctx.font = "bold 72px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(currentClicks.toString(), canvas.width / 2, canvas.height / 2 - 40);

      ctx.fillStyle = "#94a3b8";
      ctx.font = "24px sans-serif";
      ctx.fillText("clicks", canvas.width / 2, canvas.height / 2 + 30);

      // Draw time left
      ctx.fillStyle = "#ffffff";
      ctx.font = "32px sans-serif";
      ctx.fillText(`${Math.ceil(timeLeft)}s`, canvas.width / 2, canvas.height / 2 + 80);

      // Draw recent click indicators
      const now = performance.now();
      lastClickTimesRef.current = lastClickTimesRef.current.filter(t => now - t < 500);

      lastClickTimesRef.current.forEach((clickTime, i) => {
        const age = now - clickTime;
        const alpha = 1 - (age / 500);
        const radius = 20 + (age / 500) * 30;

        ctx.strokeStyle = `rgba(34, 197, 94, ${alpha})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2 - 40, radius, 0, Math.PI * 2);
        ctx.stroke();
      });
    } else {
      ctx.fillStyle = "#94a3b8";
      ctx.font = "24px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Click as fast as you can!", canvas.width / 2, canvas.height / 2 - 20);
      ctx.font = "18px sans-serif";
      ctx.fillText("Click 'Start Test' to begin", canvas.width / 2, canvas.height / 2 + 20);
    }
  }, [isRunning, currentClicks, timeLeft]);

  const animate = useCallback(() => {
    if (!isRunning) return;

    const elapsed = performance.now() - startTimeRef.current;
    const remaining = Math.max(0, (testDuration - elapsed) / 1000);

    setTimeLeft(remaining);

    if (elapsed >= testDuration) {
      const cps = Number((clickCountRef.current / (testDuration / 1000)).toFixed(2));

      setResults(prev => {
        const newResults = [...prev, {
          clicks: clickCountRef.current,
          cps
        }];

        if (newResults.length >= maxAttempts) {
          setIsCompleted(true);
        }

        setIsRunning(false);
        return newResults;
      });

      return;
    }

    drawCanvas();
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [isRunning, drawCanvas]);

  const handleCanvasClick = useCallback(() => {
    if (!isRunning) return;

    clickCountRef.current++;
    setCurrentClicks(clickCountRef.current);
    lastClickTimesRef.current.push(performance.now());
  }, [isRunning]);

  const startTest = () => {
    clickCountRef.current = 0;
    setCurrentClicks(0);
    lastClickTimesRef.current = [];
    startTimeRef.current = performance.now();
    setTimeLeft(10);

    setIsRunning(true);
    cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = requestAnimationFrame(animate);
  };

  const resetTest = () => {
    setResults([]);
    setIsCompleted(false);
    setIsRunning(false);
    setCurrentClicks(0);
    setTimeLeft(10);
    cancelAnimationFrame(animationFrameRef.current);
    drawCanvas();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    drawCanvas();

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [drawCanvas]);

  const avgCPS = results.length > 0
    ? (results.reduce((sum, r) => sum + r.cps, 0) / results.length).toFixed(2)
    : "0.00";

  const maxCPS = results.length > 0
    ? Math.max(...results.map(r => r.cps)).toFixed(2)
    : "0.00";

  if (isCompleted) {
    return (
      <TestResults
        title="Test Complete!"
        description="Your click speed results"
        onReset={resetTest}
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-4xl font-bold text-center mb-2">{avgCPS}</h3>
            <p className="text-center text-muted-foreground text-sm">Avg CPS</p>
          </div>
          <div>
            <h3 className="text-4xl font-bold text-center mb-2">{maxCPS}</h3>
            <p className="text-center text-muted-foreground text-sm">Max CPS</p>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold">Individual attempts:</h4>
          <div className="space-y-1">
            {results.map((result, i) => (
              <div key={i} className="flex justify-between text-sm p-2 rounded hover:bg-muted/50">
                <span>Attempt {i + 1}</span>
                <span className="font-mono">{result.clicks} clicks ({result.cps} CPS)</span>
              </div>
            ))}
          </div>
        </div>
      </TestResults>
    );
  }

  return (
    <TestLayout
      title="Click Speed Test"
      description="Click as many times as you can in 10 seconds"
      progress={{ current: results.length + 1, total: maxAttempts }}
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleCanvasClick}
        className="w-full h-[400px] rounded-lg border shadow-sm cursor-pointer"
      />

      <div className="flex gap-4 mt-6">
        <Button onClick={startTest} disabled={isRunning} size="lg">
          {isRunning ? "Clicking..." : "Start Test"}
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
                <div className="text-xs text-muted-foreground mb-1">Attempt {i + 1}</div>
                <div className="text-xl font-bold font-mono">{result.clicks} clicks</div>
                <div className="text-sm text-muted-foreground font-mono">{result.cps} CPS</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </TestLayout>
  );
}
