'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';

type Lang = 'en' | 'ka';

interface I18nContext {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
}

const I18nCtx = createContext<I18nContext>({
  lang: 'en',
  setLang: () => {},
  t: (key) => key,
});

// Translations
const translations: Record<Lang, Record<string, string>> = {
  en: {
    // Nav
    'nav.home': 'Home',
    'nav.services': 'Services',
    'nav.work': 'Work',
    'nav.lab': 'Lab',

    // Hero
    'hero.label': 'AI Automation Agency',
    'hero.title1': 'All Systems.',
    'hero.title2': 'One Intelligence.',

    // Portfolio
    'portfolio.label': 'Portfolio',
    'portfolio.title': 'Selected Works',
    'portfolio.desc': 'Dive into our latest implementations of intelligent automation and digital transformation.',
    'portfolio.integrations': 'Integrations',
    'portfolio.trusted': 'Trusted by Industry Leaders',

    // Project subtitles
    'project.equivalenza': 'E-Commerce Platform',
    'project.datarooms': 'AI Data Rooms',
    'project.fifty': 'Innovation Space',
    'project.hostwise': 'Property Management',
    'project.kaotenders': 'B2B Industrial',
    'project.chaos': 'Fashion & Art',
    'project.innrburial': 'Publishing & Art',

    // Dashboard
    'dashboard.label': 'Dashboard',
    'dashboard.title1': 'See your business',
    'dashboard.title2': 'run itself',
    'dashboard.desc': 'We turn chaotic workflows into streamlined systems you can monitor, optimize, and scale from a single view.',

    // Stats
    'stats.resolution': 'Resolution Rate',
    'stats.response': 'Response Time',
    'stats.processing': 'Faster Processing',
    'stats.availability': 'Availability',

    // Testimonials
    'testimonials.label': 'Testimonials',
    'testimonials.title': 'What our clients say',
    'testimonials.q1': 'ALLONE transformed our customer support with their AI chatbot. Response times dropped 80% and customer satisfaction is at an all-time high.',
    'testimonials.a1': 'Giorgi Kvaratskhelia',
    'testimonials.r1': 'CEO, TechStart Georgia',
    'testimonials.q2': 'The workflow automation they built saved us 20+ hours per week. Our team can now focus on what matters most — growing the business.',
    'testimonials.a2': 'Nino Basilaia',
    'testimonials.r2': 'Operations Director, Borjomi Group',
    'testimonials.q3': 'Their custom AI solution for lead scoring increased our conversion rate by 35%. The ROI was visible within the first month.',
    'testimonials.a3': 'David Maisuradze',
    'testimonials.r3': 'Head of Sales, Georgian Airways',

    // Clients
    'clients.title': 'Trusted by forward-thinking companies',

    // CTA
    'cta.label': 'Get in touch',
    'cta.title': 'Ready to Start Your Next Project?',
    'cta.desc': 'From strategy to deployment, we partner with you to build AI systems that deliver real results.',
    'cta.talk.label': 'Start a conversation',
    'cta.talk.btn': "Let's talk →",
    'cta.work.label': 'View our work',
    'cta.work.btn': 'See projects →',

    // Footer
    'footer.cta.label': 'Ready to converge?',
    'footer.cta.title1': 'All systems.',
    'footer.cta.title2': 'One intelligence.',
    'footer.cta.desc': "Let's build something that runs itself.",
    'footer.cta.start': 'Start a Project',
    'footer.cta.services': 'View Services',
    'footer.brand': 'ALLONE',
    'footer.tbilisi': 'Tbilisi, Georgia',
    'footer.brussels': 'Brussels, Belgium',
    'footer.est': 'Est. 2024',
    'footer.company': 'Company',
    'footer.services': 'Services',
    'footer.contact': 'Contact',
    'footer.copyright': 'All rights reserved.',
    'footer.built': 'Built with precision',

    // Footer links
    'footer.link.work': 'Work',
    'footer.link.contact': 'Contact',
    'footer.link.chatbots': 'AI Chatbots',
    'footer.link.automation': 'Workflow Automation',
    'footer.link.customai': 'Custom AI',
    'footer.link.webdev': 'Web Development',
    'footer.link.consulting': 'Consulting',

    // Lab
    'lab.hero': 'QUANTUM ALLONE',
    'lab.research.title': 'Scientific Research',
    'lab.research.desc': 'Primary research at the intersection of quantum physics and intelligent systems.',

    // Lab research papers
    'lab.r1.title': 'Quantum Machine Learning Roadmap (2026)',
    'lab.r1.label': 'Status Report',
    'lab.r1.desc': 'A comprehensive analysis of 50+ scientific papers mapping the current state of QML advantage in generative modeling and financial forecasting.',
    'lab.r2.title': 'Origin Wukong: Hardware Analysis',
    'lab.r2.label': 'Hardware Review',
    'lab.r2.desc': 'In-depth benchmarking of the 72-qubit superconducting processor, evaluating T1/T2 coherence times and gate fidelity for hybrid AI workloads.',
    'lab.r3.title': 'The Multiverse LLM Architecture',
    'lab.r3.label': 'Theoretical Paper',
    'lab.r3.desc': 'Proposing a new framework for Large Language Models using quantum superposition of weight states and tensor network compression (iPEPS).',
    'lab.r4.title': 'Quantum Brain Efficiency Thesis',
    'lab.r4.label': 'Core Research',
    'lab.r4.desc': 'Comparing biological neural efficiency with quantum gate energy consumption. Exploring why quantum hardware is a physical necessity for AGI.',
    'lab.r5.title': 'Quantum-Enhanced Diffusion Models',
    'lab.r5.label': 'Experiment',
    'lab.r5.desc': 'Investigating how quantum circuits can accelerate the reverse diffusion process in generative AI, with benchmarks against classical DDPM.',
    'lab.r6.title': 'Entanglement as Optimization Primitive',
    'lab.r6.label': 'Core Research',
    'lab.r6.desc': 'How quantum entanglement can be leveraged as a computational primitive for solving NP-hard combinatorial optimization problems.',

    'lab.minread': 'min read',

    // Services page
    'services.label': 'Services',
    'services.title1': 'Everything you need',
    'services.title2': 'to grow with AI',
    'services.viewAll': 'View all services',
    'services.bookCall': 'Book a free call',
    // Service cards
    'svc.chatbot.title': 'AI Chatbots & Assistants',
    'svc.chatbot.desc': 'Context-aware, helpful, human. Our AI learns your business and resolves issues 24/7.',
    'svc.custom.title': 'Custom AI Solutions',
    'svc.custom.desc': 'Tailored models trained on your data. From document analysis to predictive insights.',
    'svc.custom.desc2': 'We build AI systems that understand your specific domain, integrate with your existing tools, and deliver actionable results.',
    'svc.workflow.title': 'Workflow Automation',
    'svc.workflow.desc': 'We connect your existing tools into seamless automated pipelines. No more manual data entry or missed handoffs.',
    'svc.workflow.footer': 'Connect your tools. Data flows automatically.',
    'svc.website.title': 'Website Development',
    'svc.website.desc': 'Beautiful, responsive interfaces that load instantly and convert visitors into customers.',
    'svc.website.desc2': 'We craft pixel-perfect designs with modern frameworks. SEO-optimized, accessible, and built for performance.',
    'svc.consulting.title': 'Strategy & Consulting',
    'svc.consulting.desc': "Not sure what you need? We'll map out your AI journey—from first idea to full deployment.",
    'svc.consulting.cta': 'Book a free call →',

    // Work page
    'work.label': 'Portfolio',
    'work.title': 'Our Work',

    // Contact page
    'contact.label': 'Get in touch',
    'contact.title': 'Contact',
    'contact.desc': "Ready to automate? Let's talk about your project.",
    'contact.tbilisi': 'Tbilisi',
    'contact.tbilisi.sub': 'Georgia HQ',
    'contact.brussels': 'Brussels',
    'contact.brussels.sub': 'European Office',

    // Landing page
    'landing.hero.h1a': 'All systems.',
    'landing.hero.h1b': 'One intelligence.',
    'landing.hero.desc': 'Replace expensive manual processes with autonomous AI agents. Customer support, data processing, content, code — agents handle it at a fraction of the cost.',
    'landing.hero.cta1': 'Start Building',
    'landing.hero.cta2': 'Book a Demo',
    'landing.video.title': 'Meet AllOne automations.',
    'landing.video.desc': 'See how autonomous AI agents replace entire workflows.',
    'landing.services.title': 'Agents for every workflow.',
    'landing.services.desc': 'Deploy AI agents that replace entire teams. Same output, 90% less cost.',
    'landing.services.chatbot': 'AI Chatbots',
    'landing.services.chatbot.desc': 'Intelligent customer support that handles 85% of inquiries automatically.',
    'landing.services.customai': 'Custom AI',
    'landing.services.customai.desc': 'Bespoke AI models tailored to your industry and data.',
    'landing.services.workflow': 'Workflow Automation',
    'landing.services.workflow.desc': 'Eliminate manual processes. Connect your tools with AI-powered pipelines.',
    'landing.services.webdev': 'Web Development',
    'landing.services.webdev.desc': 'High-performance websites and apps that convert.',
    'landing.services.consulting': 'AI Consulting',
    'landing.services.consulting.desc': 'Strategic guidance on AI adoption. From audit to implementation.',
    'landing.services.learn': 'Learn more',
    'landing.tech.label': 'AI Platform',
    'landing.tech.h2a': 'One platform. Every agent.',
    'landing.tech.h2b': 'Deploy autonomous agents that handle customer support, process documents, write code, and manage workflows — replacing manual labor entirely.',
    'landing.tech.powered': 'Powered by',
    'landing.tech.metrics': 'Platform metrics',
    'landing.enterprise.h2a': 'Replace teams,',
    'landing.enterprise.h2b': 'not people',
    'landing.enterprise.h2c': '— scale infinitely',
    'landing.enterprise.desc': 'AI agents handle the repetitive work so your people focus on what matters. Offices in Tbilisi and Belgium, expanding globally.',
    'landing.enterprise.affiliate': 'Affiliate Program',
    'landing.enterprise.affiliate.desc': 'Earn commission by referring clients to our AI solutions',
    'landing.enterprise.franchise': 'Franchise System',
    'landing.enterprise.franchise.desc': 'Launch AllOne in your market with our proven model',
    'landing.enterprise.sales': 'Global Sales Network',
    'landing.enterprise.sales.desc': '30+ commission-based agents, zero overhead',
    'landing.enterprise.contact': 'Partner With Us',
    'landing.enterprise.contact.desc': 'Contact us to explore affiliate or franchise opportunities',
    'landing.how.label': 'How It Works',
    'landing.how.h2a': 'From manual process to autonomous agent.',
    'landing.how.h2b': 'We analyze your workflows, identify what agents can replace, and deploy them. You stop paying for repetitive labor.',
    'landing.how.s1': 'Discovery',
    'landing.how.s1.desc': 'We analyze your business processes and identify AI opportunities.',
    'landing.how.s2': 'Build',
    'landing.how.s2.desc': 'Our AI stack delivers solutions at 90% lower cost than traditional agencies.',
    'landing.how.s3': 'Deploy',
    'landing.how.s3.desc': 'Launch in days, not months. Continuous monitoring and optimization.',
    'landing.how.s4': 'Scale',
    'landing.how.s4.desc': 'From prototype to production — infrastructure that grows with you.',
    'landing.how.stack': 'Tech stack',
    'landing.cta.h2': 'Stop paying for\nwork agents can do.',
    'landing.cta.c1': 'Free consultation and AI audit',
    'landing.cta.c2': 'Custom solution scoped in 48 hours',
    'landing.cta.c3': 'Delivery in weeks, not months',
    'landing.cta.c4': 'Pay only for results',
    'landing.final.h2': 'Start Building',
    'landing.final.cta2': 'Talk to an Expert',

    // Contact form
    'form.sent': 'Message Sent',
    'form.thanks': "Thank you for reaching out. We'll get back to you within 24 hours.",
    'form.another': 'Send another message',
    'form.name': 'Name',
    'form.email': 'Email',
    'form.company': 'Company (optional)',
    'form.message': 'Tell us about your project...',
    'form.send': 'Send Message',
    'form.service.chatbot': 'AI Chatbot',
    'form.service.automation': 'Workflow Automation',
    'form.service.custom': 'Custom AI Solution',
    'form.service.website': 'Web Development',
    'form.service.consulting': 'Consulting',
    'form.service.other': 'Other',
  },
  ka: {
    // Nav
    'nav.home': 'მთავარი',
    'nav.services': 'სერვისები',
    'nav.work': 'პორტფოლიო',
    'nav.lab': 'ლაბორატორია',

    // Hero
    'hero.label': 'AI ავტომატიზაციის სააგენტო',
    'hero.title1': 'ყველა სისტემა.',
    'hero.title2': 'ერთი ინტელექტი.',

    // Portfolio
    'portfolio.label': 'პორტფოლიო',
    'portfolio.title': 'არჩეული ნამუშევრები',
    'portfolio.desc': 'გაეცანით ჩვენს უახლეს ინტელექტუალური ავტომატიზაციისა და ციფრული ტრანსფორმაციის პროექტებს.',
    'portfolio.integrations': 'ინტეგრაციები',
    'portfolio.trusted': 'ინდუსტრიის ლიდერების ნდობა',

    // Project subtitles
    'project.equivalenza': 'ელ-კომერციის პლატფორმა',
    'project.datarooms': 'AI მონაცემთა ოთახები',
    'project.fifty': 'ინოვაციების სივრცე',
    'project.hostwise': 'ქონების მართვა',
    'project.kaotenders': 'B2B ინდუსტრიული',
    'project.chaos': 'მოდა და ხელოვნება',
    'project.innrburial': 'გამომცემლობა და ხელოვნება',

    // Dashboard
    'dashboard.label': 'დეშბორდი',
    'dashboard.title1': 'ნახეთ როგორ მუშაობს',
    'dashboard.title2': 'თქვენი ბიზნესი',
    'dashboard.desc': 'ქაოტურ სამუშაო პროცესებს ვაქცევთ ოპტიმიზებულ სისტემებად, რომელთა მონიტორინგი, ოპტიმიზაცია და მასშტაბირება ერთი ხედიდან შეგიძლიათ.',

    // Stats
    'stats.resolution': 'გადაწყვეტის მაჩვენებელი',
    'stats.response': 'რეაგირების დრო',
    'stats.processing': 'სწრაფი დამუშავება',
    'stats.availability': 'ხელმისაწვდომობა',

    // Testimonials
    'testimonials.label': 'შეფასებები',
    'testimonials.title': 'რას ამბობენ ჩვენი კლიენტები',
    'testimonials.q1': 'ALLONE-მ ჩვენი კლიენტთა მომსახურება AI ჩატბოტით გარდაქმნა. რეაგირების დრო 80%-ით შემცირდა, ხოლო კლიენტთა კმაყოფილება რეკორდულ დონეზეა.',
    'testimonials.a1': 'გიორგი კვარაცხელია',
    'testimonials.r1': 'CEO, TechStart Georgia',
    'testimonials.q2': 'მათ მიერ შექმნილმა ავტომატიზაციამ კვირაში 20+ საათი დაგვიზოგა. ჩვენი გუნდი ახლა ყურადღებას ბიზნესის ზრდაზე ამახვილებს.',
    'testimonials.a2': 'ნინო ბასილაია',
    'testimonials.r2': 'ოპერაციების დირექტორი, Borjomi Group',
    'testimonials.q3': 'მათმა AI გადაწყვეტილებამ ლიდების შეფასებისთვის კონვერსიის მაჩვენებელი 35%-ით გაზარდა. ROI პირველივე თვეში იყო თვალსაჩინო.',
    'testimonials.a3': 'დავით მაისურაძე',
    'testimonials.r3': 'გაყიდვების ხელმძღვანელი, Georgian Airways',

    // Clients
    'clients.title': 'მოწინავე კომპანიების ნდობით',

    // CTA
    'cta.label': 'დაგვიკავშირდით',
    'cta.title': 'მზად ხართ შემდეგი პროექტისთვის?',
    'cta.desc': 'სტრატეგიიდან განხორციელებამდე, ჩვენ ვქმნით AI სისტემებს, რომლებიც რეალურ შედეგებს იძლევა.',
    'cta.talk.label': 'დაიწყეთ საუბარი',
    'cta.talk.btn': 'მოგვწერეთ →',
    'cta.work.label': 'ნახეთ ნამუშევრები',
    'cta.work.btn': 'პროექტები →',

    // Footer
    'footer.cta.label': 'მზად ხართ?',
    'footer.cta.title1': 'ყველა სისტემა.',
    'footer.cta.title2': 'ერთი ინტელექტი.',
    'footer.cta.desc': 'ავაშენოთ ისეთი რაღაც, რაც თავისით მუშაობს.',
    'footer.cta.start': 'დაიწყეთ პროექტი',
    'footer.cta.services': 'სერვისების ნახვა',
    'footer.brand': 'ALLONE',
    'footer.tbilisi': 'თბილისი, საქართველო',
    'footer.brussels': 'ბრიუსელი, ბელგია',
    'footer.est': 'დაფუძნდა 2024',
    'footer.company': 'კომპანია',
    'footer.services': 'სერვისები',
    'footer.contact': 'კონტაქტი',
    'footer.copyright': 'ყველა უფლება დაცულია.',
    'footer.built': 'სიზუსტით შექმნილი',

    // Footer links
    'footer.link.work': 'პორტფოლიო',
    'footer.link.contact': 'კონტაქტი',
    'footer.link.chatbots': 'AI ჩატბოტები',
    'footer.link.automation': 'ავტომატიზაცია',
    'footer.link.customai': 'AI გადაწყვეტილებები',
    'footer.link.webdev': 'ვებ დეველოპმენტი',
    'footer.link.consulting': 'კონსალტინგი',

    // Lab
    'lab.hero': 'QUANTUM ALLONE',
    'lab.research.title': 'სამეცნიერო კვლევა',
    'lab.research.desc': 'კვანტური ფიზიკისა და ინტელექტუალური სისტემების გადაკვეთაზე.',

    // Lab research papers
    'lab.r1.title': 'კვანტური მანქანური სწავლების გზამკვლევი (2026)',
    'lab.r1.label': 'სტატუს რეპორტი',
    'lab.r1.desc': '50+ სამეცნიერო ნაშრომის ყოვლისმომცველი ანალიზი, რომელიც QML-ის უპირატესობის მდგომარეობას ასახავს.',
    'lab.r2.title': 'Origin Wukong: აპარატურის ანალიზი',
    'lab.r2.label': 'აპარატურის მიმოხილვა',
    'lab.r2.desc': '72-კუბიტიანი სუპერგამტარი პროცესორის სიღრმისეული ბენჩმარკინგი.',
    'lab.r3.title': 'მულტივერსალური LLM არქიტექტურა',
    'lab.r3.label': 'თეორიული ნაშრომი',
    'lab.r3.desc': 'ახალი ფრეიმვორკის შემოთავაზება დიდი ენობრივი მოდელებისთვის კვანტური სუპერპოზიციის გამოყენებით.',
    'lab.r4.title': 'კვანტური ტვინის ეფექტურობის თეზისი',
    'lab.r4.label': 'ძირითადი კვლევა',
    'lab.r4.desc': 'ბიოლოგიური ნეირონული ეფექტურობის შედარება კვანტური გეითის ენერგომოხმარებასთან.',
    'lab.r5.title': 'კვანტურად გაძლიერებული დიფუზიური მოდელები',
    'lab.r5.label': 'ექსპერიმენტი',
    'lab.r5.desc': 'კვანტური წრედების გამოყენება დიფუზიის შებრუნების პროცესის აჩქარებისთვის გენერაციულ AI-ში.',
    'lab.r6.title': 'გადახლართვა როგორც ოპტიმიზაციის პრიმიტივი',
    'lab.r6.label': 'ძირითადი კვლევა',
    'lab.r6.desc': 'როგორ შეიძლება კვანტური გადახლართვის გამოყენება NP-რთული ოპტიმიზაციის ამოცანების გადასაჭრელად.',

    'lab.minread': 'წთ კითხვა',

    // Services page
    'services.label': 'სერვისები',
    'services.title1': 'ყველაფერი რაც გჭირდებათ',
    'services.title2': 'AI-თ ზრდისთვის',
    'services.viewAll': 'ყველა სერვისი',
    'services.bookCall': 'უფასო კონსულტაცია',
    // Service cards
    'svc.chatbot.title': 'AI ჩატბოტები და ასისტენტები',
    'svc.chatbot.desc': 'კონტექსტის მცოდნე, დამხმარე, ადამიანური. ჩვენი AI სწავლობს თქვენს ბიზნესს და აგვარებს პრობლემებს 24/7.',
    'svc.custom.title': 'ინდივიდუალური AI გადაწყვეტილებები',
    'svc.custom.desc': 'თქვენს მონაცემებზე გაწვრთნილი მოდელები. დოკუმენტების ანალიზიდან პროგნოზირებამდე.',
    'svc.custom.desc2': 'ჩვენ ვქმნით AI სისტემებს, რომლებიც ესმით თქვენს სპეციფიკურ დარგს, ინტეგრირდება არსებულ ინსტრუმენტებთან და აწვდის პრაქტიკულ შედეგებს.',
    'svc.workflow.title': 'სამუშაო პროცესის ავტომატიზაცია',
    'svc.workflow.desc': 'ჩვენ ვაკავშირებთ თქვენს არსებულ ინსტრუმენტებს ავტომატიზირებულ პაიპლაინებში. აღარ არის ხელით მონაცემების შეყვანა.',
    'svc.workflow.footer': 'დააკავშირეთ ინსტრუმენტები. მონაცემები ავტომატურად მოძრაობს.',
    'svc.website.title': 'ვებსაიტების დეველოპმენტი',
    'svc.website.desc': 'ლამაზი, რესპონსიული ინტერფეისები, რომლებიც მყისიერად იტვირთება და ვიზიტორებს მომხმარებლებად აქცევს.',
    'svc.website.desc2': 'ჩვენ ვქმნით პიქსელ-სრულყოფილ დიზაინს თანამედროვე ფრეიმვორკებით. SEO-ოპტიმიზირებული, ხელმისაწვდომი და შესრულებაზე ორიენტირებული.',
    'svc.consulting.title': 'სტრატეგია და კონსალტინგი',
    'svc.consulting.desc': 'არ იცით რა გჭირდებათ? ჩვენ დაგეხმარებით AI-ს გზის დაგეგმვაში — იდეიდან სრულ განხორციელებამდე.',
    'svc.consulting.cta': 'დაჯავშნე უფასო ზარი →',

    // Work page
    'work.label': 'პორტფოლიო',
    'work.title': 'ჩვენი ნამუშევრები',

    // Contact page
    'contact.label': 'დაგვიკავშირდით',
    'contact.title': 'კონტაქტი',
    'contact.desc': 'მზად ხართ ავტომატიზაციისთვის? მოდი ვისაუბროთ თქვენს პროექტზე.',
    'contact.tbilisi': 'თბილისი',
    'contact.tbilisi.sub': 'საქართველოს ოფისი',
    'contact.brussels': 'ბრიუსელი',
    'contact.brussels.sub': 'ევროპული ოფისი',

    // Landing page
    'landing.hero.h1a': 'ყველა სისტემა.',
    'landing.hero.h1b': 'ერთი ინტელექტი.',
    'landing.hero.desc': 'შეცვალეთ ძვირადღირებული ხელით პროცესები ავტონომიური AI აგენტებით. კლიენტთა მხარდაჭერა, მონაცემების დამუშავება, კონტენტი, კოდი — აგენტები ამას ხარჯების მცირე ნაწილად აკეთებენ.',
    'landing.hero.cta1': 'დაიწყე შენება',
    'landing.hero.cta2': 'დემოს დაჯავშნა',
    'landing.video.title': 'გაიცანით AllOne ავტომატიზაცია.',
    'landing.video.desc': 'ნახეთ როგორ ცვლიან ავტონომიური AI აგენტები მთელ სამუშაო პროცესებს.',
    'landing.services.title': 'აგენტები ყველა სამუშაო პროცესისთვის.',
    'landing.services.desc': 'განათავსეთ AI აგენტები, რომლებიც მთელ გუნდებს ცვლიან. იგივე შედეგი, 90%-ით ნაკლები ხარჯი.',
    'landing.services.chatbot': 'AI ჩატბოტები',
    'landing.services.chatbot.desc': 'ინტელექტუალური კლიენტთა მხარდაჭერა, რომელიც მოთხოვნების 85%-ს ავტომატურად ამუშავებს.',
    'landing.services.customai': 'ინდივიდუალური AI',
    'landing.services.customai.desc': 'თქვენი ინდუსტრიისა და მონაცემებისთვის მორგებული AI მოდელები.',
    'landing.services.workflow': 'პროცესების ავტომატიზაცია',
    'landing.services.workflow.desc': 'აღმოფხვრეთ ხელით პროცესები. დააკავშირეთ ინსტრუმენტები AI-ით მართულ პაიპლაინებში.',
    'landing.services.webdev': 'ვებ დეველოპმენტი',
    'landing.services.webdev.desc': 'მაღალი წარმადობის ვებსაიტები და აპლიკაციები, რომლებიც კონვერტირებენ.',
    'landing.services.consulting': 'AI კონსალტინგი',
    'landing.services.consulting.desc': 'სტრატეგიული ხელმძღვანელობა AI-ს დანერგვაში. აუდიტიდან განხორციელებამდე.',
    'landing.services.learn': 'გაიგე მეტი',
    'landing.tech.label': 'AI პლატფორმა',
    'landing.tech.h2a': 'ერთი პლატფორმა. ყველა აგენტი.',
    'landing.tech.h2b': 'განათავსეთ ავტონომიური აგენტები, რომლებიც კლიენტთა მხარდაჭერას ამუშავებენ, დოკუმენტებს ამუშავებენ, კოდს წერენ და სამუშაო პროცესებს მართავენ — ხელით შრომის სრული ჩანაცვლება.',
    'landing.tech.powered': 'მართულია',
    'landing.tech.metrics': 'პლატფორმის მეტრიკები',
    'landing.enterprise.h2a': 'შეცვალეთ გუნდები,',
    'landing.enterprise.h2b': 'არა ადამიანები',
    'landing.enterprise.h2c': '— უსასრულოდ მასშტაბირდით',
    'landing.enterprise.desc': 'AI აგენტები განმეორებად სამუშაოს ამუშავებენ, რომ თქვენი ხალხი მნიშვნელოვანზე ფოკუსირდეს. ოფისები თბილისსა და ბელგიაში, გლობალური გაფართოება.',
    'landing.enterprise.affiliate': 'აფილიატე პროგრამა',
    'landing.enterprise.affiliate.desc': 'მიიღეთ საკომისიო კლიენტების მოწვევით ჩვენს AI გადაწყვეტილებებზე',
    'landing.enterprise.franchise': 'ფრანჩაიზის სისტემა',
    'landing.enterprise.franchise.desc': 'გაუშვით AllOne თქვენს ბაზარზე ჩვენი დადასტურებული მოდელით',
    'landing.enterprise.sales': 'გლობალური გაყიდვების ქსელი',
    'landing.enterprise.sales.desc': '30+ საკომისიოზე დაფუძნებული აგენტი, ნულოვანი ხარჯი',
    'landing.enterprise.contact': 'გახდით პარტნიორი',
    'landing.enterprise.contact.desc': 'დაგვიკავშირდით აფილიატე ან ფრანჩაიზის შესაძლებლობებისთვის',
    'landing.how.label': 'როგორ მუშაობს',
    'landing.how.h2a': 'ხელით პროცესიდან ავტონომიურ აგენტამდე.',
    'landing.how.h2b': 'ჩვენ ვაანალიზებთ თქვენს სამუშაო პროცესებს, ვადგენთ რა შეუძლიათ აგენტებს ჩაანაცვლონ და ვანერგავთ მათ. თქვენ წყვეტთ განმეორებადი შრომის ხარჯებს.',
    'landing.how.s1': 'აღმოჩენა',
    'landing.how.s1.desc': 'ჩვენ ვაანალიზებთ თქვენს ბიზნეს პროცესებს და ვადგენთ AI შესაძლებლობებს.',
    'landing.how.s2': 'აშენება',
    'landing.how.s2.desc': 'ჩვენი AI სტეკი გადაწყვეტილებებს ტრადიციულ სააგენტოებზე 90%-ით იაფად აწვდის.',
    'landing.how.s3': 'განთავსება',
    'landing.how.s3.desc': 'გაშვება დღეებში, არა თვეებში. უწყვეტი მონიტორინგი და ოპტიმიზაცია.',
    'landing.how.s4': 'მასშტაბირება',
    'landing.how.s4.desc': 'პროტოტიპიდან პროდაქშენამდე — ინფრასტრუქტურა, რომელიც თქვენთან ერთად იზრდება.',
    'landing.how.stack': 'ტექნოლოგიური სტეკი',
    'landing.cta.h2': 'შეწყვიტეთ გადახდა\nსამუშაოსთვის, რასაც აგენტები აკეთებენ.',
    'landing.cta.c1': 'უფასო კონსულტაცია და AI აუდიტი',
    'landing.cta.c2': 'ინდივიდუალური გადაწყვეტილება 48 საათში',
    'landing.cta.c3': 'მიწოდება კვირებში, არა თვეებში',
    'landing.cta.c4': 'გადაიხადეთ მხოლოდ შედეგისთვის',
    'landing.final.h2': 'დაიწყე შენება',
    'landing.final.cta2': 'ესაუბრე ექსპერტს',

    // Contact form
    'form.sent': 'შეტყობინება გაიგზავნა',
    'form.thanks': 'გმადლობთ დაკავშირებისთვის. 24 საათში დაგიბრუნებთ პასუხს.',
    'form.another': 'კიდევ ერთი შეტყობინება',
    'form.name': 'სახელი',
    'form.email': 'ელ-ფოსტა',
    'form.company': 'კომპანია (არასავალდებულო)',
    'form.message': 'მოგვიყევით თქვენი პროექტის შესახებ...',
    'form.send': 'გაგზავნა',
    'form.service.chatbot': 'AI ჩატბოტი',
    'form.service.automation': 'ავტომატიზაცია',
    'form.service.custom': 'AI გადაწყვეტილება',
    'form.service.website': 'ვებ დეველოპმენტი',
    'form.service.consulting': 'კონსალტინგი',
    'form.service.other': 'სხვა',
  },
};

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');

  useEffect(() => {
    const saved = localStorage.getItem('allone-lang') as Lang;
    if (saved === 'ka') setLangState('ka');
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem('allone-lang', l);
  }, []);

  const t = useCallback(
    (key: string) => translations[lang][key] ?? translations.en[key] ?? key,
    [lang],
  );

  return <I18nCtx.Provider value={{ lang, setLang, t }}>{children}</I18nCtx.Provider>;
}

export function useI18n() {
  return useContext(I18nCtx);
}
