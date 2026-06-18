import Image from 'next/image';
import { Inter, Space_Grotesk } from 'next/font/google';
import { CareersNav } from './CareersNav';
import { CareersCursor } from './CareersCursor';

const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

// Wraps the careers pages with the studio-style navbar + footer so /careers
// feels like part of the main allonelabs.com site.
export default function CareersLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${inter.className} min-h-screen flex flex-col bg-[#f1f0ee] text-[#0c1016]`}>
      <CareersCursor />
      <CareersNav />

      <div className="flex-1">{children}</div>

      {/* Footer — replicates the static studio's dark .footer-wrapper / .allone-footer */}
      <div className={spaceGrotesk.className} style={{ backgroundColor: '#0c1016' }}>
        <footer
          className="mx-auto flex flex-col px-6 py-20 md:px-10 md:py-24 lg:px-16"
          style={{ maxWidth: '1600px', color: '#F0F6F8', gap: '3.5rem', boxSizing: 'border-box' }}
        >
          <div className="grid grid-cols-1 gap-12 md:grid-cols-[2fr_1fr_1.2fr] md:gap-16">
            {/* Brand column */}
            <div className="flex flex-col items-start gap-6">
              <Image
                src="/images/allone-mark.webp"
                alt="ALLONE"
                width={180}
                height={60}
                className="h-auto w-[7.5rem]"
                style={{ filter: 'brightness(0) invert(1)' }}
              />
              <p
                className="m-0 font-medium"
                style={{ fontSize: '1.05rem', lineHeight: 1.55, color: '#B5BFC8', maxWidth: '32rem' }}
              >
                A trusted partner for businesses using AI to scale operations, build modern systems, and ship faster than traditional agencies.
              </p>
            </div>

            {/* Company column */}
            <div className="flex flex-col">
              <h4
                className="m-0 font-semibold uppercase"
                style={{ fontSize: '0.82rem', letterSpacing: '0.12em', color: '#6B7785', marginBottom: '1.2rem' }}
              >
                Company
              </h4>
              <ul className="m-0 flex list-none flex-col p-0" style={{ gap: '0.7rem' }}>
                <li style={{ fontSize: '1.02rem' }}>
                  <a href="/" className="no-underline transition-colors hover:text-[#97CCE8]" style={{ color: '#F0F6F8' }}>Home</a>
                </li>
                <li style={{ fontSize: '1.02rem' }}>
                  <a href="/studio" className="no-underline transition-colors hover:text-[#97CCE8]" style={{ color: '#F0F6F8' }}>Studio</a>
                </li>
                <li style={{ fontSize: '1.02rem' }}>
                  <a href="/work" className="no-underline transition-colors hover:text-[#97CCE8]" style={{ color: '#F0F6F8' }}>Work</a>
                </li>
                <li style={{ fontSize: '1.02rem' }}>
                  <a href="/contact" className="no-underline transition-colors hover:text-[#97CCE8]" style={{ color: '#F0F6F8' }}>Services</a>
                </li>
                <li style={{ fontSize: '1.02rem' }}>
                  <a href="/careers" className="no-underline transition-colors hover:text-[#97CCE8]" style={{ color: '#F0F6F8' }}>Careers</a>
                </li>
              </ul>
            </div>

            {/* Contact column */}
            <div className="flex flex-col">
              <h4
                className="m-0 font-semibold uppercase"
                style={{ fontSize: '0.82rem', letterSpacing: '0.12em', color: '#6B7785', marginBottom: '1.2rem' }}
              >
                Contact
              </h4>
              <ul className="m-0 flex list-none flex-col p-0" style={{ gap: '0.7rem' }}>
                <li style={{ fontSize: '1.02rem' }}>
                  <a href="mailto:info@allonelabs.com" className="no-underline transition-colors hover:text-[#97CCE8]" style={{ color: '#F0F6F8' }}>info@allonelabs.com</a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom row */}
          <div
            className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between"
            style={{ paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div style={{ fontSize: '0.85rem', color: '#6B7785' }}>© 2026 AllOne™. All rights reserved.</div>
          </div>

          {/* Giant wordmark */}
          <div className="w-full overflow-hidden">
            <Image
              src="/images/allone-wordmark.png"
              alt="AllOne"
              width={1073}
              height={296}
              className="block h-auto w-full"
              style={{ filter: 'brightness(0) invert(1)' }}
            />
          </div>
        </footer>
      </div>
    </div>
  );
}
