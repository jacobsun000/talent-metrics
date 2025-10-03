"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { TestLayout } from "@/components/test-layout";
import { TestResults } from "@/components/test-results";

interface Target {
  x: number;
  y: number;
  radius: number;
}

interface Result {
  distance: number;
  time: number;
  hit: boolean;
}

export default function AimAccuracyTest() {
  const [results, setResults] = useState<Result[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [sensitivity, setSensitivity] = useState(1.0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentTargetRef = useRef<Target | null>(null);
  const targetSpawnTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);
  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const virtualCursorRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const maxAttempts = 10;
  const targetRadius = 30;

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw target if exists
    const target = currentTargetRef.current;
    if (target) {
      // Outer circle (border)
      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.arc(target.x, target.y, target.radius, 0, Math.PI * 2);
      ctx.fill();

      // Inner circle
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(target.x, target.y, target.radius * 0.3, 0, Math.PI * 2);
      ctx.fill();
    } else if (!isRunning) {
      // Show instruction text
      ctx.fillStyle = "#94a3b8";
      ctx.font = "24px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Click 'Start Test' to begin", canvas.width / 2, canvas.height / 2);
    }

    // Draw custom cursor when running
    if (isRunning) {
      const cursor = virtualCursorRef.current;
      ctx.strokeStyle = "#22c55e";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cursor.x - 10, cursor.y);
      ctx.lineTo(cursor.x + 10, cursor.y);
      ctx.moveTo(cursor.x, cursor.y - 10);
      ctx.lineTo(cursor.x, cursor.y + 10);
      ctx.stroke();
    }
  }, [isRunning]);

  const spawnTarget = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const padding = targetRadius + 10;
    const x = padding + Math.random() * (canvas.width - padding * 2);
    const y = padding + Math.random() * (canvas.height - padding * 2);

    currentTargetRef.current = { x, y, radius: targetRadius };
    targetSpawnTimeRef.current = performance.now();

    cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = requestAnimationFrame(drawCanvas);
  }, [targetRadius, drawCanvas]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isRunning) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Calculate delta from last position
    const deltaX = (mouseX - lastMousePosRef.current.x) * sensitivity;
    const deltaY = (mouseY - lastMousePosRef.current.y) * sensitivity;

    // Update virtual cursor position
    virtualCursorRef.current.x = Math.max(0, Math.min(canvas.width, virtualCursorRef.current.x + deltaX));
    virtualCursorRef.current.y = Math.max(0, Math.min(canvas.height, virtualCursorRef.current.y + deltaY));

    lastMousePosRef.current = { x: mouseX, y: mouseY };

    // Redraw canvas
    cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = requestAnimationFrame(drawCanvas);
  }, [isRunning, sensitivity, drawCanvas]);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isRunning || !currentTargetRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = virtualCursorRef.current.x;
    const clickY = virtualCursorRef.current.y;

    const target = currentTargetRef.current;
    const distance = Math.sqrt(
      Math.pow(clickX - target.x, 2) + Math.pow(clickY - target.y, 2)
    );

    const hit = distance <= target.radius;
    const reactionTime = performance.now() - targetSpawnTimeRef.current;

    setResults(prev => {
      const newResults = [...prev, { distance, time: reactionTime, hit }];

      if (newResults.length >= maxAttempts) {
        setIsCompleted(true);
        setIsRunning(false);
        currentTargetRef.current = null;
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = requestAnimationFrame(drawCanvas);
      } else {
        // Spawn next target after short delay
        currentTargetRef.current = null;
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = requestAnimationFrame(drawCanvas);
        setTimeout(spawnTarget, 500);
      }

      return newResults;
    });
  }, [isRunning, maxAttempts, spawnTarget, drawCanvas]);

  const startTest = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Initialize virtual cursor to center
    virtualCursorRef.current = { x: canvas.width / 2, y: canvas.height / 2 };
    lastMousePosRef.current = { x: canvas.width / 2, y: canvas.height / 2 };

    setIsRunning(true);
    setResults([]);
    setIsCompleted(false);
    spawnTarget();
  };

  const resetTest = () => {
    setResults([]);
    setIsCompleted(false);
    setIsRunning(false);
    currentTargetRef.current = null;
    cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = requestAnimationFrame(drawCanvas);
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

  const hits = results.filter(r => r.hit).length;
  const accuracy = results.length > 0 ? Math.round((hits / results.length) * 100) : 0;
  const averageTime = results.length > 0
    ? Math.round(results.reduce((a, b) => a + b.time, 0) / results.length)
    : 0;
  const averageDistance = results.length > 0
    ? Math.round(results.reduce((a, b) => a + b.distance, 0) / results.length)
    : 0;

  if (isCompleted) {
    return (
      <TestResults
        title="Test Complete!"
        description="Your aim accuracy results"
        onReset={resetTest}
      >
        <div className="grid grid-cols-2 gap-6">
          <div className="text-center">
            <h3 className="text-4xl font-bold mb-2">{accuracy}%</h3>
            <p className="text-muted-foreground">Accuracy</p>
          </div>
          <div className="text-center">
            <h3 className="text-4xl font-bold mb-2">{averageTime}ms</h3>
            <p className="text-muted-foreground">Avg Time</p>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold">Statistics:</h4>
          <div className="text-sm space-y-1">
            <div className="flex justify-between p-2 rounded hover:bg-muted/50">
              <span className="text-muted-foreground">Hits:</span>
              <span className="font-mono">{hits} / {maxAttempts}</span>
            </div>
            <div className="flex justify-between p-2 rounded hover:bg-muted/50">
              <span className="text-muted-foreground">Avg Distance:</span>
              <span className="font-mono">{averageDistance}px</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold">Individual attempts:</h4>
          <div className="max-h-60 overflow-y-auto space-y-1">
            {results.map((result, i) => (
              <div key={i} className="flex justify-between text-sm p-2 rounded hover:bg-muted/50">
                <span>Attempt {i + 1}</span>
                <span className={result.hit ? "text-green-600 font-medium" : "text-destructive font-medium"}>
                  {result.hit ? "Hit" : "Miss"} ({Math.round(result.time)}ms)
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
      title="Aim Accuracy Test"
      description="Click on the targets as quickly and accurately as possible"
      progress={{ current: results.length + 1, total: maxAttempts }}
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        className="w-full h-[500px] rounded-lg border shadow-sm cursor-none"
      />

      <div className="flex flex-wrap gap-4 mt-6 items-center">
        <Button onClick={startTest} disabled={isRunning} size="lg">
          {isRunning ? "Running..." : "Start Test"}
        </Button>
        <Button onClick={resetTest} variant="outline" disabled={isRunning} size="lg">
          Reset
        </Button>

        <div className="flex items-center gap-3 ml-auto">
          <label className="text-sm text-muted-foreground">Sensitivity:</label>
          <input
            type="range"
            min="0.1"
            max="3.0"
            step="0.1"
            value={sensitivity}
            onChange={(e) => setSensitivity(parseFloat(e.target.value))}
            className="w-32"
            disabled={isRunning}
          />
          <span className="text-sm font-mono w-12">{sensitivity.toFixed(1)}x</span>
        </div>
      </div>

      {results.length > 0 && (
        <div className="mt-8 space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground">Results:</h3>
          <div className="flex flex-wrap gap-3">
            {results.map((result, i) => (
              <div key={i} className="px-4 py-3 bg-card border rounded-lg shadow-sm">
                <div className="text-xs text-muted-foreground mb-1">Attempt {i + 1}</div>
                <div className={`text-xl font-bold ${result.hit ? "text-green-600" : "text-destructive"}`}>
                  {result.hit ? "Hit" : "Miss"}
                </div>
                <div className="text-xs text-muted-foreground font-mono">{Math.round(result.time)}ms</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </TestLayout>
  );
}
