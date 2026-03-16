import type { Metadata } from 'next';
import { WorkContent } from './WorkContent';

export const metadata: Metadata = {
  title: 'Work',
  description: 'Case studies and portfolio of AI automation projects by ALLONE.',
  alternates: { canonical: '/work' },
  openGraph: {
    title: 'Work | ALLONE',
    description: 'Our AI automation portfolio.',
    url: '/work',
  },
};

export default function WorkPage() {
  return <WorkContent />;
}
