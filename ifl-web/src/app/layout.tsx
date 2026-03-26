import type { Metadata } from 'next';
import { AuthProvider } from '@/lib/auth-context';
import ErrorBoundaryWrapper from '@/components/ErrorBoundaryWrapper';
import './globals.css';

export const metadata: Metadata = {
  title: 'IFL Platform',
  description: 'Interactive Flipped Learning Platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <AuthProvider>
          <ErrorBoundaryWrapper>{children}</ErrorBoundaryWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
