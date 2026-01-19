import type { NavItem } from '@/types';

export const navigation: NavItem[] = [
  { label: 'Home', href: '/', key: 'home' },
  { label: 'Services', href: '/#services', key: 'services' },
  { label: 'Resources', href: '/products', key: 'resources' },
  { label: 'About', href: '/about', key: 'about' },
  { label: 'Contact', href: '/contact', key: 'contact' },
  { label: 'Login', href: '/login', key: 'login' },
];

export const footerLinks = {
  company: [
    { label: 'About Us', href: '/about' },
    { label: 'Resources', href: '/products' },
    { label: 'Contact', href: '/contact' },
  ],
  services: [
    { label: 'AI Chatbots', href: '/#services' },
    { label: 'Workflow Automation', href: '/#services' },
    { label: 'Custom AI Solutions', href: '/#services' },
    { label: 'AI Consulting', href: '/#services' },
  ],
  resources: [
    { label: 'Templates', href: '/products?category=template' },
    { label: 'Courses', href: '/products?category=course' },
    { label: 'Login', href: '/login' },
    { label: 'Dashboard', href: '/dashboard' },
  ],
};
