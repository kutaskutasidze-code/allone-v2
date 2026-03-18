'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Container } from './Container';
import { useI18n } from '@/lib/i18n';

export function Footer({ hideCta = false }: { hideCta?: boolean }) {
  const { t } = useI18n();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-[#E0EEFB]">
      {/* CTA Section */}
      {!hideCta && <Container>
        <div className="py-[clamp(3rem,6vw,5rem)] text-center">
          <p className="font-mono text-[11px] text-[#7E8A97] tracking-widest uppercase mb-3">{t('footer.cta.label')}</p>
          <h2 className="text-2xl lg:text-3xl font-semibold text-[#071D2F] leading-[1.1] tracking-[-0.03em] mb-2">
            {t('footer.cta.title1')} <span className="text-[#0A68F5]">{t('footer.cta.title2')}</span>
          </h2>
          <p className="text-[#7E8A97] text-sm max-w-md mx-auto mb-6">
            {t('footer.cta.desc')}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/contact" className="btn-primary text-sm px-6 py-2.5">
              {t('footer.cta.start')}
            </Link>
            <Link href="/services" className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold text-[#071D2F] border border-[#DCE9F6] rounded-[var(--radius-lg)] hover:border-[#0A68F5] hover:bg-[#F8FAFE] transition-all duration-200">
              {t('footer.cta.services')}
            </Link>
          </div>
        </div>
      </Container>}

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
                <Link href="/services#chatbots" className="block text-sm text-[#7E8A97] hover:text-[#071D2F] transition-colors duration-200">
                  {t('footer.link.chatbots')}
                </Link>
                <Link href="/services#automation" className="block text-sm text-[#7E8A97] hover:text-[#071D2F] transition-colors duration-200">
                  {t('footer.link.automation')}
                </Link>
                <Link href="/services#custom-ai" className="block text-sm text-[#7E8A97] hover:text-[#071D2F] transition-colors duration-200">
                  {t('footer.link.customai')}
                </Link>
                <Link href="/services#web-dev" className="block text-sm text-[#7E8A97] hover:text-[#071D2F] transition-colors duration-200">
                  {t('footer.link.webdev')}
                </Link>
                <Link href="/services#consulting" className="block text-sm text-[#7E8A97] hover:text-[#071D2F] transition-colors duration-200">
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
