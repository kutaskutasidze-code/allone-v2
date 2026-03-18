import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';

let supabaseClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!supabaseClient) {
    if (!config.supabase.url || !config.supabase.serviceRoleKey) {
      throw new Error('Supabase configuration missing');
    }

    supabaseClient = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    logger.info('Supabase client initialized');
  }

  return supabaseClient;
}

// Lead types
export interface LeadData {
  id?: string;
  name: string;
  company?: string;
  company_name_local?: string;
  email?: string;
  phone?: string;
  website?: string;
  industry?: string;
  company_size?: 'small' | 'medium' | 'large' | 'enterprise';
  description?: string;
  address?: string;
  city?: string;
  country: string;
  linkedin_url?: string;
  facebook_url?: string;
  instagram_url?: string;
  matched_service?: string;
  relevance_score?: number;
  tags?: string[];
  source_id?: string;
  source_url?: string;
  is_scraped?: boolean;
}

export interface LeadSource {
  id: string;
  name: string;
  source_type: string;
  base_url: string;
  countries: string[];
  is_active: boolean;
  scrape_config: Record<string, unknown>;
}

export interface ScrapeJob {
  id: string;
  source_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  search_query?: string;
  country?: string;
  city?: string;
  leads_found: number;
  leads_new: number;
  leads_duplicate: number;
  leads_enriched: number;
  error_message?: string;
  metadata?: Record<string, unknown>;
}
