import { logger } from '../utils/logger.js';
import { getSupabase } from '../database/client.js';
import { getLeadsForEmail, markLeadEmailed } from '../database/leads.repo.js';
import { sendEmail, checkDailyLimit } from '../email/resend.client.js';
import { personalizeEmail } from '../email/groq.client.js';
import { config } from '../config.js';

async function runEmailCron() {
  logger.info('Starting email cron job...');

  // Check daily limit
  const { sent, remaining } = await checkDailyLimit();
  logger.info(`Daily email stats: ${sent} sent, ${remaining} remaining`);

  if (remaining <= 0) {
    logger.info('Daily email limit reached. Stopping.');
    return;
  }

  const supabase = getSupabase();

  // Get active campaigns
  const { data: campaigns, error: campaignsError } = await supabase
    .from('email_campaigns')
    .select('*')
    .eq('is_active', true);

  if (campaignsError || !campaigns || campaigns.length === 0) {
    logger.info('No active campaigns found');
    return;
  }

  logger.info(`Found ${campaigns.length} active campaigns`);

  let totalSent = 0;

  for (const campaign of campaigns) {
    // Check how many we can send for this campaign
    const campaignLimit = Math.min(campaign.daily_limit, remaining - totalSent);

    if (campaignLimit <= 0) {
      logger.info(`Limit reached, skipping campaign: ${campaign.name}`);
      continue;
    }

    logger.info(`Processing campaign: ${campaign.name} (limit: ${campaignLimit})`);

    // Get leads that match this campaign's criteria
    const leads = await getLeadsForEmail(campaign.id, campaignLimit);

    if (leads.length === 0) {
      logger.info(`No matching leads for campaign: ${campaign.name}`);
      continue;
    }

    logger.info(`Found ${leads.length} leads to email`);

    for (const lead of leads) {
      if (!lead.email || !lead.id) continue;

      try {
        // Personalize the email
        const personalized = await personalizeEmail(
          lead,
          {
            subject: campaign.subject,
            body: campaign.body_template,
          }
        );

        // Send the email
        const result = await sendEmail(
          lead.email,
          personalized.subject,
          personalized.body,
          lead.id,
          campaign.id
        );

        if (result.success) {
          await markLeadEmailed(lead.id);
          totalSent++;
          logger.info(`Email sent to ${lead.email} (${totalSent}/${remaining})`);
        } else {
          logger.warn(`Failed to send to ${lead.email}: ${result.error}`);
        }

        // Small delay between emails
        await new Promise((resolve) => setTimeout(resolve, 1000));

      } catch (error) {
        logger.error(`Error processing lead ${lead.email}: ${error}`);
      }
    }
  }

  logger.info(`Email cron completed. Total sent: ${totalSent}`);
}

// Run immediately
runEmailCron().catch((err) => {
  logger.error(`Email cron failed: ${err}`);
  process.exit(1);
});
