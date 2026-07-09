import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AllOne Feedback",
  robots: { index: false, follow: false },
};

// Standalone light/monochrome shell for the client portal — deliberately NOT the
// marketing header or the sales AppShell. Renders inside the root <body>.
export default function FeedbackLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-body">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-2xl items-center gap-2 px-5 py-4">
          <span className="text-[15px] font-semibold tracking-tight">AllOne</span>
          <span className="text-[13px] text-neutral-400">Feedback</span>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-5 py-10">{children}</main>
    </div>
  );
}
