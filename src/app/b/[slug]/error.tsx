"use client";

// Error boundary for the public questionnaire page. A transient DB/network
// error must never show a prospect Next's raw stack screen.
export default function BotError({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-lg font-semibold">დროებითი შეფერხება</h1>
      <p className="text-neutral-600">
        გვერდის ჩატვირთვა ვერ მოხერხდა. გთხოვთ, სცადოთ თავიდან.
      </p>
      <button
        onClick={reset}
        className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white"
      >
        თავიდან ცდა
      </button>
    </main>
  );
}
