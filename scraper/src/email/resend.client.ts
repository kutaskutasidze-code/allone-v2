import { Resend } from 'resend';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';
import { getSupabase } from '../database/client.js';

let resendClient: Resend | null = null;

function getResend(): Resend {
  if (!resendClient) {
    if (!config.resend.apiKey) {
      throw new Error('Resend API key not configured');
    }
    resendClient = new Resend(config.resend.apiKey);
  }
  return resendClient;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendEmail(
  to: string,
  subject: string,
  body: string,
  leadId: string,
  campaignId: string
): Promise<SendEmailResult> {
  const resend = getResend();
  const supabase = getSupabase();

  try {
    // Create email log entry first
    const { data: emailLog, error: logError } = await supabase
      .from('email_logs')
      .insert({
        lead_id: leadId,
        campaign_id: campaignId,
        to_email: to,
        subject,
        status: 'sending',
      })
      .select('id')
      .single();

    if (logError) {
      logger.error(`Failed to create email log: ${logError.message}`);
    }

    // Send the email
    const { data, error } = await resend.emails.send({
      from: `${config.resend.fromName} <${config.resend.fromEmail}>`,
      to,
      subject,
      text: body,
    });

    if (error) {
      // Update log with error
      if (emailLog?.id) {
        await supabase
          .from('email_logs')
          .update({
            status: 'failed',
            error_message: error.message,
          })
          .eq('id', emailLog.id);
      }

      logger.error(`Failed to send email to ${to}: ${error.message}`);
      return { success: false, error: error.message };
    }

    // Update log with success
    if (emailLog?.id) {
      await supabase
        .from('email_logs')
        .update({
          status: 'sent',
          email_provider_id: data?.id,
          sent_at: new Date().toISOString(),
        })
        .eq('id', emailLog.id);
    }

    // Update campaign stats
    await supabase
      .from('email_campaigns')
      .update({
        emails_sent: supabase.rpc('increment', { x: 1 }),
      })
      .eq('id', campaignId);

    logger.info(`Email sent to ${to}, ID: ${data?.id}`);
    return { success: true, messageId: data?.id };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Email send error: ${errorMsg}`);
    return { success: false, error: errorMsg };
  }
}

export async function checkDailyLimit(): Promise<{ sent: number; remaining: number }> {
  const supabase = getSupabase();

  // Count emails sent today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from('email_logs')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', today.toISOString())
    .in('status', ['sent', 'delivered', 'opened', 'clicked', 'replied']);

  if (error) {
    logger.error(`Failed to check daily limit: ${error.message}`);
    return { sent: 0, remaining: config.email.dailyLimit };
  }

  const sent = count || 0;
  const remaining = Math.max(0, config.email.dailyLimit - sent);

  return { sent, remaining };
}
