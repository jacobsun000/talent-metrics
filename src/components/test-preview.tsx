"use client";

import { useEffect, useRef } from "react";

interface TestPreviewProps {
  testId: string;
}

export function TestPreview({ testId }: TestPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = 200;
    canvas.height = 120;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const animate = () => {
      timeRef.current += 0.02;
      const t = timeRef.current;

      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      switch (testId) {
        case "simple-reaction":
          // Flashing circle
          const flash = Math.sin(t * 2) > 0;
          ctx.fillStyle = flash ? "#22c55e" : "#ef4444";
          ctx.beginPath();
          ctx.arc(100, 60, 30, 0, Math.PI * 2);
          ctx.fill();
          break;

        case "choice-reaction":
          // Rotating arrows
          const arrows = ["←", "→", "↑", "↓"];
          const arrowIndex = Math.floor(t * 0.5) % 4;
          ctx.fillStyle = "#22c55e";
          ctx.font = "bold 48px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(arrows[arrowIndex], 100, 60);
          break;

        case "go-no-go":
          // Alternating shapes
          const shapeIndex = Math.floor(t * 0.5) % 3;
          ctx.fillStyle = shapeIndex === 0 ? "#22c55e" : "#ef4444";
          ctx.beginPath();
          if (shapeIndex === 0) {
            // Circle
            ctx.arc(100, 60, 25, 0, Math.PI * 2);
          } else if (shapeIndex === 1) {
            // Square
            ctx.rect(75, 35, 50, 50);
          } else {
            // Triangle
            ctx.moveTo(100, 35);
            ctx.lineTo(75, 85);
            ctx.lineTo(125, 85);
            ctx.closePath();
          }
          ctx.fill();
          break;

        case "visual-acuity":
          // Flashing number sequence
          const showNumber = Math.sin(t * 3) > 0;
          if (showNumber) {
            const numbers = ["123456", "789012", "345678", "901234"];
            const numIndex = Math.floor(t * 0.5) % numbers.length;
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 32px monospace";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(numbers[numIndex], 100, 60);
          } else {
            ctx.fillStyle = "#475569";
            ctx.font = "16px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("?", 100, 60);
          }
          break;

        case "object-tracking":
          // Multiple moving balls
          for (let i = 0; i < 4; i++) {
            const angle = t + (i * Math.PI * 2) / 4;
            const bx = 100 + Math.cos(angle) * 40;
            const by = 60 + Math.sin(angle) * 30;
            ctx.fillStyle = i < 2 ? "#ef4444" : "#3b82f6";
            ctx.beginPath();
            ctx.arc(bx, by, 8, 0, Math.PI * 2);
            ctx.fill();
          }
          break;

        case "peripheral-vision":
          // Center dot with peripheral flash
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(100, 60, 5, 0, Math.PI * 2);
          ctx.fill();

          const showFlash = Math.sin(t * 2) > 0.7;
          if (showFlash) {
            ctx.fillStyle = "#22c55e";
            ctx.beginPath();
            ctx.arc(30 + (Math.floor(t) % 2) * 140, 60, 10, 0, Math.PI * 2);
            ctx.fill();
          }
          break;

        case "n-back":
          // Grid with highlight
          const gridSize = 3;
          const cellSize = 30;
          const offsetX = (200 - gridSize * cellSize) / 2;
          const offsetY = (120 - gridSize * cellSize) / 2;
          const highlightPos = Math.floor(t * 0.5) % 9;

          for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
              const px = offsetX + col * cellSize;
              const py = offsetY + row * cellSize;
              const isHighlight = row * gridSize + col === highlightPos;

              ctx.fillStyle = isHighlight ? "#22c55e" : "#1e293b";
              ctx.fillRect(px, py, cellSize - 2, cellSize - 2);

              ctx.strokeStyle = "#475569";
              ctx.lineWidth = 1;
              ctx.strokeRect(px, py, cellSize - 2, cellSize - 2);
            }
          }
          break;

        case "pattern-recognition":
          // 5x5 grid pattern with phase animation
          const pGridSize = 5;
          const pCellSize = 18;
          const pOffsetX = (200 - pGridSize * pCellSize) / 2;
          const pOffsetY = (120 - pGridSize * pCellSize) / 2;
          const showPattern = (t % 4) < 2; // Show pattern for 2 seconds, hide for 2

          for (let row = 0; row < pGridSize; row++) {
            for (let col = 0; col < pGridSize; col++) {
              const px = pOffsetX + col * pCellSize;
              const py = pOffsetY + row * pCellSize;

              let isActive = false;
              if (showPattern) {
                // Show a pattern (e.g., diagonal + center cross)
                isActive = row === col || row + col === pGridSize - 1 || row === 2 || col === 2;
              }

              ctx.fillStyle = isActive ? "#22c55e" : "#1e293b";
              ctx.fillRect(px, py, pCellSize - 2, pCellSize - 2);

              ctx.strokeStyle = "#475569";
              ctx.lineWidth = 1;
              ctx.strokeRect(px, py, pCellSize - 2, pCellSize - 2);
            }
          }

          // Add instruction text when hidden
          if (!showPattern) {
            ctx.fillStyle = "#94a3b8";
            ctx.font = "12px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("Recall pattern", 100, 105);
          }
          break;

        case "aim-accuracy":
          // Moving target
          const tx = 50 + (Math.sin(t) * 0.5 + 0.5) * 100;
          const ty = 40 + (Math.cos(t * 1.3) * 0.5 + 0.5) * 40;

          ctx.fillStyle = "#ef4444";
          ctx.beginPath();
          ctx.arc(tx, ty, 15, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(tx, ty, 5, 0, Math.PI * 2);
          ctx.fill();

          // Crosshair
          ctx.strokeStyle = "#22c55e";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(100 - 8, 60);
          ctx.lineTo(100 + 8, 60);
          ctx.moveTo(100, 60 - 8);
          ctx.lineTo(100, 60 + 8);
          ctx.stroke();
          break;

        case "tracking":
          // Target and cursor
          const ttx = 80 + Math.sin(t) * 40;
          const tty = 60 + Math.cos(t * 1.5) * 30;

          ctx.fillStyle = "#ef4444";
          ctx.beginPath();
          ctx.arc(ttx, tty, 12, 0, Math.PI * 2);
          ctx.fill();

          const cursorX = ttx + Math.sin(t * 3) * 15;
          const cursorY = tty + Math.cos(t * 3) * 15;

          ctx.strokeStyle = "#22c55e";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(cursorX - 10, cursorY);
          ctx.lineTo(cursorX + 10, cursorY);
          ctx.moveTo(cursorX, cursorY - 10);
          ctx.lineTo(cursorX, cursorY + 10);
          ctx.stroke();

          ctx.strokeStyle = "rgba(251, 191, 36, 0.5)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(cursorX, cursorY);
          ctx.lineTo(ttx, tty);
          ctx.stroke();
          break;

        case "click-speed":
          // Click counter with pulses
          const clicks = Math.floor(t * 3);
          ctx.fillStyle = "#22c55e";
          ctx.font = "bold 48px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(clicks.toString(), 100, 60);

          const pulse = Math.sin(t * 10) * 0.5 + 0.5;
          ctx.strokeStyle = `rgba(34, 197, 94, ${pulse})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(100, 60, 40 + pulse * 10, 0, Math.PI * 2);
          ctx.stroke();
          break;

        case "latency-test":
          // Timing bars
          const phase = (t * 2) % 2;
          ctx.fillStyle = phase < 1 ? "#ef4444" : "#22c55e";
          ctx.fillRect(20, 40, 160, 40);

          ctx.fillStyle = "#ffffff";
          ctx.font = "14px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(phase < 1 ? "Wait..." : "Now!", 100, 60);
          break;

        default:
          ctx.fillStyle = "#94a3b8";
          ctx.font = "16px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("Preview", 100, 60);
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [testId]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-[120px] rounded-t-lg"
      style={{ imageRendering: "crisp-edges" }}
    />
  );
}
