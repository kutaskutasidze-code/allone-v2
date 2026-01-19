import 'dotenv/config';

export const config = {
  // Ayrshare API key (get from https://ayrshare.com)
  ayrshare: {
    apiKey: process.env.AYRSHARE_API_KEY || '',
  },
  // Groq for AI content
  groq: {
    apiKey: process.env.GROQ_API_KEY || '',
  },
  // Which platforms to post to
  platforms: (process.env.PLATFORMS || 'linkedin,facebook,instagram,tiktok').split(','),
  // Topics for content generation
  topics: (process.env.TOPICS || 'AI,automation,technology,business,startups').split(','),
  // Posting schedule (cron format)
  schedule: {
    // Post 3 times a day
    times: ['9:00', '14:00', '19:00'],
    timezone: process.env.TIMEZONE || 'Asia/Tbilisi',
  },
};

export function validateConfig(): string[] {
  const errors: string[] = [];

  if (!config.ayrshare.apiKey) {
    errors.push('AYRSHARE_API_KEY is required - get it from https://ayrshare.com');
  }
  if (!config.groq.apiKey) {
    errors.push('GROQ_API_KEY is required');
  }

  return errors;
}
