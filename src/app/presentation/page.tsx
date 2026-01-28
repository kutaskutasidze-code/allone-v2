'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Circle, X, Send, Globe, Bot, Zap, Mic, Code, BarChart3, Globe2, CheckCircle2, Users, Clock, Shield, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { LiquidMetal, PulsingBorder } from '@paper-design/shaders-react';

// Icon mapping
const iconMap: Record<string, React.ReactNode> = {
  bot: <Bot className="w-5 h-5 md:w-6 md:h-6" />,
  zap: <Zap className="w-5 h-5 md:w-6 md:h-6" />,
  mic: <Mic className="w-5 h-5 md:w-6 md:h-6" />,
  code: <Code className="w-5 h-5 md:w-6 md:h-6" />,
  chart: <BarChart3 className="w-5 h-5 md:w-6 md:h-6" />,
  globe: <Globe2 className="w-5 h-5 md:w-6 md:h-6" />,
  check: <CheckCircle2 className="w-6 h-6 md:w-7 md:h-7" />,
  users: <Users className="w-6 h-6 md:w-7 md:h-7" />,
  clock: <Clock className="w-6 h-6 md:w-7 md:h-7" />,
  shield: <Shield className="w-6 h-6 md:w-7 md:h-7" />,
  sparkles: <Sparkles className="w-6 h-6 md:w-7 md:h-7" />,
};

// Bilingual content
const content = {
  en: {
    slides: [
      {
        id: 1,
        type: 'title',
        title: 'The Future Runs Itself',
        subtitle: 'AI Solutions & Digital Transformation',
        tagline: 'Allone',
      },
      {
        id: 2,
        type: 'problem',
        title: 'The Challenge',
        statement: 'Your team is drowning in manual work.',
        points: [
          'Hours lost to repetitive data entry and reports',
          'Customer inquiries overwhelming your support team',
          'Disconnected tools causing missed handoffs',
          'Scaling means hiring more people',
          'Valuable insights buried in unstructured data',
        ],
        stat: { value: '80%', label: 'of business tasks are repetitive and automatable' },
      },
      {
        id: 3,
        type: 'solution',
        title: 'The Solution',
        statement: 'Intelligent automation that works 24/7.',
        description: 'We build AI-powered systems that handle your repetitive work, answer customer questions, and connect your tools — so your team can focus on what matters.',
        stats: [
          { value: '10x', label: 'Faster Processing' },
          { value: '94%', label: 'Resolution Rate' },
          { value: '24/7', label: 'Availability' },
          { value: '<2s', label: 'Response Time' },
        ],
      },
      {
        id: 4,
        type: 'services',
        title: 'What We Build',
        statement: 'Full-stack AI and technology solutions',
        services: [
          { name: 'AI Chatbots', desc: 'Context-aware assistants for support, sales, and onboarding', icon: 'bot' },
          { name: 'Custom AI', desc: 'Tailored models trained on your data', icon: 'sparkles' },
          { name: 'Automation', desc: 'Connect tools into seamless pipelines', icon: 'zap' },
          { name: 'Voice AI', desc: 'Speech-enabled agents that handle calls', icon: 'mic' },
          { name: 'Web Development', desc: 'Beautiful, high-performance applications', icon: 'code' },
          { name: 'Analytics', desc: 'Dashboards and insights that drive decisions', icon: 'chart' },
        ],
      },
      {
        id: 5,
        type: 'process',
        title: 'How We Work',
        statement: 'A proven process that delivers results.',
        steps: [
          { num: '01', title: 'Discovery', desc: 'We learn about your business, challenges, and goals' },
          { num: '02', title: 'Design', desc: 'Detailed proposal with timelines and pricing' },
          { num: '03', title: 'Build', desc: 'Agile development with regular demos' },
          { num: '04', title: 'Launch', desc: 'Seamless deployment and ongoing support' },
        ],
      },
      {
        id: 6,
        type: 'results',
        title: 'The Impact',
        statement: 'Real results from real clients',
        results: [
          { category: 'Customer Service', items: ['80% reduction in response times', '94% automated resolution rate', '24/7 availability'], icon: 'users' },
          { category: 'Operations', items: ['20+ hours saved per week', 'Zero missed handoffs', 'Scalable without headcount'], icon: 'clock' },
          { category: 'Sales', items: ['35% increase in conversions', 'AI-powered lead scoring', 'Automated follow-ups'], icon: 'chart' },
        ],
      },
      {
        id: 7,
        type: 'testimonials',
        title: 'What Clients Say',
        testimonials: [
          { quote: 'ALLONE transformed our customer support with their AI chatbot. Response times dropped 80% and customer satisfaction is at an all-time high.', author: 'Giorgi Kvaratskhelia', role: 'CEO, TechStart Georgia' },
          { quote: 'The workflow automation they built saved us 20+ hours per week. Our team can now focus on what matters most — growing the business.', author: 'Nino Basilaia', role: 'Operations Director, Borjomi Group' },
          { quote: 'Their custom AI solution for lead scoring increased our conversion rate by 35%. The ROI was visible within the first month.', author: 'David Maisuradze', role: 'Head of Sales, Georgian Airways' },
        ],
      },
      {
        id: 8,
        type: 'why',
        title: 'Why Allone',
        statement: 'The difference that matters',
        points: [
          { title: 'Custom-Built', desc: 'Every system designed for your specific needs', icon: 'sparkles' },
          { title: 'End-to-End', desc: 'Strategy to deployment to ongoing support', icon: 'check' },
          { title: 'ROI-Focused', desc: 'We measure success by your results', icon: 'chart' },
          { title: 'Fast Delivery', desc: 'Working software quickly, not months of waiting', icon: 'clock' },
          { title: 'Partnership', desc: 'Invested in your long-term success', icon: 'users' },
          { title: 'Secure', desc: 'Enterprise-grade security and reliability', icon: 'shield' },
        ],
      },
      {
        id: 9,
        type: 'cta',
        title: 'Ready to Transform?',
        statement: 'Let\'s discuss how AI can help you operate smarter, scale faster, and compete more effectively.',
        cta: 'Ask AI anything about our services',
        website: 'www.allone.ge',
        consultation: 'Free consultation — No commitment required',
      },
    ],
    chat: {
      title: 'Ask about our services',
      placeholder: 'Ask anything...',
      thinking: 'Thinking...',
      intro: 'Ask me anything about Allone\'s services and solutions.',
    },
    langSwitch: 'ქართ',
  },
  ka: {
    slides: [
      {
        id: 1,
        type: 'title',
        title: 'მომავალი თავად მუშაობს',
        subtitle: 'AI გადაწყვეტილებები და ციფრული ტრანსფორმაცია',
        tagline: 'Allone',
      },
      {
        id: 2,
        type: 'problem',
        title: 'გამოწვევა',
        statement: 'თქვენი გუნდი ხელით სამუშაოში იხრჩობა.',
        points: [
          'საათები იკარგება განმეორებად მონაცემთა შეყვანაში',
          'კლიენტების შეკითხვები გადატვირთავს მხარდაჭერას',
          'გათიშული ხელსაწყოები იწვევს შეცდომებს',
          'ზრდა ნიშნავს მეტ თანამშრომელს',
          'ღირებული ინფორმაცია დამალულია მონაცემებში',
        ],
        stat: { value: '80%', label: 'ბიზნეს ამოცანების ავტომატიზაცია შესაძლებელია' },
      },
      {
        id: 3,
        type: 'solution',
        title: 'გადაწყვეტა',
        statement: 'ინტელექტუალური ავტომატიზაცია 24/7.',
        description: 'ვქმნით AI სისტემებს, რომლებიც ასრულებენ განმეორებად სამუშაოს, პასუხობენ კლიენტებს და აკავშირებენ თქვენს ხელსაწყოებს.',
        stats: [
          { value: '10x', label: 'უფრო სწრაფი' },
          { value: '94%', label: 'გადაწყვეტის მაჩვენებელი' },
          { value: '24/7', label: 'ხელმისაწვდომობა' },
          { value: '<2წმ', label: 'პასუხის დრო' },
        ],
      },
      {
        id: 4,
        type: 'services',
        title: 'რას ვაშენებთ',
        statement: 'სრული AI და ტექნოლოგიური გადაწყვეტილებები',
        services: [
          { name: 'AI ჩატბოტები', desc: 'კონტექსტის მცოდნე ასისტენტები მხარდაჭერისთვის', icon: 'bot' },
          { name: 'Custom AI', desc: 'თქვენს მონაცემებზე გაწვრთნილი მოდელები', icon: 'sparkles' },
          { name: 'ავტომატიზაცია', desc: 'ხელსაწყოების დაკავშირება უწყვეტ პროცესებში', icon: 'zap' },
          { name: 'ხმოვანი AI', desc: 'მეტყველების აგენტები ზარებისთვის', icon: 'mic' },
          { name: 'ვებ დეველოპმენტი', desc: 'ლამაზი, მაღალი წარმადობის აპლიკაციები', icon: 'code' },
          { name: 'ანალიტიკა', desc: 'დაშბორდები და ინსაითები გადაწყვეტილებებისთვის', icon: 'chart' },
        ],
      },
      {
        id: 5,
        type: 'process',
        title: 'როგორ ვმუშაობთ',
        statement: 'დადასტურებული პროცესი რომელიც შედეგს იძლევა.',
        steps: [
          { num: '01', title: 'აღმოჩენა', desc: 'ვსწავლობთ თქვენს ბიზნესს და გამოწვევებს' },
          { num: '02', title: 'დიზაინი', desc: 'დეტალური წინადადება ვადებით და ფასებით' },
          { num: '03', title: 'აშენება', desc: 'Agile განვითარება რეგულარული დემოებით' },
          { num: '04', title: 'გაშვება', desc: 'უწყვეტი დანერგვა და მხარდაჭერა' },
        ],
      },
      {
        id: 6,
        type: 'results',
        title: 'შედეგები',
        statement: 'რეალური შედეგები რეალური კლიენტებისგან',
        results: [
          { category: 'მომხმარებელთა სერვისი', items: ['80% შემცირება პასუხის დროში', '94% ავტომატური გადაწყვეტა', '24/7 ხელმისაწვდომობა'], icon: 'users' },
          { category: 'ოპერაციები', items: ['20+ დაზოგილი საათი კვირაში', 'ნულოვანი გამოტოვებული გადაცემა', 'სკალირება დაქირავების გარეშე'], icon: 'clock' },
          { category: 'გაყიდვები', items: ['35% ზრდა კონვერსიებში', 'AI ლიდების შეფასება', 'ავტომატური თვალყურის დევნება'], icon: 'chart' },
        ],
      },
      {
        id: 7,
        type: 'testimonials',
        title: 'რას ამბობენ კლიენტები',
        testimonials: [
          { quote: 'ALLONE-მა გარდაქმნა ჩვენი მომხმარებელთა მხარდაჭერა AI ჩატბოტით. პასუხის დრო 80%-ით შემცირდა.', author: 'გიორგი კვარაცხელია', role: 'CEO, TechStart Georgia' },
          { quote: 'მათ მიერ აშენებულმა ავტომატიზაციამ 20+ საათი დაგვიზოგა კვირაში. გუნდს ახლა შეუძლია ფოკუსირება ზრდაზე.', author: 'ნინო ბასილაია', role: 'ოპერაციების დირექტორი, ბორჯომი' },
          { quote: 'მათმა AI გადაწყვეტილებამ ლიდების შეფასებისთვის 35%-ით გაზარდა კონვერსია. ROI პირველ თვეშივე იყო ხილული.', author: 'დავით მაისურაძე', role: 'გაყიდვების ხელმძღვანელი, Georgian Airways' },
        ],
      },
      {
        id: 8,
        type: 'why',
        title: 'რატომ Allone',
        statement: 'განსხვავება რომელიც მნიშვნელოვანია',
        points: [
          { title: 'მორგებული', desc: 'ყველა სისტემა შექმნილია თქვენი საჭიროებებისთვის', icon: 'sparkles' },
          { title: 'ბოლომდე', desc: 'სტრატეგიიდან დანერგვამდე მხარდაჭერით', icon: 'check' },
          { title: 'ROI ფოკუსი', desc: 'წარმატებას თქვენი შედეგებით ვზომავთ', icon: 'chart' },
          { title: 'სწრაფი მიწოდება', desc: 'მომუშავე პროგრამა სწრაფად', icon: 'clock' },
          { title: 'პარტნიორობა', desc: 'ინვესტირებული თქვენს გრძელვადიან წარმატებაში', icon: 'users' },
          { title: 'უსაფრთხო', desc: 'საწარმოო დონის უსაფრთხოება', icon: 'shield' },
        ],
      },
      {
        id: 9,
        type: 'cta',
        title: 'მზად ხართ ტრანსფორმაციისთვის?',
        statement: 'განვიხილოთ როგორ დაგეხმარებათ AI უფრო ჭკვიანურად მუშაობაში და სწრაფ სკალირებაში.',
        cta: 'დაუსვით AI-ს კითხვა ჩვენი სერვისების შესახებ',
        website: 'www.allone.ge',
        consultation: 'უფასო კონსულტაცია — ვალდებულების გარეშე',
      },
    ],
    chat: {
      title: 'იკითხეთ ჩვენი სერვისების შესახებ',
      placeholder: 'დასვით კითხვა...',
      thinking: 'ფიქრობს...',
      intro: 'დამისვით ნებისმიერი კითხვა Allone-ის სერვისებისა და გადაწყვეტილებების შესახებ.',
    },
    langSwitch: 'ENG',
  },
};

// Company knowledge base for AI
const companyKnowledge = `
ALLONE - AI SOLUTIONS & DIGITAL TRANSFORMATION

WHO WE ARE:
Allone is a technology company specializing in AI solutions and digital transformation. We design and build intelligent automation systems that help businesses operate smarter, scale faster, and compete more effectively.

TAGLINE: "The Future Runs Itself"

WHAT WE BUILD:

1. AI Chatbots & Assistants
- Context-aware, intelligent chatbots that learn your business
- Perfect for customer support, sales, and onboarding
- 24/7 availability with 94% resolution rate
- Response times under 2 seconds

2. Custom AI Solutions
- Tailored models trained on your specific data
- Document analysis, predictive insights, NLP, computer vision
- 10x faster processing with 94% accuracy
- Domain-specific AI integrated with your existing tools

3. Workflow Automation
- Connect existing tools into seamless automated pipelines
- Eliminate manual data entry and missed handoffs
- No-code/low-code automation workflows
- Process automation, integrations, data pipelines

4. Voice AI Agents
- Speech-enabled AI assistants
- Handle calls, answer questions, schedule appointments
- Speech-to-text and text-to-speech capabilities
- 24/7 availability for phone support

5. Website Development
- Beautiful, responsive web applications
- SEO-optimized and high-performance
- Built with Next.js, React, Tailwind CSS
- Pixel-perfect designs focused on conversion

6. Analytics & Insights
- Custom dashboards and automated reporting
- Business intelligence and data visualization
- Predictive analytics for better decisions

OUR PROCESS:
1. Discovery Call - Free consultation to understand your business, challenges, and goals
2. Solution Design - Detailed proposal with timelines, deliverables, and transparent pricing
3. Build & Iterate - Agile development with regular demos, you see progress every step
4. Launch & Support - Seamless deployment, training, and ongoing optimization

RESULTS WE DELIVER:
- 80% reduction in response times
- 94% automated resolution rate
- 20+ hours saved per week per team
- 35% increase in conversion rates
- 10x faster document processing
- 24/7 availability without extra staff

CLIENT TESTIMONIALS:
- "ALLONE transformed our customer support with their AI chatbot. Response times dropped 80%." - Giorgi Kvaratskhelia, CEO, TechStart Georgia
- "The workflow automation saved us 20+ hours per week." - Nino Basilaia, Operations Director, Borjomi Group
- "Their AI solution increased our conversion rate by 35%. ROI visible in the first month." - David Maisuradze, Head of Sales, Georgian Airways

WHY CHOOSE ALLONE:
- Custom-Built: No cookie-cutter solutions, every system designed for your needs
- End-to-End: From strategy to deployment to ongoing support
- ROI-Focused: We measure success by your results, not our hours
- Fast Delivery: Working software quickly, not months of waiting
- Partnership Model: We're invested in your long-term success
- Secure & Reliable: Enterprise-grade security, your data stays yours

CONTACT:
Website: www.allone.ge
Email: hello@allone.ai

CONSULTATION:
Free initial consultation with no commitment required. We'll discuss your challenges and show you what's possible with AI.
`;

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function PresentationPage() {
  const [lang, setLang] = useState<'en' | 'ka'>('en');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [shaderReady, setShaderReady] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const slides = content[lang].slides;
  const chatText = content[lang].chat;

  useEffect(() => {
    const timer = setTimeout(() => setShaderReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

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
      if (isChatOpen) return;
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevSlide();
      } else if (e.key === 'Escape') {
        setIsChatOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide, isChatOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const openChat = useCallback(() => {
    setIsChatOpen(true);
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/presentation/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          context: companyKnowledge,
          language: lang,
        }),
      });

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply || 'Sorry, I could not process that.' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const slide = slides[currentSlide];

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 600 : -600, opacity: 0, scale: 0.98 }),
    center: { x: 0, opacity: 1, scale: 1 },
    exit: (dir: number) => ({ x: dir < 0 ? 600 : -600, opacity: 0, scale: 0.98 }),
  };

  const stagger = (i: number, base = 0.12) => ({ delay: 0.15 + i * base });

  return (
    <div className="min-h-screen bg-white text-[#111] overflow-hidden select-none">
      {/* Language Toggle */}
      <button
        onClick={() => setLang(lang === 'en' ? 'ka' : 'en')}
        className="fixed top-4 left-4 md:top-8 md:left-8 z-50 flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-white/90 backdrop-blur-sm rounded-full shadow-sm border border-gray-200 hover:bg-gray-50 transition-all"
      >
        <Globe className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-500" />
        <span className="text-xs md:text-sm font-medium">{content[lang].langSwitch}</span>
      </button>

      {/* Slide Counter */}
      <div className="fixed top-4 right-4 md:top-8 md:right-8 z-50 text-xs md:text-sm text-gray-400 font-mono">
        {String(currentSlide + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
      </div>

      {/* Slide Content */}
      <div className="min-h-screen flex items-center justify-center px-5 py-20 md:px-12 lg:px-20">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={`${slide.id}-${lang}`}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
            className="w-full max-w-5xl"
          >
            {/* TITLE */}
            {slide.type === 'title' && (
              <div className="text-center">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center justify-center gap-3 mb-8 md:mb-12"
                >
                  <Image
                    src="/images/allone-logo.png"
                    alt="Allone"
                    width={40}
                    height={40}
                    className="w-8 h-8 md:w-10 md:h-10"
                  />
                  <span className="text-xl md:text-2xl font-medium tracking-wide text-[#111]">
                    {slide.tagline}
                  </span>
                </motion.div>
                <motion.h1
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light tracking-tight text-[#111]"
                >
                  {slide.title}
                </motion.h1>
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-500 mt-4 md:mt-8 font-light max-w-xl mx-auto leading-relaxed"
                >
                  {slide.subtitle}
                </motion.p>
              </div>
            )}

            {/* PROBLEM */}
            {slide.type === 'problem' && (
              <div className="max-w-4xl mx-auto">
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs md:text-sm text-gray-400 tracking-[0.15em] uppercase mb-3">
                  01 — {lang === 'en' ? 'Challenge' : 'გამოწვევა'}
                </motion.p>
                <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light mb-3 md:mb-4">
                  {slide.title}
                </motion.h2>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-lg md:text-xl text-gray-500 mb-8 md:mb-10">
                  {slide.statement}
                </motion.p>
                <div className="grid md:grid-cols-2 gap-6 md:gap-10">
                  <div className="space-y-3 md:space-y-4">
                    {slide.points?.map((point, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={stagger(i)}
                        className="flex items-start gap-3 md:gap-4 bg-red-50 rounded-xl md:rounded-2xl p-4 md:p-5"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 flex-shrink-0" />
                        <span className="text-sm md:text-base text-red-900/80">{point}</span>
                      </motion.div>
                    ))}
                  </div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className="flex items-center justify-center"
                  >
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-8 md:p-12 text-center">
                      <div className="text-5xl md:text-7xl font-light text-[#111] mb-2">{slide.stat?.value}</div>
                      <p className="text-sm md:text-base text-gray-500 max-w-[200px] mx-auto">{slide.stat?.label}</p>
                    </div>
                  </motion.div>
                </div>
              </div>
            )}

            {/* SOLUTION */}
            {slide.type === 'solution' && (
              <div className="max-w-4xl mx-auto">
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs md:text-sm text-gray-400 tracking-[0.15em] uppercase mb-3">
                  02 — {lang === 'en' ? 'Solution' : 'გადაწყვეტა'}
                </motion.p>
                <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light mb-3 md:mb-4">
                  {slide.title}
                </motion.h2>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-lg md:text-xl text-gray-500 mb-4">
                  {slide.statement}
                </motion.p>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-base md:text-lg text-gray-600 mb-10 md:mb-14 max-w-3xl">
                  {slide.description}
                </motion.p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                  {slide.stats?.map((stat, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={stagger(i, 0.1)}
                      className="bg-[#111] text-white rounded-2xl md:rounded-3xl p-5 md:p-8 text-center"
                    >
                      <div className="text-3xl md:text-4xl font-light mb-2">{stat.value}</div>
                      <p className="text-xs md:text-sm text-white/60">{stat.label}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* SERVICES */}
            {slide.type === 'services' && (
              <div className="max-w-4xl mx-auto">
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs md:text-sm text-gray-400 tracking-[0.15em] uppercase mb-3">
                  03 — {lang === 'en' ? 'Services' : 'სერვისები'}
                </motion.p>
                <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light mb-3 md:mb-4">
                  {slide.title}
                </motion.h2>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-lg md:text-xl text-gray-500 mb-8 md:mb-10">
                  {slide.statement}
                </motion.p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                  {slide.services?.map((service, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={stagger(i, 0.08)}
                      className="bg-gray-50 rounded-xl md:rounded-2xl p-4 md:p-6 hover:bg-gray-100 transition-colors"
                    >
                      <div className="text-[#111] mb-2 md:mb-3">{iconMap[service.icon]}</div>
                      <h3 className="text-sm md:text-base font-medium mb-1">{service.name}</h3>
                      <p className="text-xs md:text-sm text-gray-500">{service.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* PROCESS */}
            {slide.type === 'process' && (
              <div className="max-w-4xl mx-auto">
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs md:text-sm text-gray-400 tracking-[0.15em] uppercase mb-3">
                  04 — {lang === 'en' ? 'Process' : 'პროცესი'}
                </motion.p>
                <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light mb-3 md:mb-4">
                  {slide.title}
                </motion.h2>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-lg md:text-xl text-gray-500 mb-8 md:mb-12">
                  {slide.statement}
                </motion.p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                  {slide.steps?.map((step, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={stagger(i, 0.12)}
                      className="bg-gray-50 rounded-2xl md:rounded-3xl p-5 md:p-8"
                    >
                      <div className="text-3xl md:text-4xl font-extralight text-gray-300 mb-3">{step.num}</div>
                      <h3 className="text-base md:text-lg font-medium mb-2">{step.title}</h3>
                      <p className="text-xs md:text-sm text-gray-500 leading-relaxed">{step.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* RESULTS */}
            {slide.type === 'results' && (
              <div className="max-w-4xl mx-auto">
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs md:text-sm text-gray-400 tracking-[0.15em] uppercase mb-3">
                  05 — {lang === 'en' ? 'Results' : 'შედეგები'}
                </motion.p>
                <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light mb-3 md:mb-4">
                  {slide.title}
                </motion.h2>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-lg md:text-xl text-gray-500 mb-8 md:mb-10">
                  {slide.statement}
                </motion.p>
                <div className="grid md:grid-cols-3 gap-4 md:gap-6">
                  {slide.results?.map((result, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={stagger(i, 0.15)}
                      className="bg-gray-50 rounded-2xl md:rounded-3xl p-5 md:p-8"
                    >
                      <div className="text-[#111] mb-3 md:mb-4">{iconMap[result.icon]}</div>
                      <h3 className="text-base md:text-lg font-medium mb-3 md:mb-4">{result.category}</h3>
                      <ul className="space-y-2 md:space-y-3">
                        {result.items.map((item, j) => (
                          <li key={j} className="flex items-start gap-2 md:gap-3 text-xs md:text-sm text-gray-600">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* TESTIMONIALS */}
            {slide.type === 'testimonials' && (
              <div className="max-w-4xl mx-auto">
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs md:text-sm text-gray-400 tracking-[0.15em] uppercase mb-3">
                  06 — {lang === 'en' ? 'Testimonials' : 'შეფასებები'}
                </motion.p>
                <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light mb-8 md:mb-12">
                  {slide.title}
                </motion.h2>
                <div className="grid md:grid-cols-3 gap-4 md:gap-6">
                  {slide.testimonials?.map((testimonial, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={stagger(i, 0.15)}
                      className="bg-[#111] text-white rounded-2xl md:rounded-3xl p-5 md:p-8"
                    >
                      <p className="text-sm md:text-base leading-relaxed mb-6 text-white/90">"{testimonial.quote}"</p>
                      <div>
                        <p className="font-medium text-sm md:text-base">{testimonial.author}</p>
                        <p className="text-xs md:text-sm text-white/50">{testimonial.role}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* WHY US */}
            {slide.type === 'why' && (
              <div className="max-w-4xl mx-auto">
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs md:text-sm text-gray-400 tracking-[0.15em] uppercase mb-3">
                  07 — {lang === 'en' ? 'Why Us' : 'რატომ ჩვენ'}
                </motion.p>
                <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light mb-3 md:mb-4">
                  {slide.title}
                </motion.h2>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-lg md:text-xl text-gray-500 mb-8 md:mb-10">
                  {slide.statement}
                </motion.p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                  {slide.points?.map((point, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={stagger(i, 0.08)}
                      className="bg-gray-50 rounded-xl md:rounded-2xl p-4 md:p-6 text-center"
                    >
                      <div className="text-[#111] mb-2 md:mb-3 flex justify-center">{iconMap[point.icon]}</div>
                      <h3 className="text-sm md:text-base font-medium mb-1">{point.title}</h3>
                      <p className="text-xs md:text-sm text-gray-500">{point.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            {slide.type === 'cta' && (
              <div className="max-w-3xl mx-auto text-center">
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light mb-4 md:mb-6"
                >
                  {slide.title}
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-base md:text-lg text-gray-500 mb-10 md:mb-14 max-w-xl mx-auto"
                >
                  {slide.statement}
                </motion.p>

                {/* Ask AI Button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={shaderReady ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                  className="flex flex-col items-center gap-6"
                >
                  <p className="text-sm md:text-base text-gray-500">{slide.cta}</p>

                  <div
                    onClick={openChat}
                    className="relative w-[260px] sm:w-[300px] md:w-[340px] h-[70px] sm:h-[80px] cursor-pointer group"
                  >
                    <div className="absolute inset-0">
                      <PulsingBorder
                        speed={0.79}
                        roundness={1}
                        thickness={0.03}
                        softness={0.75}
                        intensity={0.25}
                        bloom={0.3}
                        spots={5}
                        spotSize={0.5}
                        pulse={0.25}
                        smoke={0.3}
                        smokeSize={0.6}
                        scale={0.6}
                        rotation={0}
                        aspectRatio="auto"
                        colors={['#233944', '#262426', '#F6F3F3C2']}
                        colorBack="#00000000"
                        className="w-full h-full"
                      />
                    </div>

                    <div className="relative z-10 h-full flex items-center justify-center gap-3 md:gap-4 px-4">
                      <div className="relative flex-shrink-0">
                        <LiquidMetal
                          speed={0.68}
                          softness={0.1}
                          repetition={2}
                          shiftRed={0.3}
                          shiftBlue={0.3}
                          distortion={0.07}
                          contour={0.4}
                          scale={0.6}
                          rotation={0}
                          shape="circle"
                          angle={70}
                          image="https://workers.paper.design/file-assets/01KF3FJDBVRQRC2Z21M10KBDQ5/01KF3JVMCGH3M6TG0XEQ9ZA6S3.svg"
                          colorBack="#00000000"
                          colorTint="#FFFFFF"
                          className="w-[36px] h-[36px] md:w-[44px] md:h-[44px] rounded-full"
                        />
                      </div>
                      <span className="text-base md:text-lg font-medium tracking-wide text-[#111] group-hover:opacity-70 transition-opacity">
                        Ask AI
                      </span>
                    </div>
                  </div>

                  <p className="text-sm md:text-base text-gray-400 mt-4">{slide.website}</p>
                  <p className="text-xs md:text-sm text-gray-400">{slide.consultation}</p>
                </motion.div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="fixed bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 md:gap-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 md:px-4 md:py-2 shadow-sm border border-gray-200">
        <button
          onClick={prevSlide}
          disabled={currentSlide === 0}
          className="p-1.5 md:p-2 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 text-[#111]" />
        </button>
        <div className="flex items-center gap-1.5 md:gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => { setDirection(i > currentSlide ? 1 : -1); setCurrentSlide(i); }}
              className="group p-0.5"
            >
              <Circle
                className={`w-1.5 h-1.5 md:w-2 md:h-2 transition-all ${
                  i === currentSlide
                    ? 'fill-[#111] text-[#111] scale-125'
                    : 'text-gray-300 group-hover:text-gray-500'
                }`}
              />
            </button>
          ))}
        </div>
        <button
          onClick={nextSlide}
          disabled={currentSlide === slides.length - 1}
          className="p-1.5 md:p-2 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-[#111]" />
        </button>
      </div>

      {/* Chat Modal */}
      <AnimatePresence>
        {isChatOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsChatOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            />

            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-4 right-4 left-4 md:left-auto md:bottom-8 md:right-8 md:w-[420px] max-h-[70vh] md:max-h-[500px] bg-white rounded-2xl md:rounded-3xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col z-50"
            >
              <div className="flex items-center justify-between p-4 md:p-5 border-b border-gray-100">
                <h3 className="font-medium text-sm md:text-base">{chatText.title}</h3>
                <button onClick={() => setIsChatOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-3 md:space-y-4 min-h-[150px] md:min-h-[200px]">
                {messages.length === 0 && (
                  <p className="text-xs md:text-sm text-gray-400 text-center py-6 md:py-8">{chatText.intro}</p>
                )}
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-3 py-2 md:px-4 md:py-2.5 ${
                        msg.role === 'user' ? 'bg-[#111] text-white' : 'bg-gray-100 text-[#111]'
                      }`}
                    >
                      <p className="text-xs md:text-sm leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-2xl px-3 py-2 md:px-4 md:py-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse" />
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse [animation-delay:150ms]" />
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse [animation-delay:300ms]" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-3 md:p-4 border-t border-gray-100">
                <div className="flex items-center gap-2 md:gap-3">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder={chatText.placeholder}
                    className="flex-1 px-3 py-2 md:px-4 md:py-2.5 bg-gray-100 rounded-full text-xs md:text-sm outline-none focus:ring-2 focus:ring-gray-200 transition-all"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={isLoading || !input.trim()}
                    className="p-2 md:p-2.5 bg-[#111] text-white rounded-full disabled:opacity-40 hover:bg-gray-800 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
