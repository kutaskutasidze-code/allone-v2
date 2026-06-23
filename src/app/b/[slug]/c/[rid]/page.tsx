import { notFound } from "next/navigation";
import { getBotConfigBySlug, getResponse } from "@/lib/bots/repo";
import { ThreadChat } from "./ThreadChat";

export const dynamic = "force-dynamic";

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ slug: string; rid: string }>;
}) {
  const { slug, rid } = await params;

  const [cfg, response] = await Promise.all([
    getBotConfigBySlug(slug),
    getResponse(rid),
  ]);

  if (!response || response.bot_slug !== slug) notFound();
  if (!cfg) notFound();

  // Full-bleed pure white — overrides the app's blue-tinted --background so the
  // chat reads as one clean white surface (matching the composer).
  return (
    <div className="min-h-dvh bg-white">
      <ThreadChat slug={slug} rid={rid} title={cfg.title} />
    </div>
  );
}
