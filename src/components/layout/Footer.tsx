'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Container } from './Container';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-8 border-t border-[var(--gray-200)]">
      <Container>
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/images/allone-logo.png"
              alt="Allone"
              width={20}
              height={20}
            />
            <span className="text-sm font-medium text-[var(--black)]">ALLONE</span>
          </Link>

          <div className="flex items-center gap-6 text-xs text-[var(--gray-500)]">
            <a href="mailto:info@allone.ge" className="hover:text-[var(--black)] transition-colors">
              info@allone.ge
            </a>
            <span className="hidden md:inline">·</span>
            <span>&copy; {currentYear} Allone</span>
          </div>
        </div>
      </Container>
    </footer>
  );
}
