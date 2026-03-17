import { notFound } from 'next/navigation';
import { LAB_RESEARCH } from '@/data/lab-research';
import { ResearchPaperView } from './research-paper-view';

export function generateStaticParams() {
  return LAB_RESEARCH.map((paper) => ({
    slug: paper.slug,
  }));
}

export default async function ResearchPaperPage({ params }: { params: { slug: string } }) {
  const { slug } = await params;
  const paper = LAB_RESEARCH.find((p) => p.slug === slug);

  if (!paper) {
    notFound();
  }

  // Sort by chapter for chronological reading order
  const sorted = [...LAB_RESEARCH].sort((a, b) => a.chapter - b.chapter);

  // Get related: next in series + 2 others
  const currentIdx = sorted.findIndex((p) => p.slug === slug);
  const related = sorted
    .filter((p) => p.slug !== slug)
    .slice(0, 3)
    .map((p) => ({
      slug: p.slug,
      title: p.title,
      titleKa: p.titleKa,
      description: p.description,
      descriptionKa: p.descriptionKa,
      label: p.label,
      labelKa: p.labelKa,
      image: p.image,
      chapter: p.chapter,
    }));

  // Prefer showing next chapter first
  if (currentIdx < sorted.length - 1) {
    const nextPaper = sorted[currentIdx + 1];
    const nextIdx = related.findIndex((r) => r.slug === nextPaper.slug);
    if (nextIdx > 0) {
      const [next] = related.splice(nextIdx, 1);
      related.unshift(next);
    }
  }

  return (
    <ResearchPaperView
      paper={{
        ...paper,
        image: paper.image,
      }}
      related={related.slice(0, 3)}
      totalPapers={LAB_RESEARCH.length}
    />
  );
}
