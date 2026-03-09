'use client';

import { motion } from 'framer-motion';

interface Testimonial {
  quote: string;
  author: string;
  role: string;
  company: string;
}

const testimonials: Testimonial[] = [
  {
    quote: "ALLONE transformed our customer support with their AI chatbot. Response times dropped 80% and customer satisfaction is at an all-time high.",
    author: "Giorgi Kvaratskhelia",
    role: "CEO",
    company: "TechStart Georgia",
  },
  {
    quote: "The workflow automation they built saved us 20+ hours per week. Our team can now focus on what matters most — growing the business.",
    author: "Nino Basilaia",
    role: "Operations Director",
    company: "Borjomi Group",
  },
  {
    quote: "Their custom AI solution for lead scoring increased our conversion rate by 35%. The ROI was visible within the first month.",
    author: "David Maisuradze",
    role: "Head of Sales",
    company: "Georgian Airways",
  },
];

export function Testimonials() {
  return (
    <section className="py-[clamp(4rem,8vw,8rem)] bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mb-[clamp(3rem,6vw,5rem)]"
        >
          <p className="mono-label mb-4">Testimonials</p>
          <h2 className="text-3xl lg:text-4xl font-semibold text-heading leading-[1.1] tracking-[-0.03em]">
            What our clients say
          </h2>
        </motion.div>

        {/* Grid */}
        <div className="grid md:grid-cols-3 gap-4">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="rounded-2xl p-8 bg-white border border-border hover:border-accent/20 transition-colors flex flex-col"
            >
              {/* Quote mark */}
              <svg className="w-8 h-8 text-accent/30 mb-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
              </svg>

              <p className="text-foreground/80 leading-relaxed text-sm flex-1 mb-6">
                &ldquo;{t.quote}&rdquo;
              </p>

              <div className="pt-4 border-t border-border">
                <p className="text-heading font-medium text-sm">{t.author}</p>
                <p className="text-muted text-xs mt-0.5">
                  {t.role}, {t.company}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
