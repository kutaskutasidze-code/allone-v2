import type { NavItem } from '@/types';

export const navigation: NavItem[] = [
  { label: 'AI Studio', href: '/products', key: 'products' },
  { label: 'Contact', href: '/contact', key: 'contact' },
];

export const footerLinks = {
  company: [
    { label: 'About Us', href: '/about' },
    { label: 'Products', href: '/products' },
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
