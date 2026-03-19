import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'allone.ge — AI-Powered Solutions',
  description: 'AI solutions that cut delivery costs by 90%. Chatbots, custom AI, workflow automation, and more.',
};

export default function V2Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
