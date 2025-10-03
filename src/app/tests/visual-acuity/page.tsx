'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TestLayout } from "@/components/test-layout";

type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'expert';

interface DifficultyConfig {
  displayTime: number; // milliseconds
  digitCount: number;
  fontSize: string;
  description: string;
}

const DIFFICULTY_SETTINGS: Record<DifficultyLevel, DifficultyConfig> = {
  easy: {
    displayTime: 200,
    digitCount: 4,
    fontSize: '4rem',
    description: '4 digits, 200ms'
  },
  medium: {
    displayTime: 150,
    digitCount: 5,
    fontSize: '3.5rem',
    description: '5 digits, 150ms'
  },
  hard: {
    displayTime: 100,
    digitCount: 6,
    fontSize: '3rem',
    description: '6 digits, 100ms'
  },
  expert: {
    displayTime: 75,
    digitCount: 7,
    fontSize: '2.5rem',
    description: '7 digits, 75ms'
  }
};

export default function DynamicVisualAcuityTest() {
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('hard');
  const [gameState, setGameState] = useState<'ready' | 'countdown' | 'showing' | 'input' | 'result'>('ready');
  const [sequence, setSequence] = useState('');
  const [userInput, setUserInput] = useState('');
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [totalRounds] = useState(10);
  const [results, setResults] = useState<{ correct: number; total: number }>({ correct: 0, total: 0 });
  const [countdown, setCountdown] = useState(3);
  const inputRef = useRef<HTMLInputElement>(null);

  const generateSequence = (length: number) => {
    return Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');
  };

  const startTest = () => {
    setGameState('countdown');
    setCountdown(3);
    setRound(1);
    setResults({ correct: 0, total: 0 });
    setUserInput('');
  };

  useEffect(() => {
    if (gameState === 'countdown') {
      if (countdown > 0) {
        const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        startRound();
      }
    }
  }, [gameState, countdown]);

  const startRound = () => {
    const config = DIFFICULTY_SETTINGS[difficulty];
    const newSequence = generateSequence(config.digitCount);
    setSequence(newSequence);
    setGameState('showing');

    setTimeout(() => {
      setGameState('input');
      setTimeout(() => inputRef.current?.focus(), 50);
    }, config.displayTime);
  };

  const submitAnswer = () => {
    const isCorrect = userInput === sequence;
    const newResults = {
      correct: results.correct + (isCorrect ? 1 : 0),
      total: results.total + 1
    };
    setResults(newResults);

    if (isCorrect) {
      setScore(score + 1);
    }

    setGameState('result');
  };

  const nextRound = () => {
    if (round < totalRounds) {
      setRound(round + 1);
      setUserInput('');
      startRound();
    } else {
      setGameState('ready');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && gameState === 'input') {
      submitAnswer();
    }
  };

  const accuracy = results.total > 0 ? ((results.correct / results.total) * 100).toFixed(1) : '0';

  return (
    <TestLayout
      title="Dynamic Visual Acuity Test"
      description="Memorize the number sequence shown briefly, then enter it from memory"
      progress={gameState !== 'ready' ? { current: round, total: totalRounds } : undefined}
    >
      <div className="space-y-6">
        {/* Difficulty Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Difficulty Level</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {(Object.keys(DIFFICULTY_SETTINGS) as DifficultyLevel[]).map((level) => (
              <Button
                key={level}
                variant={difficulty === level ? 'default' : 'outline'}
                onClick={() => setDifficulty(level)}
                disabled={gameState !== 'ready'}
                className="capitalize"
              >
                {level}
                <span className="block text-xs opacity-70">
                  {DIFFICULTY_SETTINGS[level].description}
                </span>
              </Button>
            ))}
          </div>
        </div>

        {/* Stats */}
        {gameState !== 'ready' && (
          <div className="flex justify-between items-center p-4 bg-card border rounded-lg shadow-sm">
            <div className="text-center">
              <div className="text-2xl font-bold font-mono">{round}/{totalRounds}</div>
              <div className="text-xs text-muted-foreground">Round</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold font-mono">{score}</div>
              <div className="text-xs text-muted-foreground">Correct</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold font-mono">{accuracy}%</div>
              <div className="text-xs text-muted-foreground">Accuracy</div>
            </div>
          </div>
        )}

        {/* Test Area */}
        <div className="min-h-[300px] flex items-center justify-center">
          {gameState === 'ready' && (
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                A sequence of numbers will flash briefly on screen. Memorize it and enter what you saw.
              </p>
              <Button size="lg" onClick={startTest}>
                Start Test
              </Button>
            </div>
          )}

          {gameState === 'countdown' && (
            <div className="text-center">
              <div className="text-8xl font-bold text-primary animate-pulse">
                {countdown}
              </div>
              <p className="text-muted-foreground mt-4">Get ready...</p>
            </div>
          )}

          {gameState === 'showing' && (
            <div
              className="text-center font-mono font-bold tracking-wider"
              style={{ fontSize: DIFFICULTY_SETTINGS[difficulty].fontSize }}
            >
              {sequence}
            </div>
          )}

          {gameState === 'input' && (
            <div className="text-center space-y-4 w-full max-w-md">
              <p className="text-lg font-medium">Enter the sequence you saw:</p>
              <Input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value.replace(/\D/g, ''))}
                onKeyPress={handleKeyPress}
                className="text-center text-3xl font-mono tracking-widest"
                maxLength={DIFFICULTY_SETTINGS[difficulty].digitCount}
                placeholder="?"
              />
              <Button
                onClick={submitAnswer}
                disabled={userInput.length !== DIFFICULTY_SETTINGS[difficulty].digitCount}
                size="lg"
              >
                Submit
              </Button>
            </div>
          )}

          {gameState === 'result' && (
            <div className="text-center space-y-6">
              <div className={`text-6xl font-bold ${userInput === sequence ? 'text-green-500' : 'text-red-500'}`}>
                {userInput === sequence ? '✓' : '✗'}
              </div>
              <div className="space-y-2">
                <p className="text-lg">
                  <span className="text-muted-foreground">Correct answer:</span>{' '}
                  <span className="font-mono font-bold text-2xl">{sequence}</span>
                </p>
                <p className="text-lg">
                  <span className="text-muted-foreground">Your answer:</span>{' '}
                  <span className="font-mono font-bold text-2xl">{userInput || '(none)'}</span>
                </p>
              </div>
              <Button onClick={nextRound} size="lg">
                {round < totalRounds ? 'Next Round' : 'Finish Test'}
              </Button>
            </div>
          )}
        </div>

        {/* Final Results */}
        {gameState === 'ready' && results.total > 0 && (
          <div className="p-6 bg-card border rounded-lg shadow-sm space-y-2">
            <h3 className="text-lg font-semibold">Test Complete!</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold font-mono">{results.correct}/{results.total}</div>
                <div className="text-sm text-muted-foreground">Score</div>
              </div>
              <div>
                <div className="text-3xl font-bold font-mono">{accuracy}%</div>
                <div className="text-sm text-muted-foreground">Accuracy</div>
              </div>
              <div>
                <div className="text-3xl font-bold capitalize">{difficulty}</div>
                <div className="text-sm text-muted-foreground">Difficulty</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </TestLayout>
  );
}
