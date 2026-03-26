'use client';

import ErrorBoundary from './ui/ErrorBoundary';

export default function ErrorBoundaryWrapper({ children }: { children: React.ReactNode }) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}
