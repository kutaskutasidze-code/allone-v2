'use client';

import { Header, Footer } from '@/components/layout';
import { ContactInfoProvider } from '@/contexts';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ChatProvider } from '@/components/chat';
import { SmoothScroll } from '@/components/ui/SmoothScroll';
import { I18nProvider } from '@/lib/i18n';
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <I18nProvider>
      <ContactInfoProvider>
        <ChatProvider>
          <ErrorBoundary>
            <SmoothScroll>
              <Header />
              <main className="min-h-screen relative">{children}</main>
              <Footer />
            </SmoothScroll>
          </ErrorBoundary>
        </ChatProvider>
      </ContactInfoProvider>
    </I18nProvider>
  );
}
