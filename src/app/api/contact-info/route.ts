import { createClient } from '@/lib/supabase/server';
import { success, error } from '@/lib/api-response';
import { logger } from '@/lib/logger';

const DEFAULT_CONTACT_INFO = {
  email: 'info@allone.ge',
  location: 'San Francisco, CA',
  phone: null,
};

// Public endpoint to get contact info (no auth required)
export async function GET() {
  try {
    const supabase = await createClient();

    logger.db('select', 'contact_info', { public: true });

    const { data, error: dbError } = await supabase
      .from('contact_info')
      .select('email, location, phone')
      .limit(1)
      .single();

    if (dbError && dbError.code !== 'PGRST116') {
      logger.error('Failed to fetch contact info', { error: dbError.message });
      return error('Failed to fetch contact info');
    }

    return success(data || DEFAULT_CONTACT_INFO);
  } catch (err) {
    logger.error('Unexpected error in GET /api/contact-info', { error: String(err) });
    // Return default values on error to ensure the UI always has something to display
    return success(DEFAULT_CONTACT_INFO);
  }
}
