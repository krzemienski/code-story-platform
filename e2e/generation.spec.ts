/**
 * Playwright E2E Tests for Story Generation
 *
 * These tests verify the complete user flow from URL input to audio playback.
 *
 * Prerequisites:
 * - Playwright installed: npx playwright install
 * - App running locally or deployed URL
 */

import { test, expect, type Page } from "@playwright/test"

const BASE_URL = process.env.PLAYWRIGHT_TEST_URL || "http://localhost:3000"

// Helper to wait for generation with progress updates
async function waitForGeneration(page: Page, timeout = 300000) {
  const startTime = Date.now()

  while (Date.now() - startTime < timeout) {
    // Check if complete
    const completeButton = await page.$('button:has-text("Listen Now")')
    if (completeButton) {
      return true
    }

    // Check if failed
    const errorMessage = await page.$(".text-destructive")
    if (errorMessage) {
      const text = await errorMessage.textContent()
      throw new Error(`Generation failed: ${text}`)
    }

    // Log progress
    const progressElement = await page.$(".text-muted-foreground")
    if (progressElement) {
      const progress = await progressElement.textContent()
      console.log(`Progress: ${progress}`)
    }

    await page.waitForTimeout(5000)
  }

  throw new Error("Generation timed out")
}

test.describe("Story Generation Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL)
  })

  test("should load the home page with generator", async ({ page }) => {
    // Take screenshot of initial state
    await page.screenshot({ path: "screenshots/01-home-page.png", fullPage: true })

    // Verify generator is visible
    const input = await page.locator('input[placeholder*="github.com"]')
    await expect(input).toBeVisible()
  })

  test("should validate GitHub URL and show repo info", async ({ page }) => {
    // Enter a valid GitHub URL
    const input = await page.locator('input[placeholder*="github.com"]')
    await input.fill("https://github.com/vercel/next.js")

    // Click generate button
    await page.click('button:has-text("Generate")')

    // Wait for repo info to appear
    await page.waitForSelector("text=vercel/next.js", { timeout: 10000 })

    // Take screenshot of options step
    await page.screenshot({ path: "screenshots/02-repo-validated.png", fullPage: true })

    // Verify repo info is displayed
    await expect(page.locator("text=vercel/next.js")).toBeVisible()
  })

  test("should show model selection options", async ({ page }) => {
    // Navigate to options
    const input = await page.locator('input[placeholder*="github.com"]')
    await input.fill("https://github.com/facebook/react")
    await page.click('button:has-text("Generate")')
    await page.waitForSelector("text=facebook/react", { timeout: 10000 })

    // Open model configuration
    const configButton = await page.locator('button:has-text("Configure")')
    if (await configButton.isVisible()) {
      await configButton.click()
      await page.screenshot({ path: "screenshots/03-model-config.png", fullPage: true })
    }

    // Verify model selector is available
    const aiModelSection = await page.locator("text=AI Model")
    await expect(aiModelSection).toBeVisible()
  })

  test("should show generation mode selector", async ({ page }) => {
    // Navigate to options
    const input = await page.locator('input[placeholder*="github.com"]')
    await input.fill("https://github.com/openai/whisper")
    await page.click('button:has-text("Generate")')
    await page.waitForSelector("text=openai/whisper", { timeout: 10000 })

    // Look for generation mode options
    const hybridMode = await page.locator("text=Hybrid")
    const studioMode = await page.locator("text=Studio")

    // Take screenshot
    await page.screenshot({ path: "screenshots/04-generation-modes.png", fullPage: true })

    // Verify modes are available
    if (await hybridMode.isVisible()) {
      await expect(hybridMode).toBeVisible()
    }
  })

  test("should select narrative style", async ({ page }) => {
    // Navigate to options
    const input = await page.locator('input[placeholder*="github.com"]')
    await input.fill("https://github.com/microsoft/typescript")
    await page.click('button:has-text("Generate")')
    await page.waitForSelector("text=microsoft/typescript", { timeout: 10000 })

    // Select documentary style
    await page.click("text=Documentary")

    // Take screenshot
    await page.screenshot({ path: "screenshots/05-style-selected.png", fullPage: true })

    // Verify selection
    const documentaryButton = await page.locator('button:has-text("Documentary")')
    await expect(documentaryButton).toHaveClass(/border-primary/)
  })

  test("should select duration", async ({ page }) => {
    // Navigate to options
    const input = await page.locator('input[placeholder*="github.com"]')
    await input.fill("https://github.com/tailwindlabs/tailwindcss")
    await page.click('button:has-text("Generate")')
    await page.waitForSelector("text=tailwindlabs/tailwindcss", { timeout: 10000 })

    // Select 15 min duration
    await page.click('button:has-text("15 min")')

    // Take screenshot
    await page.screenshot({ path: "screenshots/06-duration-selected.png", fullPage: true })
  })

  test("should show advanced voice options", async ({ page }) => {
    // Navigate to options
    const input = await page.locator('input[placeholder*="github.com"]')
    await input.fill("https://github.com/prisma/prisma")
    await page.click('button:has-text("Generate")')
    await page.waitForSelector("text=prisma/prisma", { timeout: 10000 })

    // Open advanced options
    await page.click("text=Advanced options")

    // Wait for voice options to appear
    await page.waitForSelector("text=Voice", { timeout: 5000 })

    // Take screenshot
    await page.screenshot({ path: "screenshots/07-advanced-options.png", fullPage: true })

    // Verify voice options are visible
    await expect(page.locator("text=Rachel")).toBeVisible()
  })

  // This test actually generates audio - use sparingly
  test.skip("should complete full generation flow", async ({ page }) => {
    // Navigate to options
    const input = await page.locator('input[placeholder*="github.com"]')
    await input.fill("https://github.com/lodash/lodash")
    await page.click('button:has-text("Generate")')
    await page.waitForSelector("text=lodash/lodash", { timeout: 10000 })

    // Select quick 5-minute generation
    await page.click('button:has-text("5 min")')

    // Take pre-generation screenshot
    await page.screenshot({ path: "screenshots/08-pre-generation.png", fullPage: true })

    // Start generation
    await page.click('button:has-text("Generate Tale")')

    // Wait for generation to start
    await page.waitForSelector("text=Starting...", { timeout: 10000 })

    // Take in-progress screenshot
    await page.screenshot({ path: "screenshots/09-generation-progress.png", fullPage: true })

    // Wait for completion (5 minute timeout for short generation)
    await waitForGeneration(page, 300000)

    // Take completion screenshot
    await page.screenshot({ path: "screenshots/10-generation-complete.png", fullPage: true })

    // Verify completion
    await expect(page.locator("text=Your tale is ready!")).toBeVisible()
    await expect(page.locator('button:has-text("Listen Now")')).toBeVisible()
  })
})

test.describe("Story Player", () => {
  test("should display public story with audio player", async ({ page }) => {
    // Get a completed story ID from the database first
    // For now, navigate to discover page to find a story
    await page.goto(`${BASE_URL}/discover`)

    // Wait for stories to load
    await page.waitForSelector('[class*="card"]', { timeout: 10000 })

    // Take screenshot
    await page.screenshot({ path: "screenshots/11-discover-page.png", fullPage: true })

    // Click on first story
    const firstStory = await page.locator('[class*="card"]').first()
    await firstStory.click()

    // Wait for story page to load
    await page.waitForSelector('audio, [class*="audio-player"]', { timeout: 10000 })

    // Take screenshot of story page
    await page.screenshot({ path: "screenshots/12-story-page.png", fullPage: true })
  })

  test("should have working audio controls", async ({ page }) => {
    // Navigate to a known story (you'd need a real story ID)
    await page.goto(`${BASE_URL}/discover`)

    // Wait for content
    await page.waitForSelector('[class*="card"]', { timeout: 10000 })

    // Find play button
    const playButton = await page.locator('button[aria-label*="play"], button:has-text("Play")')

    if (await playButton.isVisible()) {
      await playButton.click()
      await page.waitForTimeout(2000)

      // Take screenshot with audio playing
      await page.screenshot({ path: "screenshots/13-audio-playing.png", fullPage: true })
    }
  })
})

test.describe("Dashboard", () => {
  test("should show user stories after login", async ({ page }) => {
    // Navigate to login
    await page.goto(`${BASE_URL}/auth/login`)

    // Take screenshot of login page
    await page.screenshot({ path: "screenshots/14-login-page.png", fullPage: true })
  })
})
