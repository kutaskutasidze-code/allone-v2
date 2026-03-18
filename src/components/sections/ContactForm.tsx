'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Check } from 'lucide-react';
import { Container } from '@/components/layout';
import { Button, Input, Textarea, Select } from '@/components/ui';
import { useContactInfo } from '@/contexts';

const serviceOptions = [
  { value: 'chatbots', label: 'AI Chatbots & Assistants' },
  { value: 'automation', label: 'Workflow Automation' },
  { value: 'custom', label: 'Custom AI Solutions' },
  { value: 'consulting', label: 'AI Strategy & Consulting' },
  { value: 'other', label: 'Other' },
];

interface FormState {
  name: string;
  email: string;
  company: string;
  service: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  message?: string;
}

export function ContactForm() {
  const { contactInfo } = useContactInfo();
  const [formData, setFormData] = useState<FormState>({
    name: '',
    email: '',
    company: '',
    service: '',
    message: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setIsSubmitted(true);
        setFormData({ name: '', email: '', company: '', service: '', message: '' });
      }
    } catch {
      setErrors({ message: 'Failed to send. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  if (isSubmitted) {
    return (
      <section className="py-24 lg:py-32">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-xl mx-auto text-center py-20"
          >
            <div className="w-16 h-16 border border-black rounded-full flex items-center justify-center mx-auto mb-8">
              <Check className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-[var(--font-display)] font-light text-black mb-4">
              Message sent
            </h2>
            <p className="text-[var(--gray-600)] mb-8">
              Thank you for reaching out. We&apos;ll be in touch within 24 hours.
            </p>
            <Button variant="outline" onClick={() => setIsSubmitted(false)}>
              Send Another
            </Button>
          </motion.div>
        </Container>
      </section>
    );
  }

  return (
    <section className="py-24 lg:py-32">
      <Container>
        <div className="grid lg:grid-cols-2 gap-20">
          {/* Left Column - Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--gray-500)] mb-4">
              Contact
            </p>
            <h2 className="text-4xl lg:text-5xl font-[var(--font-display)] font-light text-black leading-tight mb-8">
              Let&apos;s work together
            </h2>
            <p className="text-lg text-[var(--gray-600)] leading-relaxed mb-12">
              Have a project in mind? We&apos;d love to hear from you.
              Send us a message and we&apos;ll respond within 24 hours.
            </p>

            <div className="space-y-6 text-sm">
              <div>
                <p className="text-xs uppercase tracking-wider text-[var(--gray-500)] mb-1">Email</p>
                <a href={`mailto:${contactInfo.email}`} className="text-black hover:text-[var(--gray-600)] transition-colors">
                  {contactInfo.email}
                </a>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-[var(--gray-500)] mb-1">Location</p>
                <p className="text-black">{contactInfo.location}</p>
              </div>
              {contactInfo.phone && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-[var(--gray-500)] mb-1">Phone</p>
                  <a href={`tel:${contactInfo.phone}`} className="text-black hover:text-[var(--gray-600)] transition-colors">
                    {contactInfo.phone}
                  </a>
                </div>
              )}
            </div>
          </motion.div>

          {/* Right Column - Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid sm:grid-cols-2 gap-8">
                <Input
                  label="Name"
                  name="name"
                  placeholder="Your name"
                  value={formData.name}
                  onChange={handleChange}
                  error={errors.name}
                />
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  error={errors.email}
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-8">
                <Input
                  label="Company"
                  name="company"
                  placeholder="Company name"
                  value={formData.company}
                  onChange={handleChange}
                />
                <Select
                  label="Service"
                  name="service"
                  options={serviceOptions}
                  placeholder="Select"
                  value={formData.service}
                  onChange={handleChange}
                />
              </div>

              <Textarea
                label="Message"
                name="message"
                placeholder="Tell us about your project..."
                value={formData.message}
                onChange={handleChange}
                error={errors.message}
                className="min-h-[160px]"
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isSubmitting}
                rightIcon={<Send className="w-4 h-4" />}
              >
                Send Message
              </Button>
            </form>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
