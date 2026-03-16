'use client';

import { Header, Footer } from '@/components/layout';
import { ContactInfoProvider } from '@/contexts';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ChatProvider } from '@/components/chat';
import { SmoothScroll } from '@/components/ui/SmoothScroll';
import { I18nProvider } from '@/lib/i18n';
import { usePathname } from 'next/navigation';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const hideFooter = pathname === '/work' || pathname === '/services';
  const hideCta = pathname.startsWith('/lab');

  return (
    <I18nProvider>
      <ContactInfoProvider>
        <ChatProvider>
          <ErrorBoundary>
            <SmoothScroll>
              <Header />
              <main className="min-h-screen relative">{children}</main>
              {!hideFooter && <Footer hideCta={hideCta} />}
            </SmoothScroll>
          </ErrorBoundary>
        </ChatProvider>
      </ContactInfoProvider>
    </I18nProvider>
  );
}
