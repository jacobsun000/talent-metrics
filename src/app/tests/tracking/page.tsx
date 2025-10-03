"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { TestLayout } from "@/components/test-layout";
import { TestResults } from "@/components/test-results";

interface Target {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface Result {
  averageDistance: number;
  time: number;
}

export default function TrackingTest() {
  const [results, setResults] = useState<Result[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);
  const targetRef = useRef<Target>({ x: 0, y: 0, vx: 2, vy: 1.5 });
  const cursorRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const distancesRef = useRef<number[]>([]);
  const startTimeRef = useRef<number>(0);

  const maxAttempts = 5;
  const targetRadius = 15;
  const trialDuration = 10000; // 10 seconds per trial

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (isRunning) {
      const target = targetRef.current;
      const cursor = cursorRef.current;

      // Draw target
      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.arc(target.x, target.y, targetRadius, 0, Math.PI * 2);
      ctx.fill();

      // Draw cursor crosshair
      ctx.strokeStyle = "#22c55e";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cursor.x - 15, cursor.y);
      ctx.lineTo(cursor.x + 15, cursor.y);
      ctx.moveTo(cursor.x, cursor.y - 15);
      ctx.lineTo(cursor.x, cursor.y + 15);
      ctx.stroke();

      // Draw line between cursor and target
      const distance = Math.sqrt((cursor.x - target.x) ** 2 + (cursor.y - target.y) ** 2);
      ctx.strokeStyle = `rgba(251, 191, 36, ${Math.min(1, distance / 100)})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cursor.x, cursor.y);
      ctx.lineTo(target.x, target.y);
      ctx.stroke();

      // Record distance
      distancesRef.current.push(distance);
    } else {
      ctx.fillStyle = "#94a3b8";
      ctx.font = "24px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Click 'Start Test' to begin", canvas.width / 2, canvas.height / 2);
    }
  }, [isRunning]);

  const updateTarget = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const target = targetRef.current;

    target.x += target.vx;
    target.y += target.vy;

    if (target.x - targetRadius < 0 || target.x + targetRadius > canvas.width) {
      target.vx = -target.vx;
      target.x = Math.max(targetRadius, Math.min(canvas.width - targetRadius, target.x));
    }

    if (target.y - targetRadius < 0 || target.y + targetRadius > canvas.height) {
      target.vy = -target.vy;
      target.y = Math.max(targetRadius, Math.min(canvas.height - targetRadius, target.y));
    }
  }, []);

  const animate = useCallback(() => {
    if (!isRunning) return;

    updateTarget();
    drawCanvas();

    const elapsed = performance.now() - startTimeRef.current;

    if (elapsed >= trialDuration) {
      const avgDistance = distancesRef.current.reduce((a, b) => a + b, 0) / distancesRef.current.length;

      setResults(prev => {
        const newResults = [...prev, {
          averageDistance: Math.round(avgDistance),
          time: trialDuration
        }];

        if (newResults.length >= maxAttempts) {
          setIsCompleted(true);
          setIsRunning(false);
        } else {
          setIsRunning(false);
        }

        return newResults;
      });

      return;
    }

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [isRunning, updateTarget, drawCanvas]);

  const startTest = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    targetRef.current = {
      x: canvas.width / 2,
      y: canvas.height / 2,
      vx: 2 + Math.random(),
      vy: 1.5 + Math.random()
    };

    cursorRef.current = { x: canvas.width / 2, y: canvas.height / 2 };
    distancesRef.current = [];
    startTimeRef.current = performance.now();

    setIsRunning(true);
    cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = requestAnimationFrame(animate);
  };

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isRunning) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    cursorRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }, [isRunning]);

  const resetTest = () => {
    setResults([]);
    setIsCompleted(false);
    setIsRunning(false);
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

  const avgDistance = results.length > 0
    ? Math.round(results.reduce((sum, r) => sum + r.averageDistance, 0) / results.length)
    : 0;

  if (isCompleted) {
    return (
      <TestResults
        title="Test Complete!"
        description="Your tracking results"
        onReset={resetTest}
      >
        <div>
          <h3 className="text-4xl font-bold text-center mb-2">{avgDistance}px</h3>
          <p className="text-center text-muted-foreground">Average distance from target</p>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold">Individual attempts:</h4>
          <div className="space-y-1">
            {results.map((result, i) => (
              <div key={i} className="flex justify-between text-sm p-2 rounded hover:bg-muted/50">
                <span>Attempt {i + 1}</span>
                <span className="font-mono">{result.averageDistance}px</span>
              </div>
            ))}
          </div>
        </div>
      </TestResults>
    );
  }

  return (
    <TestLayout
      title="Tracking Test"
      description="Keep your cursor as close to the moving target as possible for 10 seconds"
      progress={{ current: results.length + 1, total: maxAttempts }}
    >
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        className="w-full h-[500px] rounded-lg border shadow-sm cursor-none"
      />

      <div className="flex gap-4 mt-6 items-center">
        <Button onClick={startTest} disabled={isRunning} size="lg">
          {isRunning ? "Tracking..." : "Start Test"}
        </Button>
        <Button onClick={resetTest} variant="outline" disabled={isRunning} size="lg">
          Reset
        </Button>
        {isRunning && (
          <div className="ml-auto text-sm text-muted-foreground">
            Time: {Math.round((performance.now() - startTimeRef.current) / 1000)}s / 10s
          </div>
        )}
      </div>

      {results.length > 0 && (
        <div className="mt-8 space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground">Results:</h3>
          <div className="flex flex-wrap gap-3">
            {results.map((result, i) => (
              <div key={i} className="px-4 py-3 bg-card border rounded-lg shadow-sm">
                <div className="text-xs text-muted-foreground mb-1">Attempt {i + 1}</div>
                <div className="text-xl font-bold font-mono">{result.averageDistance}px</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </TestLayout>
  );
}
