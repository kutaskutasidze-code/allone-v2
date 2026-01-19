'use client';

import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';

interface Testimonial {
  quote: string;
  author: string;
  role: string;
  company: string;
}

// Static testimonials - can be moved to database later
const testimonials: Testimonial[] = [
  {
    quote: "ALLONE transformed our customer support with their AI chatbot. Response times dropped 80% and customer satisfaction is at an all-time high.",
    author: "Giorgi Kvaratskhelia",
    role: "CEO",
    company: "TechStart Georgia",
  },
  {
    quote: "The workflow automation they built saved us 20+ hours per week. Our team can now focus on what matters most - growing the business.",
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
    <section className="py-24 lg:py-32 bg-zinc-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mb-16"
        >
          <p className="text-zinc-500 text-sm font-medium tracking-wide uppercase mb-4">
            Testimonials
          </p>
          <h2 className="text-3xl lg:text-4xl font-light text-zinc-900 leading-tight">
            What our clients say
          </h2>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-white rounded-2xl p-8 border border-zinc-200"
            >
              <Quote className="w-8 h-8 text-zinc-200 mb-6" />
              <p className="text-zinc-700 leading-relaxed mb-6">
                &quot;{testimonial.quote}&quot;
              </p>
              <div>
                <p className="font-medium text-zinc-900">{testimonial.author}</p>
                <p className="text-sm text-zinc-500">
                  {testimonial.role}, {testimonial.company}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
