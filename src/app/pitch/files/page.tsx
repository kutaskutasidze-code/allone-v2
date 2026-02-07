'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, FileSpreadsheet, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

type Lang = 'en' | 'ka';

const files = {
  en: [
    {
      name: 'Financial Model',
      description: 'Full Year 1 financial model: revenue projections, COGS, operating expenses, EBITDA, net income, headcount, client growth, and key metrics — month by month',
      file: '/allone-financial-projections.xlsx',
      icon: 'xls',
      size: '~20 KB',
    },
  ],
  ka: [
    {
      name: 'ფინანსური მოდელი',
      description: 'პირველი წლის სრული ფინანსური მოდელი: შემოსავლების პროექციები, COGS, საოპერაციო ხარჯები, EBITDA, წმინდა მოგება, თანამშრომლები, კლიენტების ზრდა — თვეების მიხედვით',
      file: '/allone-financial-projections-GE.xlsx',
      icon: 'xls',
      size: '~20 KB',
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
            {en ? 'Financial Model' : 'ფინანსური მოდელი'}
          </h1>
          <p className="text-base md:text-lg text-[#6e6e73] mb-8 md:mb-12">
            {en
              ? 'Download the full Year 1 financial model with month-by-month projections.'
              : 'ჩამოტვირთეთ პირველი წლის სრული ფინანსური მოდელი თვეების მიხედვით.'}
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
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center shrink-0 bg-green-50">
                  <FileSpreadsheet className="w-6 h-6 md:w-7 md:h-7 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg md:text-xl font-semibold text-[#1d1d1f] group-hover:text-green-600 transition-colors">
                      {file.name}
                    </h2>
                    <Download className="w-5 h-5 text-[#86868b] group-hover:text-green-600 transition-colors shrink-0 ml-3" />
                  </div>
                  <p className="text-sm md:text-base text-[#6e6e73] mt-1 leading-relaxed">
                    {file.description}
                  </p>
                  <div className="flex items-center gap-3 mt-3">
                    <span className="text-xs text-[#86868b] bg-[#f5f5f7] rounded-full px-2.5 py-0.5">
                      XLSX
                    </span>
                    <span className="text-xs text-[#86868b]">{file.size}</span>
                  </div>
                </div>
              </div>
            </motion.a>
          ))}
        </div>

        {/* Key highlights from model */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 bg-white rounded-2xl border border-[#e5e5e7] p-6"
        >
          <h3 className="text-lg font-semibold mb-4">{en ? 'Key Highlights' : 'მთავარი მაჩვენებლები'}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: en ? 'Year 1 Revenue' : 'წელი 1 შემოსავალი', value: '$444K' },
              { label: en ? 'Net Income' : 'წმინდა მოგება', value: '$196K' },
              { label: en ? 'EBITDA Margin' : 'EBITDA მარჟა', value: '51.9%' },
              { label: en ? 'Gross Margin' : 'მთლიანი მარჟა', value: '68.4%' },
              { label: en ? 'End Clients' : 'საბოლოო კლიენტები', value: '264' },
              { label: en ? 'EBITDA+ Month' : 'EBITDA+ თვე', value: '2' },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="text-xs text-[#86868b] mb-1">{item.label}</div>
                <div className="text-lg font-bold">{item.value}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Both languages note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center"
        >
          <p className="text-sm text-[#86868b]">
            {en
              ? 'Switch to GE for Georgian language version'
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
