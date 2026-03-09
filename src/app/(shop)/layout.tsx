'use client';

import { Header, Footer } from '@/components/layout';
import { ContactInfoProvider } from '@/contexts';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ContactInfoProvider>
      <ErrorBoundary>
        <Header />
        <main className="min-h-screen relative">{children}</main>
        <Footer />
      </ErrorBoundary>
    </ContactInfoProvider>
  );
}
