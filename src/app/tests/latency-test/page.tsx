"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TestLayout } from "@/components/test-layout";

export default function LatencyTest() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<number[]>([]);
  const [currentRun, setCurrentRun] = useState(0);
  const [totalRuns] = useState(10); // Number of automatic runs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);
  const scheduleTimeRef = useRef<number>(0);
  const actualTimeRef = useRef<number>(0);
  const timeoutRef = useRef<number>(0);

  const drawCanvas = useCallback((color: string, text: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 32px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  }, []);

  const scheduleNextRun = useCallback((runNumber: number) => {
    if (runNumber >= totalRuns) {
      setIsRunning(false);
      setCurrentRun(0);
      drawCanvas("#22c55e", "All tests complete!");
      return;
    }

    // Random interval between 201-1201 ms
    const randomInterval = 201 + Math.random() * 1000;

    drawCanvas("#3b82f6", `Next test in ${(randomInterval / 1000).toFixed(1)}s...`);

    timeoutRef.current = window.setTimeout(() => {
      runSingleTest(runNumber);
    }, randomInterval);
  }, [totalRuns]);

  const runSingleTest = useCallback((runNumber: number) => {
    setCurrentRun(runNumber + 1);
    const targetTime = performance.now() + 1000; // 1 second from now
    scheduleTimeRef.current = targetTime;

    const checkAndDraw = () => {
      const now = performance.now();

      if (now >= targetTime) {
        actualTimeRef.current = now;
        const latency = actualTimeRef.current - scheduleTimeRef.current;

        drawCanvas("#22c55e", `Test ${runNumber + 1}/${totalRuns} - Latency: ${latency.toFixed(2)}ms`);

        setResults(prev => [...prev, latency]);

        // Schedule next run after a short delay to show result
        setTimeout(() => {
          scheduleNextRun(runNumber + 1);
        }, 200);
      } else {
        animationFrameRef.current = requestAnimationFrame(checkAndDraw);
      }
    };

    drawCanvas("#ef4444", `Test ${runNumber + 1}/${totalRuns} - Waiting...`);
    animationFrameRef.current = requestAnimationFrame(checkAndDraw);
  }, [drawCanvas, totalRuns, scheduleNextRun]);

  const startTest = () => {
    setIsRunning(true);
    setResults([]);
    runSingleTest(0);
  };

  const resetTest = () => {
    setResults([]);
    setCurrentRun(0);
    cancelAnimationFrame(animationFrameRef.current);
    clearTimeout(timeoutRef.current);
    setIsRunning(false);
    drawCanvas("#ffffff", "Click 'Start Test' to begin");
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    drawCanvas("#ffffff", "Click 'Start Test' to begin");

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      clearTimeout(timeoutRef.current);
    };
  }, [drawCanvas]);

  const average = results.length > 0
    ? results.reduce((a, b) => a + b, 0) / results.length
    : 0;

  const max = results.length > 0 ? Math.max(...results) : 0;
  const min = results.length > 0 ? Math.min(...results) : 0;

  return (
    <TestLayout
      title="Rendering Latency Test"
      description="This test measures the latency between when a visual change is scheduled and when it actually renders. It uses requestAnimationFrame and performance.now() to measure frame-accurate timing."
    >
      <div className="space-y-6">
        <canvas
          ref={canvasRef}
          className="w-full h-64 rounded-lg border shadow-sm"
        />

        <div className="flex gap-4 items-center">
          <Button onClick={startTest} disabled={isRunning} size="lg">
            {isRunning ? `Running (${currentRun}/${totalRuns})...` : "Start Test"}
          </Button>
          <Button onClick={resetTest} variant="outline" disabled={isRunning} size="lg">
            Reset
          </Button>
          {isRunning && (
            <span className="text-sm text-muted-foreground">
              Test {currentRun} of {totalRuns}
            </span>
          )}
        </div>

        {results.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border shadow-sm">
              <CardHeader>
                <CardTitle>Statistics</CardTitle>
                <CardDescription>Measured over {results.length} test{results.length !== 1 ? 's' : ''}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between p-2 rounded hover:bg-muted/50">
                  <span className="text-muted-foreground">Average:</span>
                  <span className="font-bold font-mono">{average.toFixed(3)}ms</span>
                </div>
                <div className="flex justify-between p-2 rounded hover:bg-muted/50">
                  <span className="text-muted-foreground">Min:</span>
                  <span className="font-bold font-mono">{min.toFixed(3)}ms</span>
                </div>
                <div className="flex justify-between p-2 rounded hover:bg-muted/50">
                  <span className="text-muted-foreground">Max:</span>
                  <span className="font-bold font-mono">{max.toFixed(3)}ms</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardHeader>
                <CardTitle>Individual Results</CardTitle>
                <CardDescription>Most recent first</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {[...results].reverse().map((latency, i) => (
                    <div key={i} className="flex justify-between text-sm p-2 rounded hover:bg-muted/50">
                      <span className="text-muted-foreground">Test {results.length - i}:</span>
                      <span className="font-mono">{latency.toFixed(3)}ms</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              1. The test automatically runs 10 times with random intervals (201-1201 ms) between each test
            </p>
            <p>
              2. Each test schedules a visual change to occur exactly 1000ms in the future using performance.now()
            </p>
            <p>
              3. It uses requestAnimationFrame to check on every display refresh if the target time has been reached
            </p>
            <p>
              4. When the target time is reached (or passed), it immediately draws to the canvas and records the actual time
            </p>
            <p>
              5. The latency is the difference between the scheduled time and when the frame actually rendered
            </p>
            <p className="pt-2">
              <strong>Expected results:</strong> On most systems, latency should be 0-16ms (one frame at 60Hz) or 0-8ms at 120Hz.
              Higher values may indicate rendering performance issues or background processes.
            </p>
          </CardContent>
        </Card>
      </div>
    </TestLayout>
  );
}
