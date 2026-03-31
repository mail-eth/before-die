"use client";

import { useEffect, useState } from "react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(true);
  }, []);

  if (!hasError) return null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <h2 className="text-3xl font-bold" style={{ fontFamily: "Georgia, serif" }}>
        Something went wrong
      </h2>
      <p className="mt-4 max-w-md text-muted-foreground">
        We encountered an unexpected error. Your data is safe.
      </p>
      <button
        onClick={reset}
        className="mt-8 rounded-full bg-foreground px-8 py-3 text-sm font-medium text-background transition hover:opacity-90"
      >
        Try again
      </button>
    </div>
  );
}
