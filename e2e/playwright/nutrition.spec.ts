/**
 * Playwright E2E test for Nutrition - AddMeal flow
 * Tests: 5-second meal add target
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:19006';

test.describe('AddMeal Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    // Navigate to Nutrition (assuming it's accessible via Nutrition tab or Home)
    await page.click('[aria-label="Home"]');
  });

  test('should complete meal add in under 5 seconds (happy path)', async ({ page }) => {
    const startTime = Date.now();
    
    // Open AddMeal sheet
    await page.click('[data-testid="add-meal-button"]');
    await page.locator('[data-testid="add-meal-sheet"]').waitFor({ timeout: 2000 });
    
    // Click a recent chip (fastest path)
    const recentChip = page.locator('[data-testid="recent-chip"]').first();
    await expect(recentChip).toBeVisible({ timeout: 2000 });
    await recentChip.click();
    
    // Confirm (should default to 1 serving)
    await page.click('[data-testid="add-meal-confirm"]');
    
    // Wait for sheet to close
    await page.locator('[data-testid="add-meal-sheet"]').waitFor({ state: 'hidden', timeout: 2000 });
    
    const duration = Date.now() - startTime;
    console.log(`AddMeal duration: ${duration}ms`);
    
    expect(duration).toBeLessThan(5000);
  });

  test('should show search results quickly', async ({ page }) => {
    // Open AddMeal sheet
    await page.click('[data-testid="add-meal-button"]');
    await page.locator('[data-testid="add-meal-sheet"]').waitFor({ timeout: 2000 });
    
    // Type search query
    const searchInput = page.locator('[placeholder="Search foods..."]');
    await searchInput.fill('chicken');
    
    // Should see results within 300ms
    const startTime = Date.now();
    await page.locator('[data-testid="food-search-result"]').first().waitFor({ timeout: 1000 });
    const searchTime = Date.now() - startTime;
    
    console.log(`Search results time: ${searchTime}ms`);
    expect(searchTime).toBeLessThan(500);
  });

  test('should support barcode button', async ({ page }) => {
    // Open AddMeal sheet
    await page.click('[data-testid="add-meal-button"]');
    await page.locator('[data-testid="add-meal-sheet"]').waitFor({ timeout: 2000 });
    
    // Click barcode button
    const barcodeButton = page.locator('[data-testid="barcode-button"]');
    await expect(barcodeButton).toBeVisible();
    
    // On web, should show manual entry fallback
    await barcodeButton.click();
    await expect(page.locator('text="Enter barcode"')).toBeVisible({ timeout: 2000 });
  });
});

test.describe('Goals Setup', () => {
  test('should save goals and calculate TDEE', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('[aria-label="Progress"]');
    
    // Click "Set Your Goals"
    await page.click('text="Set Your Goals"');
    await page.locator('[data-testid="goal-setup-modal"]').waitFor({ timeout: 2000 });
    
    // Fill in basics
    await page.fill('[name="age"]', '30');
    await page.fill('[name="height"]', '175');
    await page.fill('[name="weight"]', '80');
    await page.click('text="Next"');
    
    // Select activity level
    await page.click('text="Moderate"');
    await page.click('text="Next"');
    
    // Select target
    await page.click('text="Recomp"');
    await page.click('text="Save"');
    
    // Should see TDEE displayed
    await expect(page.locator('text="TDEE"')).toBeVisible({ timeout: 2000 });
    await expect(page.locator('text=/\\d{4}/')).toBeVisible(); // TDEE number
  });
});

