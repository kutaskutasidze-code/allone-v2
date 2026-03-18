import { describe, it, expect, vi } from 'vitest';

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    },
  })),
}));

describe('Auth Module', () => {
  it('should export requireAuth function', async () => {
    const { requireAuth } = await import('@/lib/auth');
    expect(requireAuth).toBeDefined();
    expect(typeof requireAuth).toBe('function');
  });

  it('should export checkAuth function', async () => {
    const { checkAuth } = await import('@/lib/auth');
    expect(checkAuth).toBeDefined();
    expect(typeof checkAuth).toBe('function');
  });

  it('should export AuthError class', async () => {
    const { AuthError } = await import('@/lib/auth');
    expect(AuthError).toBeDefined();
    const error = new AuthError('test');
    expect(error.message).toBe('test');
    expect(error.name).toBe('AuthError');
  });

  it('checkAuth should return null when not authenticated', async () => {
    const { checkAuth } = await import('@/lib/auth');
    const result = await checkAuth();
    expect(result).toBeNull();
  });
});
