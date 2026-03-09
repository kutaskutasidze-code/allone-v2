import { createBrowserClient } from '@supabase/ssr';
import { revalidateTag } from 'next/cache';

/**
 * Invalidate cache for a specific tag
 * Next.js 16 requires a cache profile as the second argument
 */
export function invalidateCache(tag: string): void {
  try {
    // Use expire: 0 to immediately invalidate the cache
    revalidateTag(tag, { expire: 0 });
  } catch (error) {
    // Log but don't throw - cache invalidation shouldn't break the request
    console.error(`Failed to invalidate cache tag "${tag}":`, error);
  }
}

/**
 * Create a public Supabase client for caching
 * This client doesn't use cookies, making it safe for use in cached functions
 */
function createPublicClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Fetch categories from database
 */
export async function getCachedCategories() {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Failed to fetch categories:', error.message);
    return [];
  }

  return data || [];
}

/**
 * Fetch published services from database
 */
export async function getCachedServices() {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('is_published', true)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Failed to fetch services:', error.message);
    return [];
  }

  return data || [];
}

/**
 * Fetch published projects from database
 */
export async function getCachedProjects() {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('is_published', true)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Failed to fetch projects:', error.message);
    return [];
  }

  return data || [];
}

/**
 * Fetch published clients from database
 */
export async function getCachedClients() {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('is_published', true)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Failed to fetch clients:', error.message);
    return [];
  }

  return data || [];
}

/**
 * Fetch stats from database
 */
export async function getCachedStats() {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('stats')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Failed to fetch stats:', error.message);
    return [];
  }

  return data || [];
}

/**
 * Fetch company values from database
 */
export async function getCachedValues() {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('company_values')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Failed to fetch values:', error.message);
    return [];
  }

  return data || [];
}

/**
 * Fetch about content from database
 */
export async function getCachedAboutContent() {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('about_content')
    .select('*')
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Failed to fetch about content:', error.message);
    return null;
  }

  return data || null;
}

/**
 * Fetch contact info from database
 */
export async function getCachedContactInfo() {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('contact_info')
    .select('*')
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Failed to fetch contact info:', error.message);
    return null;
  }

  return data || {
    email: 'info@allone.ge',
    location: 'San Francisco, CA',
    phone: null,
  };
}
