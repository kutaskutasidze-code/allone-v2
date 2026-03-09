'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Container } from './Container';
import { footerLinks } from '@/data/navigation';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-[#E0EEFB]">
      {/* CTA Section - Minimized */}
      <Container>
        <div className="py-[clamp(3rem,6vw,5rem)] text-center">
          <p className="font-mono text-[11px] text-[#7E8A97] tracking-widest uppercase mb-3">Ready to converge?</p>
          <h2 className="text-2xl lg:text-3xl font-semibold text-[#071D2F] leading-[1.1] tracking-[-0.03em] mb-2">
            All systems. <span className="text-[#0A68F5]">One intelligence.</span>
          </h2>
          <p className="text-[#7E8A97] text-sm max-w-md mx-auto mb-6">
            Let&apos;s build something that runs itself.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/contact" className="btn-primary text-sm px-6 py-2.5">
              Start a Project
            </Link>
            <Link href="/services" className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold text-[#071D2F] border border-[#DCE9F6] rounded-[var(--radius-lg)] hover:border-[#0A68F5] hover:bg-[#F8FAFE] transition-all duration-200">
              View Services
            </Link>
          </div>
        </div>
      </Container>

      {/* Links Grid */}
      <div className="border-t border-[#E0EEFB]">
        <Container>
          <div className="py-[clamp(3rem,6vw,5rem)] grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
            {/* Col 1: Brand */}
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-2.5 mb-4">
                <Image
                  src="/images/allone-logo.png"
                  alt="Allone"
                  width={28}
                  height={28}
                  className="object-contain"
                />
                <span className="text-sm font-semibold text-[#071D2F] tracking-[-0.02em] font-[family-name:var(--font-display)]">
                  ALLONE
                </span>
              </Link>
              <p className="text-sm text-[#7E8A97] mb-1">Tbilisi, Georgia</p>
              <p className="text-sm text-[#7E8A97]">Brussels, Belgium</p>
              <p className="font-mono text-[10px] text-[#B0BAC5] tracking-widest uppercase mt-3">
                Est. 2024
              </p>
            </div>

            {/* Col 2: Company */}
            <div>
              <p className="font-mono text-[11px] text-[#B0BAC5] tracking-widest uppercase mb-4">
                Company
              </p>
              <nav className="space-y-2.5">
                {footerLinks.company.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block text-sm text-[#7E8A97] hover:text-[#071D2F] transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Col 3: Services */}
            <div>
              <p className="font-mono text-[11px] text-[#B0BAC5] tracking-widest uppercase mb-4">
                Services
              </p>
              <nav className="space-y-2.5">
                {footerLinks.services.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block text-sm text-[#7E8A97] hover:text-[#071D2F] transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Col 4: Contact */}
            <div>
              <p className="font-mono text-[11px] text-[#B0BAC5] tracking-widest uppercase mb-4">
                Contact
              </p>
              <div className="space-y-2.5">
                <a
                  href="mailto:info@allone.ge"
                  className="block text-sm text-[#7E8A97] hover:text-[#071D2F] transition-colors duration-200"
                >
                  info@allone.ge
                </a>
              </div>
            </div>
          </div>
        </Container>
      </div>

      {/* Copyright */}
      <div className="border-t border-[#E0EEFB]">
        <Container>
          <div className="py-5 flex flex-col sm:flex-row justify-between items-center gap-2">
            <p className="font-mono text-[10px] text-[#B0BAC5] tracking-widest uppercase">
              &copy; {currentYear} Allone. All rights reserved.
            </p>
            <p className="font-mono text-[10px] text-[#B0BAC5] tracking-widest uppercase">
              Built with precision
            </p>
          </div>
        </Container>
      </div>
    </footer>
  );
}
