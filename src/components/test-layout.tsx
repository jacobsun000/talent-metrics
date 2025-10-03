import Link from "next/link";
import { ReactNode } from "react";

interface TestLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
  progress?: {
    current: number;
    total: number;
  };
}

export function TestLayout({ title, description, children, progress }: TestLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-8">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to tests
          </Link>
        </div>

        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-3">{title}</h1>
          <p className="text-lg text-muted-foreground">{description}</p>
          {progress && (
            <div className="mt-3 text-sm text-muted-foreground">
              Attempt {progress.current} of {progress.total}
            </div>
          )}
        </header>

        <main>{children}</main>
      </div>
    </div>
  );
}
