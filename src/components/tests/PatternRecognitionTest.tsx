'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type Difficulty = 'easy' | 'medium' | 'hard';

interface Cell {
  row: number;
  col: number;
}

const DIFFICULTY_SETTINGS = {
  easy: { gridSize: 3, cells: 3, displayTime: 2000 },
  medium: { gridSize: 4, cells: 5, displayTime: 1500 },
  hard: { gridSize: 5, cells: 8, displayTime: 1000 },
};

export default function PatternRecognitionTest() {
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [phase, setPhase] = useState<'setup' | 'memorize' | 'draw' | 'result'>('setup');
  const [pattern, setPattern] = useState<Cell[]>([]);
  const [userPattern, setUserPattern] = useState<Cell[]>([]);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [totalRounds] = useState(5);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const settings = DIFFICULTY_SETTINGS[difficulty];
  const cellSize = 80;
  const padding = 10;

  // Generate random pattern
  const generatePattern = () => {
    const cells: Cell[] = [];
    const used = new Set<string>();

    while (cells.length < settings.cells) {
      const row = Math.floor(Math.random() * settings.gridSize);
      const col = Math.floor(Math.random() * settings.gridSize);
      const key = `${row}-${col}`;

      if (!used.has(key)) {
        cells.push({ row, col });
        used.add(key);
      }
    }

    return cells;
  };

  // Draw grid on canvas
  const drawGrid = (highlightCells: Cell[] = [], userCells: Cell[] = []) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const canvasSize = settings.gridSize * cellSize + (settings.gridSize + 1) * padding;
    canvas.width = canvasSize;
    canvas.height = canvasSize;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    for (let row = 0; row < settings.gridSize; row++) {
      for (let col = 0; col < settings.gridSize; col++) {
        const x = col * cellSize + (col + 1) * padding;
        const y = row * cellSize + (row + 1) * padding;

        // Check if this cell is in the pattern
        const isPattern = highlightCells.some(c => c.row === row && c.col === col);
        const isUser = userCells.some(c => c.row === row && c.col === col);

        if (isPattern) {
          ctx.fillStyle = '#3b82f6'; // Blue for pattern
        } else if (isUser) {
          ctx.fillStyle = '#10b981'; // Green for user input
        } else {
          ctx.fillStyle = '#f3f4f6'; // Light gray for empty
        }

        ctx.fillRect(x, y, cellSize, cellSize);

        // Border
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, cellSize, cellSize);
      }
    }
  };

  // Handle canvas click
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (phase !== 'draw') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Calculate which cell was clicked
    let clickedCol = -1;
    let clickedRow = -1;

    for (let col = 0; col < settings.gridSize; col++) {
      const cellX = col * cellSize + (col + 1) * padding;
      if (x >= cellX && x <= cellX + cellSize) {
        clickedCol = col;
        break;
      }
    }

    for (let row = 0; row < settings.gridSize; row++) {
      const cellY = row * cellSize + (row + 1) * padding;
      if (y >= cellY && y <= cellY + cellSize) {
        clickedRow = row;
        break;
      }
    }

    if (clickedRow !== -1 && clickedCol !== -1) {
      const cell = { row: clickedRow, col: clickedCol };

      // Toggle cell selection
      const existingIndex = userPattern.findIndex(
        c => c.row === cell.row && c.col === cell.col
      );

      if (existingIndex !== -1) {
        setUserPattern(userPattern.filter((_, i) => i !== existingIndex));
      } else {
        setUserPattern([...userPattern, cell]);
      }
    }
  };

  // Start test
  const startTest = () => {
    const newPattern = generatePattern();
    setPattern(newPattern);
    setUserPattern([]);
    setPhase('memorize');

    // Show pattern then hide
    setTimeout(() => {
      setPhase('draw');
    }, settings.displayTime);
  };

  // Submit answer
  const submitAnswer = () => {
    // Calculate score
    const correctCells = userPattern.filter(userCell =>
      pattern.some(p => p.row === userCell.row && p.col === userCell.col)
    ).length;

    const incorrectCells = userPattern.length - correctCells;
    const missedCells = pattern.length - correctCells;

    const roundScore = Math.max(0, correctCells * 10 - incorrectCells * 5 - missedCells * 3);
    setScore(score + roundScore);
    setPhase('result');
  };

  // Next round
  const nextRound = () => {
    if (round < totalRounds) {
      setRound(round + 1);
      startTest();
    } else {
      setPhase('setup');
      setRound(1);
    }
  };

  // Reset test
  const resetTest = () => {
    setPhase('setup');
    setRound(1);
    setScore(0);
    setUserPattern([]);
    setPattern([]);
  };

  // Draw canvas when pattern or user pattern changes
  useEffect(() => {
    if (phase === 'memorize') {
      drawGrid(pattern);
    } else if (phase === 'draw') {
      drawGrid([], userPattern);
    } else if (phase === 'result') {
      drawGrid(pattern, userPattern);
    } else {
      drawGrid();
    }
  }, [phase, pattern, userPattern, difficulty]);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Pattern Recognition Test</CardTitle>
        <CardDescription>
          Memorize the pattern and reproduce it by clicking the cells
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {phase === 'setup' && (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Difficulty Level</label>
              <div className="flex gap-2">
                {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
                  <Button
                    key={d}
                    variant={difficulty === d ? 'default' : 'outline'}
                    onClick={() => setDifficulty(d)}
                    className="flex-1"
                  >
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </Button>
                ))}
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                <p><strong>Easy:</strong> 3×3 grid, 3 cells, 2s display</p>
                <p><strong>Medium:</strong> 4×4 grid, 5 cells, 1.5s display</p>
                <p><strong>Hard:</strong> 5×5 grid, 8 cells, 1s display</p>
              </div>
            </div>

            <div className="flex justify-center">
              <canvas
                ref={canvasRef}
                className="border rounded-lg"
              />
            </div>

            <Button onClick={startTest} className="w-full" size="lg">
              Start Test ({totalRounds} Rounds)
            </Button>
          </div>
        )}

        {phase === 'memorize' && (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-lg font-medium">Round {round}/{totalRounds}</p>
              <p className="text-sm text-muted-foreground">Memorize this pattern!</p>
            </div>

            <div className="flex justify-center">
              <canvas
                ref={canvasRef}
                className="border rounded-lg"
              />
            </div>
          </div>
        )}

        {phase === 'draw' && (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-lg font-medium">Round {round}/{totalRounds}</p>
              <p className="text-sm text-muted-foreground">
                Click cells to recreate the pattern ({userPattern.length}/{pattern.length} selected)
              </p>
            </div>

            <div className="flex justify-center">
              <canvas
                ref={canvasRef}
                onClick={handleCanvasClick}
                className="border rounded-lg cursor-pointer hover:border-blue-400 transition-colors"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => setUserPattern([])}
                variant="outline"
                className="flex-1"
              >
                Clear
              </Button>
              <Button
                onClick={submitAnswer}
                className="flex-1"
                disabled={userPattern.length === 0}
              >
                Submit Answer
              </Button>
            </div>
          </div>
        )}

        {phase === 'result' && (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-lg font-medium">Round {round}/{totalRounds} Complete</p>
              <p className="text-sm text-muted-foreground">
                Blue = Correct Pattern | Green = Your Answer
              </p>
            </div>

            <div className="flex justify-center">
              <canvas
                ref={canvasRef}
                className="border rounded-lg"
              />
            </div>

            <div className="text-center space-y-2">
              <div className="text-2xl font-bold">Score: {score}</div>
              <div className="text-sm text-muted-foreground">
                Correct: {userPattern.filter(u => pattern.some(p => p.row === u.row && p.col === u.col)).length} |
                Wrong: {userPattern.filter(u => !pattern.some(p => p.row === u.row && p.col === u.col)).length} |
                Missed: {pattern.filter(p => !userPattern.some(u => u.row === p.row && u.col === p.col)).length}
              </div>
            </div>

            <div className="flex gap-2">
              {round < totalRounds ? (
                <Button onClick={nextRound} className="w-full" size="lg">
                  Next Round
                </Button>
              ) : (
                <div className="w-full space-y-2">
                  <div className="text-center text-lg font-bold">
                    Final Score: {score} / {totalRounds * 100}
                  </div>
                  <Button onClick={resetTest} className="w-full" size="lg">
                    Start New Test
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
