/**
 * Test: Hotel self-service registration flow
 * Covers: /register page → 3-step form → login as new tenant admin
 */
import { test, expect } from '@playwright/test'
import { step } from './helpers.js'

const unique = () => Date.now().toString(36)

test.describe('旅館自助註冊流程', () => {
  let tenantSlug, hotelSlug, adminEmail

  test.beforeAll(() => {
    const id = unique()
    tenantSlug = `test-group-${id}`
    hotelSlug  = `test-hotel-${id}`
    adminEmail = `admin-${id}@example.com`
  })

  test('01 - 從登入頁點擊「立即註冊旅館」連結', async ({ page }) => {
    await page.goto('/login')
    await step(page)
    await expect(page.getByText('立即註冊旅館')).toBeVisible()
    await page.getByText('立即註冊旅館').click()
    await expect(page).toHaveURL(/\/register/)
    await step(page)
  })

  test('02 - 完成三步驟表單並完成註冊', async ({ page }) => {
    await page.goto('/register')
    await step(page)

    // Step 1: 集團資訊
    await expect(page.getByText('集團資訊')).toBeVisible()
    await page.locator('input').nth(0).fill(`測試集團 ${unique()}`)
    await page.locator('input').nth(1).fill(tenantSlug)
    await page.locator('input').nth(2).fill(`contact-${unique()}@example.com`)
    await step(page)
    await page.getByRole('button', { name: '下一步' }).click()

    // Step 2: 第一間旅館
    await expect(page.getByText('第一間旅館')).toBeVisible()
    await page.locator('input').nth(0).fill(`測試旅館 ${unique()}`)
    await page.locator('input').nth(1).fill(hotelSlug)
    await page.locator('input').nth(2).fill('台北市中正區測試路1號')
    await step(page)
    await page.getByRole('button', { name: '下一步' }).click()

    // Step 3: 管理員帳號
    await expect(page.getByText('管理員帳號')).toBeVisible()
    await page.locator('input').nth(0).fill('測試管理員')
    await page.locator('input').nth(1).fill(adminEmail)
    await page.locator('input').nth(2).fill('testPass1234!')
    await step(page)
    await page.getByRole('button', { name: '完成註冊' }).click()

    // Should redirect to dashboard after registration
    await expect(page).toHaveURL('/', { timeout: 10000 })
    await step(page)
  })

  test('03 - 登出後用新帳號重新登入', async ({ page }) => {
    // Login with the newly created admin
    await page.goto('/login')
    await step(page)
    await page.locator('#email').fill(adminEmail)
    await page.locator('#password').fill('testPass1234!')
    await page.getByRole('button', { name: '登入' }).click()
    await expect(page).toHaveURL('/', { timeout: 8000 })
    await step(page)

    // Verify we land on dashboard with manage menu visible
    await expect(page.getByText('儀表板')).toBeVisible()
    await step(page)
  })
})
