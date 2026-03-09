'use client';

import { Header, Footer } from '@/components/layout';
import { ContactInfoProvider } from '@/contexts';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ChatProvider } from '@/components/chat';
import { usePathname } from 'next/navigation';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const hideFooter = pathname === '/work' || pathname === '/services';

  return (
    <ContactInfoProvider>
      <ChatProvider>
        <ErrorBoundary>
          <Header />
          <main className="min-h-screen relative">{children}</main>
          {!hideFooter && <Footer />}
        </ErrorBoundary>
      </ChatProvider>
    </ContactInfoProvider>
  );
}
