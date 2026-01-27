'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Circle, X, Send, Globe, Bot, Zap, Mic, BookOpen, Code, BarChart3, DollarSign, Handshake, TrendingUp } from 'lucide-react';
import Image from 'next/image';
import { LiquidMetal, PulsingBorder } from '@paper-design/shaders-react';

// Icon mapping for professional look
const iconMap: Record<string, React.ReactNode> = {
  bot: <Bot className="w-5 h-5 md:w-6 md:h-6" />,
  zap: <Zap className="w-5 h-5 md:w-6 md:h-6" />,
  mic: <Mic className="w-5 h-5 md:w-6 md:h-6" />,
  book: <BookOpen className="w-5 h-5 md:w-6 md:h-6" />,
  code: <Code className="w-5 h-5 md:w-6 md:h-6" />,
  chart: <BarChart3 className="w-5 h-5 md:w-6 md:h-6" />,
  dollar: <DollarSign className="w-6 h-6 md:w-7 md:h-7" />,
  handshake: <Handshake className="w-6 h-6 md:w-7 md:h-7" />,
  trending: <TrendingUp className="w-6 h-6 md:w-7 md:h-7" />,
};

// Bilingual content
const content = {
  en: {
    slides: [
      {
        id: 1,
        type: 'title',
        title: 'Partnership',
        subtitle: 'AI & Technology Implementation for Consulting Firms',
        tagline: 'Allone',
      },
      {
        id: 2,
        type: 'opportunity',
        title: 'The Opportunity',
        statement: 'Your clients need AI. They trust you to guide them.',
        points: [
          '78% of businesses want AI adoption but only 15% have implementation capability',
          'The AI services market is growing 35% annually in emerging markets',
          'Consulting firms lose deals when clients need tech execution, not just advice',
        ],
        bottom: 'The gap between advice and implementation is worth capturing.',
      },
      {
        id: 3,
        type: 'solution',
        title: 'The Solution',
        statement: 'You advise. We build. Together we deliver.',
        model: [
          { step: '01', title: 'Identify', desc: 'Your consultant spots opportunity' },
          { step: '02', title: 'Introduce', desc: 'Warm intro to Allone' },
          { step: '03', title: 'Scope', desc: 'We propose solution' },
          { step: '04', title: 'Deliver', desc: 'We build & deploy' },
          { step: '05', title: 'Earn', desc: 'You get commission' },
        ],
      },
      {
        id: 4,
        type: 'track',
        title: 'Why Allone',
        statement: 'Proven delivery, not promises',
        credentials: [
          'Team with Big4 and tech startup backgrounds',
          'Full-stack: strategy through deployment',
          'Georgian-speaking with regional expertise',
          'Flexible engagement models',
        ],
      },
      {
        id: 5,
        type: 'services',
        title: 'What We Build',
        statement: 'Full-stack AI and technology solutions',
        services: [
          { name: 'AI Assistants', desc: 'Chatbots & virtual assistants', icon: 'bot' },
          { name: 'Automation', desc: 'Workflows & integrations', icon: 'zap' },
          { name: 'Voice AI', desc: 'Voice agents & IVR', icon: 'mic' },
          { name: 'RAG Systems', desc: 'Document intelligence', icon: 'book' },
          { name: 'Development', desc: 'Web & mobile apps', icon: 'code' },
          { name: 'Analytics', desc: 'Dashboards & insights', icon: 'chart' },
        ],
      },
      {
        id: 6,
        type: 'usecases',
        title: 'Recognize the Signals',
        statement: 'When clients say this, think of Allone',
        cases: [
          { hear: 'We spend hours on reports', solution: 'Automated reporting' },
          { hear: 'Support is overwhelmed', solution: 'AI chatbot' },
          { hear: 'Too much manual work', solution: 'Process automation' },
          { hear: 'Can\'t find info', solution: 'Document AI' },
          { hear: 'Need 24/7 service', solution: 'Voice AI agent' },
        ],
      },
      {
        id: 7,
        type: 'benefits',
        title: 'What You Get',
        statement: '20-40% commission on every project',
        benefits: [
          { category: 'Revenue', items: ['20-40% commission based on involvement', 'Recurring revenue on subscriptions', 'No cap on earnings'], icon: 'dollar' },
          { category: 'Support', items: ['Team training session', 'Co-branded proposals', 'Dedicated partner manager'], icon: 'handshake' },
          { category: 'Growth', items: ['Expand service offerings', 'Tech-forward positioning', 'AI capabilities without hiring'], icon: 'trending' },
        ],
      },
      {
        id: 8,
        type: 'models',
        title: 'Choose Your Model',
        statement: 'Flexible partnership options',
        options: [
          { name: 'Referral', desc: 'Simple introductions, minimal involvement, 20% commission', highlight: false },
          { name: 'Strategic', desc: 'Joint meetings, co-branded work, 30% commission', highlight: true },
          { name: 'White-Label', desc: 'We work under your brand, 40% commission', highlight: false },
        ],
      },
      {
        id: 9,
        type: 'next',
        title: 'Let\'s Talk',
        steps: [
          { num: '01', title: 'Discovery Call', desc: '30 min to explore' },
          { num: '02', title: 'Agreement', desc: 'Simple terms' },
          { num: '03', title: 'Training', desc: '1-hour session' },
          { num: '04', title: 'First Referral', desc: 'Start earning' },
        ],
        cta: 'Ask AI anything about the partnership',
        website: 'www.allone.ge',
      },
    ],
    chat: {
      title: 'Ask about the partnership',
      placeholder: 'Ask anything...',
      thinking: 'Thinking...',
      intro: 'Ask me anything about the partnership program.',
    },
    langSwitch: 'ქართ',
  },
  ka: {
    slides: [
      {
        id: 1,
        type: 'title',
        title: 'პარტნიორობა',
        subtitle: 'AI და ტექნოლოგიური იმპლემენტაცია საკონსულტაციო ფირმებისთვის',
        tagline: 'Allone',
      },
      {
        id: 2,
        type: 'opportunity',
        title: 'შესაძლებლობა',
        statement: 'თქვენს კლიენტებს AI სჭირდებათ. ისინი თქვენ გენდობიან.',
        points: [
          'ბიზნესების 78%-ს AI დანერგვა სურს, მხოლოდ 15%-ს აქვს იმპლემენტაციის შესაძლებლობა',
          'AI სერვისების ბაზარი 35%-ით იზრდება ყოველწლიურად განვითარებად ბაზრებზე',
          'საკონსულტაციო ფირმები კარგავენ გარიგებებს, როცა კლიენტებს ტექ აღსრულება სჭირდებათ',
        ],
        bottom: 'რჩევასა და იმპლემენტაციას შორის უფსკრული ღირს დაკავებად.',
      },
      {
        id: 3,
        type: 'solution',
        title: 'გადაწყვეტა',
        statement: 'თქვენ რჩევას აძლევთ. ჩვენ ვაშენებთ.',
        model: [
          { step: '01', title: 'იდენტიფიცირება', desc: 'შესაძლებლობის დანახვა' },
          { step: '02', title: 'წარდგენა', desc: 'გაცნობა Allone-თან' },
          { step: '03', title: 'შეფასება', desc: 'გადაწყვეტის შეთავაზება' },
          { step: '04', title: 'მიწოდება', desc: 'აშენება და დანერგვა' },
          { step: '05', title: 'შემოსავალი', desc: 'საკომისიოს მიღება' },
        ],
      },
      {
        id: 4,
        type: 'track',
        title: 'რატომ Allone',
        statement: 'დადასტურებული შედეგები, არა დაპირებები',
        credentials: [
          'გუნდი Big4 და ტექ სტარტაპის გამოცდილებით',
          'სრული ციკლი: სტრატეგიიდან დანერგვამდე',
          'ქართულენოვანი რეგიონული ექსპერტიზით',
          'მოქნილი თანამშრომლობის მოდელები',
        ],
      },
      {
        id: 5,
        type: 'services',
        title: 'რას ვაშენებთ',
        statement: 'სრული AI და ტექნოლოგიური გადაწყვეტილებები',
        services: [
          { name: 'AI ასისტენტები', desc: 'ჩატბოტები და ასისტენტები', icon: 'bot' },
          { name: 'ავტომატიზაცია', desc: 'პროცესები და ინტეგრაციები', icon: 'zap' },
          { name: 'ხმოვანი AI', desc: 'ხმოვანი აგენტები', icon: 'mic' },
          { name: 'RAG სისტემები', desc: 'დოკუმენტის ინტელექტი', icon: 'book' },
          { name: 'პროგრამირება', desc: 'ვებ და მობაილ აპები', icon: 'code' },
          { name: 'ანალიტიკა', desc: 'დაშბორდები და ანალიზი', icon: 'chart' },
        ],
      },
      {
        id: 6,
        type: 'usecases',
        title: 'ამოიცანით სიგნალები',
        statement: 'როცა კლიენტები ამას ამბობენ, გაიხსენეთ Allone',
        cases: [
          { hear: 'საათობით ვხარჯავთ ანგარიშებზე', solution: 'ავტომატური ანგარიშგება' },
          { hear: 'მხარდაჭერა გადატვირთულია', solution: 'AI ჩატბოტი' },
          { hear: 'ძალიან ბევრი ხელით საქმე', solution: 'პროცესის ავტომატიზაცია' },
          { hear: 'ვერ ვპოულობთ ინფორმაციას', solution: 'დოკუმენტის AI' },
          { hear: '24/7 სერვისი გვჭირდება', solution: 'ხმოვანი AI აგენტი' },
        ],
      },
      {
        id: 7,
        type: 'benefits',
        title: 'რას იღებთ',
        statement: '20-40% საკომისიო ყველა პროექტზე',
        benefits: [
          { category: 'შემოსავალი', items: ['20-40% საკომისიო ჩართულობის მიხედვით', 'რეკურენტული შემოსავალი გამოწერებზე', 'შემოსავლის ლიმიტი არ არის'], icon: 'dollar' },
          { category: 'მხარდაჭერა', items: ['გუნდის ტრენინგი', 'თანაბრენდირებული წინადადებები', 'პერსონალური პარტნიორის მენეჯერი'], icon: 'handshake' },
          { category: 'ზრდა', items: ['სერვისების გაფართოება', 'ტექნოლოგიური პოზიციონირება', 'AI შესაძლებლობები დაქირავების გარეშე'], icon: 'trending' },
        ],
      },
      {
        id: 8,
        type: 'models',
        title: 'აირჩიეთ მოდელი',
        statement: 'მოქნილი პარტნიორობის ვარიანტები',
        options: [
          { name: 'რეფერალი', desc: 'მარტივი გაცნობა, მინიმალური ჩართულობა, 20% საკომისიო', highlight: false },
          { name: 'სტრატეგიული', desc: 'ერთობლივი შეხვედრები, თანაბრენდირება, 30% საკომისიო', highlight: true },
          { name: 'White-Label', desc: 'თქვენი ბრენდით ვმუშაობთ, 40% საკომისიო', highlight: false },
        ],
      },
      {
        id: 9,
        type: 'next',
        title: 'მოდით ვისაუბროთ',
        steps: [
          { num: '01', title: 'საწყისი ზარი', desc: '30 წუთი' },
          { num: '02', title: 'შეთანხმება', desc: 'მარტივი პირობები' },
          { num: '03', title: 'ტრენინგი', desc: '1-საათიანი' },
          { num: '04', title: 'პირველი რეფერალი', desc: 'დაიწყეთ შოულობა' },
        ],
        cta: 'დაუსვით AI-ს კითხვა პარტნიორობის შესახებ',
        website: 'www.allone.ge',
      },
    ],
    chat: {
      title: 'იკითხეთ პარტნიორობის შესახებ',
      placeholder: 'დასვით კითხვა...',
      thinking: 'ფიქრობს...',
      intro: 'დამისვით ნებისმიერი კითხვა პარტნიორობის პროგრამის შესახებ.',
    },
    langSwitch: 'ENG',
  },
};

// Partnership knowledge base for AI
const partnershipKnowledge = `
ALLONE PARTNERSHIP PROGRAM

WHO IS ALLONE:
Allone is a Georgian technology company specializing in AI solutions and digital transformation. We build AI assistants, process automation, voice AI, RAG systems, custom software, and analytics solutions.

PARTNERSHIP MODEL:
We partner with consulting firms to offer AI and technology implementation to their clients. The consulting firm identifies opportunities, introduces Allone, and earns commission on closed projects.

HOW IT WORKS:
1. Your consultant identifies a client who needs AI or technology
2. You make a warm introduction to Allone
3. Allone scopes the project and creates a proposal
4. Allone builds and deploys the solution
5. You receive commission when the client pays

COMMISSION:
Commission rates are negotiable based on involvement level, project complexity, and exclusivity. We're flexible and focused on terms that work for both parties.

PARTNERSHIP MODELS:
- Referral Partner: Simple introductions, minimal involvement, commission on closed deals
- Strategic Partner: Joint client meetings, co-branded deliverables, higher commission
- White-Label Partner: We work under your brand, you own the relationship

WHAT WE BUILD:
- AI Assistants: Custom chatbots, virtual assistants, customer service AI
- Process Automation: Workflow automation, data pipelines, integrations
- Voice AI: Voice agents, IVR systems, speech-to-text
- RAG Systems: AI that understands documents, intelligent knowledge bases
- Custom Development: Web apps, mobile apps, software solutions
- Analytics: Dashboards, automated reporting, business insights

TYPICAL USE CASES:
- "We spend hours on reports" → Automated reporting
- "Customer support overwhelmed" → AI chatbot
- "Too much manual data entry" → Process automation
- "Can't find info in documents" → Document AI assistant
- "Need 24/7 service" → Voice AI agent

PARTNER BENEFITS:
- Revenue: Commission on referrals, recurring on subscriptions, no cap
- Support: Team training, co-branded proposals, priority support
- Growth: Expand without hiring, tech-forward positioning

NEXT STEPS:
1. Discovery call (30 minutes)
2. Partnership agreement
3. Team enablement (1-hour training)
4. First referral

CONTACT:
Website: www.allone.ge
`;

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function PartnershipPage() {
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
      const response = await fetch('/api/partnership/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          context: partnershipKnowledge,
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
                {/* Logo + Allone branding */}
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

            {/* OPPORTUNITY */}
            {slide.type === 'opportunity' && (
              <div className="max-w-3xl mx-auto">
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs md:text-sm text-gray-400 tracking-[0.15em] uppercase mb-3">
                  01 — {lang === 'en' ? 'Opportunity' : 'შესაძლებლობა'}
                </motion.p>
                <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light mb-3 md:mb-4">
                  {slide.title}
                </motion.h2>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-lg md:text-xl text-gray-500 mb-8 md:mb-12">
                  {slide.statement}
                </motion.p>
                <div className="space-y-3 md:space-y-4">
                  {slide.points?.map((point, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={stagger(i)}
                      className="flex items-start gap-3 md:gap-4 bg-gray-50 rounded-xl md:rounded-2xl p-4 md:p-6"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-[#111] mt-2 flex-shrink-0" />
                      <span className="text-sm md:text-base lg:text-lg text-[#111]">{point}</span>
                    </motion.div>
                  ))}
                </div>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="text-sm md:text-base text-gray-400 mt-6 md:mt-8 text-center italic">
                  {slide.bottom}
                </motion.p>
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
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-lg md:text-xl text-gray-500 mb-8 md:mb-12">
                  {slide.statement}
                </motion.p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
                  {slide.model?.map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={stagger(i, 0.08)}
                      className="bg-gray-50 rounded-xl md:rounded-2xl p-4 md:p-5 text-center"
                    >
                      <div className="text-2xl md:text-3xl font-extralight text-gray-300 mb-2">{item.step}</div>
                      <h3 className="text-sm md:text-base font-medium mb-1">{item.title}</h3>
                      <p className="text-[10px] md:text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* TRACK RECORD */}
            {slide.type === 'track' && (
              <div className="max-w-3xl mx-auto">
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs md:text-sm text-gray-400 tracking-[0.15em] uppercase mb-3">
                  03 — {lang === 'en' ? 'Why Us' : 'რატომ ჩვენ'}
                </motion.p>
                <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light mb-3 md:mb-4">
                  {slide.title}
                </motion.h2>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-lg md:text-xl text-gray-500 mb-8 md:mb-10">
                  {slide.statement}
                </motion.p>
                <div className="space-y-3 md:space-y-4">
                  {slide.credentials?.map((credential: string, i: number) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={stagger(i, 0.1)}
                      className="flex items-center gap-3 md:gap-4 bg-[#111] text-white rounded-xl md:rounded-2xl p-4 md:p-6"
                    >
                      <div className="w-2 h-2 rounded-full bg-white flex-shrink-0" />
                      <span className="text-sm md:text-base lg:text-lg">{credential}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* SERVICES */}
            {slide.type === 'services' && (
              <div className="max-w-4xl mx-auto">
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs md:text-sm text-gray-400 tracking-[0.15em] uppercase mb-3">
                  04 — {lang === 'en' ? 'Capabilities' : 'შესაძლებლობები'}
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
                      className="bg-gray-50 rounded-xl md:rounded-2xl p-4 md:p-6"
                    >
                      <div className="text-[#111] mb-2 md:mb-3">{iconMap[service.icon]}</div>
                      <h3 className="text-sm md:text-base font-medium mb-1">{service.name}</h3>
                      <p className="text-xs md:text-sm text-gray-500">{service.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* USE CASES */}
            {slide.type === 'usecases' && (
              <div className="max-w-3xl mx-auto">
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs md:text-sm text-gray-400 tracking-[0.15em] uppercase mb-3">
                  05 — {lang === 'en' ? 'Use Cases' : 'გამოყენება'}
                </motion.p>
                <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light mb-3 md:mb-4">
                  {slide.title}
                </motion.h2>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-lg md:text-xl text-gray-500 mb-8 md:mb-10">
                  {slide.statement}
                </motion.p>
                <div className="space-y-2 md:space-y-3">
                  {slide.cases?.map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={stagger(i, 0.08)}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-gray-50 rounded-xl md:rounded-2xl p-4 md:p-5 gap-2 sm:gap-4"
                    >
                      <span className="text-sm md:text-base text-gray-600 italic">"{item.hear}"</span>
                      <span className="text-sm md:text-base text-[#111] font-medium flex items-center gap-2">
                        <span className="text-gray-300">→</span> {item.solution}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* BENEFITS */}
            {slide.type === 'benefits' && (
              <div className="max-w-4xl mx-auto">
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs md:text-sm text-gray-400 tracking-[0.15em] uppercase mb-3">
                  06 — {lang === 'en' ? 'Benefits' : 'სარგებელი'}
                </motion.p>
                <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light mb-3 md:mb-4">
                  {slide.title}
                </motion.h2>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-lg md:text-xl text-gray-500 mb-8 md:mb-10">
                  {slide.statement}
                </motion.p>
                <div className="grid md:grid-cols-3 gap-4 md:gap-6">
                  {slide.benefits?.map((benefit, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={stagger(i, 0.15)}
                      className="bg-gray-50 rounded-2xl md:rounded-3xl p-5 md:p-8"
                    >
                      <div className="text-[#111] mb-3 md:mb-4">{iconMap[benefit.icon]}</div>
                      <h3 className="text-base md:text-lg font-medium mb-3 md:mb-4">{benefit.category}</h3>
                      <ul className="space-y-2 md:space-y-3">
                        {benefit.items.map((item, j) => (
                          <li key={j} className="flex items-start gap-2 md:gap-3 text-xs md:text-sm text-gray-600">
                            <div className="w-1 h-1 rounded-full bg-gray-400 mt-1.5 flex-shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* MODELS */}
            {slide.type === 'models' && (
              <div className="max-w-4xl mx-auto">
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs md:text-sm text-gray-400 tracking-[0.15em] uppercase mb-3">
                  07 — {lang === 'en' ? 'Models' : 'მოდელები'}
                </motion.p>
                <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light mb-3 md:mb-4">
                  {slide.title}
                </motion.h2>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-lg md:text-xl text-gray-500 mb-8 md:mb-10">
                  {slide.statement}
                </motion.p>
                <div className="grid md:grid-cols-3 gap-4 md:gap-6">
                  {slide.options?.map((option, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={stagger(i, 0.15)}
                      className={`rounded-2xl md:rounded-3xl p-5 md:p-8 text-center transition-all ${
                        option.highlight
                          ? 'bg-[#111] text-white shadow-xl scale-[1.02]'
                          : 'bg-gray-50 border border-gray-100'
                      }`}
                    >
                      <h3 className="text-lg md:text-xl font-medium mb-2 md:mb-3">{option.name}</h3>
                      <p className={`text-xs md:text-sm leading-relaxed ${option.highlight ? 'text-white/70' : 'text-gray-500'}`}>
                        {option.desc}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* NEXT STEPS with LiquidMetal */}
            {slide.type === 'next' && (
              <div className="max-w-3xl mx-auto text-center">
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light mb-8 md:mb-12"
                >
                  {slide.title}
                </motion.h2>

                {/* Steps Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-10 md:mb-14">
                  {slide.steps?.map((step, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={stagger(i, 0.1)}
                      className="bg-gray-50 rounded-xl md:rounded-2xl p-4 md:p-5 text-left"
                    >
                      <span className="text-2xl md:text-3xl font-extralight text-gray-300">{step.num}</span>
                      <h3 className="text-sm md:text-base font-medium mt-2">{step.title}</h3>
                      <p className="text-[10px] md:text-xs text-gray-500 mt-1">{step.desc}</p>
                    </motion.div>
                  ))}
                </div>

                {/* LiquidMetal Ask AI Button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={shaderReady ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                  className="flex flex-col items-center gap-6"
                >
                  <p className="text-sm md:text-base text-gray-500">{slide.cta}</p>

                  {/* Ask AI Button with PulsingBorder */}
                  <div
                    onClick={openChat}
                    className="relative w-[260px] sm:w-[300px] md:w-[340px] h-[70px] sm:h-[80px] cursor-pointer group"
                  >
                    {/* PulsingBorder */}
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

                    {/* Inner content */}
                    <div className="relative z-10 h-full flex items-center justify-center gap-3 md:gap-4 px-4">
                      {/* LiquidMetal sparkle */}
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

                      {/* Ask AI text */}
                      <span className="text-base md:text-lg font-medium tracking-wide text-[#111] group-hover:opacity-70 transition-opacity">
                        Ask AI
                      </span>
                    </div>
                  </div>

                  {/* Website */}
                  <p className="text-sm md:text-base text-gray-400 mt-4">{slide.website}</p>
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
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsChatOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            />

            {/* Chat Panel */}
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-4 right-4 left-4 md:left-auto md:bottom-8 md:right-8 md:w-[420px] max-h-[70vh] md:max-h-[500px] bg-white rounded-2xl md:rounded-3xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col z-50"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 md:p-5 border-b border-gray-100">
                <h3 className="font-medium text-sm md:text-base">{chatText.title}</h3>
                <button onClick={() => setIsChatOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
                </button>
              </div>

              {/* Messages */}
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

              {/* Input */}
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
