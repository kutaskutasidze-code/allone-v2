import type { Metadata } from 'next';
import { AnimationPreviewContent } from '@/components/animations/AnimationPreviewContent';

export const metadata: Metadata = {
  title: 'Animation Preview',
  description: 'Hero animation concepts for the Allone brand.',
};

export default function AnimationPreviewPage() {
  return <AnimationPreviewContent />;
}
