"use client";
import { useState, useEffect } from "react";
import { OTHER_LABEL, type BotQuestion } from "@/lib/bots/types";

export function BotChat({
  slug,
  title,
  intro,
  questions,
}: {
  slug: string;
  title: string;
  intro: string | null;
  questions: BotQuestion[];
}) {
  const [step, setStep] = useState(-1); // -1 = intro screen
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [done, setDone] = useState(false);

  // On mount: resume existing thread if one was stored for this slug.
  // This runs only on the /b/[slug] bot page (not on /b/[slug]/c/[rid]).
  useEffect(() => {
    const stored = localStorage.getItem(`bot_thread_${slug}`);
    if (stored) {
      window.location.assign(`/b/${slug}/c/${stored}`);
    }
  }, [slug]);

  async function submit(all: Record<string, string | string[]>) {
    const res = await fetch(`/api/bots/${slug}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers: all }),
    });
    const data = (await res.json()) as { ok?: boolean; response_id?: string };
    if (data.response_id) {
      localStorage.setItem(`bot_thread_${slug}`, data.response_id);
      window.location.assign(`/b/${slug}/c/${data.response_id}`);
      return;
    }
    setDone(true);
  }

  function answer(q: BotQuestion, value: string | string[]) {
    const next = { ...answers, [q.id]: value };
    setAnswers(next);
    if (step + 1 >= questions.length) void submit(next);
    else setStep(step + 1);
  }

  if (done)
    return (
      <main className="mx-auto max-w-2xl p-8 text-center">მადლობა! 🙌</main>
    );
  if (step < 0)
    return (
      <main className="mx-auto max-w-2xl p-8">
        <h1 className="text-xl font-semibold">{title}</h1>
        {intro && <p className="mt-3 text-neutral-600">{intro}</p>}
        <button
          onClick={() => setStep(0)}
          className="mt-5 rounded-xl bg-black px-5 py-3 text-white"
        >
          დავიწყოთ
        </button>
      </main>
    );

  const q = questions[step];
  const opts = [...(q.options ?? []), ...(q.allowOther ? [OTHER_LABEL] : [])];
  return (
    <main className="mx-auto max-w-2xl p-8">
      <p className="text-sm text-neutral-500">
        {step + 1} / {questions.length}
      </p>
      <h2 className="mt-2 text-lg font-medium">{q.text}</h2>
      {q.hint && <p className="text-sm text-neutral-500">{q.hint}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        {q.type === "text" ? (
          <TextAnswer onSubmit={(v) => answer(q, v)} />
        ) : (
          opts.map((o) => (
            <button
              key={o}
              onClick={() => answer(q, q.type === "multi" ? [o] : o)}
              className="rounded-full border px-4 py-2 text-sm"
            >
              {o}
            </button>
          ))
        )}
      </div>
    </main>
  );
}

function TextAnswer({ onSubmit }: { onSubmit: (v: string) => void }) {
  const [v, setV] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(v.trim());
      }}
      className="flex w-full gap-2"
    >
      <input
        value={v}
        onChange={(e) => setV(e.target.value)}
        className="flex-1 rounded-xl border px-4 py-3"
        placeholder="ჩაწერეთ პასუხი…"
      />
      <button className="rounded-xl bg-black px-5 text-white">გაგზავნა</button>
    </form>
  );
}
