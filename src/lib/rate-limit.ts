import { createClient } from '@/lib/supabase/server';

/**
 * Production-ready rate limiting using Supabase
 *
 * This implementation stores rate limit data in Supabase,
 * making it work correctly in serverless environments like Vercel
 * where in-memory state is not preserved between requests.
 *
 * For high-traffic applications, consider using:
 * - Upstash Redis (https://upstash.com)
 * - Vercel KV
 * - Cloudflare Workers KV
 */

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  maxRequests: number;
  /** Time window in seconds */
  windowSeconds: number;
  /** Identifier prefix for different rate limit types */
  prefix?: string;
}

export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Number of remaining requests in current window */
  remaining: number;
  /** Unix timestamp when the rate limit resets */
  resetAt: number;
}

/**
 * Default rate limit configuration
 */
const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 5,
  windowSeconds: 60,
  prefix: 'rate_limit',
};

/**
 * In-memory fallback for development or when DB is unavailable
 * Note: This won't work in production serverless environments
 */
const memoryStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Clean up expired entries from memory store
 */
function cleanupMemoryStore(): void {
  const now = Date.now();
  for (const [key, value] of memoryStore.entries()) {
    if (value.resetAt < now) {
      memoryStore.delete(key);
    }
  }
}

/**
 * Check rate limit using in-memory store (fallback)
 */
function checkMemoryRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  // Cleanup old entries periodically
  if (Math.random() < 0.1) {
    cleanupMemoryStore();
  }

  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;
  const key = `${config.prefix}:${identifier}`;

  const existing = memoryStore.get(key);

  if (!existing || existing.resetAt < now) {
    // New window
    const resetAt = now + windowMs;
    memoryStore.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt,
    };
  }

  if (existing.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: existing.resetAt,
    };
  }

  existing.count++;
  return {
    allowed: true,
    remaining: config.maxRequests - existing.count,
    resetAt: existing.resetAt,
  };
}

/**
 * Check if a request is rate limited
 *
 * @param identifier - Unique identifier (usually IP address or user ID)
 * @param config - Rate limit configuration
 * @returns Rate limit result with allowed status and remaining requests
 *
 * @example
 * ```ts
 * const result = await checkRateLimit(clientIp, { maxRequests: 5, windowSeconds: 60 });
 * if (!result.allowed) {
 *   return rateLimited();
 * }
 * ```
 */
export async function checkRateLimit(
  identifier: string,
  config: Partial<RateLimitConfig> = {}
): Promise<RateLimitResult> {
  const fullConfig: RateLimitConfig = { ...DEFAULT_CONFIG, ...config };
  const endpoint = fullConfig.prefix || 'default';

  try {
    const supabase = await createClient();

    // Try to use Supabase RPC for rate limiting
    // This works across serverless instances by persisting to database
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_identifier: identifier,
      p_endpoint: endpoint,
      p_max_requests: fullConfig.maxRequests,
      p_window_seconds: fullConfig.windowSeconds,
    });

    if (error) {
      // If the RPC doesn't exist or fails, fall back to memory
      // This is expected before running the migration SQL
      console.warn('Rate limit RPC failed, using memory fallback:', error.message);
      return checkMemoryRateLimit(identifier, fullConfig);
    }

    if (data && data.length > 0) {
      const result = data[0];
      return {
        allowed: result.allowed,
        remaining: result.remaining,
        resetAt: new Date(result.reset_at).getTime(),
      };
    }

    // Fallback to memory if no data returned
    return checkMemoryRateLimit(identifier, fullConfig);
  } catch {
    // Any error - fall back to memory-based rate limiting
    return checkMemoryRateLimit(identifier, fullConfig);
  }
}

/**
 * Get client IP address from request headers
 * Works with Vercel, Cloudflare, and other proxies
 */
export function getClientIp(request: Request): string {
  // Vercel
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  // Cloudflare
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // Real IP (nginx)
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  return 'unknown';
}

/**
 * Simple rate limit check for contact form
 * 5 requests per minute per IP
 */
export async function checkContactRateLimit(request: Request): Promise<RateLimitResult> {
  const ip = getClientIp(request);
  return checkRateLimit(ip, {
    maxRequests: 5,
    windowSeconds: 60,
    prefix: 'contact',
  });
}

/**
 * Stricter rate limit for sensitive operations
 * 3 requests per 5 minutes per IP
 */
export async function checkStrictRateLimit(request: Request): Promise<RateLimitResult> {
  const ip = getClientIp(request);
  return checkRateLimit(ip, {
    maxRequests: 3,
    windowSeconds: 300,
    prefix: 'strict',
  });
}
