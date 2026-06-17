"use client";
import { useState, useEffect, useRef } from "react";

interface ThreadDocument {
  kind: string;
  label: string;
  url: string;
}

interface ThreadStatus {
  status: string;
  intro: string;
  documents: ThreadDocument[];
}

const LABEL_MAP: Record<string, string> = {
  offer: "შეთავაზება",
  contract: "ხელშეკრულება",
  invoice: "ინვოისი",
};

export function ThreadChat({
  slug,
  rid,
  title,
}: {
  slug: string;
  rid: string;
  title: string;
}) {
  const [thread, setThread] = useState<ThreadStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function poll() {
    try {
      const res = await fetch(`/api/bots/${slug}/thread/${rid}`);
      if (!res.ok) {
        setError("ვერ ჩაიტვირთა. სცადეთ გვერდის განახლება.");
        return;
      }
      const data = (await res.json()) as ThreadStatus;
      setThread(data);

      // Slow down once delivered
      if (data.status === "sent" && data.documents.length > 0) {
        if (intervalRef.current !== null) {
          clearInterval(intervalRef.current);
        }
        intervalRef.current = setInterval(() => void poll(), 15_000);
      }
    } catch {
      setError("კავშირის შეცდომა. სცადეთ მოგვიანებით.");
    }
  }

  useEffect(() => {
    void poll();
    intervalRef.current = setInterval(() => void poll(), 5_000);
    return () => {
      if (intervalRef.current !== null) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, rid]);

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="mb-6 text-xl font-semibold">{title}</h1>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!thread && !error && (
        <div className="text-sm text-neutral-400">იტვირთება…</div>
      )}

      {thread && (
        <div className="flex flex-col gap-4">
          {/* Bot intro bubble */}
          <div className="max-w-[80%] self-start">
            <div className="rounded-2xl rounded-tl-sm bg-neutral-100 px-4 py-3 text-sm text-neutral-800">
              {thread.intro}
            </div>
          </div>

          {/* Document bubbles */}
          {thread.documents.map((doc, i) => (
            <div key={i} className="max-w-[80%] self-start">
              <div className="rounded-2xl rounded-tl-sm border border-neutral-200 bg-white px-4 py-3 text-sm">
                <p className="mb-2 font-medium text-neutral-900">
                  {LABEL_MAP[doc.kind] ?? doc.label}
                </p>
                <div className="flex gap-3">
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg bg-black px-3 py-1.5 text-xs font-medium text-white"
                  >
                    ნახვა
                  </a>
                  <a
                    href={doc.url}
                    download
                    className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700"
                  >
                    ჩამოტვირთვა
                  </a>
                </div>
              </div>
            </div>
          ))}

          {/* Pending indicator */}
          {thread.status !== "sent" && (
            <div className="max-w-[80%] self-start">
              <div className="rounded-2xl rounded-tl-sm bg-neutral-100 px-4 py-3 text-xs text-neutral-400">
                <span className="animate-pulse">● </span>
                ველოდებით შეთავაზებას…
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
