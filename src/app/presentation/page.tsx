'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Send, Bot, Mic, Search,
  Check, Phone, ArrowRight, AlertTriangle, Target,
  Diamond, TrendingUp, Brain, Clock, BookOpen, UserPlus,
  MessageSquare, Users, Zap
} from 'lucide-react';
import Image from 'next/image';

/* ─── Portfolio Data ─── */
const projects = [
  { src: '/images/work/equivalenza.webp', title: 'Equivalenza', subtitle: 'E-Commerce Platform', span: true },
  { src: '/images/work/datarooms.webp', title: 'DataRooms', subtitle: 'AI Data Rooms', span: true },
  { src: '/images/work/fifty.webp', title: 'FIFTY', subtitle: 'Innovation Space' },
  { src: '/images/work/hostwise.webp', title: 'HostWise', subtitle: 'Property Management' },
  { src: '/images/work/kaotenders.webp', title: 'KaoTenders', subtitle: 'B2B Industrial' },
  { src: '/images/work/chaos-concept.webp', title: 'Chaos Concept', subtitle: 'Fashion & Art' },
];

const clientNames = ['Equivalenza', 'DataRooms', 'FIFTY', 'HostWise', 'KaoTenders', 'Chaos Concept', 'INNRBURIAL'];

/* ─── Chat Responses ─── */
const chatResponses: Record<string, string> = {
  default: 'მადლობა შეკითხვისთვის! ჩვენი გუნდი დაგეხმარებათ AI ინტეგრაციაში. გსურთ უფასო კონსულტაციის დაჯავშნა?',
  price: 'ჩვენი სერვისების ფასები:\n\n• ვებსაიტი — 1,000₾-დან\n• AI ექსპერტი — 3,000₾ (ჩაშენება) + 600₾/თვე\n• AI ჩატბოტი — ინდივიდუალური შეფასება\n\nგსურთ დეტალური ინფორმაცია?',
  chatbot: 'AI ჩატბოტი პასუხობს მომხმარებელთა კითხვებს 24/7. Resolution rate: 94%, პასუხის დრო: <2 წამი.\n\nის ამცირებს მხარდაჭერის ხარჯებს 60%-ით და ერთდროულად ასობით მომხმარებელს ემსახურება.',
  expert: 'AI ექსპერტი — თქვენი კომპანიის ცოდნის ბაზა.\n\n✓ აგროვებს ყველა დოკუმენტს\n✓ პასუხობს კითხვებს მყისიერად\n✓ ატრენინგებს ახალ თანამშრომლებს\n✓ მუშაობს 24/7',
  website: 'ჩვენ ვქმნით თანამედროვე ვებსაიტებს Next.js-ით:\n\n✓ SEO ოპტიმიზირებული\n✓ მობაილ-ადაპტირებული\n✓ სწრაფი ჩატვირთვა\n✓ ვიზიტორების კონვერსია\n\nნახეთ პორტფოლიო: allone.ge/work',
  hello: 'გამარჯობა! კეთილი იყოს თქვენი მობრძანება ALLONE-ში. რა გაინტერესებთ — ვებსაიტი, AI ექსპერტი თუ ჩატბოტი?',
};

function getResponse(input: string) {
  const l = input.toLowerCase();
  if (l.includes('ფას') || l.includes('ღირ') || l.includes('price')) return chatResponses.price;
  if (l.includes('ჩატბოტ') || l.includes('chatbot') || l.includes('support')) return chatResponses.chatbot;
  if (l.includes('ექსპერტ') || l.includes('expert') || l.includes('ცოდნ')) return chatResponses.expert;
  if (l.includes('ვებ') || l.includes('საიტ') || l.includes('website')) return chatResponses.website;
  if (l.includes('გამარჯ') || l.includes('hello') || l.includes('hi')) return chatResponses.hello;
  return chatResponses.default;
}

/* ─── Animation Config ─── */
const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
};

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

/* ─── Sub-Components ─── */

function NumBadge({ n, light }: { n: string; light?: boolean }) {
  return (
    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg font-mono text-xs font-semibold ${
      light ? 'bg-white/20 text-white' : 'bg-[var(--accent-light)] text-[var(--accent)]'
    }`}>
      {n}
    </span>
  );
}

function MonoLabel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`font-mono text-[11px] font-semibold tracking-[0.12em] uppercase text-[var(--accent)] ${className}`}>
      {children}
    </p>
  );
}

function Divider() {
  return <div className="w-12 h-[3px] rounded-sm bg-[var(--accent)]" />;
}

function ProductMarker({ n, label }: { n: string; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <NumBadge n={n} />
      <MonoLabel>{label}</MonoLabel>
    </div>
  );
}

function ProblemCard({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-2xl p-8 md:p-10 bg-gradient-to-br from-red-50 to-orange-50 border border-red-200">
      <span className="absolute -top-5 -right-3 text-[160px] font-black text-red-500/[0.06] leading-none select-none">!</span>
      <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mb-5 text-red-500">
        {icon}
      </div>
      <h3 className="text-2xl font-bold text-[var(--heading)] mb-3">პრობლემა</h3>
      <div className="text-base text-[var(--text)] leading-relaxed">{children}</div>
    </div>
  );
}

function SolutionCard({ children, extra }: { children: React.ReactNode; extra?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl p-8 md:p-10 bg-white/70 backdrop-blur-xl border border-[var(--border)]">
      <h3 className="text-2xl font-bold text-[var(--heading)]">ჩვენი გადაწყვეტა</h3>
      <Divider />
      <div className="text-base text-[var(--text)] leading-relaxed">{children}</div>
      {extra}
    </div>
  );
}

function PriceBlock({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-[#071D2F] text-white rounded-2xl px-6 py-5 text-center flex-1">
      <div className="text-xs opacity-50 mb-1">{label}</div>
      <div className="text-2xl md:text-3xl font-extrabold tracking-tight">{value}</div>
      {sub && <div className="text-xs opacity-50 mt-1">{sub}</div>}
    </div>
  );
}

function BenefitItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 text-[15px] leading-relaxed">
      <span className="mt-0.5 w-6 h-6 min-w-[24px] rounded-full bg-[var(--accent-light)] text-[var(--accent)] flex items-center justify-center">
        <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
      </span>
      <span>{children}</span>
    </li>
  );
}

function Tag({ children, light }: { children: React.ReactNode; light?: boolean }) {
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full font-mono text-[11px] font-semibold tracking-wide ${
      light
        ? 'bg-white/15 text-white'
        : 'bg-[var(--accent-light)] text-[var(--accent)]'
    }`}>
      {children}
    </span>
  );
}

function WorkflowStep({ n, title, sub, active }: { n: string; title: string; sub: string; active: boolean }) {
  return (
    <div className={`flex items-center gap-4 px-5 py-4 rounded-xl border transition-all duration-300 ${
      active
        ? 'border-[var(--accent)] bg-[var(--accent-light)]'
        : 'border-[var(--border-light)] bg-[var(--surface)]'
    }`}>
      <span className={`w-8 h-8 rounded-lg font-mono text-sm font-bold flex items-center justify-center transition-colors duration-300 ${
        active ? 'bg-[var(--accent)] text-white' : 'bg-[var(--accent-light)] text-[var(--accent)]'
      }`}>{n}</span>
      <div>
        <div className="text-sm font-semibold text-[var(--heading)]">{title}</div>
        <div className="text-xs text-[var(--muted)]">{sub}</div>
      </div>
    </div>
  );
}

/* ─── Expert Demo ─── */
function ExpertDemo({ active }: { active: boolean }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ title: string; text: string; confidence: string }[]>([]);
  const hasRun = useRef(false);

  useEffect(() => {
    if (!active || hasRun.current) return;
    hasRun.current = true;
    const fullQuery = 'როგორ მუშაობს შვებულების პროცესი?';
    let i = 0;

    const typeTimer = setInterval(() => {
      if (i <= fullQuery.length) {
        setQuery(fullQuery.slice(0, i));
        i++;
      } else {
        clearInterval(typeTimer);
        setTimeout(() => {
          setResults([
            { title: 'შვებულების პროცედურა', text: 'თანამშრომელმა უნდა შეავსოს განაცხადი HR პორტალზე მინიმუმ 5 სამუშაო დღით ადრე. მენეჯერი ამტკიცებს 2 დღეში.', confidence: '97%' },
            { title: 'სამართლებრივი ჩარჩო', text: 'შრომის კოდექსის 21-ე მუხლის მიხედვით, წელიწადში 24 სამუშაო დღე ანაზღაურებადი შვებულება.', confidence: '94%' },
          ]);
        }, 400);
      }
    }, 50);

    return () => clearInterval(typeTimer);
  }, [active]);

  // Reset on deactivate
  useEffect(() => {
    if (!active) {
      hasRun.current = false;
      setQuery('');
      setResults([]);
    }
  }, [active]);

  return (
    <div className="w-full max-w-[380px] bg-white rounded-2xl border border-[var(--border)] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
      {/* Header */}
      <div className="bg-[#071D2F] text-white px-6 py-5 flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-[var(--accent)] flex items-center justify-center">
          <Brain className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="font-bold text-[15px]">AI Expert</div>
          <div className="text-xs opacity-60">თქვენი კომპანიის ცოდნა</div>
        </div>
      </div>
      {/* Body */}
      <div className="p-5">
        <div className="flex items-center gap-2 px-4 py-2.5 bg-[var(--surface)] rounded-xl border border-[var(--border-light)] mb-4">
          <Search className="w-4 h-4 text-[var(--muted)]" />
          <span className="text-sm text-[var(--text)] flex-1">{query}<span className="inline-block w-[2px] h-4 bg-[var(--accent)] ml-0.5 animate-pulse align-middle" /></span>
        </div>
        <div className="space-y-2">
          {results.map((r, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.2, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="bg-[var(--surface)] rounded-xl p-4 border-l-[3px] border-l-[var(--accent)]"
            >
              <h5 className="text-[13px] font-semibold text-[var(--heading)] mb-1">{r.title}</h5>
              <p className="text-xs text-[var(--muted)] leading-relaxed">{r.text}</p>
              <div className="flex items-center gap-1 mt-2 text-[11px] font-semibold text-emerald-500">
                <Check className="w-3 h-3" strokeWidth={2.5} />
                Confidence: {r.confidence}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Chat Demo ─── */
interface ChatMsg {
  id: number;
  role: 'user' | 'bot';
  text: string;
}

function ChatDemo({ active }: { active: boolean }) {
  const [messages, setMessages] = useState<ChatMsg[]>([
    { id: 0, role: 'bot', text: 'გამარჯობა! მე ვარ ALLONE AI ასისტენტი. რითი შემიძლია დაგეხმაროთ?' },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const send = useCallback(() => {
    const text = input.trim();
    if (!text || typing) return;
    const uid = Date.now();
    setMessages(prev => [...prev, { id: uid, role: 'user', text }]);
    setInput('');
    setTyping(true);

    setTimeout(() => {
      setTyping(false);
      setMessages(prev => [...prev, { id: uid + 1, role: 'bot', text: getResponse(text) }]);
    }, 1200);
  }, [input, typing]);

  return (
    <div className="w-full max-w-[380px] h-[520px] bg-white rounded-2xl border border-[var(--border)] flex flex-col overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--border-light)]">
        <div className="w-10 h-10 rounded-full bg-[#071D2F] flex items-center justify-center text-white">
          <Bot className="w-[18px] h-[18px]" />
        </div>
        <div>
          <div className="font-bold text-sm text-[var(--text)]">ALLONE Assistant</div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Online
          </div>
        </div>
      </div>
      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-3">
        {messages.map(m => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] px-4 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap ${
              m.role === 'user'
                ? 'bg-[#071D2F] text-white rounded-2xl rounded-br-sm'
                : 'bg-[var(--surface)] text-[var(--text)] rounded-2xl rounded-bl-sm'
            }`}>
              {m.text}
            </div>
          </motion.div>
        ))}
        {typing && (
          <div className="flex gap-1 px-4 py-3 bg-[var(--surface)] rounded-2xl rounded-bl-sm w-fit">
            {[0, 1, 2].map(i => (
              <span key={i} className="w-1.5 h-1.5 rounded-full bg-[var(--muted)] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        )}
        <div ref={endRef} />
      </div>
      {/* Input */}
      <div className="p-3 border-t border-[var(--border-light)]">
        <div className="flex items-center gap-2">
          <button className="w-9 h-9 rounded-full bg-[var(--surface)] border border-[var(--border-light)] flex items-center justify-center text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors">
            <Mic className="w-4 h-4" />
          </button>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); send(); } }}
            placeholder="დაწერე შეკითხვა..."
            className="flex-1 px-4 py-2.5 bg-[var(--surface)] rounded-full text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
          />
          <button
            onClick={send}
            disabled={!input.trim() || typing}
            className="w-9 h-9 rounded-full bg-[#071D2F] text-white flex items-center justify-center hover:bg-[var(--accent)] disabled:opacity-40 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-center text-[10px] text-[var(--muted)] mt-2">Powered by ALLONE AI</p>
      </div>
    </div>
  );
}

/* ─── Main Presentation ─── */
export default function PresentationPage() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);
  const TOTAL = 10;

  const go = useCallback((n: number) => {
    if (n === current || n < 0 || n >= TOTAL) return;
    setDirection(n > current ? 1 : -1);
    setCurrent(n);
  }, [current]);

  const next = useCallback(() => go(current + 1), [go, current]);
  const prev = useCallback(() => go(current - 1), [go, current]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return;
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [next, prev]);

  // Touch swipe
  const touchX = useRef(0);
  useEffect(() => {
    const start = (e: TouchEvent) => { touchX.current = e.touches[0].clientX; };
    const end = (e: TouchEvent) => {
      const diff = touchX.current - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 60) diff > 0 ? next() : prev();
    };
    window.addEventListener('touchstart', start);
    window.addEventListener('touchend', end);
    return () => { window.removeEventListener('touchstart', start); window.removeEventListener('touchend', end); };
  }, [next, prev]);

  // Workflow demo step highlighting
  const [activeSteps, setActiveSteps] = useState<number[]>([]);
  useEffect(() => {
    if (current === 7) {
      setActiveSteps([]);
      const timers = [0, 1, 2].map((i) =>
        setTimeout(() => setActiveSteps(prev => [...prev, i]), (i + 1) * 700)
      );
      return () => timers.forEach(clearTimeout);
    } else {
      setActiveSteps([]);
    }
  }, [current]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-white select-none">
      {/* Logo */}
      <div className="fixed top-8 left-10 z-50 text-xl font-extrabold tracking-tight text-[var(--heading)]">
        ALL<span className="text-[var(--accent)]">ONE</span>
      </div>

      {/* Slides */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={current}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 flex flex-col justify-center items-center overflow-y-auto"
          style={{ padding: 'clamp(40px, 5vw, 60px) clamp(24px, 6vw, 80px)' }}
        >
          {/* ── SLIDE 0: Cover ── */}
          {current === 0 && (
            <motion.div variants={stagger} initial="hidden" animate="show" className="flex flex-col items-center text-center gap-6">
              <motion.div variants={fadeUp}><MonoLabel>ALLONE.GE</MonoLabel></motion.div>
              <motion.div variants={fadeUp}>
                <h1 className="text-[clamp(40px,5vw,72px)] font-extrabold text-[var(--heading)] tracking-[-0.03em] leading-[1.05]">
                  პროდუქტები &<br />სერვისები
                </h1>
              </motion.div>
              <motion.div variants={fadeUp}><Divider /></motion.div>
              <motion.div variants={fadeUp}>
                <p className="text-[clamp(16px,1.5vw,22px)] text-[var(--muted)] leading-relaxed max-w-xl">
                  AI-ით გაძლიერებული გადაწყვეტილებები,<br />რომლებიც ბიზნესს ზრდის
                </p>
              </motion.div>
              <motion.div variants={fadeUp} className="flex gap-3 mt-2">
                <Tag>ვებსაიტი</Tag>
                <Tag>AI ექსპერტი</Tag>
                <Tag>AI ჩატბოტი</Tag>
              </motion.div>
              <motion.div variants={fadeUp} className="mt-8">
                <button onClick={next} className="inline-flex items-center gap-2 px-8 py-3.5 bg-[var(--accent)] text-white rounded-full text-[15px] font-semibold hover:bg-[var(--accent-hover)] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(10,104,245,0.3)] transition-all">
                  დაიწყე პრეზენტაცია <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            </motion.div>
          )}

          {/* ── SLIDE 1: Website — Problem & Solution ── */}
          {current === 1 && (
            <motion.div variants={stagger} initial="hidden" animate="show" className="w-full max-w-[1100px] flex flex-col gap-8">
              <motion.div variants={fadeUp}><ProductMarker n="01" label="ვებსაიტი" /></motion.div>
              <motion.div variants={fadeUp} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ProblemCard icon={<AlertTriangle className="w-6 h-6" />}>
                  <p>
                    დღეს კომპანიების <strong>70%-ზე მეტს</strong> აქვს ვებსაიტი, მაგრამ მხოლოდ მცირე ნაწილი იყენებს მას როგორც <strong>ბრენდინგის მთავარ ინსტრუმენტს</strong> და აქტიური გაყიდვების დამხმარე საშუალებას.
                  </p>
                </ProblemCard>
                <SolutionCard
                  extra={
                    <>
                      <div className="flex gap-2 flex-wrap">
                        <Tag>Next.js</Tag><Tag>React</Tag><Tag>Tailwind</Tag><Tag>Vercel</Tag>
                      </div>
                      <PriceBlock label="ფასი" value="1,000₾-დან" />
                    </>
                  }
                >
                  <p>მაღალი ხარისხი, მაღალი სიჩქარე, დაბალი ფასი — <strong>ერთ პროდუქტში.</strong></p>
                </SolutionCard>
              </motion.div>
            </motion.div>
          )}

          {/* ── SLIDE 2: Website — Benefits ── */}
          {current === 2 && (
            <motion.div variants={stagger} initial="hidden" animate="show" className="w-full max-w-[1100px] flex flex-col gap-8">
              <motion.div variants={fadeUp}>
                <ProductMarker n="01" label="ვებსაიტი — უპირატესობები" />
                <h2 className="text-[clamp(28px,3.5vw,48px)] font-bold text-[var(--heading)] tracking-tight mt-2">
                  ჩვენი ვებსაიტები ეხმარება კომპანიებს
                </h2>
              </motion.div>
              <motion.div variants={fadeUp} className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[
                  { icon: <Target className="w-8 h-8 text-[var(--accent)]" />, title: 'კონვერსია', desc: 'ვებსაიტის ვიზიტორები გადაიქცნენ კლიენტებად' },
                  { icon: <Diamond className="w-8 h-8 text-[var(--accent)]" />, title: 'ბრენდი', desc: 'კომპანიას ჰქონდეს ძლიერი ონლაინ ბრენდი' },
                  { icon: <TrendingUp className="w-8 h-8 text-[var(--accent)]" />, title: 'გაყიდვები', desc: 'კარგად სტრუქტურირებული ვებსაიტით ნათლად აჩვენოს პროდუქტის ფასეულობა' },
                ].map((card, i) => (
                  <div key={i} className="rounded-2xl p-8 bg-white/70 backdrop-blur-xl border border-[var(--border)] hover:border-[var(--accent)]/20 hover:shadow-[0_8px_40px_rgba(10,104,245,0.08)] transition-all flex flex-col items-center text-center gap-4">
                    {card.icon}
                    <h3 className="text-lg font-bold text-[var(--heading)]">{card.title}</h3>
                    <p className="text-sm text-[var(--muted)] leading-relaxed">{card.desc}</p>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          )}

          {/* ── SLIDE 3: Website — Portfolio ── */}
          {current === 3 && (
            <motion.div variants={stagger} initial="hidden" animate="show" className="w-full max-w-[1100px] flex flex-col gap-6">
              <motion.div variants={fadeUp}>
                <ProductMarker n="01" label="ვებსაიტი — პორტფოლიო" />
                <h2 className="text-[clamp(28px,3.5vw,48px)] font-bold text-[var(--heading)] tracking-tight mt-2">Selected Works</h2>
                <p className="text-[var(--muted)] text-lg mt-1">ჩვენი უახლესი პროექტები</p>
              </motion.div>
              <motion.div variants={fadeUp} className="grid grid-cols-4 gap-3">
                {projects.map((p, i) => (
                  <div key={i} className={`relative rounded-xl overflow-hidden border border-[var(--border-light)] group cursor-pointer ${p.span ? 'col-span-2 aspect-video' : 'aspect-[4/3]'}`}>
                    <Image
                      src={p.src}
                      alt={p.title}
                      fill
                      sizes={p.span ? '50vw' : '25vw'}
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--dark)]/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                      <h4 className="text-[15px] font-bold text-white">{p.title}</h4>
                      <p className="text-xs text-white/70">{p.subtitle}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
              {/* Marquee */}
              <motion.div variants={fadeUp} className="w-full overflow-hidden" style={{ maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)' }}>
                <div className="flex gap-20 animate-[marquee_25s_linear_infinite] whitespace-nowrap">
                  {[...clientNames, ...clientNames].map((name, i) => (
                    <span key={i} className="text-2xl font-bold text-[var(--text)]/[0.08] tracking-tight font-[family-name:var(--font-display)]">{name}</span>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* ── SLIDE 4: AI Expert — Problem ── */}
          {current === 4 && (
            <motion.div variants={stagger} initial="hidden" animate="show" className="w-full max-w-[1100px] flex flex-col gap-8">
              <motion.div variants={fadeUp}><ProductMarker n="02" label="AI ექსპერტი" /></motion.div>
              <motion.div variants={fadeUp} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ProblemCard icon={<Brain className="w-6 h-6" />}>
                  <p>
                    დღეს კომპანიებში ინფორმაცია და ე.წ. <strong>know how</strong> ხშირად გაფანტულია დოკუმენტებში, ელ.ფოსტებში, სხვადასხვა სისტემაში და თანამშრომლების მეხსიერებაში — <strong>არ არსებობს სისტემატიზებული სახით.</strong>
                  </p>
                </ProblemCard>
                <SolutionCard>
                  <p>AI ექსპერტი არის კომპანიის <strong>{'"'}საკუთარი ChatGPT{'"'}</strong> რომელიც მხოლოდ მის მონაცემებზეა გაწვრთნილი.</p>
                  <p className="text-sm text-[var(--muted)] leading-relaxed mt-2">
                    ხელოვნური ინტელექტის სისტემა, რომელიც აგროვებს კომპანიის ყველა ინფორმაციას ერთ სივრცეში და აქცევს მას ინტელექტუალურ ასისტენტად.
                  </p>
                </SolutionCard>
              </motion.div>
            </motion.div>
          )}

          {/* ── SLIDE 5: AI Expert — Benefits + Demo ── */}
          {current === 5 && (
            <motion.div variants={stagger} initial="hidden" animate="show" className="w-full max-w-[1100px] flex flex-col md:flex-row gap-10 items-start">
              <motion.div variants={fadeUp} className="flex-1 flex flex-col gap-6">
                <div>
                  <ProductMarker n="02" label="AI ექსპერტი — უპირატესობები" />
                  <h2 className="text-[clamp(22px,2.5vw,32px)] font-bold text-[var(--heading)] tracking-tight mt-2">
                    როცა კომპანიას აქვს AI ექსპერტი
                  </h2>
                </div>
                <ul className="flex flex-col gap-3.5">
                  <BenefitItem><strong>AI თანამშრომელი</strong> — იცის კომპანიის ყველა დოკუმენტი და პროცესი</BenefitItem>
                  <BenefitItem><strong>24/7 მუშაობა</strong> — გადაწყვეტილებები სწრაფდება, ინფორმაცია არასოდეს იკარგება</BenefitItem>
                  <BenefitItem><strong>მყისიერი პასუხები</strong> — თანამშრომლები დროს არ ხარჯავენ მოძიებაში</BenefitItem>
                  <BenefitItem><strong>ცოდნის შენახვა</strong> — თანამშრომელი წავა, ცოდნა არ დაიკარგება</BenefitItem>
                  <BenefitItem><strong>სწრაფი ონბორდინგი</strong> — ახალი თანამშრომლის ტრენინგი AI-ით</BenefitItem>
                </ul>
                <div className="flex gap-4 mt-2">
                  <PriceBlock label="ჩაშენება" value="3,000₾-დან" />
                  <PriceBlock label="ყოველთვიური" value="600₾-დან" />
                </div>
              </motion.div>
              <motion.div variants={fadeUp}>
                <ExpertDemo active={current === 5} />
              </motion.div>
            </motion.div>
          )}

          {/* ── SLIDE 6: AI Chatbot — Problem ── */}
          {current === 6 && (
            <motion.div variants={stagger} initial="hidden" animate="show" className="w-full max-w-[1100px] flex flex-col gap-8">
              <motion.div variants={fadeUp}><ProductMarker n="03" label="AI ჩატბოტი — Customer Support" /></motion.div>
              <motion.div variants={fadeUp} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ProblemCard icon={<MessageSquare className="w-6 h-6" />}>
                  <p>
                    როცა კომპანიაში ბევრი შეკითხვა შედის, თანამშრომლები დიდ დროს ხარჯავენ ერთსა და იმავე კითხვებზე პასუხში. <strong>თუ მომხმარებელი სწრაფად ვერ იღებს პასუხს — ტოვებს პლატფორმას და კონკურენტთან მიდის.</strong>
                  </p>
                </ProblemCard>
                <SolutionCard
                  extra={
                    <div className="flex gap-5 mt-2">
                      {[
                        { val: '94%', label: 'Resolution rate' },
                        { val: '<2s', label: 'Response time' },
                        { val: '24/7', label: 'Availability' },
                      ].map((s, i) => (
                        <div key={i} className="text-center">
                          <div className="text-2xl md:text-3xl font-extrabold text-[var(--accent)] tracking-tight">{s.val}</div>
                          <div className="text-xs text-[var(--muted)] mt-1">{s.label}</div>
                        </div>
                      ))}
                    </div>
                  }
                >
                  <p>AI ჩატბოტი პასუხობს მომხმარებლების კითხვებს <strong>24/7</strong>, რაც მნიშვნელოვნად ამცირებს მხარდაჭერის გუნდის დატვირთვას.</p>
                  <p className="text-sm text-[var(--muted)] leading-relaxed mt-2">
                    ერთდროულად ასობით მომხმარებელს ემსახურება — აუმჯობესებს გამოცდილებას და ზრდის გაყიდვებს.
                  </p>
                </SolutionCard>
              </motion.div>
            </motion.div>
          )}

          {/* ── SLIDE 7: Chatbot — Live Demo ── */}
          {current === 7 && (
            <motion.div variants={stagger} initial="hidden" animate="show" className="w-full max-w-[1100px] flex flex-col md:flex-row gap-10 items-center">
              <motion.div variants={fadeUp} className="flex-1 flex flex-col gap-6">
                <div>
                  <ProductMarker n="03" label="ALLONE AI — ცოცხალი დემო" />
                  <h2 className="text-[clamp(22px,2.5vw,32px)] font-bold text-[var(--heading)] tracking-tight mt-2">
                    AI ჩატბოტი & ასისტენტი
                  </h2>
                  <p className="text-[var(--muted)] mt-2">
                    ინტერაქტიული დემო — დაწერე შეკითხვა და ნახე როგორ მუშაობს
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <WorkflowStep n="1" title="მომხმარებელი წერს შეკითხვას" sub="ტექსტით ან ხმით" active={activeSteps.includes(0)} />
                  <div className="text-center text-[var(--border)] text-xl py-1">↓</div>
                  <WorkflowStep n="2" title="AI ამუშავებს შეკითხვას" sub="კომპანიის ცოდნაზე დაფუძნებით" active={activeSteps.includes(1)} />
                  <div className="text-center text-[var(--border)] text-xl py-1">↓</div>
                  <WorkflowStep n="3" title="მყისიერი, ზუსტი პასუხი" sub="<2 წამში, 24/7" active={activeSteps.includes(2)} />
                </div>
              </motion.div>
              <motion.div variants={fadeUp}>
                <ChatDemo active={current === 7} />
              </motion.div>
            </motion.div>
          )}

          {/* ── SLIDE 8: All Products Summary ── */}
          {current === 8 && (
            <motion.div variants={stagger} initial="hidden" animate="show" className="w-full max-w-[1100px] flex flex-col gap-8 items-center">
              <motion.div variants={fadeUp} className="text-center">
                <MonoLabel>პროდუქტები</MonoLabel>
                <h2 className="text-[clamp(28px,3.5vw,48px)] font-bold text-[var(--heading)] tracking-tight mt-2">ყველა სერვისი ერთ ადგილას</h2>
              </motion.div>
              <motion.div variants={fadeUp} className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full">
                {/* Website */}
                <div className="flex flex-col gap-4 rounded-2xl p-8 bg-white border border-[var(--border)] hover:border-[var(--accent)]/20 hover:shadow-lg transition-all">
                  <div className="flex items-center gap-2.5"><NumBadge n="01" /><span className="font-mono text-[11px] font-semibold tracking-wide uppercase text-[var(--text)]">ვებსაიტი</span></div>
                  <h3 className="text-xl font-bold text-[var(--heading)]">Web Development</h3>
                  <p className="text-[13px] text-[var(--muted)] leading-relaxed flex-1">Beautiful, responsive interfaces that load instantly and convert visitors into customers.</p>
                  <div className="flex gap-1.5 flex-wrap"><Tag>Next.js</Tag><Tag>React</Tag><Tag>Tailwind</Tag></div>
                  <div className="border-t border-[var(--border-light)] pt-4 mt-auto">
                    <span className="text-[28px] font-extrabold text-[var(--heading)]">1,000₾</span>
                    <span className="text-sm text-[var(--muted)]">-დან</span>
                  </div>
                </div>

                {/* AI Expert — Accent */}
                <div className="flex flex-col gap-4 rounded-2xl p-8 bg-[var(--accent)] text-white">
                  <div className="flex items-center gap-2.5"><NumBadge n="02" light /><span className="font-mono text-[11px] font-semibold tracking-wide uppercase text-white/60">AI ექსპერტი</span></div>
                  <h3 className="text-xl font-bold">AI Expert</h3>
                  <p className="text-[13px] text-white/70 leading-relaxed flex-1">Your company&apos;s own ChatGPT — trained exclusively on your data, processes, and knowledge.</p>
                  <div className="flex gap-1.5 flex-wrap"><Tag light>NLP</Tag><Tag light>RAG</Tag><Tag light>24/7</Tag></div>
                  <div className="border-t border-white/20 pt-4 mt-auto">
                    <span className="text-[28px] font-extrabold">3,000₾</span>
                    <span className="text-sm opacity-60">-დან</span>
                    <div className="text-xs opacity-50 mt-0.5">+ 600₾/თვე სერვისი</div>
                  </div>
                </div>

                {/* AI Chatbot */}
                <div className="flex flex-col gap-4 rounded-2xl p-8 bg-white border border-[var(--border)] hover:border-[var(--accent)]/20 hover:shadow-lg transition-all">
                  <div className="flex items-center gap-2.5"><NumBadge n="03" /><span className="font-mono text-[11px] font-semibold tracking-wide uppercase text-[var(--text)]">AI ჩატბოტი</span></div>
                  <h3 className="text-xl font-bold text-[var(--heading)]">AI Chatbot</h3>
                  <p className="text-[13px] text-[var(--muted)] leading-relaxed flex-1">24/7 customer support that resolves issues instantly and scales to hundreds of simultaneous users.</p>
                  <div className="flex gap-1.5 flex-wrap"><Tag>Support</Tag><Tag>Sales</Tag><Tag>Onboarding</Tag></div>
                  <div className="border-t border-[var(--border-light)] pt-4 mt-auto flex gap-5">
                    <div>
                      <div className="text-[22px] font-extrabold text-[var(--accent)]">94%</div>
                      <div className="text-[11px] text-[var(--muted)]">Resolution</div>
                    </div>
                    <div>
                      <div className="text-[22px] font-extrabold text-[var(--accent)]">&lt;2s</div>
                      <div className="text-[11px] text-[var(--muted)]">Response</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* ── SLIDE 9: CTA ── */}
          {current === 9 && (
            <motion.div variants={stagger} initial="hidden" animate="show" className="flex flex-col items-center text-center gap-7">
              <motion.div variants={fadeUp}><MonoLabel className="!text-[var(--muted)]">ALLONE.GE</MonoLabel></motion.div>
              <motion.div variants={fadeUp}>
                <h1 className="text-[clamp(40px,5vw,72px)] font-extrabold text-[var(--heading)] tracking-[-0.03em] leading-[1.05]">
                  დავიწყოთ<br />თანამშრომლობა
                </h1>
              </motion.div>
              <motion.div variants={fadeUp}>
                <p className="text-[clamp(16px,1.5vw,22px)] text-[var(--muted)] leading-relaxed max-w-xl">
                  AI-ით გაძლიერებული გადაწყვეტილებები თქვენი ბიზნესისთვის
                </p>
              </motion.div>
              <motion.div variants={fadeUp} className="flex gap-4 mt-4">
                <a href="/contact" className="inline-flex items-center gap-2 px-8 py-3.5 bg-[var(--accent)] text-white rounded-full text-[15px] font-semibold hover:bg-[var(--accent-hover)] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(10,104,245,0.3)] transition-all">
                  <Phone className="w-4 h-4" /> დაჯავშნე ზარი
                </a>
                <a href="/" className="inline-flex items-center gap-2 px-8 py-3.5 border-[1.5px] border-[var(--border)] text-[var(--text)] rounded-full text-[15px] font-semibold hover:bg-[var(--surface)] transition-all">
                  allone.ge <ArrowRight className="w-4 h-4" />
                </a>
              </motion.div>
              <motion.div variants={fadeUp} className="flex gap-8 mt-10 text-[13px] text-[var(--muted)]">
                <span>Tbilisi, Georgia</span>
                <span>Brussels, Belgium</span>
                <span>info@allone.ge</span>
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* ── Navigation Bar ── */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-white/85 backdrop-blur-xl border border-[var(--border)] px-5 py-2.5 rounded-full shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
        <button
          onClick={prev}
          disabled={current === 0}
          className="w-9 h-9 rounded-full border border-[var(--border)] bg-white flex items-center justify-center text-[var(--text)] hover:bg-[var(--accent)] hover:text-white hover:border-[var(--accent)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex gap-1.5">
          {Array.from({ length: TOTAL }).map((_, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === current ? 'w-6 bg-[var(--accent)]' : 'w-2 bg-[var(--border)] hover:bg-[var(--muted)]'
              }`}
            />
          ))}
        </div>

        <span className="font-mono text-xs text-[var(--muted)] min-w-[44px] text-center">
          {current + 1} / {TOTAL}
        </span>

        <button
          onClick={next}
          disabled={current === TOTAL - 1}
          className="w-9 h-9 rounded-full border border-[var(--border)] bg-white flex items-center justify-center text-[var(--text)] hover:bg-[var(--accent)] hover:text-white hover:border-[var(--accent)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Marquee keyframe — needed for Tailwind */}
      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
