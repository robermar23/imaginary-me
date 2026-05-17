import { test, expect } from '@playwright/test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const FIXTURE_IMAGE = path.join(__dirname, 'fixtures', 'test-photo.jpg')

// ── Landing page ──────────────────────────────────────────────────────────────

test.describe('Landing page', () => {
  test('shows headline and CTA', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /reimagine yourself/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /start creating/i })).toBeVisible()
  })

  test('CTA navigates to create flow', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /start creating/i }).click()
    await expect(page).toHaveURL(/\/create/)
  })
})

// ── Survey wizard ─────────────────────────────────────────────────────────────

test.describe('Survey wizard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/create')
  })

  test('shows the entertainment step by default', async ({ page }) => {
    await expect(page.getByText(/movies/i).first()).toBeVisible()
  })

  test('adds a movie tag and advances to step 2', async ({ page }) => {
    // Add a movie via the tag input
    const movieInput = page.getByPlaceholder(/type a movie/i)
    await movieInput.fill('Dune')
    await movieInput.press('Enter')
    await expect(page.getByText('Dune')).toBeVisible()

    // Advance
    await page.getByRole('button', { name: /next/i }).click()
    await expect(page).toHaveURL(/survey-dreams/)
  })

  test('advances through all 3 survey steps', async ({ page }) => {
    // Step 1 → Step 2
    const movieInput = page.getByPlaceholder(/type a movie/i)
    await movieInput.fill('Dune')
    await movieInput.press('Enter')
    await page.getByRole('button', { name: /next/i }).click()
    await expect(page).toHaveURL(/survey-dreams/)

    // Step 2 → Step 3
    await page.getByRole('button', { name: /next/i }).click()
    await expect(page).toHaveURL(/survey-aesthetic/)

    // Step 3 → Photo upload
    await page.getByRole('button', { name: /next/i }).click()
    await expect(page).toHaveURL(/photo-upload/)
  })

  test('back button preserves entered data', async ({ page }) => {
    const movieInput = page.getByPlaceholder(/type a movie/i)
    await movieInput.fill('Inception')
    await movieInput.press('Enter')

    await page.getByRole('button', { name: /next/i }).click()
    await page.getByRole('button', { name: /back/i }).click()

    await expect(page.getByText('Inception')).toBeVisible()
  })
})

// ── Photo upload ──────────────────────────────────────────────────────────────

test.describe('Photo upload', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/create?step=photo-upload')
  })

  test('shows upload dropzone and tips', async ({ page }) => {
    await expect(page.getByText(/tap to upload|drag.*photos/i)).toBeVisible()
  })

  test('Next button is disabled with no photos', async ({ page }) => {
    await expect(page.getByRole('button', { name: /next/i })).toBeDisabled()
  })
})

// ── Generation settings ───────────────────────────────────────────────────────

test.describe('Generation settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/create?step=generation-settings')
  })

  test('shows image count slider', async ({ page }) => {
    await expect(page.getByRole('slider')).toBeVisible()
  })

  test('shows the generate button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /reimagine me/i })).toBeVisible()
  })
})

// ── Navigation ────────────────────────────────────────────────────────────────

test.describe('Navigation', () => {
  test('logo link returns to landing page', async ({ page }) => {
    await page.goto('/create')
    await page.getByRole('link', { name: /imaginary me/i }).click()
    await expect(page).toHaveURL('/')
  })

  test('404 page is shown for unknown routes', async ({ page }) => {
    await page.goto('/does-not-exist')
    await expect(page.getByText(/doesn.t exist yet|not found/i)).toBeVisible()
  })
})
