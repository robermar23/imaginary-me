import { test, expect } from '@playwright/test'

// Runs only in the mobile-chrome project (Pixel 5 viewport)
test.use({ viewport: { width: 393, height: 851 } })

test.describe('Mobile — landing page', () => {
  test('hero is visible on 375px viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /reimagine yourself/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /start creating/i })).toBeVisible()
  })
})

test.describe('Mobile — survey', () => {
  test('survey step layout fits on iPhone SE (375px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/create')
    // Back and Next buttons must both be in viewport without scrolling
    await expect(page.getByRole('button', { name: /next/i })).toBeInViewport()
  })

  test('tag input works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/create')
    const input = page.getByPlaceholder(/type a movie/i)
    await input.tap()
    await input.fill('Avatar')
    await input.press('Enter')
    await expect(page.getByText('Avatar')).toBeVisible()
  })
})

test.describe('Mobile — navigation', () => {
  test('step label is visible in header', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/create?step=photo-upload')
    await expect(page.getByText(/upload photos/i)).toBeVisible()
  })
})
