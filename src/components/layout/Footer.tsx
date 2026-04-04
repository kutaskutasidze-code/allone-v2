'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Container } from './Container';
import { useI18n } from '@/lib/i18n';

export function Footer() {
  const { t } = useI18n();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-[#E0EEFB]">
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
                  {t('footer.brand')}
                </span>
              </Link>
              <p className="text-sm text-[#7E8A97] mb-1">{t('footer.tbilisi')}</p>
              <p className="text-sm text-[#7E8A97]">{t('footer.brussels')}</p>
              <p className="font-mono text-[10px] text-[#B0BAC5] tracking-widest uppercase mt-3">
                {t('footer.est')}
              </p>
            </div>

            {/* Col 2: Company */}
            <div>
              <p className="font-mono text-[11px] text-[#B0BAC5] tracking-widest uppercase mb-4">
                {t('footer.company')}
              </p>
              <nav className="space-y-2.5">
                <Link href="/work" className="block text-sm text-[#7E8A97] hover:text-[#071D2F] transition-colors duration-200">
                  {t('footer.link.work')}
                </Link>
                <Link href="/contact" className="block text-sm text-[#7E8A97] hover:text-[#071D2F] transition-colors duration-200">
                  {t('footer.link.contact')}
                </Link>
              </nav>
            </div>

            {/* Col 3: Services */}
            <div>
              <p className="font-mono text-[11px] text-[#B0BAC5] tracking-widest uppercase mb-4">
                {t('footer.services')}
              </p>
              <nav className="space-y-2.5">
                <a href="/#services" className="block text-sm text-[#7E8A97] hover:text-[#071D2F] transition-colors duration-200">
                  {t('footer.link.chatbots')}
                </a>
                <a href="/#services" className="block text-sm text-[#7E8A97] hover:text-[#071D2F] transition-colors duration-200">
                  {t('footer.link.webdev')}
                </a>
                <a href="/#automation" className="block text-sm text-[#7E8A97] hover:text-[#071D2F] transition-colors duration-200">
                  {t('footer.link.automation')}
                </a>
                <Link href="/contact" className="block text-sm text-[#7E8A97] hover:text-[#071D2F] transition-colors duration-200">
                  {t('footer.link.consulting')}
                </Link>
              </nav>
            </div>

            {/* Col 4: Contact */}
            <div>
              <p className="font-mono text-[11px] text-[#B0BAC5] tracking-widest uppercase mb-4">
                {t('footer.contact')}
              </p>
              <div className="space-y-2.5">
                <a
                  href="mailto:info@allonelabs.com"
                  className="block text-sm text-[#7E8A97] hover:text-[#071D2F] transition-colors duration-200"
                >
                  info@allonelabs.com
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
              &copy; {currentYear} Allone. {t('footer.copyright')}
            </p>
            <p className="font-mono text-[10px] text-[#B0BAC5] tracking-widest uppercase">
              {t('footer.built')}
            </p>
          </div>
        </Container>
      </div>
    </footer>
  );
}
