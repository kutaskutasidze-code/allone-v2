'use client';

import { useState, useEffect } from 'react';

const defaultContent = {
  en: {
    slides: [
      { id: 1, type: 'title', title: 'ALLONE', subtitle: 'AI Solutions for Business', tagline: 'We consult, build, and maintain AI systems for companies', location: 'Tbilisi, Georgia' },
      { id: 2, type: 'service', title: 'What We Do', statement: 'We are an AI-powered technology services company', steps: [{ number: '01', name: 'Consultation', desc: 'We analyze what the client needs' }, { number: '02', name: 'Planning', desc: 'We design the AI solution' }, { number: '03', name: 'Execution', desc: 'We build and deploy fast' }, { number: '04', name: 'Support', desc: 'We maintain and update — monthly' }], analogy: 'High quality, high speed, low price — in one package' },
      { id: 3, type: 'products', title: 'Our Products', statement: 'Three core products for business growth', items: [{ name: 'Website', desc: 'Modern websites that convert visitors into customers. From 1,000₾' }, { name: 'AI Expert', desc: 'Your company\'s own ChatGPT — trained only on your data. Setup: 3,000₾ + 600₾/mo' }, { name: 'AI Chatbot', desc: 'Customer Support 24/7 — 94% resolution rate, <2s response time' }] },
      { id: 4, type: 'economics', title: 'How We Make Money', statement: 'Simple, recurring revenue with high margins', metrics: [{ metric: 'Monthly fee per client', value: '$300' }, { metric: 'Infrastructure cost', value: '~$30', note: 'Fixed + 5% API' }, { metric: 'Sales commission (25%)', value: '$75' }, { metric: 'Gross profit per client', value: '$195', highlight: true, note: '65% margin' }, { metric: 'Year 1 gross margin', value: '68.4%', note: 'Improves with scale' }, { metric: 'Average client stays', value: '15 months' }, { metric: 'Revenue per client lifetime', value: '$4,500' }], insight: 'Every new client = ~$195/month profit. Year 1 ends at 68.4% gross margin, 51.9% EBITDA margin.' },
      { id: 5, type: 'projection', title: 'Year 1 Financial Model', statement: 'Validated monthly projections from our financial model', footer: 'Year 1 of a 3-year growth plan. Full Excel model available for download.', highlights: [{ label: 'Month 2', value: 'EBITDA positive' }, { label: 'Month 12', value: '$75K/mo revenue' }, { label: 'Year 1 Revenue', value: '$444K' }, { label: 'Year 1 Net Income', value: '$196K' }, { label: 'Year 1 EBITDA', value: '$231K' }, { label: 'End Clients', value: '264' }], details: [{ label: 'M1', revenue: '$5.6K', clients: '27', ebitda: '-$3.2K' }, { label: 'M3', revenue: '$15.2K', clients: '58', ebitda: '$5.5K' }, { label: 'M6', revenue: '$31.4K', clients: '115', ebitda: '$14.3K' }, { label: 'M9', revenue: '$52.1K', clients: '186', ebitda: '$29.8K' }, { label: 'M12', revenue: '$75.2K', clients: '264', ebitda: '$44.5K' }] },
      { id: 6, type: 'sales_strategy', title: 'How We Sell', statement: 'Problem-first approach with live demos', strategies: [{ name: 'Show the Problem', desc: '70%+ of companies\' websites don\'t drive sales' }, { name: 'Knowledge Loss', desc: 'Company know-how is scattered — employees leave, knowledge is lost' }, { name: 'Customer Loss', desc: 'No fast answer? → Customer goes to competitor' }, { name: 'AI Expert Demo', desc: 'Show how it answers company questions instantly' }, { name: 'Chatbot Demo', desc: '94% resolution, <2s — live demo on the spot' }, { name: 'Risk-Free', desc: '7 days no results? Full refund' }], framework: 'Problem → Demo → ROI → Risk-free trial → Close' },
      { id: 7, type: 'operations', title: 'How It Works', statement: 'Traditional business structure with technology leverage', flow: [{ step: 'Sales Team', detail: 'Commission-only agents sign new clients (25% commission)' }, { step: 'Technical Team', detail: 'Consults with client & builds AI solution (1 week)' }, { step: 'AI Platform', detail: 'Runs the solution automatically, 24/7' }, { step: 'Support', detail: 'Monthly maintenance & improvements' }], keyPoint: 'After initial setup, each client runs on autopilot. Infrastructure cost stays ~$30/month per client regardless of usage.' },
      { id: 8, type: 'team', title: 'Team Growth', statement: 'Lean team that scales with revenue', headcount: [{ period: 'M1–M3', sales: '6', tech: '2', detail: 'Startup phase' }, { period: 'M4–M6', sales: '8–10', tech: '2–3', detail: 'Growth phase' }, { period: 'M7–M9', sales: '10–12', tech: '3', detail: 'Scale phase' }, { period: 'M10–M12', sales: '13–15', tech: '4', detail: 'Expansion' }], costs: [{ item: 'Tech salaries', value: '$51K/year', note: '$1,500/person/month' }, { item: 'Office & Admin', value: '$18K/year', note: '$1,500/month fixed' }, { item: 'Equipment', value: '$4K/year', note: '$1K per new hire' }, { item: 'Total OpEx', value: '$73K/year' }] },
      { id: 9, type: 'investment', title: 'The Investment', statement: '$1.24M total for 40% equity — deployed in 3 stages', stages: [{ label: 'Stage 1 — Now', amount: '$40K', equity: '10%', funds: 'Office, sales expansion, tech team' }, { label: 'Stage 2 — After Proof', amount: '$200K', equity: '15%', funds: 'Own servers + 15–20 salespeople' }, { label: 'Stage 3 — After Scale', amount: '$1M', equity: '15%', funds: 'Regional expansion in Caucasus' }], safety: 'You invest $40K now. If we don\'t prove revenue in 6 months, you stop.' },
      { id: 10, type: 'closing', title: 'Pricing & Economics', statement: 'Simple, transparent pricing in GEL', reasons: [{ point: 'Website', detail: 'From 1,000₾' }, { point: 'AI Expert — Setup', detail: 'From 3,000₾' }, { point: 'AI Expert — Monthly', detail: 'From 600₾/month' }, { point: 'AI Chatbot', detail: 'Custom pricing' }, { point: '10% Commission', detail: 'For sales agents' }, { point: 'Risk-Free', detail: '7-day guarantee' }] },
      { id: 11, type: 'chat', title: 'Ask Questions', statement: 'Ask anything about the business model, financials, or investment terms', placeholder: 'Type your question...', suggestions: ['What is the break-even month?', 'How much is Stage 1?', 'What are the margins?', 'How does the sales team work?'] },
    ],
  },
  ka: {
    slides: [
      { id: 1, type: 'title', title: 'ALLONE', subtitle: 'AI გადაწყვეტილებები ბიზნესისთვის', tagline: 'ჩვენ ვაკეთებთ კონსულტაციას, ვაშენებთ და ვმართავთ AI სისტემებს კომპანიებისთვის', location: 'თბილისი, საქართველო' },
      { id: 2, type: 'service', title: 'რას ვაკეთებთ', statement: 'ჩვენ AI-ით გაძლიერებული ტექნოლოგიური სერვისების კომპანია ვართ', steps: [{ number: '01', name: 'კონსულტაცია', desc: 'ვაანალიზებთ, რა სჭირდება კლიენტს' }, { number: '02', name: 'დაგეგმვა', desc: 'ვპროექტებთ AI გადაწყვეტილებას' }, { number: '03', name: 'შესრულება', desc: 'ვაშენებთ და ვნერგავთ სწრაფად' }, { number: '04', name: 'მხარდაჭერა', desc: 'ვმართავთ, ვაახლებთ — ყოველთვიურად' }], analogy: 'მაღალი ხარისხი, მაღალი სიჩქარე, დაბალი ფასი — ერთ სივრცეში' },
      { id: 3, type: 'products', title: 'ჩვენი პროდუქტები', statement: 'სამი ძირითადი პროდუქტი', items: [{ name: 'ვებსაიტი', desc: 'თანამედროვე ვებსაიტები — ვიზიტორები გადაიქცევიან კლიენტებად. ფასი: 1,000₾-დან' }, { name: 'AI ექსპერტი', desc: 'კომპანიის "საკუთარი ChatGPT" — გაწვრთნილი მხოლოდ თქვენს მონაცემებზე. ჩაშენება: 3,000₾-დან + 600₾/თვე' }, { name: 'AI ჩატბოტი', desc: 'Customer Support 24/7 — 94% resolution rate, <2წმ პასუხის დრო' }] },
      { id: 4, type: 'economics', title: 'როგორ ვშოულობთ', statement: 'მარტივი, განმეორებადი შემოსავალი მაღალი მარჟით', metrics: [{ metric: 'ყოველთვიური გადასახადი', value: '$300' }, { metric: 'ინფრასტრუქტურის ხარჯი', value: '~$30', note: 'ფიქს. + 5% API' }, { metric: 'გაყიდვების საკომისიო (25%)', value: '$75' }, { metric: 'მოგება კლიენტზე', value: '$195', highlight: true, note: '65% მარჟა' }, { metric: 'პირველი წლის მთლიანი მარჟა', value: '68.4%' }, { metric: 'კლიენტის საშუალო ვადა', value: '15 თვე' }, { metric: 'შემოსავალი კლიენტის ვადაზე', value: '$4,500' }], insight: 'ყოველი ახალი კლიენტი = ~$195/თვეში მოგება.' },
      { id: 5, type: 'projection', title: 'პირველი წლის ფინანსური მოდელი', statement: 'ვალიდურებული პროექციები', footer: '3-წლიანი გეგმის პირველი წელი.', highlights: [{ label: 'მე-2 თვე', value: 'EBITDA დადებითი' }, { label: 'მე-12 თვე', value: '$75K/თვე' }, { label: 'წელი 1', value: '$444K' }, { label: 'წმინდა მოგება', value: '$196K' }, { label: 'EBITDA', value: '$231K' }, { label: 'კლიენტები', value: '264' }], details: [{ label: 'თ1', revenue: '$5.6K', clients: '27', ebitda: '-$3.2K' }, { label: 'თ3', revenue: '$15.2K', clients: '58', ebitda: '$5.5K' }, { label: 'თ6', revenue: '$31.4K', clients: '115', ebitda: '$14.3K' }, { label: 'თ9', revenue: '$52.1K', clients: '186', ebitda: '$29.8K' }, { label: 'თ12', revenue: '$75.2K', clients: '264', ebitda: '$44.5K' }] },
      { id: 6, type: 'sales_strategy', title: 'როგორ ვყიდით', statement: 'პრობლემაზე ორიენტირებული მიდგომა', strategies: [{ name: 'აჩვენე პრობლემა', desc: '70%+ კომპანიას ვებსაიტი არ ეხმარება გაყიდვებში' }, { name: 'ცოდნის დაკარგვა', desc: 'კომპანიის know-how გაფანტულია — თანამშრომელი წავა, ცოდნა იკარგება' }, { name: 'მომხმარებლის დაკარგვა', desc: 'სწრაფი პასუხი ვერ მიიღო? → კონკურენტთან წავიდა' }, { name: 'AI ექსპერტის დემო', desc: 'აჩვენე როგორ პასუხობს კომპანიის კითხვებს მყისიერად' }, { name: 'ჩატბოტის დემო', desc: '94% resolution, <2 წამი — ცოცხალი დემო' }, { name: 'რისკის გარეშე', desc: '7 დღეში არ მუშაობს? სრული თანხა უკან' }], framework: 'პრობლემა → დემო → ROI → ცდა → დახურვა' },
      { id: 7, type: 'operations', title: 'როგორ მუშაობს', statement: 'ტრადიციული სტრუქტურა ტექნოლოგიური ბერკეტით', flow: [{ step: 'გაყიდვების გუნდი', detail: 'საკომისიო აგენტები (25%)' }, { step: 'ტექნიკური გუნდი', detail: 'აშენებს AI (1 კვირა)' }, { step: 'AI პლატფორმა', detail: 'ავტომატურად, 24/7' }, { step: 'მხარდაჭერა', detail: 'ყოველთვიური მოვლა' }], keyPoint: 'ავტოპილოტზე მუშაობს. ხარჯი ~$30/თვეში კლიენტზე.' },
      { id: 8, type: 'team', title: 'გუნდის ზრდა', statement: 'მსუბუქი გუნდი', headcount: [{ period: 'თ1–თ3', sales: '6', tech: '2', detail: 'სტარტაპ ფაზა' }, { period: 'თ4–თ6', sales: '8–10', tech: '2–3', detail: 'ზრდის ფაზა' }, { period: 'თ7–თ9', sales: '10–12', tech: '3', detail: 'მასშტაბის ფაზა' }, { period: 'თ10–თ12', sales: '13–15', tech: '4', detail: 'გაფართოება' }], costs: [{ item: 'ტექ. ხელფასები', value: '$51K/წელი', note: '$1,500/ადამიანი/თვე' }, { item: 'ოფისი', value: '$18K/წელი', note: '$1,500/თვე' }, { item: 'აღჭურვილობა', value: '$4K/წელი' }, { item: 'სულ OpEx', value: '$73K/წელი' }] },
      { id: 9, type: 'investment', title: 'ინვესტიცია', statement: '$1.24M სულ, 40% წილი — 3 ეტაპად', stages: [{ label: 'ეტაპი 1', amount: '$40K', equity: '10%', funds: 'ოფისი, გაყიდვები, ტექ. გუნდი' }, { label: 'ეტაპი 2', amount: '$200K', equity: '15%', funds: 'სერვერები + აგენტები' }, { label: 'ეტაპი 3', amount: '$1M', equity: '15%', funds: 'რეგიონული გაფართოება' }], safety: 'აინვესტირებთ $40K. თუ 6 თვეში ვერ დავადასტურებთ — ჩერდებით.' },
      { id: 10, type: 'closing', title: 'ფასები & ეკონომიკა', statement: 'მარტივი, გამჭვირვალე ფასწარმოქმნა', reasons: [{ point: 'ვებსაიტი', detail: '1,000₾-დან' }, { point: 'AI ექსპერტი — ჩაშენება', detail: '3,000₾-დან' }, { point: 'AI ექსპერტი — სერვისი', detail: '600₾/თვე-დან' }, { point: 'AI ჩატბოტი', detail: 'ინდივიდუალური შეფასება' }, { point: '10% საკომისიო', detail: 'გაყიდვების აგენტებისთვის' }, { point: 'რისკის გარეშე', detail: '7-დღიანი გარანტია' }] },
      { id: 11, type: 'chat', title: 'ჰკითხეთ AI-ს', statement: 'ჰკითხეთ რაც გაინტერესებთ', placeholder: 'დაწერეთ შეკითხვა...', suggestions: ['ბრეიქ-ივენ თვე?', '1 ეტაპი?', 'მარჟები?', 'გაყიდვების გუნდი?'] },
    ],
  },
};

type SlideContent = Record<string, any>;

export default function PitchEditPage() {
  const [content, setContent] = useState<any>(defaultContent);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeLang, setActiveLang] = useState<'en' | 'ka'>('ka');

  useEffect(() => {
    fetch('/api/pitch/content')
      .then(r => r.json())
      .then(data => {
        if (data.content && Object.keys(data.content).length > 0) {
          setContent(data.content);
        }
      })
      .catch(() => {});
  }, []);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch('/api/pitch/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (res.ok) setSaved(true);
    } catch {}
    setSaving(false);
    setTimeout(() => setSaved(false), 3000);
  };

  const updateSlideField = (lang: 'en' | 'ka', slideIndex: number, field: string, value: string) => {
    setContent((prev: any) => {
      const newContent = JSON.parse(JSON.stringify(prev));
      newContent[lang].slides[slideIndex][field] = value;
      return newContent;
    });
  };

  const updateNestedField = (lang: 'en' | 'ka', slideIndex: number, path: string[], value: string) => {
    setContent((prev: any) => {
      const newContent = JSON.parse(JSON.stringify(prev));
      let obj = newContent[lang].slides[slideIndex];
      for (let i = 0; i < path.length - 1; i++) {
        obj = obj[path[i]];
      }
      obj[path[path.length - 1]] = value;
      return newContent;
    });
  };

  const slides = content[activeLang]?.slides || [];

  return (
    <div className="min-h-[100dvh] bg-[#fafafa] py-6 sm:py-8 px-3 sm:px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8 sticky top-0 bg-[#fafafa] py-4 z-10 border-b border-[#e5e5e7]">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#1d1d1f]">Pitch Editor</h1>
            <p className="text-xs sm:text-sm text-[#86868b]">Edit pitch deck text content</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex bg-[#f5f5f7] rounded-full p-0.5">
              <button onClick={() => setActiveLang('en')} className={`px-3 py-1.5 text-sm font-medium rounded-full transition-all ${activeLang === 'en' ? 'bg-[#1d1d1f] text-white' : 'text-[#6e6e73]'}`}>EN</button>
              <button onClick={() => setActiveLang('ka')} className={`px-3 py-1.5 text-sm font-medium rounded-full transition-all ${activeLang === 'ka' ? 'bg-[#1d1d1f] text-white' : 'text-[#6e6e73]'}`}>KA</button>
            </div>
            <button onClick={save} disabled={saving} className="px-4 py-2 bg-[#1d1d1f] text-white text-sm font-medium rounded-lg hover:bg-[#3a3a3c] disabled:opacity-50 transition-colors">
              {saving ? 'Saving...' : saved ? 'Saved!' : 'Save'}
            </button>
          </div>
        </div>

        {/* Slides */}
        <div className="space-y-6">
          {slides.map((slide: SlideContent, idx: number) => (
            <div key={slide.id} className="bg-white rounded-xl border border-[#e5e5e7] p-5">
              <h2 className="text-sm font-semibold text-[#86868b] uppercase tracking-wider mb-4">
                Slide {slide.id} — {slide.type}
              </h2>

              {/* Common fields */}
              {slide.title && <Field label="Title" value={slide.title} onChange={(v) => updateSlideField(activeLang, idx, 'title', v)} />}
              {slide.subtitle && <Field label="Subtitle" value={slide.subtitle} onChange={(v) => updateSlideField(activeLang, idx, 'subtitle', v)} />}
              {slide.tagline && <Field label="Tagline" value={slide.tagline} onChange={(v) => updateSlideField(activeLang, idx, 'tagline', v)} />}
              {slide.location && <Field label="Location" value={slide.location} onChange={(v) => updateSlideField(activeLang, idx, 'location', v)} />}
              {slide.statement && <Field label="Statement" value={slide.statement} onChange={(v) => updateSlideField(activeLang, idx, 'statement', v)} />}
              {slide.analogy && <Field label="Analogy" value={slide.analogy} onChange={(v) => updateSlideField(activeLang, idx, 'analogy', v)} />}
              {slide.insight && <Field label="Insight" value={slide.insight} onChange={(v) => updateSlideField(activeLang, idx, 'insight', v)} />}
              {slide.keyPoint && <Field label="Key Point" value={slide.keyPoint} onChange={(v) => updateSlideField(activeLang, idx, 'keyPoint', v)} />}
              {slide.safety && <Field label="Safety" value={slide.safety} onChange={(v) => updateSlideField(activeLang, idx, 'safety', v)} />}
              {slide.footer && <Field label="Footer" value={slide.footer} onChange={(v) => updateSlideField(activeLang, idx, 'footer', v)} />}
              {slide.framework && <Field label="Framework" value={slide.framework} onChange={(v) => updateSlideField(activeLang, idx, 'framework', v)} />}
              {slide.placeholder && <Field label="Placeholder" value={slide.placeholder} onChange={(v) => updateSlideField(activeLang, idx, 'placeholder', v)} />}

              {/* Steps */}
              {slide.steps && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-[#86868b] mb-2">Steps</p>
                  {slide.steps.map((step: any, si: number) => (
                    <div key={si} className="flex flex-col sm:flex-row gap-2 mb-2">
                      <input value={step.name} onChange={(e) => updateNestedField(activeLang, idx, ['steps', String(si), 'name'], e.target.value)} className="sm:w-1/3 px-2 py-1.5 text-sm border border-[#e5e5e7] rounded-lg" />
                      <input value={step.desc} onChange={(e) => updateNestedField(activeLang, idx, ['steps', String(si), 'desc'], e.target.value)} className="flex-1 px-2 py-1.5 text-sm border border-[#e5e5e7] rounded-lg" />
                    </div>
                  ))}
                </div>
              )}

              {/* Items */}
              {slide.items && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-[#86868b] mb-2">Items</p>
                  {slide.items.map((item: any, ii: number) => (
                    <div key={ii} className="flex flex-col sm:flex-row gap-2 mb-2">
                      <input value={item.name} onChange={(e) => updateNestedField(activeLang, idx, ['items', String(ii), 'name'], e.target.value)} className="sm:w-1/3 px-2 py-1.5 text-sm border border-[#e5e5e7] rounded-lg" />
                      <input value={item.desc} onChange={(e) => updateNestedField(activeLang, idx, ['items', String(ii), 'desc'], e.target.value)} className="flex-1 px-2 py-1.5 text-sm border border-[#e5e5e7] rounded-lg" />
                    </div>
                  ))}
                </div>
              )}

              {/* Metrics */}
              {slide.metrics && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-[#86868b] mb-2">Metrics</p>
                  {slide.metrics.map((m: any, mi: number) => (
                    <div key={mi} className="flex gap-2 mb-2">
                      <input value={m.metric} onChange={(e) => updateNestedField(activeLang, idx, ['metrics', String(mi), 'metric'], e.target.value)} className="flex-1 px-2 py-1.5 text-sm border border-[#e5e5e7] rounded-lg" />
                      <input value={m.value} onChange={(e) => updateNestedField(activeLang, idx, ['metrics', String(mi), 'value'], e.target.value)} className="w-24 px-2 py-1.5 text-sm border border-[#e5e5e7] rounded-lg" />
                      <input value={m.note || ''} onChange={(e) => updateNestedField(activeLang, idx, ['metrics', String(mi), 'note'], e.target.value)} className="w-32 px-2 py-1.5 text-sm border border-[#e5e5e7] rounded-lg" placeholder="Note" />
                    </div>
                  ))}
                </div>
              )}

              {/* Highlights */}
              {slide.highlights && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-[#86868b] mb-2">Highlights</p>
                  {slide.highlights.map((h: any, hi: number) => (
                    <div key={hi} className="flex gap-2 mb-2">
                      <input value={h.label} onChange={(e) => updateNestedField(activeLang, idx, ['highlights', String(hi), 'label'], e.target.value)} className="w-1/3 px-2 py-1.5 text-sm border border-[#e5e5e7] rounded-lg" placeholder="Label" />
                      <input value={h.value} onChange={(e) => updateNestedField(activeLang, idx, ['highlights', String(hi), 'value'], e.target.value)} className="flex-1 px-2 py-1.5 text-sm border border-[#e5e5e7] rounded-lg" placeholder="Value" />
                    </div>
                  ))}
                </div>
              )}

              {/* Details (projection table) */}
              {slide.details && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-[#86868b] mb-2">Monthly Details</p>
                  {slide.details.map((d: any, di: number) => (
                    <div key={di} className="flex gap-2 mb-2">
                      <input value={d.label} onChange={(e) => updateNestedField(activeLang, idx, ['details', String(di), 'label'], e.target.value)} className="w-16 px-2 py-1.5 text-sm border border-[#e5e5e7] rounded-lg" placeholder="Month" />
                      <input value={d.revenue} onChange={(e) => updateNestedField(activeLang, idx, ['details', String(di), 'revenue'], e.target.value)} className="flex-1 px-2 py-1.5 text-sm border border-[#e5e5e7] rounded-lg" placeholder="Revenue" />
                      <input value={d.clients} onChange={(e) => updateNestedField(activeLang, idx, ['details', String(di), 'clients'], e.target.value)} className="w-20 px-2 py-1.5 text-sm border border-[#e5e5e7] rounded-lg" placeholder="Clients" />
                      <input value={d.ebitda} onChange={(e) => updateNestedField(activeLang, idx, ['details', String(di), 'ebitda'], e.target.value)} className="flex-1 px-2 py-1.5 text-sm border border-[#e5e5e7] rounded-lg" placeholder="EBITDA" />
                    </div>
                  ))}
                </div>
              )}

              {/* Strategies */}
              {slide.strategies && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-[#86868b] mb-2">Sales Strategies</p>
                  {slide.strategies.map((s: any, si: number) => (
                    <div key={si} className="flex flex-col sm:flex-row gap-2 mb-2">
                      <input value={s.name} onChange={(e) => updateNestedField(activeLang, idx, ['strategies', String(si), 'name'], e.target.value)} className="sm:w-1/3 px-2 py-1.5 text-sm border border-[#e5e5e7] rounded-lg" />
                      <input value={s.desc} onChange={(e) => updateNestedField(activeLang, idx, ['strategies', String(si), 'desc'], e.target.value)} className="flex-1 px-2 py-1.5 text-sm border border-[#e5e5e7] rounded-lg" />
                    </div>
                  ))}
                </div>
              )}

              {/* Flow */}
              {slide.flow && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-[#86868b] mb-2">Flow</p>
                  {slide.flow.map((f: any, fi: number) => (
                    <div key={fi} className="flex flex-col sm:flex-row gap-2 mb-2">
                      <input value={f.step} onChange={(e) => updateNestedField(activeLang, idx, ['flow', String(fi), 'step'], e.target.value)} className="sm:w-1/3 px-2 py-1.5 text-sm border border-[#e5e5e7] rounded-lg" />
                      <input value={f.detail} onChange={(e) => updateNestedField(activeLang, idx, ['flow', String(fi), 'detail'], e.target.value)} className="flex-1 px-2 py-1.5 text-sm border border-[#e5e5e7] rounded-lg" />
                    </div>
                  ))}
                </div>
              )}

              {/* Headcount */}
              {slide.headcount && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-[#86868b] mb-2">Headcount</p>
                  {slide.headcount.map((h: any, hi: number) => (
                    <div key={hi} className="border border-[#e5e5e7] rounded-lg p-3 mb-2">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <input value={h.period} onChange={(e) => updateNestedField(activeLang, idx, ['headcount', String(hi), 'period'], e.target.value)} className="px-2 py-1.5 text-sm border border-[#e5e5e7] rounded-lg" placeholder="Period" />
                        <input value={h.sales} onChange={(e) => updateNestedField(activeLang, idx, ['headcount', String(hi), 'sales'], e.target.value)} className="px-2 py-1.5 text-sm border border-[#e5e5e7] rounded-lg" placeholder="Sales" />
                        <input value={h.tech} onChange={(e) => updateNestedField(activeLang, idx, ['headcount', String(hi), 'tech'], e.target.value)} className="px-2 py-1.5 text-sm border border-[#e5e5e7] rounded-lg" placeholder="Tech" />
                        <input value={h.detail} onChange={(e) => updateNestedField(activeLang, idx, ['headcount', String(hi), 'detail'], e.target.value)} className="px-2 py-1.5 text-sm border border-[#e5e5e7] rounded-lg" placeholder="Detail" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Costs */}
              {slide.costs && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-[#86868b] mb-2">Costs</p>
                  {slide.costs.map((c: any, ci: number) => (
                    <div key={ci} className="flex gap-2 mb-2">
                      <input value={c.item} onChange={(e) => updateNestedField(activeLang, idx, ['costs', String(ci), 'item'], e.target.value)} className="flex-1 px-2 py-1.5 text-sm border border-[#e5e5e7] rounded-lg" placeholder="Item" />
                      <input value={c.value} onChange={(e) => updateNestedField(activeLang, idx, ['costs', String(ci), 'value'], e.target.value)} className="w-28 px-2 py-1.5 text-sm border border-[#e5e5e7] rounded-lg" placeholder="Value" />
                      <input value={c.note || ''} onChange={(e) => updateNestedField(activeLang, idx, ['costs', String(ci), 'note'], e.target.value)} className="w-32 px-2 py-1.5 text-sm border border-[#e5e5e7] rounded-lg" placeholder="Note" />
                    </div>
                  ))}
                </div>
              )}

              {/* Stages */}
              {slide.stages && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-[#86868b] mb-2">Investment Stages</p>
                  {slide.stages.map((s: any, si: number) => (
                    <div key={si} className="border border-[#e5e5e7] rounded-lg p-3 mb-2">
                      <div className="grid grid-cols-2 gap-2">
                        <input value={s.label} onChange={(e) => updateNestedField(activeLang, idx, ['stages', String(si), 'label'], e.target.value)} className="px-2 py-1.5 text-sm border border-[#e5e5e7] rounded-lg" placeholder="Label" />
                        <input value={s.amount} onChange={(e) => updateNestedField(activeLang, idx, ['stages', String(si), 'amount'], e.target.value)} className="px-2 py-1.5 text-sm border border-[#e5e5e7] rounded-lg" placeholder="Amount" />
                        <input value={s.equity} onChange={(e) => updateNestedField(activeLang, idx, ['stages', String(si), 'equity'], e.target.value)} className="px-2 py-1.5 text-sm border border-[#e5e5e7] rounded-lg" placeholder="Equity" />
                        <input value={s.funds} onChange={(e) => updateNestedField(activeLang, idx, ['stages', String(si), 'funds'], e.target.value)} className="px-2 py-1.5 text-sm border border-[#e5e5e7] rounded-lg" placeholder="Funds" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Reasons */}
              {slide.reasons && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-[#86868b] mb-2">Reasons</p>
                  {slide.reasons.map((r: any, ri: number) => (
                    <div key={ri} className="flex flex-col sm:flex-row gap-2 mb-2">
                      <input value={r.point} onChange={(e) => updateNestedField(activeLang, idx, ['reasons', String(ri), 'point'], e.target.value)} className="sm:w-1/3 px-2 py-1.5 text-sm border border-[#e5e5e7] rounded-lg" />
                      <input value={r.detail} onChange={(e) => updateNestedField(activeLang, idx, ['reasons', String(ri), 'detail'], e.target.value)} className="flex-1 px-2 py-1.5 text-sm border border-[#e5e5e7] rounded-lg" />
                    </div>
                  ))}
                </div>
              )}

              {/* Suggestions */}
              {slide.suggestions && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-[#86868b] mb-2">Suggestions</p>
                  {slide.suggestions.map((s: string, si: number) => (
                    <input key={si} value={s} onChange={(e) => updateNestedField(activeLang, idx, ['suggestions', String(si)], e.target.value)} className="w-full px-2 py-1.5 text-sm border border-[#e5e5e7] rounded-lg mb-2" />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom save button */}
        <div className="mt-8 pb-[env(safe-area-inset-bottom)] flex justify-center">
          <button onClick={save} disabled={saving} className="px-6 py-3 bg-[#1d1d1f] text-white font-medium rounded-xl hover:bg-[#3a3a3c] disabled:opacity-50 transition-colors">
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save All Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="mb-3">
      <label className="text-xs font-medium text-[#86868b] block mb-1">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm border border-[#e5e5e7] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1d1d1f]"
      />
    </div>
  );
}
