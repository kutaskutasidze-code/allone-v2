import { notFound } from "next/navigation";
import { getBotConfigBySlug } from "@/lib/bots/repo";
import { BotChat } from "./BotChat";

export const dynamic = "force-dynamic";

export default async function BotPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cfg = await getBotConfigBySlug(slug);
  if (!cfg) notFound();
  // Full-bleed pure white — overrides the app's blue-tinted --background so the
  // chat reads as one clean white surface (matching the composer).
  return (
    <div className="min-h-dvh bg-white">
      <BotChat slug={cfg.slug} title={cfg.title} intro={cfg.intro} />
    </div>
  );
}
