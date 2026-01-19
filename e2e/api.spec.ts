import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('API Routes', () => {
  test('POST /api/newsletter should accept valid email', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/newsletter`, {
      data: { email: `test-${Date.now()}@example.com` },
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  test('POST /api/newsletter should reject invalid email', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/newsletter`, {
      data: { email: 'invalid-email' },
    });

    // Should return validation error
    expect(response.status()).toBe(400);
  });

  test('POST /api/contact should require all fields', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/contact`, {
      data: { name: 'Test' }, // Missing email and message
    });

    expect(response.status()).toBe(400);
  });

  test('GET /api/admin/* should require authentication', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/admin/claude/stats`);

    // Should return 401 Unauthorized
    expect(response.status()).toBe(401);
  });
});
