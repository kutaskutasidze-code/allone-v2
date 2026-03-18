import type { NavItem } from '@/types';

export const navigation: NavItem[] = [
  { label: 'Home', href: '/', key: 'home' },
  { label: 'Services', href: '/services', key: 'services' },
  { label: 'Work', href: '/work', key: 'work' },
];

export const footerLinks = {
  company: [
    { label: 'Work', href: '/work' },
    { label: 'Contact', href: '/contact' },
  ],
  services: [
    { label: 'AI Chatbots', href: '/services#chatbots' },
    { label: 'Workflow Automation', href: '/services#automation' },
    { label: 'Custom AI', href: '/services#custom-ai' },
    { label: 'Web Development', href: '/services#web-dev' },
    { label: 'Consulting', href: '/services#consulting' },
  ],
  resources: [
    { label: 'Contact', href: '/contact' },
  ],
};
