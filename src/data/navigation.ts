import type { NavItem } from '@/types';

export const navigation: NavItem[] = [
  { label: 'Home', href: '/', key: 'home' },
  { label: 'Services', href: '/services', key: 'services' },
  { label: 'Work', href: '/work', key: 'work' },
  { label: 'About', href: '/about', key: 'about' },
];

export const footerLinks = {
  company: [
    { label: 'About', href: '/about' },
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
    { label: 'AI Studio', href: '/products' },
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Login', href: '/login' },
  ],
};
