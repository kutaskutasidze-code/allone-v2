'use client';

import { Header } from '@/components/layout';
import { ContactInfoProvider } from '@/contexts';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ChatProvider } from '@/components/chat';

export default function WorkLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ContactInfoProvider>
      <ChatProvider>
        <ErrorBoundary>
          <Header />
          <main className="h-screen overflow-hidden relative">{children}</main>
        </ErrorBoundary>
      </ChatProvider>
    </ContactInfoProvider>
  );
}
