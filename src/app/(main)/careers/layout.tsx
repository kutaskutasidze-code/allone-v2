import Image from 'next/image';
import { Inter } from 'next/font/google';
import { CareersNav } from './CareersNav';

const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] });

// Wraps the careers pages with the studio-style navbar + footer so /careers
// feels like part of the main allonelabs.com site.
export default function CareersLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${inter.className} min-h-screen flex flex-col bg-[#f1f0ee] text-[#0c1016]`}>
      <CareersNav />

      <div className="flex-1">{children}</div>

      <footer className="border-t border-[#0c1016]/10 mt-20">
        <div className="max-w-6xl mx-auto px-5 lg:px-8 pt-14 pb-8">
          <div className="grid gap-10 md:grid-cols-[1.4fr_1fr]">
            <div className="max-w-sm">
              <Image src="/images/allone-mark.webp" alt="AllOne" width={120} height={40} className="h-8 w-auto object-contain mb-4" />
              <p className="text-sm text-[#565f6b] leading-relaxed">
                A trusted partner for businesses using AI to scale operations, build modern systems, and ship faster than traditional agencies.
              </p>
            </div>
            <div className="flex gap-16 md:justify-end">
              <nav className="flex flex-col gap-2.5 text-sm">
                <span className="text-xs uppercase tracking-[0.14em] text-[#6b7480] mb-1">Company</span>
                <a href="/" className="text-[#0c1016]/70 hover:text-[#0c1016] transition-colors">Home</a>
                <a href="/studio" className="text-[#0c1016]/70 hover:text-[#0c1016] transition-colors">Studio</a>
                <a href="/work" className="text-[#0c1016]/70 hover:text-[#0c1016] transition-colors">Work</a>
                <a href="/contact" className="text-[#0c1016]/70 hover:text-[#0c1016] transition-colors">Services</a>
                <a href="/careers" className="text-[#0c1016]/70 hover:text-[#0c1016] transition-colors">Careers</a>
              </nav>
              <div className="flex flex-col gap-2.5 text-sm">
                <span className="text-xs uppercase tracking-[0.14em] text-[#6b7480] mb-1">Contact</span>
                <a href="mailto:info@allonelabs.com" className="text-[#0c1016]/70 hover:text-[#0c1016] transition-colors">info@allonelabs.com</a>
              </div>
            </div>
          </div>

          <div className="mt-14">
            <Image src="/images/allone-wordmark.png" alt="AllOne" width={1073} height={296} className="w-full h-auto" />
          </div>
          <p className="mt-6 text-xs text-[#6b7480]">© 2026 AllOne™. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
