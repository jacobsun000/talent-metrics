"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { TestLayout } from "@/components/test-layout";
import { TestResults } from "@/components/test-results";

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  isTarget: boolean;
  isSelected: boolean;
}

interface Result {
  correct: number;
  total: number;
}

type Phase = "idle" | "showing" | "tracking" | "selecting" | "results";

export default function ObjectTrackingTest() {
  const [results, setResults] = useState<Result[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);
  const ballsRef = useRef<Ball[]>([]);
  const phaseRef = useRef<Phase>("idle");

  const maxAttempts = 5;
  const numBalls = 8;
  const numTargets = 3;
  const ballRadius = 20;
  const speed = 3;

  const initializeBalls = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const balls: Ball[] = [];
    const padding = ballRadius + 10;

    for (let i = 0; i < numBalls; i++) {
      let x: number, y: number;
      let attempts = 0;
      do {
        x = padding + Math.random() * (canvas.width - padding * 2);
        y = padding + Math.random() * (canvas.height - padding * 2);
        attempts++;
      } while (
        attempts < 100 &&
        balls.some(b => Math.sqrt((b.x - x) ** 2 + (b.y - y) ** 2) < ballRadius * 3)
      );

      const angle = Math.random() * Math.PI * 2;
      balls.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        isTarget: i < numTargets,
        isSelected: false,
      });
    }

    ballsRef.current = balls;
  }, []);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const currentPhase = phaseRef.current;

    if (currentPhase === "idle") {
      ctx.fillStyle = "#94a3b8";
      ctx.font = "24px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Click 'Start Test' to begin", canvas.width / 2, canvas.height / 2);
      return;
    }

    ballsRef.current.forEach(ball => {
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ballRadius, 0, Math.PI * 2);

      if (currentPhase === "showing" && ball.isTarget) {
        ctx.fillStyle = "#ef4444";
      } else if (currentPhase === "selecting" && ball.isSelected) {
        ctx.fillStyle = "#22c55e";
      } else {
        ctx.fillStyle = "#3b82f6";
      }

      ctx.fill();
    });
  }, []);

  const updateBalls = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    ballsRef.current.forEach(ball => {
      ball.x += ball.vx;
      ball.y += ball.vy;

      if (ball.x - ballRadius < 0 || ball.x + ballRadius > canvas.width) {
        ball.vx = -ball.vx;
        ball.x = Math.max(ballRadius, Math.min(canvas.width - ballRadius, ball.x));
      }

      if (ball.y - ballRadius < 0 || ball.y + ballRadius > canvas.height) {
        ball.vy = -ball.vy;
        ball.y = Math.max(ballRadius, Math.min(canvas.height - ballRadius, ball.y));
      }
    });
  }, []);

  const animate = useCallback(() => {
    if (phaseRef.current === "tracking" || phaseRef.current === "selecting") {
      updateBalls();
    }

    drawCanvas();

    if (phaseRef.current !== "idle" && phaseRef.current !== "results") {
      animationFrameRef.current = requestAnimationFrame(animate);
    }
  }, [updateBalls, drawCanvas]);

  const startTest = useCallback(() => {
    initializeBalls();
    setPhase("showing");
    phaseRef.current = "showing";

    cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = requestAnimationFrame(animate);

    setTimeout(() => {
      setPhase("tracking");
      phaseRef.current = "tracking";
    }, 2000);

    setTimeout(() => {
      setPhase("selecting");
      phaseRef.current = "selecting";
    }, 7000);
  }, [initializeBalls, animate]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (phaseRef.current !== "selecting") return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    ballsRef.current.forEach(ball => {
      const distance = Math.sqrt((clickX - ball.x) ** 2 + (clickY - ball.y) ** 2);
      if (distance <= ballRadius) {
        ball.isSelected = !ball.isSelected;
      }
    });

    cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = requestAnimationFrame(drawCanvas);
  }, [drawCanvas]);

  const submitSelection = () => {
    const selectedTargets = ballsRef.current.filter(b => b.isTarget && b.isSelected).length;
    const totalTargets = numTargets;

    setResults(prev => {
      const newResults = [...prev, { correct: selectedTargets, total: totalTargets }];

      if (newResults.length >= maxAttempts) {
        setIsCompleted(true);
        setPhase("results");
        phaseRef.current = "results";
      } else {
        setPhase("idle");
        phaseRef.current = "idle";
        cancelAnimationFrame(animationFrameRef.current);
        drawCanvas();
      }

      return newResults;
    });
  };

  const resetTest = () => {
    setResults([]);
    setIsCompleted(false);
    setPhase("idle");
    phaseRef.current = "idle";
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

  const totalCorrect = results.reduce((sum, r) => sum + r.correct, 0);
  const totalPossible = results.length * numTargets;
  const accuracy = totalPossible > 0 ? Math.round((totalCorrect / totalPossible) * 100) : 0;

  if (isCompleted) {
    return (
      <TestResults
        title="Test Complete!"
        description="Your multiple object tracking results"
        onReset={resetTest}
      >
        <div>
          <h3 className="text-4xl font-bold text-center mb-2">{accuracy}%</h3>
          <p className="text-center text-muted-foreground">Overall accuracy</p>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold">Individual attempts:</h4>
          <div className="space-y-1">
            {results.map((result, i) => (
              <div key={i} className="flex justify-between text-sm p-2 rounded hover:bg-muted/50">
                <span>Attempt {i + 1}</span>
                <span className="font-mono">{result.correct} / {result.total}</span>
              </div>
            ))}
          </div>
        </div>
      </TestResults>
    );
  }

  return (
    <TestLayout
      title="Multiple Object Tracking (MOT)"
      description="Track the red balls. After they turn blue, click the ones that were originally red"
      progress={{ current: results.length + 1, total: maxAttempts }}
    >
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="w-full h-[500px] rounded-lg border shadow-sm cursor-pointer"
      />

      <div className="flex gap-4 mt-6 items-center">
        <Button onClick={startTest} disabled={phase !== "idle"} size="lg">
          {phase === "idle" ? "Start Test" : phase === "showing" ? "Memorizing..." : phase === "tracking" ? "Tracking..." : "Select targets"}
        </Button>
        {phase === "selecting" && (
          <Button onClick={submitSelection} size="lg">Submit Selection</Button>
        )}
        <Button onClick={resetTest} variant="outline" disabled={phase === "tracking" || phase === "showing"} size="lg">
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
                <div className="text-xl font-bold font-mono">
                  {result.correct} / {result.total}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </TestLayout>
  );
}
