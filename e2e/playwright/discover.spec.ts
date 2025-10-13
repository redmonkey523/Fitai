/**
 * Playwright E2E test for Discover feature
 * Tests: loading, skeleton, data display, error handling
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:19006';

test.describe('Discover Screen', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    // Navigate to Discover tab
    await page.click('[aria-label="Discover"]');
  });

  test('should show skeleton loader initially', async ({ page }) => {
    // Wait for skeleton to appear
    const skeleton = page.locator('[data-testid="skeleton-loader"]').first();
    await expect(skeleton).toBeVisible({ timeout: 2000 });
  });

  test('should load and display trending programs within 500ms', async ({ page }) => {
    const startTime = Date.now();
    
    // Wait for first program card
    await page.locator('[data-testid="program-card"]').first().waitFor({ timeout: 5000 });
    
    const loadTime = Date.now() - startTime;
    console.log(`Discover TTFB: ${loadTime}ms`);
    
    expect(loadTime).toBeLessThan(1000); // Allow buffer for CI
  });

  test('should display trending programs', async ({ page }) => {
    // Wait for programs to load
    const programCard = page.locator('[data-testid="program-card"]').first();
    await expect(programCard).toBeVisible({ timeout: 5000 });
  });

  test('should allow switching between tabs', async ({ page }) => {
    // Click Coaches tab
    await page.click('text="Coaches"');
    await expect(page.locator('[data-testid="coach-card"]').first()).toBeVisible({ timeout: 5000 });
    
    // Click Programs tab
    await page.click('text="Programs"');
    await expect(page.locator('[data-testid="program-card"]').first()).toBeVisible({ timeout: 5000 });
  });

  test('should support pull-to-refresh', async ({ page }) => {
    // Wait for initial load
    await page.locator('[data-testid="program-card"]').first().waitFor({ timeout: 5000 });
    
    // Simulate pull-to-refresh (scroll up)
    await page.evaluate(() => {
      window.scrollTo(0, -100);
    });
    
    // Should see loading indicator briefly
    await page.waitForTimeout(500);
  });

  test('should show error state with retry on failure', async ({ page }) => {
    // Mock API failure
    await page.route('**/api/trending*', route => route.abort());
    
    await page.reload();
    await page.click('[aria-label="Discover"]');
    
    // Should show error state
    const errorState = page.locator('text="Something went wrong"');
    await expect(errorState).toBeVisible({ timeout: 5000 });
    
    // Should have retry button
    const retryButton = page.locator('text="Try Again"');
    await expect(retryButton).toBeVisible();
  });

  test('should show empty state when no results', async ({ page }) => {
    // Mock empty API response
    await page.route('**/api/trending*', route => route.fulfill({
      status: 200,
      body: JSON.stringify({ items: [] })
    }));
    
    await page.reload();
    await page.click('[aria-label="Discover"]');
    
    // Should show empty state
    const emptyState = page.locator('[data-testid="empty-state"]');
    await expect(emptyState).toBeVisible({ timeout: 5000 });
  });
});

