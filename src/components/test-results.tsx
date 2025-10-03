import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ReactNode } from "react";

interface TestResultsProps {
  title: string;
  description: string;
  children: ReactNode;
  onReset: () => void;
}

export function TestResults({ title, description, children, onReset }: TestResultsProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {children}

          <div className="flex gap-3 pt-4">
            <Button onClick={onReset} className="flex-1" size="lg">
              Try Again
            </Button>
            <Button asChild variant="outline" className="flex-1" size="lg">
              <Link href="/">Home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
