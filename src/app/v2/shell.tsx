'use client';

import { V2Navbar, V2Footer } from './components';

export function V2ShellServer({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-[#071D2F] font-body antialiased">
      <V2Navbar />
      {children}
      <V2Footer />
      <div className="h-24" />
    </div>
  );
}
