import { MetadataRoute } from 'next';

const llmBotRules = {
  allow: ['/', '/llms.txt', '/llms-full.txt'],
  disallow: ['/admin/', '/api/', '/sales/', '/dashboard/'],
};

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/sales/', '/dashboard/'],
      },
      { userAgent: 'GPTBot', ...llmBotRules },
      { userAgent: 'ChatGPT-User', ...llmBotRules },
      { userAgent: 'Anthropic-ai', ...llmBotRules },
      { userAgent: 'ClaudeBot', ...llmBotRules },
      { userAgent: 'PerplexityBot', ...llmBotRules },
      { userAgent: 'Google-Extended', ...llmBotRules },
      { userAgent: 'Bytespider', ...llmBotRules },
      { userAgent: 'Applebot-Extended', ...llmBotRules },
      { userAgent: 'meta-externalagent', ...llmBotRules },
    ],
    sitemap: 'https://allone.ge/sitemap.xml',
  };
}
