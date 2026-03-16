import { LabHero, LabResearches } from '@/components/sections';
import { Metadata } from 'next';
import { LabChatPopup } from './lab-chat-popup';

export const metadata: Metadata = {
  title: 'Quantum AI Lab | ALLONE',
  description: 'Research, experiments, and products at the intersection of Quantum Computing and Artificial Intelligence.',
};

export default function LabPage() {
  return (
    <main className="min-h-screen bg-white">
      <LabHero />
      <LabResearches />
      <LabChatPopup />
    </main>
  );
}
