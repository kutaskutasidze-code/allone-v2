'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, FileText, FileSpreadsheet, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

type Lang = 'en' | 'ka';

const files = {
  en: [
    {
      name: 'Investor Memo',
      description: 'Full investor memorandum with business model, financials, and investment terms',
      file: '/allone-investor-memo.docx',
      icon: 'doc',
      size: '~40 KB',
    },
    {
      name: 'Financial Projections',
      description: '7-sheet Excel model: P&L, client growth, team costs, unit economics, cash flow, investment plan, 3-year scenarios',
      file: '/allone-financial-projections.xlsx',
      icon: 'xls',
      size: '~15 KB',
    },
  ],
  ka: [
    {
      name: 'ინვესტორის მემო',
      description: 'სრული ინვესტორის მემორანდუმი ბიზნეს-მოდელით, ფინანსებით და ინვესტიციის პირობებით',
      file: '/allone-investor-memo-GE.docx',
      icon: 'doc',
      size: '~35 KB',
    },
    {
      name: 'ფინანსური პროექციები',
      description: '7-ფურცლიანი Excel მოდელი: P&L, კლიენტების ზრდა, გუნდის ხარჯები, ერთეულის ეკონომიკა, ფულადი ნაკადები, ინვესტიციის გეგმა, 3-წლიანი სცენარები',
      file: '/allone-financial-projections-GE.xlsx',
      icon: 'xls',
      size: '~15 KB',
    },
  ],
};

export default function PitchFilesPage() {
  const [lang, setLang] = useState<Lang>('en');

  const currentFiles = files[lang];
  const en = lang === 'en';

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#1d1d1f]">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-[#e5e5e7]">
        <div className="max-w-3xl mx-auto px-4 py-3 md:py-4 flex items-center justify-between">
          <Link
            href="/pitch"
            className="flex items-center gap-1.5 text-sm text-[#6e6e73] hover:text-[#1d1d1f] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{en ? 'Back to Pitch' : 'პრეზენტაციაზე დაბრუნება'}</span>
          </Link>
          <div className="flex items-center bg-[#f5f5f7] rounded-full overflow-hidden">
            <button
              onClick={() => setLang('en')}
              className={`px-2.5 py-1 text-xs font-medium transition-all ${
                lang === 'en' ? 'bg-[#1d1d1f] text-white' : 'text-[#6e6e73]'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLang('ka')}
              className={`px-2.5 py-1 text-xs font-medium transition-all ${
                lang === 'ka' ? 'bg-[#1d1d1f] text-white' : 'text-[#6e6e73]'
              }`}
            >
              GE
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 pt-24 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl md:text-5xl font-bold mb-2">
            {en ? 'Investor Documents' : 'ინვესტორის დოკუმენტები'}
          </h1>
          <p className="text-base md:text-lg text-[#6e6e73] mb-8 md:mb-12">
            {en
              ? 'Download the full investor package — memo and financial projections.'
              : 'ჩამოტვირთეთ ინვესტორის სრული პაკეტი — მემორანდუმი და ფინანსური პროექციები.'}
          </p>
        </motion.div>

        <div className="space-y-4">
          {currentFiles.map((file, i) => (
            <motion.a
              key={file.file}
              href={file.file}
              download
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.15 }}
              className="block bg-white rounded-2xl p-5 md:p-7 shadow-sm border border-[#e5e5e7] hover:shadow-md hover:border-[#d2d2d7] transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center shrink-0 ${
                  file.icon === 'doc' ? 'bg-blue-50' : 'bg-green-50'
                }`}>
                  {file.icon === 'doc' ? (
                    <FileText className={`w-6 h-6 md:w-7 md:h-7 ${file.icon === 'doc' ? 'text-blue-600' : 'text-green-600'}`} />
                  ) : (
                    <FileSpreadsheet className="w-6 h-6 md:w-7 md:h-7 text-green-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg md:text-xl font-semibold text-[#1d1d1f] group-hover:text-blue-600 transition-colors">
                      {file.name}
                    </h2>
                    <Download className="w-5 h-5 text-[#86868b] group-hover:text-blue-600 transition-colors shrink-0 ml-3" />
                  </div>
                  <p className="text-sm md:text-base text-[#6e6e73] mt-1 leading-relaxed">
                    {file.description}
                  </p>
                  <div className="flex items-center gap-3 mt-3">
                    <span className="text-xs text-[#86868b] bg-[#f5f5f7] rounded-full px-2.5 py-0.5">
                      {file.file.endsWith('.docx') ? 'DOCX' : 'XLSX'}
                    </span>
                    <span className="text-xs text-[#86868b]">{file.size}</span>
                  </div>
                </div>
              </div>
            </motion.a>
          ))}
        </div>

        {/* Both languages note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center"
        >
          <p className="text-sm text-[#86868b]">
            {en
              ? 'Switch to GE for Georgian language versions'
              : 'გადართეთ EN-ზე ინგლისურენოვანი ვერსიისთვის'}
          </p>
        </motion.div>

        {/* Contact */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-12 bg-[#1d1d1f] text-white rounded-2xl p-6 md:p-8 text-center"
        >
          <h3 className="text-lg md:text-xl font-semibold mb-2">
            {en ? 'Ready to discuss?' : 'მზად ხართ სადისკუსიოდ?'}
          </h3>
          <p className="text-sm md:text-base text-white/70 mb-4">
            {en
              ? 'Contact us to schedule a meeting and learn more about the opportunity.'
              : 'დაგვიკავშირდით შეხვედრის დასანიშნად.'}
          </p>
          <a
            href="https://allone.ge"
            className="inline-block bg-white text-[#1d1d1f] font-medium rounded-full px-6 py-2.5 text-sm hover:bg-[#f5f5f7] transition-colors"
          >
            allone.ge
          </a>
        </motion.div>
      </div>
    </div>
  );
}
