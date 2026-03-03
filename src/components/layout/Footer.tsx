'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Container } from './Container';

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'AI Studio', href: '/products' },
  { label: 'Services', href: '/#services' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[var(--black)]">
      {/* Closing CTA Section */}
      <div className="border-t border-white/10">
        <Container>
          <div className="py-20 lg:py-28 text-center">
            <p
              className="mono-label mb-6"
            >
              Ready?
            </p>
            <h2 className="text-3xl lg:text-5xl font-light text-white leading-[1.05] tracking-[-0.03em] mb-8">
              Begin the transformation
            </h2>
            <Link
              href="/contact"
              className="btn-pill"
            >
              Get Started
            </Link>
          </div>
        </Container>
      </div>

      {/* Footer Grid */}
      <div className="border-t border-white/10">
        <Container>
          <div className="py-12 lg:py-16 grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-16">
            {/* Col 1: Logo + Location */}
            <div className="space-y-4">
              <Link href="/" className="flex items-center gap-2.5">
                <Image
                  src="/images/allone-logo.png"
                  alt="Allone"
                  width={22}
                  height={22}
                  className="invert"
                />
                <span className="text-sm font-semibold text-white tracking-tight">
                  ALLONE
                </span>
              </Link>
              <div className="space-y-1">
                <p className="text-sm text-white/40">Tbilisi, Georgia</p>
                <p
                  className="text-white/40"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase' }}
                >
                  Est. 2024
                </p>
              </div>
            </div>

            {/* Col 2: Navigation */}
            <div>
              <p
                className="mono-label mb-4"
              >
                Navigation
              </p>
              <nav className="space-y-2.5">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block text-sm text-white/50 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Col 3: Contact */}
            <div>
              <p
                className="mono-label mb-4"
              >
                Contact
              </p>
              <div className="space-y-2.5">
                <a
                  href="mailto:info@allone.ge"
                  className="block text-sm text-white/50 hover:text-white transition-colors"
                >
                  info@allone.ge
                </a>
              </div>
            </div>
          </div>
        </Container>
      </div>

      {/* Copyright */}
      <div className="border-t border-white/10">
        <Container>
          <div className="py-6 flex flex-col sm:flex-row justify-between items-center gap-2">
            <p
              className="text-white/40"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase' }}
            >
              &copy; {currentYear} Allone. All rights reserved.
            </p>
          </div>
        </Container>
      </div>
    </footer>
  );
}
