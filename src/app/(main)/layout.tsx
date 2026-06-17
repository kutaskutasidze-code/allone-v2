'use client';

import { usePathname } from 'next/navigation';
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
  const pathname = usePathname();
  // Careers is a standalone recruitment landing — no site navbar or footer.
  const standalone = pathname?.startsWith('/careers');
  return (
    <I18nProvider>
      <ContactInfoProvider>
        <ChatProvider>
          <ErrorBoundary>
            <SmoothScroll>
              {!standalone && <Header />}
              <main className="min-h-screen relative">{children}</main>
              {!standalone && <Footer />}
            </SmoothScroll>
          </ErrorBoundary>
        </ChatProvider>
      </ContactInfoProvider>
    </I18nProvider>
  );
}
