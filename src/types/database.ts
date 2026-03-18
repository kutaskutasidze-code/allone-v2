export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string;
          title: string;
          description: string;
          image_url: string | null;
          category: string;
          technologies: string[];
          display_order: number;
          is_published: boolean;
          revenue: number;
          contract_url: string | null;
          invoice_url: string | null;
          project_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          image_url?: string | null;
          category: string;
          technologies?: string[];
          display_order?: number;
          is_published?: boolean;
          revenue?: number;
          contract_url?: string | null;
          invoice_url?: string | null;
          project_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          image_url?: string | null;
          category?: string;
          technologies?: string[];
          display_order?: number;
          is_published?: boolean;
          revenue?: number;
          contract_url?: string | null;
          invoice_url?: string | null;
          project_date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      services: {
        Row: {
          id: string;
          title: string;
          description: string;
          icon: string;
          features: string[];
          subtitle: string | null;
          secondary_description: string | null;
          stats: { value: string; label: string }[];
          footer_text: string | null;
          cta_text: string | null;
          cta_url: string | null;
          card_type: string | null;
          display_order: number;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          icon?: string;
          features?: string[];
          subtitle?: string | null;
          secondary_description?: string | null;
          stats?: { value: string; label: string }[];
          footer_text?: string | null;
          cta_text?: string | null;
          cta_url?: string | null;
          card_type?: string | null;
          display_order?: number;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          icon?: string;
          features?: string[];
          subtitle?: string | null;
          secondary_description?: string | null;
          stats?: { value: string; label: string }[];
          footer_text?: string | null;
          cta_text?: string | null;
          cta_url?: string | null;
          card_type?: string | null;
          display_order?: number;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      clients: {
        Row: {
          id: string;
          name: string;
          logo_text: string;
          logo_url: string | null;
          display_order: number;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          logo_text: string;
          logo_url?: string | null;
          display_order?: number;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          logo_text?: string;
          logo_url?: string | null;
          display_order?: number;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      stats: {
        Row: {
          id: string;
          value: string;
          label: string;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          value: string;
          label: string;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          value?: string;
          label?: string;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      company_values: {
        Row: {
          id: string;
          number: string;
          title: string;
          description: string;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          number: string;
          title: string;
          description: string;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          number?: string;
          title?: string;
          description?: string;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      contact_info: {
        Row: {
          id: string;
          email: string;
          location: string;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          location: string;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          location?: string;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      about_content: {
        Row: {
          id: string;
          hero_subtitle: string;
          hero_title: string;
          story_subtitle: string;
          story_title: string;
          story_paragraphs: string[];
          values_subtitle: string;
          values_title: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          hero_subtitle?: string;
          hero_title: string;
          story_subtitle?: string;
          story_title: string;
          story_paragraphs?: string[];
          values_subtitle?: string;
          values_title?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          hero_subtitle?: string;
          hero_title?: string;
          story_subtitle?: string;
          story_title?: string;
          story_paragraphs?: string[];
          values_subtitle?: string;
          values_title?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          display_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          display_order?: number;
          created_at?: string;
        };
      };
      sales_users: {
        Row: {
          id: string;
          email: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      leads: {
        Row: {
          id: string;
          sales_user_id: string | null;
          name: string;
          email: string | null;
          phone: string | null;
          company: string | null;
          status: 'new' | 'contacted' | 'qualified' | 'won' | 'lost';
          value: number;
          source: string | null;
          notes: string | null;
          // Extended fields for lead generation
          company_name_local: string | null;
          website: string | null;
          industry: string | null;
          company_size: 'small' | 'medium' | 'large' | 'enterprise' | null;
          description: string | null;
          address: string | null;
          city: string | null;
          country: string | null;
          linkedin_url: string | null;
          facebook_url: string | null;
          instagram_url: string | null;
          matched_service: 'chatbots' | 'custom_ai' | 'automation' | 'website' | 'consulting' | null;
          relevance_score: number;
          tags: string[];
          source_id: string | null;
          source_url: string | null;
          email_sent_at: string | null;
          email_opened_at: string | null;
          email_replied_at: string | null;
          is_scraped: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sales_user_id?: string | null;
          name: string;
          email?: string | null;
          phone?: string | null;
          company?: string | null;
          status?: 'new' | 'contacted' | 'qualified' | 'won' | 'lost';
          value?: number;
          source?: string | null;
          notes?: string | null;
          company_name_local?: string | null;
          website?: string | null;
          industry?: string | null;
          company_size?: 'small' | 'medium' | 'large' | 'enterprise' | null;
          description?: string | null;
          address?: string | null;
          city?: string | null;
          country?: string | null;
          linkedin_url?: string | null;
          facebook_url?: string | null;
          instagram_url?: string | null;
          matched_service?: 'chatbots' | 'custom_ai' | 'automation' | 'website' | 'consulting' | null;
          relevance_score?: number;
          tags?: string[];
          source_id?: string | null;
          source_url?: string | null;
          email_sent_at?: string | null;
          email_opened_at?: string | null;
          email_replied_at?: string | null;
          is_scraped?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          sales_user_id?: string | null;
          name?: string;
          email?: string | null;
          phone?: string | null;
          company?: string | null;
          status?: 'new' | 'contacted' | 'qualified' | 'won' | 'lost';
          value?: number;
          source?: string | null;
          notes?: string | null;
          company_name_local?: string | null;
          website?: string | null;
          industry?: string | null;
          company_size?: 'small' | 'medium' | 'large' | 'enterprise' | null;
          description?: string | null;
          address?: string | null;
          city?: string | null;
          country?: string | null;
          linkedin_url?: string | null;
          facebook_url?: string | null;
          instagram_url?: string | null;
          matched_service?: 'chatbots' | 'custom_ai' | 'automation' | 'website' | 'consulting' | null;
          relevance_score?: number;
          tags?: string[];
          source_id?: string | null;
          source_url?: string | null;
          email_sent_at?: string | null;
          email_opened_at?: string | null;
          email_replied_at?: string | null;
          is_scraped?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      lead_sources: {
        Row: {
          id: string;
          name: string;
          source_type: 'maps' | 'directory' | 'jobs' | 'registry' | 'search' | 'manual';
          base_url: string;
          countries: string[];
          is_active: boolean;
          scrape_config: Record<string, unknown>;
          last_scraped_at: string | null;
          leads_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          source_type: 'maps' | 'directory' | 'jobs' | 'registry' | 'search' | 'manual';
          base_url: string;
          countries?: string[];
          is_active?: boolean;
          scrape_config?: Record<string, unknown>;
          last_scraped_at?: string | null;
          leads_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          source_type?: 'maps' | 'directory' | 'jobs' | 'registry' | 'search' | 'manual';
          base_url?: string;
          countries?: string[];
          is_active?: boolean;
          scrape_config?: Record<string, unknown>;
          last_scraped_at?: string | null;
          leads_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      scrape_jobs: {
        Row: {
          id: string;
          source_id: string | null;
          status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
          search_query: string | null;
          country: string | null;
          city: string | null;
          leads_found: number;
          leads_new: number;
          leads_duplicate: number;
          leads_enriched: number;
          error_message: string | null;
          metadata: Record<string, unknown>;
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          source_id?: string | null;
          status?: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
          search_query?: string | null;
          country?: string | null;
          city?: string | null;
          leads_found?: number;
          leads_new?: number;
          leads_duplicate?: number;
          leads_enriched?: number;
          error_message?: string | null;
          metadata?: Record<string, unknown>;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          source_id?: string | null;
          status?: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
          search_query?: string | null;
          country?: string | null;
          city?: string | null;
          leads_found?: number;
          leads_new?: number;
          leads_duplicate?: number;
          leads_enriched?: number;
          error_message?: string | null;
          metadata?: Record<string, unknown>;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
        };
      };
      email_campaigns: {
        Row: {
          id: string;
          name: string;
          subject: string;
          body_template: string;
          target_service: 'chatbots' | 'custom_ai' | 'automation' | 'website' | 'consulting' | null;
          target_countries: string[];
          min_relevance_score: number;
          is_active: boolean;
          emails_sent: number;
          emails_delivered: number;
          emails_opened: number;
          emails_clicked: number;
          emails_replied: number;
          emails_bounced: number;
          daily_limit: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          subject: string;
          body_template: string;
          target_service?: 'chatbots' | 'custom_ai' | 'automation' | 'website' | 'consulting' | null;
          target_countries?: string[];
          min_relevance_score?: number;
          is_active?: boolean;
          emails_sent?: number;
          emails_delivered?: number;
          emails_opened?: number;
          emails_clicked?: number;
          emails_replied?: number;
          emails_bounced?: number;
          daily_limit?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          subject?: string;
          body_template?: string;
          target_service?: 'chatbots' | 'custom_ai' | 'automation' | 'website' | 'consulting' | null;
          target_countries?: string[];
          min_relevance_score?: number;
          is_active?: boolean;
          emails_sent?: number;
          emails_delivered?: number;
          emails_opened?: number;
          emails_clicked?: number;
          emails_replied?: number;
          emails_bounced?: number;
          daily_limit?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      email_logs: {
        Row: {
          id: string;
          lead_id: string | null;
          campaign_id: string | null;
          email_provider_id: string | null;
          to_email: string;
          subject: string;
          status: 'queued' | 'sending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'replied' | 'bounced' | 'failed' | 'unsubscribed';
          sent_at: string | null;
          delivered_at: string | null;
          opened_at: string | null;
          clicked_at: string | null;
          replied_at: string | null;
          bounced_at: string | null;
          error_message: string | null;
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          lead_id?: string | null;
          campaign_id?: string | null;
          email_provider_id?: string | null;
          to_email: string;
          subject: string;
          status?: 'queued' | 'sending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'replied' | 'bounced' | 'failed' | 'unsubscribed';
          sent_at?: string | null;
          delivered_at?: string | null;
          opened_at?: string | null;
          clicked_at?: string | null;
          replied_at?: string | null;
          bounced_at?: string | null;
          error_message?: string | null;
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
        Update: {
          id?: string;
          lead_id?: string | null;
          campaign_id?: string | null;
          email_provider_id?: string | null;
          to_email?: string;
          subject?: string;
          status?: 'queued' | 'sending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'replied' | 'bounced' | 'failed' | 'unsubscribed';
          sent_at?: string | null;
          delivered_at?: string | null;
          opened_at?: string | null;
          clicked_at?: string | null;
          replied_at?: string | null;
          bounced_at?: string | null;
          error_message?: string | null;
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
      };
      email_templates: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          subject: string;
          body: string;
          target_service: 'chatbots' | 'custom_ai' | 'automation' | 'website' | 'consulting' | 'general' | null;
          language: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          subject: string;
          body: string;
          target_service?: 'chatbots' | 'custom_ai' | 'automation' | 'website' | 'consulting' | 'general' | null;
          language?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          subject?: string;
          body?: string;
          target_service?: 'chatbots' | 'custom_ai' | 'automation' | 'website' | 'consulting' | 'general' | null;
          language?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      lead_analytics: {
        Row: {
          id: string;
          date: string;
          leads_scraped: number;
          leads_enriched: number;
          leads_with_email: number;
          leads_with_phone: number;
          emails_sent: number;
          emails_opened: number;
          emails_replied: number;
          scrape_jobs_run: number;
          scrape_jobs_failed: number;
          top_source_id: string | null;
          top_country: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          date: string;
          leads_scraped?: number;
          leads_enriched?: number;
          leads_with_email?: number;
          leads_with_phone?: number;
          emails_sent?: number;
          emails_opened?: number;
          emails_replied?: number;
          scrape_jobs_run?: number;
          scrape_jobs_failed?: number;
          top_source_id?: string | null;
          top_country?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          date?: string;
          leads_scraped?: number;
          leads_enriched?: number;
          leads_with_email?: number;
          leads_with_phone?: number;
          emails_sent?: number;
          emails_opened?: number;
          emails_replied?: number;
          scrape_jobs_run?: number;
          scrape_jobs_failed?: number;
          top_source_id?: string | null;
          top_country?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// Helper types for easier usage
export type Project = Database['public']['Tables']['projects']['Row'];
export type ProjectInsert = Database['public']['Tables']['projects']['Insert'];
export type ProjectUpdate = Database['public']['Tables']['projects']['Update'];

export type Service = Database['public']['Tables']['services']['Row'];
export type ServiceInsert = Database['public']['Tables']['services']['Insert'];
export type ServiceUpdate = Database['public']['Tables']['services']['Update'];

export type Client = Database['public']['Tables']['clients']['Row'];
export type ClientInsert = Database['public']['Tables']['clients']['Insert'];
export type ClientUpdate = Database['public']['Tables']['clients']['Update'];

export type Stat = Database['public']['Tables']['stats']['Row'];
export type StatInsert = Database['public']['Tables']['stats']['Insert'];
export type StatUpdate = Database['public']['Tables']['stats']['Update'];

export type CompanyValue = Database['public']['Tables']['company_values']['Row'];
export type CompanyValueInsert = Database['public']['Tables']['company_values']['Insert'];
export type CompanyValueUpdate = Database['public']['Tables']['company_values']['Update'];

export type ContactInfo = Database['public']['Tables']['contact_info']['Row'];
export type ContactInfoInsert = Database['public']['Tables']['contact_info']['Insert'];
export type ContactInfoUpdate = Database['public']['Tables']['contact_info']['Update'];

export type AboutContent = Database['public']['Tables']['about_content']['Row'];
export type AboutContentInsert = Database['public']['Tables']['about_content']['Insert'];
export type AboutContentUpdate = Database['public']['Tables']['about_content']['Update'];

export type Category = Database['public']['Tables']['categories']['Row'];
export type CategoryInsert = Database['public']['Tables']['categories']['Insert'];
export type CategoryUpdate = Database['public']['Tables']['categories']['Update'];

export type SalesUser = Database['public']['Tables']['sales_users']['Row'];
export type SalesUserInsert = Database['public']['Tables']['sales_users']['Insert'];
export type SalesUserUpdate = Database['public']['Tables']['sales_users']['Update'];

export type Lead = Database['public']['Tables']['leads']['Row'];
export type LeadInsert = Database['public']['Tables']['leads']['Insert'];
export type LeadUpdate = Database['public']['Tables']['leads']['Update'];

export type LeadStatus = Lead['status'];
export type MatchedService = Lead['matched_service'];
export type CompanySize = Lead['company_size'];

// Lead with sales user info for admin view
export interface LeadWithSalesUser extends Lead {
  sales_user?: SalesUser | null;
}

// Lead Generation Types
export type LeadSource = Database['public']['Tables']['lead_sources']['Row'];
export type LeadSourceInsert = Database['public']['Tables']['lead_sources']['Insert'];
export type LeadSourceUpdate = Database['public']['Tables']['lead_sources']['Update'];
export type LeadSourceType = LeadSource['source_type'];

export type ScrapeJob = Database['public']['Tables']['scrape_jobs']['Row'];
export type ScrapeJobInsert = Database['public']['Tables']['scrape_jobs']['Insert'];
export type ScrapeJobUpdate = Database['public']['Tables']['scrape_jobs']['Update'];
export type ScrapeJobStatus = ScrapeJob['status'];

export type EmailCampaign = Database['public']['Tables']['email_campaigns']['Row'];
export type EmailCampaignInsert = Database['public']['Tables']['email_campaigns']['Insert'];
export type EmailCampaignUpdate = Database['public']['Tables']['email_campaigns']['Update'];

export type EmailLog = Database['public']['Tables']['email_logs']['Row'];
export type EmailLogInsert = Database['public']['Tables']['email_logs']['Insert'];
export type EmailLogUpdate = Database['public']['Tables']['email_logs']['Update'];
export type EmailStatus = EmailLog['status'];

export type EmailTemplate = Database['public']['Tables']['email_templates']['Row'];
export type EmailTemplateInsert = Database['public']['Tables']['email_templates']['Insert'];
export type EmailTemplateUpdate = Database['public']['Tables']['email_templates']['Update'];

export type LeadAnalytics = Database['public']['Tables']['lead_analytics']['Row'];
export type LeadAnalyticsInsert = Database['public']['Tables']['lead_analytics']['Insert'];
export type LeadAnalyticsUpdate = Database['public']['Tables']['lead_analytics']['Update'];

// Extended types with relations
export interface LeadWithSource extends Lead {
  lead_source?: LeadSource | null;
}

export interface EmailLogWithRelations extends EmailLog {
  lead?: Lead | null;
  campaign?: EmailCampaign | null;
}

export interface ScrapeJobWithSource extends ScrapeJob {
  lead_source?: LeadSource | null;
}

// Country codes used in lead generation
export type CountryCode = 'KZ' | 'UZ' | 'GE' | 'TR' | 'AM' | 'AZ';

export const COUNTRY_NAMES: Record<CountryCode, string> = {
  KZ: 'Kazakhstan',
  UZ: 'Uzbekistan',
  GE: 'Georgia',
  TR: 'Turkey',
  AM: 'Armenia',
  AZ: 'Azerbaijan',
};

export const SERVICE_NAMES: Record<NonNullable<MatchedService>, string> = {
  chatbots: 'AI Chatbots',
  custom_ai: 'Custom AI Solutions',
  automation: 'Workflow Automation',
  website: 'Website Development',
  consulting: 'AI Consulting',
};
