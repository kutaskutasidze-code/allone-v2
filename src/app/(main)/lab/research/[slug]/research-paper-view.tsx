"use client";

import Link from "next/link";
import Image from "next/image";
import { useI18n } from "@/lib/i18n";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, Calendar, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { ScrollProgress } from "@/components/ui/ScrollProgress";

interface PaperData {
  slug: string;
  title: string;
  titleKa: string;
  description: string;
  descriptionKa: string;
  label: string;
  labelKa: string;
  date: string;
  dateKa: string;
  dateISO: string;
  author: string;
  authorRole: string;
  authorRoleKa: string;
  image: string;
  content: string;
  contentKa: string;
  readTime: string;
  chapter: number;
}

interface RelatedPaper {
  slug: string;
  title: string;
  titleKa: string;
  description: string;
  descriptionKa: string;
  label: string;
  labelKa: string;
  image: string;
  chapter: number;
}

function renderContent(content: string) {
  return content.split("\n\n").map((block, i) => {
    const trimmed = block.trim();
    if (!trimmed) return null;

    // Main headings
    if (trimmed.startsWith("## ")) {
      return (
        <motion.h2
          key={i}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-3xl md:text-4xl font-display font-semibold tracking-tight text-heading mt-16 mb-6"
        >
          {trimmed.replace("## ", "")}
        </motion.h2>
      );
    }

    // Subheadings
    if (trimmed.startsWith("### ")) {
      return (
        <motion.h3
          key={i}
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="text-xl md:text-2xl font-display font-semibold tracking-tight text-heading mt-12 mb-4"
        >
          {trimmed.replace("### ", "")}
        </motion.h3>
      );
    }

    // Blockquotes / pull quotes
    if (trimmed.startsWith("> ")) {
      const quoteText = trimmed.replace(/^> /gm, "");
      return (
        <motion.blockquote
          key={i}
          initial={{ opacity: 0, x: -12 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="my-10 pl-6 border-l-2 border-accent"
        >
          <p className="text-lg md:text-xl font-display font-medium text-heading leading-relaxed italic">
            {quoteText}
          </p>
        </motion.blockquote>
      );
    }

    // Lists
    if (trimmed.includes("\n- ") || trimmed.startsWith("- ")) {
      return (
        <motion.ul
          key={i}
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="my-6 space-y-3"
        >
          {trimmed.split("\n").map((item, j) => {
            const text = item.replace(/^- /, "").trim();
            if (!text) return null;
            return (
              <li
                key={j}
                className="flex gap-3 text-[17px] leading-[1.8] text-muted font-body"
              >
                <span className="text-accent mt-[10px] shrink-0 w-1.5 h-1.5 rounded-full bg-accent/40" />
                <span dangerouslySetInnerHTML={{ __html: text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-heading font-semibold">$1</strong>') }} />
              </li>
            );
          })}
        </motion.ul>
      );
    }

    // Tables (simple markdown tables)
    if (trimmed.includes(" | ") && trimmed.includes("\n|")) {
      const rows = trimmed.split("\n").filter(r => r.trim().length > 0);
      const headerRow = rows[0];
      const dataRows = rows.slice(2); // skip separator row
      const headers = headerRow.split("|").map(h => h.trim()).filter(Boolean);

      return (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.4 }}
          className="my-8 overflow-x-auto"
        >
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border">
                {headers.map((h, hi) => (
                  <th key={hi} className="text-left py-3 px-3 font-display font-semibold text-heading text-xs uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataRows.map((row, ri) => {
                const cells = row.split("|").map(c => c.trim()).filter(Boolean);
                return (
                  <tr key={ri} className="border-b border-border-light">
                    {cells.map((cell, ci) => (
                      <td
                        key={ci}
                        className="py-2.5 px-3 text-muted font-body"
                        dangerouslySetInnerHTML={{ __html: cell.replace(/\*\*(.*?)\*\*/g, '<strong class="text-heading">$1</strong>') }}
                      />
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </motion.div>
      );
    }

    // Paragraphs with fade-in
    return (
      <motion.p
        key={i}
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="text-[17px] leading-[1.85] text-muted font-body mb-6"
        dangerouslySetInnerHTML={{
          __html: trimmed
            .replace(/\*\*(.*?)\*\*/g, '<strong class="text-heading font-semibold">$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>'),
        }}
      />
    );
  });
}

export function ResearchPaperView({
  paper,
  related,
  totalPapers,
}: {
  paper: PaperData;
  related: RelatedPaper[];
  totalPapers: number;
}) {
  const { lang } = useI18n();
  const isKa = lang === "ka";

  const title = isKa ? paper.titleKa : paper.title;
  const description = isKa ? paper.descriptionKa : paper.description;
  const label = isKa ? paper.labelKa : paper.label;
  const date = isKa ? paper.dateKa : paper.date;
  const content = isKa ? paper.contentKa : paper.content;
  const authorRole = isKa ? paper.authorRoleKa : paper.authorRole;
  const readTime = isKa
    ? paper.readTime.replace("min read", "წთ კითხვა")
    : paper.readTime;
  const chapterLabel = isKa
    ? `ნაწილი ${paper.chapter} / ${totalPapers}`
    : `Part ${paper.chapter} of ${totalPapers}`;

  return (
    <div className="bg-white min-h-screen">
      {/* Scroll progress bar */}
      <ScrollProgress className="fixed top-0 z-[60] bg-accent" />

      {/* Hero image */}
      <div className="relative w-full h-[40vh] md:h-[50vh] overflow-hidden">
        <Image
          src={paper.image}
          alt={title}
          fill
          className="object-cover"
          sizes="100vw"
          priority
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-white" />
      </div>

      <article className="relative max-w-[680px] mx-auto px-5 sm:px-6 -mt-20">
        {/* Back link */}
        <Link
          href="/lab"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-accent transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          {isKa ? "ლაბორატორია" : "Lab"}
        </Link>

        {/* Header */}
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-5">
            <Badge variant="accent">{label}</Badge>
            <span className="text-xs font-mono text-muted tracking-wide">
              {chapterLabel}
            </span>
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-3xl md:text-[42px] font-display font-semibold text-heading tracking-tight leading-[1.12] mb-5"
          >
            {title}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-lg text-muted leading-relaxed font-body mb-8"
          >
            {description}
          </motion.p>

          {/* Author card */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="flex items-center gap-4 py-5 border-y border-border-light"
          >
            <div className="relative w-11 h-11 rounded-full overflow-hidden bg-surface-2 shrink-0">
              <Image
                src="/images/author.jpg"
                alt={paper.author}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-heading font-body truncate">
                {paper.author}
              </p>
              <p className="text-xs text-muted font-body">{authorRole}</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted shrink-0">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {date}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {readTime}
              </span>
            </div>
          </motion.div>
        </header>

        {/* Content */}
        <div className="pb-16">{renderContent(content)}</div>

        {/* Author inline — photo + quote at the end of post */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-start gap-5 py-8 border-y border-border-light mb-16"
        >
          <div className="relative w-16 h-16 rounded-full overflow-hidden bg-surface-2 shrink-0">
            <Image
              src="/images/author.jpg"
              alt={paper.author}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <div>
            <p className="text-sm font-semibold text-heading font-body">
              {paper.author}
            </p>
            <p className="text-xs text-muted font-body mb-2">{authorRole}</p>
            <p className="text-sm text-muted leading-relaxed font-body">
              {isKa
                ? "ALLONE-ის დამფუძნებელი, კვანტური AI მკვლევარი თბილისიდან. ვაშენებთ ხიდს კვანტურ ფიზიკასა და პრაქტიკულ AI-ს შორის."
                : "Founder of ALLONE, quantum AI researcher from Tbilisi. Building the bridge between quantum physics and practical AI."}
            </p>
          </div>
        </motion.div>

        {/* CTA */}
        <div className="bg-surface-2 rounded-2xl p-8 text-center mb-16">
          <h3 className="text-xl font-display font-semibold text-heading mb-3">
            {isKa ? "თანამშრომლობა გსურთ?" : "Want to collaborate?"}
          </h3>
          <p className="text-sm text-muted mb-6 max-w-md mx-auto font-body">
            {isKa
              ? "ჩვენი ლაბორატორია ღიაა პარტნიორობისთვის."
              : "Our lab is open to partnerships with research institutions and R&D teams."}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/contact"
              className="btn-primary text-sm px-6 py-2.5 rounded-lg"
            >
              {isKa ? "კონტაქტი" : "Get in Touch"}
            </Link>
          </div>
        </div>
      </article>

      {/* Related posts */}
      {related.length > 0 && (
        <section className="bg-surface-2 py-20">
          <div className="max-w-5xl mx-auto px-5 sm:px-6">
            <p className="mono-label mb-3">
              {isKa ? "კითხვა გააგრძელე" : "Continue Reading"}
            </p>
            <h2 className="text-2xl font-display font-semibold text-heading mb-10">
              {isKa ? "მეტი ლაბორატორიიდან" : "More from the Lab"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {related.map((p) => (
                <Link
                  key={p.slug}
                  href={`/lab/research/${p.slug}`}
                  className="group"
                >
                  <div className="bg-white rounded-xl overflow-hidden border border-border-light transition-all hover:border-accent/30 hover:shadow-lg h-full flex flex-col">
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <Image
                        src={p.image}
                        alt={isKa ? p.titleKa : p.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        sizes="(max-width: 768px) 100vw, 33vw"
                        unoptimized
                      />
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="outline" className="text-[9px]">
                          {isKa ? p.labelKa : p.label}
                        </Badge>
                        <span className="text-[10px] font-mono text-muted">
                          {isKa ? `ნაწ. ${p.chapter}` : `Pt. ${p.chapter}`}
                        </span>
                      </div>
                      <h3 className="text-base font-display font-semibold text-heading leading-snug mb-2 group-hover:text-accent transition-colors flex-1">
                        {isKa ? p.titleKa : p.title}
                      </h3>
                      <p className="text-xs text-muted line-clamp-2 font-body">
                        {isKa ? p.descriptionKa : p.description}
                      </p>
                      <div className="mt-3 flex items-center gap-1 text-xs font-medium text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                        {isKa ? "წაკითხვა" : "Read"}
                        <ChevronRight className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
