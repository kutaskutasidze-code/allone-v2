import Groq from 'groq-sdk';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';
import { LeadData } from '../database/client.js';

let groqClient: Groq | null = null;

function getGroq(): Groq {
  if (!groqClient) {
    if (!config.groq.apiKey) {
      throw new Error('Groq API key not configured');
    }
    groqClient = new Groq({ apiKey: config.groq.apiKey });
  }
  return groqClient;
}

export interface PersonalizedEmail {
  subject: string;
  body: string;
}

export async function personalizeEmail(
  lead: LeadData,
  template: { subject: string; body: string }
): Promise<PersonalizedEmail> {
  const groq = getGroq();

  // Replace basic placeholders first
  let subject = template.subject
    .replace(/\{\{company\}\}/g, lead.company || lead.name)
    .replace(/\{\{country\}\}/g, lead.country || '')
    .replace(/\{\{industry\}\}/g, lead.industry || 'your industry');

  let body = template.body
    .replace(/\{\{company\}\}/g, lead.company || lead.name)
    .replace(/\{\{country\}\}/g, lead.country || '')
    .replace(/\{\{industry\}\}/g, lead.industry || 'your industry')
    .replace(/\{\{unsubscribe_link\}\}/g, 'https://allone.ge/unsubscribe');

  // Use Groq to personalize the email further based on company description
  if (lead.description) {
    try {
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are an AI assistant that helps personalize sales emails.
Given a company description, make subtle improvements to the email to make it more relevant.
Keep the same structure and length, just make it feel more personalized.
Do not add greetings or signatures - those are already in the template.
Return ONLY the improved email body, nothing else.`,
          },
          {
            role: 'user',
            content: `Company: ${lead.company || lead.name}
Description: ${lead.description}
Industry: ${lead.industry || 'Unknown'}

Current email body:
${body}

Improve this email to be more relevant to this specific company. Keep it concise.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const improvedBody = completion.choices[0]?.message?.content;
      if (improvedBody && improvedBody.length > 50) {
        body = improvedBody;
      }
    } catch (error) {
      logger.warn(`Groq personalization failed, using template: ${error}`);
    }
  }

  return { subject, body };
}

export async function generateEmailFromContext(
  lead: LeadData,
  service: string
): Promise<PersonalizedEmail | null> {
  const groq = getGroq();

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are a professional B2B sales email writer for Allone, a company that offers:
- AI Chatbots for customer support automation
- Custom AI Solutions for fintech/healthcare
- Workflow Automation for logistics/manufacturing
- Website Development for hotels/restaurants/startups
- AI Consulting for enterprises

Write short, compelling cold emails that:
1. Are personalized to the company
2. Highlight relevant benefits
3. Include a clear call-to-action
4. Are professional but friendly
5. Are under 150 words

Return the email in this exact format:
SUBJECT: [subject line]
BODY:
[email body]`,
        },
        {
          role: 'user',
          content: `Write an email for:
Company: ${lead.company || lead.name}
Industry: ${lead.industry || 'Unknown'}
Country: ${lead.country}
Description: ${lead.description || 'No description available'}
Recommended Service: ${service}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const content = completion.choices[0]?.message?.content || '';

    // Parse the response
    const subjectMatch = content.match(/SUBJECT:\s*(.+)/);
    const bodyMatch = content.match(/BODY:\s*([\s\S]+)/);

    if (subjectMatch && bodyMatch) {
      return {
        subject: subjectMatch[1].trim(),
        body: bodyMatch[1].trim() + '\n\n---\nUnsubscribe: https://allone.ge/unsubscribe',
      };
    }

    return null;
  } catch (error) {
    logger.error(`Groq email generation failed: ${error}`);
    return null;
  }
}
