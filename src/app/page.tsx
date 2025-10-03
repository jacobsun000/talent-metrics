"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TestPreview } from "@/components/test-preview";

export default function Home() {
  const tests = [
    {
      id: "simple-reaction",
      title: "Simple Reaction Time",
      description: "A stimulus appears; click as fast as possible",
      category: "Core Reaction & Reflex",
    },
    {
      id: "choice-reaction",
      title: "Choice Reaction Time",
      description: "Multiple stimuli with specific responses",
      category: "Core Reaction & Reflex",
    },
    {
      id: "go-no-go",
      title: "Go/No-Go Test",
      description: "Respond to target stimuli, ignore distractors",
      category: "Core Reaction & Reflex",
    },
    {
      id: "visual-acuity",
      title: "Dynamic Visual Acuity",
      description: "Memorize number sequences flashed for milliseconds",
      category: "Visual & Spatial",
    },
    {
      id: "object-tracking",
      title: "Multiple Object Tracking (MOT)",
      description: "Track multiple moving objects simultaneously",
      category: "Visual & Spatial",
    },
    {
      id: "peripheral-vision",
      title: "Peripheral Vision Test",
      description: "Detect stimuli in your peripheral vision",
      category: "Visual & Spatial",
    },
    {
      id: "n-back",
      title: "Working Memory (N-Back)",
      description: "Remember positions N steps back",
      category: "Cognitive & Memory",
    },
    {
      id: "pattern-recognition",
      title: "Pattern Recognition",
      description: "Memorize grid patterns and reproduce them from memory",
      category: "Cognitive & Memory",
    },
    {
      id: "aim-accuracy",
      title: "Aim Accuracy",
      description: "Click on targets appearing randomly",
      category: "Motor Control & Precision",
    },
    {
      id: "tracking",
      title: "Tracking Test",
      description: "Follow a moving target with your cursor",
      category: "Motor Control & Precision",
    },
    {
      id: "click-speed",
      title: "Click Speed/Tapping",
      description: "Click as fast as you can",
      category: "Motor Control & Precision",
    },
    {
      id: "latency-test",
      title: "Rendering Latency Test",
      description: "Measure your display's rendering latency",
      category: "System Performance",
    },
  ];

  return (
    <div className="min-h-screen p-8 pb-20 sm:p-20">
      <main className="max-w-6xl mx-auto">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-4">Talent Metrics</h1>
          <p className="text-lg text-muted-foreground">
            Measure and train gaming-related skills with scientifically inspired tests
          </p>
        </header>

        <section>
          <h2 className="text-2xl font-semibold mb-6">Available Tests</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tests.map((test) => (
              <Link key={test.id} href={`/tests/${test.id}`}>
                <Card className="h-full hover:border-primary transition-colors overflow-hidden">
                  <TestPreview testId={test.id} />
                  <CardHeader>
                    <div className="text-xs text-muted-foreground uppercase mb-2">
                      {test.category}
                    </div>
                    <CardTitle>{test.title}</CardTitle>
                    <CardDescription>{test.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
