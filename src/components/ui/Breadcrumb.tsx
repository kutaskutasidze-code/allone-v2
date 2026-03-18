'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { BreadcrumbSchema } from '@/components/seo';

interface BreadcrumbProps {
  customLabels?: Record<string, string>;
}

export function Breadcrumb({ customLabels = {} }: BreadcrumbProps) {
  const pathname = usePathname();

  if (pathname === '/') return null;

  const segments = pathname.split('/').filter(Boolean);

  const breadcrumbs = segments.map((segment, index) => {
    const path = '/' + segments.slice(0, index + 1).join('/');
    const label = customLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
    return { name: label, url: `https://allone.ge${path}` };
  });

  // Add home at the beginning
  const allBreadcrumbs = [{ name: 'Home', url: 'https://allone.ge' }, ...breadcrumbs];

  return (
    <>
      <BreadcrumbSchema items={allBreadcrumbs} />
      <nav aria-label="Breadcrumb" className="py-4 px-6">
        <ol className="flex items-center gap-2 text-sm text-gray-500">
          <li>
            <Link
              href="/"
              className="hover:text-black transition-colors flex items-center gap-1"
            >
              <Home className="w-4 h-4" />
              <span className="sr-only">Home</span>
            </Link>
          </li>
          {segments.map((segment, index) => {
            const path = '/' + segments.slice(0, index + 1).join('/');
            const isLast = index === segments.length - 1;
            const label = customLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');

            return (
              <li key={path} className="flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-gray-300" />
                {isLast ? (
                  <span className="text-black font-medium">{label}</span>
                ) : (
                  <Link
                    href={path}
                    className="hover:text-black transition-colors"
                  >
                    {label}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
