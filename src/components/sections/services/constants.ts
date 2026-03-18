/**
 * Shared constants for Services section components
 */

// Animation spring configurations
export const SPRING_CONFIG = { stiffness: 80, damping: 25, mass: 0.5 };
export const OPACITY_SPRING_CONFIG = { stiffness: 100, damping: 20, mass: 0.3 };

// Ease out cubic function for smooth scroll animations
export const easeOutCubic = (p: number) => 1 - Math.pow(1 - p, 3);

// Direction-based transform values for scroll animations
export type Direction = 'left' | 'right' | 'top' | 'bottom' | 'top-left' | 'top-right';

export const DIRECTION_TRANSFORMS: Record<Direction, { x: [number, number]; y: [number, number]; rotate: [number, number] }> = {
  left: { x: [-80, 0], y: [20, 0], rotate: [-2, 0] },
  right: { x: [80, 0], y: [20, 0], rotate: [2, 0] },
  top: { x: [0, 0], y: [-60, 0], rotate: [0, 0] },
  bottom: { x: [0, 0], y: [60, 0], rotate: [0, 0] },
  'top-left': { x: [-50, 0], y: [-40, 0], rotate: [-1.5, 0] },
  'top-right': { x: [50, 0], y: [-40, 0], rotate: [1.5, 0] },
};

// Conversation script for the chatbot demo - Appointment Booking
export const conversationScript = [
  { type: 'user' as const, text: "Hi, I'd like to book a consultation" },
  { type: 'bot' as const, text: "I'd be happy to help! I have openings this week on Thursday at 2pm or Friday at 10am. Which works better for you?" },
  { type: 'user' as const, text: "Friday at 10am works" },
  { type: 'bot' as const, text: "You're all set for Friday at 10am. I've sent a calendar invite and reminder to your email. See you then!" },
];

// Default text content when no database service is found
export const defaultContent = {
  chatbot: {
    title: 'AI Chatbots & Assistants',
    subtitle: 'Conversations that actually help.',
    description: 'Context-aware, helpful, human. Our AI learns your business and resolves issues 24/7.',
    features: ['Support', 'Sales', 'Onboarding'],
    stats: [{ value: '94%', label: 'Resolution rate' }, { value: '<2s', label: 'Response time' }],
  },
  custom_ai: {
    title: 'Custom AI Solutions',
    description: 'Tailored models trained on your data. From document analysis to predictive insights.',
    secondary_description: 'We build AI systems that understand your specific domain, integrate with your existing tools, and deliver actionable results.',
    features: ['NLP', 'Vision', 'Predictions'],
    stats: [{ value: '10x', label: 'Faster processing' }, { value: '94%', label: 'Accuracy' }, { value: '24/7', label: 'Availability' }],
  },
  workflow: {
    title: 'Workflow Automation',
    description: 'We connect your existing tools into seamless automated pipelines. No more manual data entry or missed handoffs.',
    footer_text: 'Connect your tools. Data flows automatically.',
  },
  website: {
    title: 'Website Development',
    description: 'Beautiful, responsive interfaces that load instantly and convert visitors into customers.',
    secondary_description: 'We craft pixel-perfect designs with modern frameworks. SEO-optimized, accessible, and built for performance.',
    features: ['Next.js', 'React', 'Tailwind', 'Vercel'],
  },
  consulting: {
    title: 'Strategy & Consulting',
    description: "Not sure what you need? We'll map out your AI journey—from first idea to full deployment.",
    cta_text: 'Book a free call →',
    cta_url: '/contact',
  },
};

// Workflow diagram path data
export const workflowPathData: Record<string, string> = {
  'trigger-main': 'M 54,80 L 95,80',
  'main-decision': 'M 165,80 L 200,80',
  'decision-output1': 'M 246,80 C 270,75 300,55 320,50',
  'decision-output2': 'M 246,80 C 270,85 300,105 320,110',
  'main-tool1': 'M 130,100 C 105,115 75,140 80,152',
  'main-tool2': 'M 130,100 C 155,120 180,150 175,162',
};
