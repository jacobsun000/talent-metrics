"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { TestLayout } from "@/components/test-layout";
import { TestResults } from "@/components/test-results";

interface Result {
  position: number;
  isMatch: boolean;
  responded: boolean;
  correct: boolean;
}

const POSITIONS = [
  { x: 0.25, y: 0.25 },
  { x: 0.5, y: 0.25 },
  { x: 0.75, y: 0.25 },
  { x: 0.25, y: 0.5 },
  { x: 0.5, y: 0.5 },
  { x: 0.75, y: 0.5 },
  { x: 0.25, y: 0.75 },
  { x: 0.5, y: 0.75 },
  { x: 0.75, y: 0.75 },
];

type Phase = "idle" | "showing" | "waiting" | "completed";

export default function NBackTest() {
  const [results, setResults] = useState<Result[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [nLevel, setNLevel] = useState(2);
  const [phase, setPhase] = useState<Phase>("idle");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);
  const sequenceRef = useRef<number[]>([]);
  const currentIndexRef = useRef<number>(0);
  const respondedRef = useRef<boolean>(false);
  const phaseRef = useRef<Phase>("idle");

  const totalTrials = 20;
  const squareSize = 60;

  const drawCanvas = useCallback((highlightPosition?: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (phaseRef.current === "idle") {
      ctx.fillStyle = "#94a3b8";
      ctx.font = "24px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`${nLevel}-Back Test`, canvas.width / 2, canvas.height / 2 - 30);
      ctx.font = "16px sans-serif";
      ctx.fillText("Press SPACE when position matches", canvas.width / 2, canvas.height / 2 + 10);
      ctx.fillText(`${nLevel} steps back`, canvas.width / 2, canvas.height / 2 + 35);
      return;
    }

    // Draw grid
    POSITIONS.forEach((pos, i) => {
      const x = pos.x * canvas.width - squareSize / 2;
      const y = pos.y * canvas.height - squareSize / 2;

      if (highlightPosition === i) {
        ctx.fillStyle = "#22c55e";
      } else {
        ctx.fillStyle = "#1e293b";
      }

      ctx.fillRect(x, y, squareSize, squareSize);

      ctx.strokeStyle = "#475569";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, squareSize, squareSize);
    });
  }, [nLevel]);

  const generateSequence = useCallback(() => {
    const sequence: number[] = [];
    for (let i = 0; i < totalTrials; i++) {
      if (i >= nLevel && Math.random() < 0.3) {
        sequence.push(sequence[i - nLevel]);
      } else {
        let pos;
        do {
          pos = Math.floor(Math.random() * POSITIONS.length);
        } while (i >= nLevel && pos === sequence[i - nLevel]);
        sequence.push(pos);
      }
    }
    return sequence;
  }, [nLevel]);

  const showNextStimulus = useCallback(() => {
    if (currentIndexRef.current >= sequenceRef.current.length) {
      setIsCompleted(true);
      setPhase("completed");
      phaseRef.current = "completed";
      return;
    }

    const position = sequenceRef.current[currentIndexRef.current];
    const isMatch = currentIndexRef.current >= nLevel &&
      sequenceRef.current[currentIndexRef.current] === sequenceRef.current[currentIndexRef.current - nLevel];

    respondedRef.current = false;
    setPhase("showing");
    phaseRef.current = "showing";

    cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = requestAnimationFrame(() => {
      drawCanvas(position);
    });

    setTimeout(() => {
      setPhase("waiting");
      phaseRef.current = "waiting";

      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = requestAnimationFrame(() => {
        drawCanvas();
      });

      setTimeout(() => {
        const responded = respondedRef.current;
        const correct = (isMatch && responded) || (!isMatch && !responded);

        setResults(prev => [...prev, {
          position,
          isMatch,
          responded,
          correct
        }]);

        currentIndexRef.current++;
        showNextStimulus();
      }, 1500);
    }, 500);
  }, [nLevel, drawCanvas]);

  const startTest = useCallback(() => {
    sequenceRef.current = generateSequence();
    currentIndexRef.current = 0;
    setResults([]);
    setIsCompleted(false);
    setPhase("showing");
    phaseRef.current = "showing";

    showNextStimulus();
  }, [generateSequence, showNextStimulus]);

  const handleKeyPress = useCallback(() => {
    if (phaseRef.current === "showing" || phaseRef.current === "waiting") {
      respondedRef.current = true;
    }
  }, []);

  const resetTest = () => {
    setResults([]);
    setIsCompleted(false);
    setPhase("idle");
    phaseRef.current = "idle";
    currentIndexRef.current = 0;
    drawCanvas();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    drawCanvas();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        handleKeyPress();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [drawCanvas, handleKeyPress]);

  const correctCount = results.filter(r => r.correct).length;
  const accuracy = results.length > 0 ? Math.round((correctCount / results.length) * 100) : 0;

  if (isCompleted) {
    return (
      <TestResults
        title="Test Complete!"
        description={`Your ${nLevel}-back test results`}
        onReset={resetTest}
      >
        <div>
          <h3 className="text-4xl font-bold text-center mb-2">{accuracy}%</h3>
          <p className="text-center text-muted-foreground">Accuracy</p>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold">Statistics:</h4>
          <div className="text-sm space-y-1">
            <div className="flex justify-between p-2 rounded hover:bg-muted/50">
              <span className="text-muted-foreground">Correct:</span>
              <span className="font-mono">{correctCount} / {totalTrials}</span>
            </div>
            <div className="flex justify-between p-2 rounded hover:bg-muted/50">
              <span className="text-muted-foreground">Matches detected:</span>
              <span className="font-mono">{results.filter(r => r.isMatch && r.responded).length}</span>
            </div>
            <div className="flex justify-between p-2 rounded hover:bg-muted/50">
              <span className="text-muted-foreground">False positives:</span>
              <span className="font-mono">{results.filter(r => !r.isMatch && r.responded).length}</span>
            </div>
          </div>
        </div>
      </TestResults>
    );
  }

  return (
    <TestLayout
      title="Working Memory (N-Back) Test"
      description={`Press SPACE when the current position matches the position ${nLevel} steps back`}
      progress={{ current: results.length + 1, total: totalTrials }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-[500px] rounded-lg border shadow-sm"
      />

      <div className="flex flex-wrap gap-4 mt-6 items-center">
        <Button onClick={startTest} disabled={phase !== "idle" && phase !== "completed"} size="lg">
          {phase === "idle" || phase === "completed" ? "Start Test" : "Running..."}
        </Button>
        <Button onClick={resetTest} variant="outline" disabled={phase !== "idle" && phase !== "completed"} size="lg">
          Reset
        </Button>

        <div className="flex items-center gap-3 ml-auto">
          <label className="text-sm text-muted-foreground">N-Level:</label>
          <select
            value={nLevel}
            onChange={(e) => setNLevel(Number(e.target.value))}
            className="px-3 py-2 bg-card border rounded-lg text-sm shadow-sm"
            disabled={phase !== "idle"}
          >
            <option value={1}>1-Back</option>
            <option value={2}>2-Back</option>
            <option value={3}>3-Back</option>
          </select>
        </div>
      </div>

      {results.length > 0 && phase !== "completed" && (
        <div className="mt-6 p-4 bg-card border rounded-lg shadow-sm">
          <div className="text-sm">
            <span className="text-muted-foreground">Progress:</span>{" "}
            <span className="font-mono">{results.length} / {totalTrials}</span>
            {" | "}
            <span className="text-muted-foreground">Accuracy:</span>{" "}
            <span className="font-mono">{accuracy}%</span>
          </div>
        </div>
      )}
    </TestLayout>
  );
}
