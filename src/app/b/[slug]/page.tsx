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
  return <BotChat slug={cfg.slug} title={cfg.title} intro={cfg.intro} />;
}
