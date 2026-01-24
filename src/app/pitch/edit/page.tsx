'use client';

import { useState, useEffect } from 'react';

// Default content structure matching the pitch page
const defaultContent = {
  en: {
    slides: [
      { id: 1, type: 'title', title: 'ALLONE', subtitle: 'AI Solutions for Business', tagline: 'We consult, build, and maintain AI systems for companies', location: 'Tbilisi, Georgia' },
      { id: 2, type: 'service', title: 'What We Do', statement: 'We are a technology service company', steps: [{ number: '01', name: 'Consultation', desc: 'We analyze what the client needs automated' }, { number: '02', name: 'Planning', desc: 'We design the AI solution — voice agent, chatbot, or workflow' }, { number: '03', name: 'Execution', desc: 'We build and deploy the solution within one week' }, { number: '04', name: 'Support & Debugging', desc: 'We maintain, update, and fix — ongoing monthly' }], analogy: 'Like hiring a consulting firm + IT department — for $300/month' },
      { id: 3, type: 'products', title: 'What We Build', statement: 'AI tools that replace manual work', items: [{ name: 'Voice Agents', desc: 'AI answers phones, books appointments, takes orders — 24/7' }, { name: 'Smart Chatbots', desc: 'AI trained on business documents, answers customer questions instantly' }, { name: 'Workflow Automations', desc: 'AI handles emails, data entry, follow-ups automatically' }, { name: 'Custom AI Solutions', desc: 'Tailored systems for specific business needs ($2K–$10K per project)' }] },
      { id: 4, type: 'economics', title: 'How We Make Money', statement: 'Simple, recurring revenue with high margins', metrics: [{ metric: 'Monthly fee per client', value: '$300' }, { metric: 'Our cost per client', value: '$90' }, { metric: 'Profit per client', value: '$210', highlight: true, note: '70% margin' }, { metric: 'Average client stays', value: '15 months' }, { metric: 'Revenue per client lifetime', value: '$4,500' }], sales: { title: 'Commission-based sales team', points: ['6 salespeople now — no fixed salary, commission only', 'Each brings ~3 clients/month (after ramp-up)', 'Commission: 25% of first 3 months ($225 per deal)', 'Sales cycle: 1 week'] }, insight: 'Every new client = $210/month profit with near-zero acquisition risk' },
      { id: 5, type: 'projection', title: 'Year 1 Revenue', statement: 'Dynamic growth model: salespeople × 3 deals/month − churn', footer: 'This is Year 1 of a 3-year growth plan', costs: 'Includes: office ($1,500/mo all year), tech team (2→4), infrastructure ($90/client), commissions' },
      { id: 6, type: 'operations', title: 'How It Works', statement: 'Traditional business structure with technology leverage', flow: [{ step: 'Sales Team', detail: 'Commission-only agents sign new clients' }, { step: 'Technical Team', detail: 'Consults with client & builds AI solution (1 week)' }, { step: 'AI Platform', detail: 'Runs the solution automatically, 24/7' }, { step: 'Support', detail: 'Monthly maintenance & improvements' }], keyPoint: 'After initial setup, each client runs on autopilot. Our cost stays at $90/month regardless of client activity.', parallel: 'Like a telecom company — infrastructure cost is fixed, each new subscriber adds pure margin' },
      { id: 7, type: 'investment', title: 'The Investment', statement: '$1.24M total for 40% equity — deployed in 3 stages', stages: [{ label: 'Stage 1 — Now', amount: '$40K', equity: '10%', funds: 'Office (12mo), sales expansion, tech team (2)', unlock: 'First $6K monthly revenue' }, { label: 'Stage 2 — After Proof', amount: '$200K', equity: '15%', funds: 'Own servers + 15–20 salespeople', unlock: '50+ clients, $30K/month' }, { label: 'Stage 3 — After Scale', amount: '$1M', equity: '15%', funds: 'Regional expansion in Caucasus', unlock: '200+ clients, profitable' }], safety: 'You invest $40K now. If we don\'t prove revenue in 6 months, you stop. Zero further risk.' },
      { id: 8, type: 'closing', title: 'Why This Works', statement: 'Business logic, not startup promises', reasons: [{ point: 'No fixed costs', detail: 'Salespeople earn only when they sell' }, { point: 'High margins', detail: '70% gross, improves to 88% with own servers' }, { point: 'Recurring revenue', detail: 'Clients pay monthly, average 15-month lifetime' }, { point: 'Simple product', detail: 'Businesses understand "AI answers my phone for $300/month"' }, { point: 'Our foundation', detail: 'Product live at allone.ge, 3 paid clients, active sales pipeline' }, { point: 'Break-even Month 3', detail: 'Self-sustaining from month 3 — $40K investment covers early deficit only' }] },
      { id: 9, type: 'chat', title: 'Ask Questions', statement: 'Ask anything about the business model, financials, or investment terms', placeholder: 'Type your question...', suggestions: ['What is the break-even month?', 'How much is Stage 1?', 'What are the margins?'] },
    ],
  },
  ka: {
    slides: [
      { id: 1, type: 'title', title: 'ALLONE', subtitle: 'AI გადაწყვეტილებები ბიზნესისთვის', tagline: 'ჩვენ ვაკეთებთ კონსულტაციას, ვაშენებთ და ვმართავთ AI სისტემებს კომპანიებისთვის', location: 'თბილისი, საქართველო' },
      { id: 2, type: 'service', title: 'რას ვაკეთებთ', statement: 'ჩვენ ტექნოლოგიური სერვისების კომპანია ვართ', steps: [{ number: '01', name: 'კონსულტაცია', desc: 'ვაანალიზებთ, რა სჭირდება კლიენტს ავტომატიზაციისთვის' }, { number: '02', name: 'დაგეგმვა', desc: 'ვპროექტებთ AI გადაწყვეტილებას — ხმოვანი აგენტი, ჩატბოტი ან ავტომატიზაცია' }, { number: '03', name: 'შესრულება', desc: 'ვაშენებთ და ვნერგავთ გადაწყვეტილებას ერთ კვირაში' }, { number: '04', name: 'მხარდაჭერა', desc: 'ვმართავთ, ვაახლებთ და ვასწორებთ — ყოველთვიურად' }], analogy: 'როგორც საკონსულტაციო ფირმა + IT დეპარტამენტი — თვეში $300-ად' },
      { id: 3, type: 'products', title: 'რას ვაშენებთ', statement: 'AI ინსტრუმენტები, რომლებიც ხელით მუშაობას ცვლიან', items: [{ name: 'ხმოვანი აგენტები', desc: 'AI პასუხობს ტელეფონზე, ჯავშნის შეხვედრებს, იღებს შეკვეთებს — 24/7' }, { name: 'ჭკვიანი ჩატბოტები', desc: 'AI, გაწვრთნილი ბიზნეს-დოკუმენტებზე, მომენტალურად პასუხობს კლიენტებს' }, { name: 'ავტომატიზაციები', desc: 'AI ამუშავებს ელ-ფოსტას, მონაცემთა შეყვანას, შეხსენებებს ავტომატურად' }, { name: 'ინდივიდუალური AI', desc: 'კონკრეტულ ბიზნეს-საჭიროებებზე მორგებული სისტემები ($2K–$10K პროექტზე)' }] },
      { id: 4, type: 'economics', title: 'როგორ ვშოულობთ', statement: 'მარტივი, განმეორებადი შემოსავალი მაღალი მარჟით', metrics: [{ metric: 'ყოველთვიური გადასახადი', value: '$300' }, { metric: 'ჩვენი ხარჯი კლიენტზე', value: '$90' }, { metric: 'მოგება კლიენტზე', value: '$210', highlight: true, note: '70% მარჟა' }, { metric: 'კლიენტის საშუალო ვადა', value: '15 თვე' }, { metric: 'შემოსავალი კლიენტის ვადაზე', value: '$4,500' }], sales: { title: 'საკომისიო გაყიდვების გუნდი', points: ['6 გაყიდვების აგენტი ახლა — ფიქსირებული ხელფასის გარეშე', 'თითოეულს მოჰყავს ~3 კლიენტი/თვეში (ადაპტაციის შემდეგ)', 'საკომისიო: პირველი 3 თვის 25% ($225 თითო გარიგებაზე)', 'გაყიდვის ციკლი: 1 კვირა'] }, insight: 'ყოველი ახალი კლიენტი = $210/თვეში მოგება, თითქმის ნულოვანი რისკით' },
      { id: 5, type: 'projection', title: 'პირველი წლის შემოსავალი', statement: 'დინამიკური მოდელი: გაყიდვების აგენტი × 3 გარიგება/თვე', footer: 'ეს არის 3-წლიანი გეგმის პირველი წელი', costs: 'მოიცავს: ოფისი ($1,500/თვე მთელი წელი), ტექ. გუნდი (2→4), ინფრასტრუქტურა ($90/კლიენტი), კომისიები' },
      { id: 6, type: 'operations', title: 'როგორ მუშაობს', statement: 'ტრადიციული ბიზნეს-სტრუქტურა ტექნოლოგიური ბერკეტით', flow: [{ step: 'გაყიდვების გუნდი', detail: 'საკომისიო აგენტები მოიყვანენ ახალ კლიენტებს' }, { step: 'ტექნიკური გუნდი', detail: 'ატარებს კონსულტაციას და აშენებს AI კონსტრუქციას (1 კვირა)' }, { step: 'AI პლატფორმა', detail: 'ამუშავებს გადაწყვეტილებას ავტომატურად, 24/7' }, { step: 'მხარდაჭერა', detail: 'ყოველთვიური მოვლა და გაუმჯობესება' }], keyPoint: 'პროდუქტის დანერგვის შემდეგ, თითოეული კლიენტი მუშაობს ავტოპილოტზე. ჩვენი ხარჯი რჩება $90/თვეში.', parallel: 'როგორც სატელეკომო კომპანია — ინფრასტრუქტურის ხარჯი ფიქსირებულია, ყოველი ახალი აბონენტი ამატებს წმინდა მარჟას' },
      { id: 7, type: 'investment', title: 'ინვესტიცია', statement: '$1.24M სულ, 40% წილის სანაცვლოდ — 3 ეტაპად', stages: [{ label: 'ეტაპი 1 — ახლა', amount: '$40K', equity: '10%', funds: 'ოფისი (12თვე), გაყიდვების გაფართოება, ტექ. გუნდი (2)', unlock: 'პირველი $6K ყოველთვიური შემოსავალი' }, { label: 'ეტაპი 2 — დადასტურების შემდეგ', amount: '$200K', equity: '15%', funds: 'საკუთარი სერვერები + 15–20 გაყიდვების აგენტი', unlock: '50+ კლიენტი, $30K/თვეში' }, { label: 'ეტაპი 3 — მასშტაბირების შემდეგ', amount: '$1M', equity: '15%', funds: 'რეგიონული გაფართოება კავკასიაში', unlock: '200+ კლიენტი, მომგებიანი' }], safety: 'თქვენ აინვესტირებთ $40K ახლა. თუ 6 თვეში შემოსავალს ვერ დავადასტურებთ, თქვენ ჩერდებით. ნულოვანი რისკი.' },
      { id: 8, type: 'closing', title: 'რატომ მუშაობს', statement: 'ჩვენ გთავაზობთ ბიზნეს ლოგიკას და არა "სტარტაპ" დაპირებას', reasons: [{ point: 'ფიქსირებული ხარჯების გარეშე', detail: 'გაყიდვის აგენტებს შემოსავალი აქვთ მხოლოდ როცა ყიდიან' }, { point: 'მაღალი მარჟა', detail: '70% საწყისი, იზრდება 88%-მდე საკუთარი სერვერებით' }, { point: 'განმეორებადი შემოსავალი', detail: 'კლიენტები იხდიან ყოველთვიურად, საშუალოდ 15 თვე' }, { point: 'მარტივი პროდუქტი', detail: 'ბიზნესებისთვის გასაგებია: "AI პასუხობს ტელეფონზე $300/თვეში"' }, { point: 'ჩვენი საფუძველი', detail: 'პროდუქტი უკვე მუშაობს allone.ge-ზე, გვყავს 3 კლიენტი, აქტიური გაყიდვები' }, { point: 'ბრეიქ-ივენ მე-3 თვე', detail: 'თვითკმარი მე-3 თვიდან — $40K ინვესტიცია მხოლოდ საწყის დეფიციტს ფარავს' }] },
      { id: 9, type: 'chat', title: 'ჰკითხეთ AI-ს', statement: 'ჰკითხეთ რაც გაინტერესებთ ბიზნეს-მოდელის, ფინანსების ან ინვესტიციის პირობების შესახებ', placeholder: 'დაწერეთ თქვენი შეკითხვა...', suggestions: ['რა არის ბრეიქ-ივენ თვე?', 'რამდენია 1 ეტაპის ინვესტიცია?', 'რა მარჟებია?'] },
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
              {slide.title && (
                <Field label="Title" value={slide.title} onChange={(v) => updateSlideField(activeLang, idx, 'title', v)} />
              )}
              {slide.subtitle && (
                <Field label="Subtitle" value={slide.subtitle} onChange={(v) => updateSlideField(activeLang, idx, 'subtitle', v)} />
              )}
              {slide.tagline && (
                <Field label="Tagline" value={slide.tagline} onChange={(v) => updateSlideField(activeLang, idx, 'tagline', v)} />
              )}
              {slide.location && (
                <Field label="Location" value={slide.location} onChange={(v) => updateSlideField(activeLang, idx, 'location', v)} />
              )}
              {slide.statement && (
                <Field label="Statement" value={slide.statement} onChange={(v) => updateSlideField(activeLang, idx, 'statement', v)} />
              )}
              {slide.analogy && (
                <Field label="Analogy" value={slide.analogy} onChange={(v) => updateSlideField(activeLang, idx, 'analogy', v)} />
              )}
              {slide.insight && (
                <Field label="Insight" value={slide.insight} onChange={(v) => updateSlideField(activeLang, idx, 'insight', v)} />
              )}
              {slide.keyPoint && (
                <Field label="Key Point" value={slide.keyPoint} onChange={(v) => updateSlideField(activeLang, idx, 'keyPoint', v)} />
              )}
              {slide.parallel && (
                <Field label="Parallel" value={slide.parallel} onChange={(v) => updateSlideField(activeLang, idx, 'parallel', v)} />
              )}
              {slide.safety && (
                <Field label="Safety" value={slide.safety} onChange={(v) => updateSlideField(activeLang, idx, 'safety', v)} />
              )}
              {slide.footer && (
                <Field label="Footer" value={slide.footer} onChange={(v) => updateSlideField(activeLang, idx, 'footer', v)} />
              )}
              {slide.costs && (
                <Field label="Costs" value={slide.costs} onChange={(v) => updateSlideField(activeLang, idx, 'costs', v)} />
              )}
              {slide.placeholder && (
                <Field label="Placeholder" value={slide.placeholder} onChange={(v) => updateSlideField(activeLang, idx, 'placeholder', v)} />
              )}

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
                    </div>
                  ))}
                </div>
              )}

              {/* Sales points */}
              {slide.sales && (
                <div className="mt-3">
                  <Field label="Sales Title" value={slide.sales.title} onChange={(v) => updateNestedField(activeLang, idx, ['sales', 'title'], v)} />
                  <p className="text-xs font-medium text-[#86868b] mb-2">Sales Points</p>
                  {slide.sales.points.map((p: string, pi: number) => (
                    <input key={pi} value={p} onChange={(e) => updateNestedField(activeLang, idx, ['sales', 'points', String(pi)], e.target.value)} className="w-full px-2 py-1.5 text-sm border border-[#e5e5e7] rounded-lg mb-2" />
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

              {/* Stages */}
              {slide.stages && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-[#86868b] mb-2">Investment Stages</p>
                  {slide.stages.map((s: any, si: number) => (
                    <div key={si} className="border border-[#e5e5e7] rounded-lg p-3 mb-2">
                      <div className="grid grid-cols-2 gap-2">
                        <input value={s.label} onChange={(e) => updateNestedField(activeLang, idx, ['stages', String(si), 'label'], e.target.value)} className="px-2 py-1.5 text-sm border border-[#e5e5e7] rounded-lg" placeholder="Label" />
                        <input value={s.amount} onChange={(e) => updateNestedField(activeLang, idx, ['stages', String(si), 'amount'], e.target.value)} className="px-2 py-1.5 text-sm border border-[#e5e5e7] rounded-lg" placeholder="Amount" />
                        <input value={s.funds} onChange={(e) => updateNestedField(activeLang, idx, ['stages', String(si), 'funds'], e.target.value)} className="col-span-2 px-2 py-1.5 text-sm border border-[#e5e5e7] rounded-lg" placeholder="Funds" />
                        <input value={s.unlock} onChange={(e) => updateNestedField(activeLang, idx, ['stages', String(si), 'unlock'], e.target.value)} className="col-span-2 px-2 py-1.5 text-sm border border-[#e5e5e7] rounded-lg" placeholder="Unlock milestone" />
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
