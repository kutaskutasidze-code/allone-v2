"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { translate, type Locale, type TranslationKey } from "@/lib/i18n/dict";

const MAX = 3;
const MAX_DIM = 1600;
const QUALITY = 0.72;

// Downscale + re-encode to JPEG in-browser so uploads stay small.
async function compress(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIM / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", QUALITY),
    );
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}

export default function ScreenshotField({
  files,
  onChange,
  locale,
}: {
  files: File[];
  onChange: (files: File[]) => void;
  locale: Locale;
}) {
  const t = (k: TranslationKey) => translate(locale, k);
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    if (picked.length === 0) return;
    setBusy(true);
    const room = MAX - files.length;
    const compressed = await Promise.all(picked.slice(0, room).map(compress));
    onChange([...files, ...compressed].slice(0, MAX));
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function remove(i: number) {
    onChange(files.filter((_, idx) => idx !== i));
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {files.map((f, i) => (
          <div key={i} className="relative h-16 w-16 overflow-hidden rounded-lg border border-neutral-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previews[i]} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white"
              aria-label={t("feedback.portal.shots.remove")}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        {files.length < MAX && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="flex h-16 w-16 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-neutral-300 text-neutral-400 transition hover:border-neutral-400 hover:text-neutral-600 disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
          </button>
        )}
      </div>
      <p className="mt-1.5 text-[11px] text-neutral-400">{t("feedback.portal.shots.max")}</p>
      <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={pick} />
    </div>
  );
}
