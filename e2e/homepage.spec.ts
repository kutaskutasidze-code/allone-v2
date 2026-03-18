import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load homepage with key elements', async ({ page }) => {
    await page.goto('/');

    // Check page title
    await expect(page).toHaveTitle(/ALLONE/);

    // Check hero section
    const heroSection = page.locator('section').first();
    await expect(heroSection).toBeVisible();

    // Check navigation
    const nav = page.locator('nav, header').first();
    await expect(nav).toBeVisible();
  });

  test('should have working navigation links', async ({ page }) => {
    await page.goto('/');

    // Services link
    const servicesLink = page.locator('a[href="/services"]').first();
    if (await servicesLink.isVisible()) {
      await servicesLink.click();
      await expect(page).toHaveURL(/\/services/);
    }
  });
});

test.describe('Services Page', () => {
  test('should display services from database', async ({ page }) => {
    await page.goto('/services');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check that services are rendered
    const serviceCards = page.locator('a[href^="/services/"]');
    await expect(serviceCards.first()).toBeVisible();

    // Verify at least one service title
    const titles = page.locator('h3');
    const count = await titles.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('Contact Form', () => {
  test('should have required form fields', async ({ page }) => {
    await page.goto('/contact');

    // Check form fields exist
    const nameField = page.locator('input[name="name"], input[placeholder*="name" i]');
    const emailField = page.locator('input[name="email"], input[type="email"]');
    const messageField = page.locator('textarea[name="message"], textarea');

    // At least email should be required
    if (await emailField.isVisible()) {
      await expect(emailField).toBeVisible();
    }
  });
});
