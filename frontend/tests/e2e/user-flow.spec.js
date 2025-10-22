import { test, expect } from '@playwright/test';

test.describe('FlowTune User Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display homepage correctly', async ({ page }) => {
    // Check if the main elements are visible
    await expect(page.locator('h1')).toContainText('FlowTune');
    await expect(page.locator('nav')).toBeVisible();
    
    // Check navigation links
    await expect(page.locator('a[href="/marketplace"]')).toBeVisible();
    await expect(page.locator('a[href="/create"]')).toBeVisible();
  });

  test('should navigate to marketplace', async ({ page }) => {
    await page.click('a[href="/marketplace"]');
    await expect(page).toHaveURL('/marketplace');
    
    // Check marketplace elements
    await expect(page.locator('h1')).toContainText('Marketplace');
    await expect(page.locator('[data-testid="nft-grid"]')).toBeVisible();
  });

  test('should navigate to create page', async ({ page }) => {
    await page.click('a[href="/create"]');
    await expect(page).toHaveURL('/create');
    
    // Check create page elements
    await expect(page.locator('h1')).toContainText('Create');
    await expect(page.locator('[data-testid="ai-generation-form"]')).toBeVisible();
  });

  test('should handle wallet connection flow', async ({ page }) => {
    // Click connect wallet button
    await page.click('[data-testid="connect-wallet-btn"]');
    
    // Check if wallet modal appears
    await expect(page.locator('[data-testid="wallet-modal"]')).toBeVisible();
    
    // Check wallet options
    await expect(page.locator('[data-testid="blocto-wallet"]')).toBeVisible();
    await expect(page.locator('[data-testid="dapper-wallet"]')).toBeVisible();
  });

  test('should test AI music generation form', async ({ page }) => {
    await page.goto('/create');
    
    // Fill out the form
    await page.fill('[data-testid="prompt-input"]', 'Create a peaceful ambient track');
    await page.selectOption('[data-testid="genre-select"]', 'ambient');
    await page.selectOption('[data-testid="duration-select"]', '30');
    
    // Submit form (this will be mocked in test environment)
    await page.click('[data-testid="generate-btn"]');
    
    // Check if generation starts
    await expect(page.locator('[data-testid="generation-status"]')).toBeVisible();
  });

  test('should test marketplace filtering', async ({ page }) => {
    await page.goto('/marketplace');
    
    // Test genre filter
    await page.selectOption('[data-testid="genre-filter"]', 'electronic');
    await page.waitForTimeout(1000); // Wait for filter to apply
    
    // Test price filter
    await page.selectOption('[data-testid="price-filter"]', 'low-to-high');
    await page.waitForTimeout(1000);
    
    // Test search
    await page.fill('[data-testid="search-input"]', 'ambient');
    await page.press('[data-testid="search-input"]', 'Enter');
    await page.waitForTimeout(1000);
  });

  test('should test NFT detail page', async ({ page }) => {
    await page.goto('/marketplace');
    
    // Click on first NFT (if available)
    const firstNft = page.locator('[data-testid="nft-card"]').first();
    if (await firstNft.isVisible()) {
      await firstNft.click();
      
      // Check NFT detail page elements
      await expect(page.locator('[data-testid="nft-title"]')).toBeVisible();
      await expect(page.locator('[data-testid="nft-description"]')).toBeVisible();
      await expect(page.locator('[data-testid="nft-price"]')).toBeVisible();
      await expect(page.locator('[data-testid="audio-player"]')).toBeVisible();
    }
  });

  test('should test responsive design on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    
    // Check if mobile menu toggle is visible
    await expect(page.locator('[data-testid="mobile-menu-toggle"]')).toBeVisible();
    
    // Test mobile menu
    await page.click('[data-testid="mobile-menu-toggle"]');
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
    
    // Test navigation in mobile menu
    await page.click('[data-testid="mobile-menu"] a[href="/marketplace"]');
    await expect(page).toHaveURL('/marketplace');
  });

  test('should test audio player functionality', async ({ page }) => {
    await page.goto('/marketplace');
    
    // Find an NFT with audio and click play
    const playButton = page.locator('[data-testid="play-button"]').first();
    if (await playButton.isVisible()) {
      await playButton.click();
      
      // Check if audio player controls appear
      await expect(page.locator('[data-testid="audio-controls"]')).toBeVisible();
      await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible();
      
      // Test pause functionality
      await page.click('[data-testid="pause-button"]');
    }
  });

  test('should test playlist functionality', async ({ page }) => {
    // Navigate to playlists page
    await page.goto('/playlists');
    
    // Check playlist elements
    await expect(page.locator('h1')).toContainText('Playlists');
    
    // Test create playlist button
    const createBtn = page.locator('[data-testid="create-playlist-btn"]');
    if (await createBtn.isVisible()) {
      await createBtn.click();
      await expect(page.locator('[data-testid="playlist-modal"]')).toBeVisible();
    }
  });

  test('should test user profile page', async ({ page }) => {
    // Navigate to profile page
    await page.goto('/profile');
    
    // Check profile elements
    await expect(page.locator('[data-testid="profile-header"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-stats"]')).toBeVisible();
    
    // Test tabs
    await page.click('[data-testid="created-tab"]');
    await expect(page.locator('[data-testid="created-nfts"]')).toBeVisible();
    
    await page.click('[data-testid="owned-tab"]');
    await expect(page.locator('[data-testid="owned-nfts"]')).toBeVisible();
  });

  test('should test error handling', async ({ page }) => {
    // Test 404 page
    await page.goto('/non-existent-page');
    await expect(page.locator('[data-testid="error-page"]')).toBeVisible();
    await expect(page.locator('h1')).toContainText('404');
    
    // Test back to home button
    await page.click('[data-testid="back-home-btn"]');
    await expect(page).toHaveURL('/');
  });

  test('should test accessibility features', async ({ page }) => {
    await page.goto('/');
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    
    // Check focus indicators
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Test skip links
    await page.keyboard.press('Tab');
    const skipLink = page.locator('[data-testid="skip-link"]');
    if (await skipLink.isVisible()) {
      await expect(skipLink).toContainText('Skip to main content');
    }
  });

  test('should test dark mode toggle', async ({ page }) => {
    await page.goto('/');
    
    // Find and click dark mode toggle
    const darkModeToggle = page.locator('[data-testid="dark-mode-toggle"]');
    if (await darkModeToggle.isVisible()) {
      await darkModeToggle.click();
      
      // Check if dark mode is applied
      await expect(page.locator('html')).toHaveClass(/dark/);
      
      // Toggle back to light mode
      await darkModeToggle.click();
      await expect(page.locator('html')).not.toHaveClass(/dark/);
    }
  });
});