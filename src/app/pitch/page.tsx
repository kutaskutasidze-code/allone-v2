'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Circle, Send, Download, Loader2, Globe } from 'lucide-react';
import Link from 'next/link';

type Lang = 'en' | 'ka';

const content = {
  en: {
    slides: [
      { id: 1, type: 'title', title: 'ALLONE', subtitle: 'AI Solutions for Business', tagline: 'We consult, build, and maintain AI systems for companies', location: 'Tbilisi, Georgia' },
      { id: 2, type: 'service', title: 'What We Do', statement: 'We are a technology service company', steps: [{ number: '01', name: 'Consultation', desc: 'We analyze what the client needs automated' }, { number: '02', name: 'Planning', desc: 'We design the AI solution — voice agent, chatbot, or workflow' }, { number: '03', name: 'Execution', desc: 'We build and deploy the solution within one week' }, { number: '04', name: 'Support & Debugging', desc: 'We maintain, update, and fix — ongoing monthly' }], analogy: 'Like hiring a consulting firm + IT department — for $300/month' },
      { id: 3, type: 'products', title: 'What We Build', statement: 'AI tools that replace manual work', items: [{ name: 'Voice Agents', desc: 'AI answers phones, books appointments, takes orders — 24/7' }, { name: 'Smart Chatbots', desc: 'AI trained on business documents, answers customer questions instantly' }, { name: 'Workflow Automations', desc: 'AI handles emails, data entry, follow-ups automatically' }, { name: 'Custom AI Solutions', desc: 'Tailored systems for specific business needs ($2K–$10K per project)' }] },
      { id: 4, type: 'economics', title: 'How We Make Money', statement: 'Simple, recurring revenue with high margins', metrics: [{ metric: 'Monthly fee per client', value: '$300' }, { metric: 'Infrastructure cost', value: '~$30', note: 'Fixed + 5% API' }, { metric: 'Sales commission (25%)', value: '$75' }, { metric: 'Gross profit per client', value: '$195', highlight: true, note: '65% margin' }, { metric: 'Year 1 gross margin', value: '68.4%', note: 'Improves with scale' }, { metric: 'Average client stays', value: '15 months' }, { metric: 'Revenue per client lifetime', value: '$4,500' }], insight: 'Every new client = ~$195/month profit. Year 1 ends at 68.4% gross margin, 51.9% EBITDA margin.' },
      { id: 5, type: 'projection', title: 'Year 1 Financial Model', statement: 'Validated monthly projections from our financial model', footer: 'Year 1 of a 3-year growth plan. Full Excel model available for download.', highlights: [{ label: 'Month 2', value: 'EBITDA positive' }, { label: 'Month 12', value: '$75K/mo revenue' }, { label: 'Year 1 Revenue', value: '$444K' }, { label: 'Year 1 Net Income', value: '$196K' }, { label: 'Year 1 EBITDA', value: '$231K' }, { label: 'End Clients', value: '264' }], details: [{ label: 'M1', revenue: '$5.6K', clients: '27', ebitda: '-$3.2K' }, { label: 'M3', revenue: '$15.2K', clients: '58', ebitda: '$5.5K' }, { label: 'M6', revenue: '$31.4K', clients: '115', ebitda: '$14.3K' }, { label: 'M9', revenue: '$52.1K', clients: '186', ebitda: '$29.8K' }, { label: 'M12', revenue: '$75.2K', clients: '264', ebitda: '$44.5K' }] },
      { id: 6, type: 'sales_strategy', title: 'How We Sell', statement: 'Simple, proven strategies for AI product sales', strategies: [{ name: 'Show Don\'t Tell', desc: 'Live demos with their actual use case — restaurant taking orders, salon booking appointments. Non-technical owners need to see it working.' }, { name: 'Time-Savings ROI', desc: '$300/month = $2.30/hour to save 130+ hours monthly. Small business owners think in hours, not features.' }, { name: 'Before/After Proof', desc: '"Before: Lost 20 leads/week from after-hours. After: Captured 90% of inquiries 24/7, gaining 18 new customers/month."' }, { name: 'Competitor Pressure', desc: '63% of business leaders worry they\'ll be left behind without AI. Your competitors already use chatbots — your customers expect instant replies.' }, { name: 'Instant Payback', desc: 'If AI captures just 2 extra customers/month at $150 avg sale, it pays for itself. Everything after is pure profit.' }, { name: 'Risk-Free Start', desc: 'We build your AI agent this week. If it doesn\'t capture 10+ inquiries in 7 days, first month refunded.' }], framework: 'Demo → Show savings → Prove with competitors → Risk-free trial → Close with ROI math' },
      { id: 7, type: 'operations', title: 'How It Works', statement: 'Traditional business structure with technology leverage', flow: [{ step: 'Sales Team', detail: 'Commission-only agents sign new clients (25% commission)' }, { step: 'Technical Team', detail: 'Consults with client & builds AI solution (1 week)' }, { step: 'AI Platform', detail: 'Runs the solution automatically, 24/7' }, { step: 'Support', detail: 'Monthly maintenance & improvements' }], keyPoint: 'After initial setup, each client runs on autopilot. Infrastructure cost stays ~$30/month per client regardless of usage.' },
      { id: 8, type: 'team', title: 'Team Growth', statement: 'Lean team that scales with revenue', headcount: [{ period: 'M1–M3', sales: '6', tech: '2', detail: 'Startup phase — prove the model' }, { period: 'M4–M6', sales: '8–10', tech: '2–3', detail: 'Growth phase — add 1 tech hire' }, { period: 'M7–M9', sales: '10–12', tech: '3', detail: 'Scale phase — more sales capacity' }, { period: 'M10–M12', sales: '13–15', tech: '4', detail: 'Expansion — 4th tech hire' }], costs: [{ item: 'Tech salaries', value: '$51K/year', note: '$1,500/person/month' }, { item: 'Office & Admin', value: '$18K/year', note: '$1,500/month fixed' }, { item: 'Equipment', value: '$4K/year', note: '$1K per new hire' }, { item: 'Total OpEx', value: '$73K/year' }] },
      { id: 9, type: 'investment', title: 'The Investment', statement: '$1.24M total for 40% equity — deployed in 3 stages', stages: [{ label: 'Stage 1 — Now', amount: '$40K', equity: '10%', funds: 'Office, sales expansion, tech team' }, { label: 'Stage 2 — After Proof', amount: '$200K', equity: '15%', funds: 'Own servers + 15–20 salespeople' }, { label: 'Stage 3 — After Scale', amount: '$1M', equity: '15%', funds: 'Regional expansion in Caucasus' }], safety: 'You invest $40K now. If we don\'t prove revenue in 6 months, you stop.' },
      { id: 10, type: 'closing', title: 'Why This Works', statement: 'Business logic, not startup promises', reasons: [{ point: 'No fixed sales costs', detail: 'Salespeople earn only when they sell (25% commission)' }, { point: 'High margins', detail: '68.4% gross, 51.9% EBITDA — improves to 88% with own servers' }, { point: 'Recurring revenue', detail: 'Clients pay monthly, average 15-month lifetime' }, { point: 'EBITDA positive Month 2', detail: 'Self-sustaining from month 2. Year 1 net income: $196K' }, { point: '$196K cash by Year 1', detail: 'From $40K initial investment to $196K cash position in 12 months' }, { point: 'Simple product', detail: '"AI answers my phone for $300/month" — any business owner gets it' }] },
      { id: 11, type: 'chat', title: 'Ask Questions', statement: 'Ask anything about the business model, financials, or investment terms', placeholder: 'Type your question...', suggestions: ['What is the break-even month?', 'How much is Stage 1?', 'What are the margins?', 'How does the sales team work?'] },
    ],
  },
  ka: {
    slides: [
      { id: 1, type: 'title', title: 'ALLONE', subtitle: 'AI გადაწყვეტილებები ბიზნესისთვის', tagline: 'ჩვენ ვაკეთებთ კონსულტაციას, ვაშენებთ და ვმართავთ AI სისტემებს კომპანიებისთვის', location: 'თბილისი, საქართველო' },
      { id: 2, type: 'service', title: 'რას ვაკეთებთ', statement: 'ჩვენ ტექნოლოგიური სერვისების კომპანია ვართ', steps: [{ number: '01', name: 'კონსულტაცია', desc: 'ვაანალიზებთ, რა სჭირდება კლიენტს ავტომატიზაციისთვის' }, { number: '02', name: 'დაგეგმვა', desc: 'ვპროექტებთ AI გადაწყვეტილებას — ხმოვანი აგენტი, ჩატბოტი ან ავტომატიზაცია' }, { number: '03', name: 'შესრულება', desc: 'ვაშენებთ და ვნერგავთ გადაწყვეტილებას ერთ კვირაში' }, { number: '04', name: 'მხარდაჭერა', desc: 'ვმართავთ, ვაახლებთ და ვასწორებთ — ყოველთვიურად' }], analogy: 'როგორც საკონსულტაციო ფირმა + IT დეპარტამენტი — თვეში $300-ად' },
      { id: 3, type: 'products', title: 'რას ვაშენებთ', statement: 'AI ინსტრუმენტები, რომლებიც ხელით მუშაობას ცვლიან', items: [{ name: 'ხმოვანი აგენტები', desc: 'AI პასუხობს ტელეფონზე, ჯავშნის შეხვედრებს, იღებს შეკვეთებს — 24/7' }, { name: 'ჭკვიანი ჩატბოტები', desc: 'AI, გაწვრთნილი ბიზნეს-დოკუმენტებზე, მომენტალურად პასუხობს კლიენტებს' }, { name: 'ავტომატიზაციები', desc: 'AI ამუშავებს ელ-ფოსტას, მონაცემთა შეყვანას, შეხსენებებს ავტომატურად' }, { name: 'ინდივიდუალური AI', desc: 'კონკრეტულ ბიზნეს-საჭიროებებზე მორგებული სისტემები ($2K–$10K პროექტზე)' }] },
      { id: 4, type: 'economics', title: 'როგორ ვშოულობთ', statement: 'მარტივი, განმეორებადი შემოსავალი მაღალი მარჟით', metrics: [{ metric: 'ყოველთვიური გადასახადი', value: '$300' }, { metric: 'ინფრასტრუქტურის ხარჯი', value: '~$30', note: 'ფიქს. + 5% API' }, { metric: 'გაყიდვების საკომისიო (25%)', value: '$75' }, { metric: 'მოგება კლიენტზე', value: '$195', highlight: true, note: '65% მარჟა' }, { metric: 'პირველი წლის მთლიანი მარჟა', value: '68.4%', note: 'იზრდება მასშტაბით' }, { metric: 'კლიენტის საშუალო ვადა', value: '15 თვე' }, { metric: 'შემოსავალი კლიენტის ვადაზე', value: '$4,500' }], insight: 'ყოველი ახალი კლიენტი = ~$195/თვეში მოგება. პირველი წელი 68.4% მთლიანი მარჟა, 51.9% EBITDA მარჟა.' },
      { id: 5, type: 'projection', title: 'პირველი წლის ფინანსური მოდელი', statement: 'ვალიდურებული ყოველთვიური პროექციები ფინანსური მოდელიდან', footer: '3-წლიანი გეგმის პირველი წელი. სრული Excel მოდელი ხელმისაწვდომია ჩამოსატვირთად.', highlights: [{ label: 'მე-2 თვე', value: 'EBITDA დადებითი' }, { label: 'მე-12 თვე', value: '$75K/თვე შემოსავალი' }, { label: 'წელი 1 შემოსავალი', value: '$444K' }, { label: 'წელი 1 წმინდა მოგება', value: '$196K' }, { label: 'წელი 1 EBITDA', value: '$231K' }, { label: 'საბოლოო კლიენტები', value: '264' }], details: [{ label: 'თ1', revenue: '$5.6K', clients: '27', ebitda: '-$3.2K' }, { label: 'თ3', revenue: '$15.2K', clients: '58', ebitda: '$5.5K' }, { label: 'თ6', revenue: '$31.4K', clients: '115', ebitda: '$14.3K' }, { label: 'თ9', revenue: '$52.1K', clients: '186', ebitda: '$29.8K' }, { label: 'თ12', revenue: '$75.2K', clients: '264', ebitda: '$44.5K' }] },
      { id: 6, type: 'sales_strategy', title: 'როგორ ვყიდით', statement: 'მარტივი, დადასტურებული სტრატეგიები AI პროდუქტების გასაყიდად', strategies: [{ name: 'აჩვენე, ნუ ხსნი', desc: 'ცოცხალი დემო კონკრეტული სცენარით — რესტორანი იღებს შეკვეთებს, სალონი ჯავშნის შეხვედრებს. არატექნიკურ მფლობელებს სჭირდებათ რომ ნახონ მოქმედებაში.' }, { name: 'დროის დაზოგვის ROI', desc: '$300/თვეში = $2.30/საათში 130+ საათის დაზოგვისთვის. მცირე ბიზნესის მფლობელები საათებით ფიქრობენ, არა ფუნქციებით.' }, { name: 'წინა/შემდეგ მტკიცებულება', desc: '"წინ: 20 ლიდი/კვირაში იკარგებოდა სამუშაო საათების შემდეგ. შემდეგ: 90% შეკითხვა დაფიქსირდა 24/7."' }, { name: 'კონკურენტის ზეწოლა', desc: '63% ბიზნეს ლიდერი შეშფოთებულია, რომ AI-ს გარეშე ჩამორჩება. თქვენი კონკურენტები უკვე იყენებენ ჩატბოტებს.' }, { name: 'მყისიერი ანაზღაურება', desc: 'თუ AI-მ თვეში მხოლოდ 2 ახალი კლიენტი მოიყვანა საშუალოდ $150-ით, თვის გადასახადი უკვე ანაზღაურებულია.' }, { name: 'რისკის გარეშე დაწყება', desc: 'ვაშენებთ AI აგენტს ამ კვირაში. თუ 7 დღეში 10+ შეკითხვა არ დაფიქსირდა, პირველი თვე უკან ბრუნდება.' }], framework: 'დემო → დაზოგვის ჩვენება → კონკურენტის მაგალითი → რისკის გარეშე ცდა → ROI-ით დახურვა' },
      { id: 7, type: 'operations', title: 'როგორ მუშაობს', statement: 'ტრადიციული ბიზნეს-სტრუქტურა ტექნოლოგიური ბერკეტით', flow: [{ step: 'გაყიდვების გუნდი', detail: 'საკომისიო აგენტები მოიყვანენ კლიენტებს (25% საკომისიო)' }, { step: 'ტექნიკური გუნდი', detail: 'ატარებს კონსულტაციას და აშენებს AI კონსტრუქციას (1 კვირა)' }, { step: 'AI პლატფორმა', detail: 'ამუშავებს გადაწყვეტილებას ავტომატურად, 24/7' }, { step: 'მხარდაჭერა', detail: 'ყოველთვიური მოვლა და გაუმჯობესება' }], keyPoint: 'დანერგვის შემდეგ, კლიენტი მუშაობს ავტოპილოტზე. ინფრასტრუქტურის ხარჯი ~$30/თვეში კლიენტზე.' },
      { id: 8, type: 'team', title: 'გუნდის ზრდა', statement: 'მსუბუქი გუნდი, რომელიც შემოსავალთან ერთად იზრდება', headcount: [{ period: 'თ1–თ3', sales: '6', tech: '2', detail: 'სტარტაპ ფაზა — მოდელის დამტკიცება' }, { period: 'თ4–თ6', sales: '8–10', tech: '2–3', detail: 'ზრდის ფაზა — 1 ტექ. დამატება' }, { period: 'თ7–თ9', sales: '10–12', tech: '3', detail: 'მასშტაბის ფაზა — მეტი გაყიდვები' }, { period: 'თ10–თ12', sales: '13–15', tech: '4', detail: 'გაფართოება — მე-4 ტექნიკოსი' }], costs: [{ item: 'ტექ. ხელფასები', value: '$51K/წელი', note: '$1,500/ადამიანი/თვე' }, { item: 'ოფისი და ადმინი', value: '$18K/წელი', note: '$1,500/თვე ფიქსირებული' }, { item: 'აღჭურვილობა', value: '$4K/წელი', note: '$1K ახალ თანამშრომელზე' }, { item: 'სულ OpEx', value: '$73K/წელი' }] },
      { id: 9, type: 'investment', title: 'ინვესტიცია', statement: '$1.24M სულ, 40% წილის სანაცვლოდ — 3 ეტაპად', stages: [{ label: 'ეტაპი 1 — ახლა', amount: '$40K', equity: '10%', funds: 'ოფისი, გაყიდვების გაფართოება, ტექ. გუნდი' }, { label: 'ეტაპი 2 — დადასტურების შემდეგ', amount: '$200K', equity: '15%', funds: 'საკუთარი სერვერები + 15–20 აგენტი' }, { label: 'ეტაპი 3 — მასშტაბირების შემდეგ', amount: '$1M', equity: '15%', funds: 'რეგიონული გაფართოება კავკასიაში' }], safety: 'აინვესტირებთ $40K ახლა. თუ 6 თვეში ვერ დავადასტურებთ — ჩერდებით.' },
      { id: 10, type: 'closing', title: 'რატომ მუშაობს', statement: 'ბიზნეს ლოგიკა, არა სტარტაპ დაპირება', reasons: [{ point: 'ფიქსირებული გაყიდვების ხარჯის გარეშე', detail: 'აგენტებს შემოსავალი აქვთ მხოლოდ როცა ყიდიან (25% საკომისიო)' }, { point: 'მაღალი მარჟა', detail: '68.4% მთლიანი, 51.9% EBITDA — 88%-მდე საკუთარი სერვერებით' }, { point: 'განმეორებადი შემოსავალი', detail: 'კლიენტები იხდიან ყოველთვიურად, საშუალოდ 15 თვე' }, { point: 'EBITDA დადებითი მე-2 თვიდან', detail: 'თვითკმარი მე-2 თვიდან. წელი 1 წმინდა მოგება: $196K' }, { point: '$196K ნაღდი წელი 1-ით', detail: '$40K საწყისი ინვესტიციიდან $196K-მდე 12 თვეში' }, { point: 'მარტივი პროდუქტი', detail: '"AI პასუხობს ტელეფონზე $300/თვეში" — ნებისმიერ ბიზნესმენს ესმის' }] },
      { id: 11, type: 'chat', title: 'ჰკითხეთ AI-ს', statement: 'ჰკითხეთ რაც გაინტერესებთ ბიზნეს-მოდელის, ფინანსების ან ინვესტიციის პირობების შესახებ', placeholder: 'დაწერეთ შეკითხვა...', suggestions: ['რა არის ბრეიქ-ივენ თვე?', 'რამდენია 1 ეტაპი?', 'რა მარჟებია?', 'როგორ მუშაობს გაყიდვების გუნდი?'] },
    ],
  },
};

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function PitchPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);
  const [lang, setLang] = useState<Lang>('en');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const slides = content[lang].slides;
  const slide = slides[currentSlide];
  const en = lang === 'en';

  const nextSlide = useCallback(() => {
    if (currentSlide < slides.length - 1) {
      setDirection(1);
      setCurrentSlide(prev => prev + 1);
    }
  }, [currentSlide, slides.length]);

  const prevSlide = useCallback(() => {
    if (currentSlide > 0) {
      setDirection(-1);
      setCurrentSlide(prev => prev - 1);
    }
  }, [currentSlide]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (slide.type === 'chat' && (e.target as HTMLElement)?.tagName === 'INPUT') return;
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevSlide();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide, slide.type]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/pitch/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, history: messages }),
      });
      const data = await res.json();
      if (data.response) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: en ? 'Sorry, something went wrong.' : 'ბოდიში, შეცდომა მოხდა.' }]);
    }
    setIsLoading(false);
  };

  const handleSuggestion = (text: string) => {
    setInput(text);
    inputRef.current?.focus();
  };

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir < 0 ? '100%' : '-100%', opacity: 0 }),
  };

  return (
    <div className="min-h-[100dvh] bg-[#fafafa] text-[#1d1d1f] overflow-hidden select-none">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-[#e5e5e7]">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between">
          <span className="text-xs sm:text-sm text-[#86868b]">{currentSlide + 1} / {slides.length}</span>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/pitch/files"
              className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm text-[#6e6e73] hover:text-[#1d1d1f] transition-colors"
            >
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">{en ? 'Downloads' : 'ჩამოტვირთვა'}</span>
            </Link>
            <button
              onClick={() => setLang(lang === 'en' ? 'ka' : 'en')}
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full bg-[#f5f5f7] hover:bg-[#e5e5e7] transition-colors"
            >
              <Globe className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#6e6e73]" />
              <span className="text-xs font-medium text-[#1d1d1f]">{lang.toUpperCase()}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Slide Content */}
      <div className="h-[100dvh] flex items-center justify-center pt-12 pb-16 px-4 sm:px-8">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={`${slide.id}-${lang}`}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="w-full max-w-4xl"
          >
            {/* TITLE */}
            {slide.type === 'title' && (
              <div className="text-center px-2">
                <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="text-5xl sm:text-7xl md:text-8xl font-bold tracking-tight">{slide.title}</motion.h1>
                <motion.p initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="text-lg sm:text-xl md:text-2xl text-[#6e6e73] mt-3 sm:mt-4 font-light">{slide.subtitle}</motion.p>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-sm sm:text-base text-[#86868b] mt-4 sm:mt-6 max-w-md mx-auto">{slide.tagline}</motion.p>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-xs sm:text-sm text-[#a1a1a6] mt-6 sm:mt-8">{slide.location}</motion.p>
              </div>
            )}

            {/* SERVICE */}
            {slide.type === 'service' && (
              <div className="px-2">
                <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2">{slide.title}</motion.h2>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-base sm:text-lg text-[#6e6e73] mb-6 sm:mb-8">{slide.statement}</motion.p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                  {slide.steps?.map((step: any, i: number) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.1 }} className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm border border-[#e5e5e7]">
                      <div className="text-xl sm:text-2xl font-bold text-[#86868b] mb-1 sm:mb-2">{step.number}</div>
                      <div className="text-sm sm:text-base font-semibold mb-1">{step.name}</div>
                      <div className="text-xs sm:text-sm text-[#6e6e73] leading-snug">{step.desc}</div>
                    </motion.div>
                  ))}
                </div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-4 sm:mt-6 bg-[#1d1d1f] text-white rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center">
                  <p className="text-sm sm:text-base font-light">{slide.analogy}</p>
                </motion.div>
              </div>
            )}

            {/* PRODUCTS */}
            {slide.type === 'products' && (
              <div className="px-2">
                <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2">{slide.title}</motion.h2>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-base sm:text-lg text-[#6e6e73] mb-6 sm:mb-8">{slide.statement}</motion.p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  {slide.items?.map((item: any, i: number) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.1 }} className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm border border-[#e5e5e7]">
                      <div className="text-base sm:text-lg font-semibold mb-1">{item.name}</div>
                      <div className="text-sm text-[#6e6e73]">{item.desc}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* ECONOMICS */}
            {slide.type === 'economics' && (
              <div className="px-2">
                <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2">{slide.title}</motion.h2>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-base sm:text-lg text-[#6e6e73] mb-4 sm:mb-6">{slide.statement}</motion.p>
                <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-[#e5e5e7] overflow-hidden">
                  {slide.metrics?.map((m: any, i: number) => (
                    <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 + i * 0.08 }} className={`flex items-center justify-between p-3 sm:p-4 border-b border-[#e5e5e7] last:border-0 ${m.highlight ? 'bg-[#f5f5f7]' : ''}`}>
                      <span className="text-sm sm:text-base text-[#6e6e73]">{m.metric}</span>
                      <div className="text-right">
                        <span className={`text-lg sm:text-xl font-bold ${m.highlight ? 'text-green-600' : ''}`}>{m.value}</span>
                        {m.note && <span className="text-xs sm:text-sm text-[#86868b] ml-2">{m.note}</span>}
                      </div>
                    </motion.div>
                  ))}
                </div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-4 bg-[#f5f5f7] rounded-xl p-3 sm:p-4 text-center">
                  <p className="text-sm sm:text-base font-medium">{slide.insight}</p>
                </motion.div>
              </div>
            )}

            {/* PROJECTION */}
            {slide.type === 'projection' && (
              <div className="px-2">
                <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2">{slide.title}</motion.h2>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-base sm:text-lg text-[#6e6e73] mb-6 sm:mb-8">{slide.statement}</motion.p>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3 mb-4">
                  {slide.highlights?.map((h: any, i: number) => (
                    <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 + i * 0.1 }} className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm border border-[#e5e5e7] text-center">
                      <div className="text-[10px] sm:text-xs text-[#86868b] mb-1">{h.label}</div>
                      <div className="text-sm sm:text-lg font-bold">{h.value}</div>
                    </motion.div>
                  ))}
                </div>
                {slide.details && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="bg-white rounded-xl border border-[#e5e5e7] overflow-hidden">
                    <div className="grid grid-cols-5 text-center text-xs sm:text-sm">
                      <div className="p-2 sm:p-3 bg-[#f5f5f7] font-semibold border-b border-[#e5e5e7]">{en ? 'Month' : 'თვე'}</div>
                      <div className="p-2 sm:p-3 bg-[#f5f5f7] font-semibold border-b border-[#e5e5e7]">{en ? 'Revenue' : 'შემოსავალი'}</div>
                      <div className="p-2 sm:p-3 bg-[#f5f5f7] font-semibold border-b border-[#e5e5e7]">{en ? 'Clients' : 'კლიენტები'}</div>
                      <div className="p-2 sm:p-3 bg-[#f5f5f7] font-semibold border-b border-[#e5e5e7]">EBITDA</div>
                      <div className="p-2 sm:p-3 bg-[#f5f5f7] font-semibold border-b border-[#e5e5e7]">{en ? 'Status' : 'სტატუსი'}</div>
                      {slide.details.map((d: any, i: number) => {
                        const isPositive = !d.ebitda.startsWith('-');
                        return [
                          <div key={`l${i}`} className="p-2 sm:p-3 border-b border-[#e5e5e7] font-medium">{d.label}</div>,
                          <div key={`r${i}`} className="p-2 sm:p-3 border-b border-[#e5e5e7]">{d.revenue}</div>,
                          <div key={`c${i}`} className="p-2 sm:p-3 border-b border-[#e5e5e7]">{d.clients}</div>,
                          <div key={`e${i}`} className={`p-2 sm:p-3 border-b border-[#e5e5e7] font-semibold ${isPositive ? 'text-green-600' : 'text-red-500'}`}>{d.ebitda}</div>,
                          <div key={`s${i}`} className="p-2 sm:p-3 border-b border-[#e5e5e7]">
                            <span className={`inline-block w-2 h-2 rounded-full ${isPositive ? 'bg-green-500' : 'bg-red-400'}`} />
                          </div>,
                        ];
                      })}
                    </div>
                  </motion.div>
                )}
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }} className="text-sm text-[#86868b] mt-4 text-center">{slide.footer}</motion.p>
              </div>
            )}

            {/* SALES STRATEGY */}
            {slide.type === 'sales_strategy' && (
              <div className="px-2">
                <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2">{slide.title}</motion.h2>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-base sm:text-lg text-[#6e6e73] mb-6 sm:mb-8">{slide.statement}</motion.p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  {slide.strategies?.map((s: any, i: number) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.08 }} className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm border border-[#e5e5e7]">
                      <div className="text-sm sm:text-base font-semibold mb-1">{s.name}</div>
                      <div className="text-xs sm:text-sm text-[#6e6e73] leading-snug">{s.desc}</div>
                    </motion.div>
                  ))}
                </div>
                {slide.framework && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="mt-4 sm:mt-6 bg-[#1d1d1f] text-white rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center">
                    <p className="text-sm sm:text-base font-light">{slide.framework}</p>
                  </motion.div>
                )}
              </div>
            )}

            {/* OPERATIONS */}
            {slide.type === 'operations' && (
              <div className="px-2">
                <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2">{slide.title}</motion.h2>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-base sm:text-lg text-[#6e6e73] mb-6 sm:mb-8">{slide.statement}</motion.p>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  {slide.flow?.map((f: any, i: number) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.1 }} className="flex-1 bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm border border-[#e5e5e7] relative">
                      <div className="text-sm sm:text-base font-semibold mb-1">{f.step}</div>
                      <div className="text-xs sm:text-sm text-[#6e6e73]">{f.detail}</div>
                      {i < (slide.flow?.length || 0) - 1 && (
                        <div className="hidden sm:block absolute -right-2 top-1/2 -translate-y-1/2 text-[#d2d2d7]">&rarr;</div>
                      )}
                    </motion.div>
                  ))}
                </div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-4 sm:mt-6 bg-[#f5f5f7] rounded-xl p-3 sm:p-4 text-center">
                  <p className="text-sm sm:text-base">{slide.keyPoint}</p>
                </motion.div>
              </div>
            )}

            {/* TEAM */}
            {slide.type === 'team' && (
              <div className="px-2">
                <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2">{slide.title}</motion.h2>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-base sm:text-lg text-[#6e6e73] mb-6 sm:mb-8">{slide.statement}</motion.p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4">
                  {slide.headcount?.map((h: any, i: number) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.1 }} className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm border border-[#e5e5e7]">
                      <div className="text-xs sm:text-sm font-medium text-[#86868b] mb-1">{h.period}</div>
                      <div className="text-sm sm:text-base"><span className="font-semibold">{h.sales}</span> <span className="text-[#86868b] text-xs">{en ? 'sales' : 'გაყ.'}</span></div>
                      <div className="text-sm sm:text-base"><span className="font-semibold">{h.tech}</span> <span className="text-[#86868b] text-xs">{en ? 'tech' : 'ტექ.'}</span></div>
                      <div className="text-xs text-[#6e6e73] mt-1">{h.detail}</div>
                    </motion.div>
                  ))}
                </div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-[#e5e5e7] overflow-hidden">
                  {slide.costs?.map((c: any, i: number) => (
                    <div key={i} className={`flex items-center justify-between p-3 sm:p-4 border-b border-[#e5e5e7] last:border-0 ${i === (slide.costs?.length || 0) - 1 ? 'bg-[#f5f5f7] font-semibold' : ''}`}>
                      <span className="text-sm sm:text-base text-[#6e6e73]">{c.item}</span>
                      <div className="text-right">
                        <span className="text-base sm:text-lg font-bold">{c.value}</span>
                        {c.note && <span className="text-xs sm:text-sm text-[#86868b] ml-2">{c.note}</span>}
                      </div>
                    </div>
                  ))}
                </motion.div>
              </div>
            )}

            {/* INVESTMENT */}
            {slide.type === 'investment' && (
              <div className="px-2">
                <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2">{slide.title}</motion.h2>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-base sm:text-lg text-[#6e6e73] mb-4 sm:mb-6">{slide.statement}</motion.p>
                <div className="space-y-2 sm:space-y-3">
                  {slide.stages?.map((s: any, i: number) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.15 }} className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm border border-[#e5e5e7]">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 mb-1 sm:mb-2">
                        <span className="text-xs sm:text-sm font-medium text-[#86868b]">{s.label}</span>
                        <div className="flex items-center gap-2 sm:gap-3">
                          <span className="text-xl sm:text-2xl font-bold">{s.amount}</span>
                          <span className="text-xs sm:text-sm font-medium text-blue-600">&rarr; {s.equity}</span>
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm text-[#6e6e73]">{s.funds}</p>
                    </motion.div>
                  ))}
                </div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="mt-4 bg-green-50 border border-green-200 rounded-xl p-3 sm:p-4 text-center">
                  <p className="text-sm sm:text-base text-green-800 font-medium">{slide.safety}</p>
                </motion.div>
              </div>
            )}

            {/* CLOSING */}
            {slide.type === 'closing' && (
              <div className="px-2">
                <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2">{slide.title}</motion.h2>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-base sm:text-lg text-[#6e6e73] mb-6 sm:mb-8">{slide.statement}</motion.p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  {slide.reasons?.map((r: any, i: number) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.1 }} className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm border border-[#e5e5e7]">
                      <div className="flex items-start gap-2 sm:gap-3">
                        <div className="w-2 h-2 rounded-full bg-[#1d1d1f] mt-1.5 shrink-0" />
                        <div>
                          <div className="text-sm sm:text-base font-semibold">{r.point}</div>
                          <div className="text-xs sm:text-sm text-[#6e6e73]">{r.detail}</div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* CHAT */}
            {slide.type === 'chat' && (
              <div className="px-2 h-[calc(100dvh-10rem)] flex flex-col">
                <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2">{slide.title}</motion.h2>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-base sm:text-lg text-[#6e6e73] mb-4">{slide.statement}</motion.p>
                <div className="flex-1 overflow-y-auto mb-4 space-y-3 min-h-0">
                  {messages.length === 0 && (
                    <div className="flex flex-wrap gap-2">
                      {slide.suggestions?.map((s: string, i: number) => (
                        <motion.button key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.1 }} onClick={() => handleSuggestion(s)} className="px-3 py-2 text-sm bg-white rounded-xl border border-[#e5e5e7] hover:bg-[#f5f5f7] transition-colors text-left">
                          {s}
                        </motion.button>
                      ))}
                    </div>
                  )}
                  {messages.map((msg, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`max-w-[85%] ${msg.role === 'user' ? 'ml-auto' : ''}`}>
                      <div className={`rounded-2xl px-4 py-3 ${msg.role === 'user' ? 'bg-[#1d1d1f] text-white' : 'bg-white border border-[#e5e5e7]'}`}>
                        <p className="text-sm sm:text-base whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </motion.div>
                  ))}
                  {isLoading && (
                    <div className="flex items-center gap-2 text-[#86868b]">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">{en ? 'Thinking...' : 'ფიქრობს...'}</span>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
                <div className="flex gap-2">
                  <input ref={inputRef} type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder={slide.placeholder} className="flex-1 px-4 py-3 text-sm sm:text-base bg-white border border-[#e5e5e7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1d1d1f]/20" />
                  <button onClick={handleSend} disabled={!input.trim() || isLoading} className="px-4 py-3 bg-[#1d1d1f] text-white rounded-xl disabled:opacity-40 transition-opacity">
                    <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 sm:gap-3 bg-white/90 backdrop-blur-sm rounded-full px-3 sm:px-4 py-2 shadow-lg border border-[#e5e5e7]">
        <button onClick={prevSlide} disabled={currentSlide === 0} className="p-1.5 sm:p-2 rounded-full hover:bg-[#f5f5f7] disabled:opacity-30 transition-all touch-manipulation">
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
        <div className="flex items-center gap-1 sm:gap-1.5">
          {slides.map((_, i) => (
            <button key={i} onClick={() => { setDirection(i > currentSlide ? 1 : -1); setCurrentSlide(i); }} className="touch-manipulation">
              <Circle className={`w-1.5 h-1.5 sm:w-2 sm:h-2 transition-all ${i === currentSlide ? 'fill-[#1d1d1f] text-[#1d1d1f] scale-125' : 'text-[#d2d2d7]'}`} />
            </button>
          ))}
        </div>
        <button onClick={nextSlide} disabled={currentSlide === slides.length - 1} className="p-1.5 sm:p-2 rounded-full hover:bg-[#f5f5f7] disabled:opacity-30 transition-all touch-manipulation">
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
    </div>
  );
}
