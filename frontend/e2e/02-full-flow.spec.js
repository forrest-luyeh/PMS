/**
 * 測試 2：完整流程（Multi-Tenant 版）
 *
 * 以 TENANT_ADMIN (admin@example.com) 身份，在預設集團 → 預設品牌 → 預設旅館
 * 端對端完整住房作業：
 *   登入 → 新增客人 → 新增訂房 → Check-in → 附加消費 → 折扣 → 收款 → Check-out → 房務清潔 → 用戶管理
 */

import { test, expect } from '@playwright/test'
import { login, today, daysAfter, navTo, step } from './helpers.js'

const SUFFIX = Date.now().toString().slice(-6)
const GUEST_NAME = `測試客人 ${SUFFIX}`
const GUEST_PHONE = `09${SUFFIX}`

test.describe('完整流程：客人建立 → 住房全週期（預設旅館）', () => {

  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  // ─── Step 1：新增客人 ──────────────────────────────────────────
  test('2-1 新增客人（歸屬預設旅館）', async ({ page }) => {
    await navTo(page, '客人管理', '/guests')
    await expect(page.getByRole('heading', { name: '客人管理' })).toBeVisible()
    await step(page)

    await page.getByRole('button', { name: '+ 新增客人' }).click()
    await expect(page.getByRole('heading', { name: '新增客人' })).toBeVisible()

    await page.locator('.fixed').locator('input').nth(0).fill(GUEST_NAME)
    await page.locator('.fixed').locator('input').nth(2).fill(GUEST_PHONE)
    await page.locator('.fixed').locator('input').nth(3).fill(`test${SUFFIX}@example.com`)
    await page.locator('.fixed').locator('input').nth(4).fill('台灣')
    await step(page)

    await page.getByRole('button', { name: '儲存' }).click()
    await expect(page.getByRole('heading', { name: '新增客人' })).not.toBeVisible()

    await page.locator('input[placeholder*="搜尋"]').fill(GUEST_NAME.slice(0, 5))
    await expect(page.locator(`td:has-text("${GUEST_NAME}")`)).toBeVisible()
  })

  // ─── Step 2：新增訂房 ──────────────────────────────────────────
  test('2-2 為新客人建立訂房', async ({ page }) => {
    await navTo(page, '訂房管理', '/reservations')
    await step(page)

    await page.getByRole('button', { name: '+ 新增訂房' }).click()
    await expect(page.getByRole('heading', { name: '新增訂房' })).toBeVisible()

    const modal = page.locator('.fixed')
    const guestSelect = modal.locator('select').nth(0)
    const guestOption = guestSelect.locator(`option:has-text("${GUEST_NAME}")`)
    await expect(guestOption).toBeAttached({ timeout: 8000 })
    const guestVal = await guestOption.getAttribute('value')
    await guestSelect.selectOption(guestVal)

    await expect(modal.locator('select').nth(1).locator('option').nth(1)).toBeAttached({ timeout: 8000 })
    await modal.locator('select').nth(1).selectOption({ index: 1 })

    await modal.locator('input[type="date"]').nth(0).fill(today())
    await modal.locator('input[type="date"]').nth(1).fill(daysAfter(2))
    await step(page)

    await page.getByRole('button', { name: '建立訂房' }).click()
    await expect(page.getByRole('heading', { name: '新增訂房' })).not.toBeVisible()

    await page.locator('input[placeholder*="搜尋"]').fill(GUEST_NAME.slice(0, 5))
    await expect(page.locator(`td:has-text("${GUEST_NAME}")`)).toBeVisible()
  })

  // ─── Step 3：Check-in ─────────────────────────────────────────
  test('2-3 執行 Check-in 並指定房間', async ({ page }) => {
    await navTo(page, '訂房管理', '/reservations')
    await page.locator('input[placeholder*="搜尋"]').fill(GUEST_NAME.slice(0, 5))

    const row = page.locator('tr').filter({ hasText: GUEST_NAME }).first()
    await expect(row).toBeVisible({ timeout: 5000 })
    await row.getByRole('button', { name: '詳細' }).click()
    await expect(page.getByRole('heading', { name: '訂房詳細' })).toBeVisible()
    await step(page)

    await page.getByRole('button', { name: 'Check-in' }).click()

    const roomSelect = page.locator('select').filter({ hasText: '請選擇可用房間' })
    await page.waitForTimeout(800)
    const options = await roomSelect.locator('option').all()

    if (options.length > 1) {
      await roomSelect.selectOption({ index: 1 })
      await step(page)
      await page.getByRole('button', { name: '確認入住' }).click()
      await expect(page.locator('text=確認入住')).not.toBeVisible()

      await page.locator('input[placeholder*="搜尋"]').fill(GUEST_NAME.slice(0, 5))
      await expect(
        page.locator('tr').filter({ hasText: GUEST_NAME }).locator('td:has-text("住中")')
      ).toBeVisible()
    } else {
      test.info().annotations.push({ type: 'warning', description: '無可用房間，跳過 Check-in' })
      await page.keyboard.press('Escape')
    }
  })

  // ─── Step 4：帳務操作 ─────────────────────────────────────────
  test('2-4 附加消費、折扣、收款', async ({ page }) => {
    await navTo(page, '訂房管理', '/reservations')
    await page.locator('input[placeholder*="搜尋"]').fill(GUEST_NAME.slice(0, 5))

    const checkedInRow = page.locator('tr').filter({ hasText: GUEST_NAME }).filter({ hasText: '住中' }).first()
    if (await checkedInRow.count() === 0) { test.skip(); return }

    await checkedInRow.getByRole('button', { name: '詳細' }).click()
    await step(page)
    await page.getByRole('button', { name: '查看帳單' }).click()
    await expect(page.getByText('消費明細')).toBeVisible()
    await step(page)

    // 附加消費 $500
    await page.getByRole('button', { name: '+ 附加消費' }).click()
    await page.locator('.fixed input[type="text"], .fixed input:not([type])').first().fill('餐飲')
    await page.locator('.fixed input[type="number"]').fill('500')
    await step(page)
    await page.getByRole('button', { name: '確認' }).click()
    await expect(page.locator('td:has-text("餐飲")')).toBeVisible()

    // 折扣 $100
    await page.getByRole('button', { name: '+ 折扣' }).click()
    await page.locator('.fixed input[type="text"], .fixed input:not([type])').first().fill('會員折扣')
    await page.locator('.fixed input[type="number"]').fill('100')
    await step(page)
    await page.getByRole('button', { name: '確認' }).click()
    await expect(page.locator('td:has-text("會員折扣")')).toBeVisible()
    await step(page)

    // 讀取餘額並全額收款
    await page.waitForTimeout(500)
    const balanceEl = page.locator('div.text-2xl.font-bold').last()
    const balanceText = await balanceEl.innerText()
    const balance = Math.abs(parseFloat(balanceText.replace(/[^\d.]/g, '')))
    const payAmount = isNaN(balance) || balance === 0 ? '3000' : String(balance)

    await page.getByRole('button', { name: '+ 收款' }).click()
    await page.locator('.fixed input[type="number"]').fill(payAmount)
    await step(page)
    await page.getByRole('button', { name: '確認' }).click()

    // 餘額應 ≤ 0
    await page.waitForTimeout(500)
    const finalText = await page.locator('div.text-2xl.font-bold').last().innerText()
    const final = parseFloat(finalText.replace(/[^\d.]/g, ''))
    expect(final).toBeLessThanOrEqual(0)
  })

  // ─── Step 5：Check-out ────────────────────────────────────────
  test('2-5 Check-out', async ({ page }) => {
    await navTo(page, '訂房管理', '/reservations')
    await page.locator('input[placeholder*="搜尋"]').fill(GUEST_NAME.slice(0, 5))

    const checkedInRow = page.locator('tr').filter({ hasText: GUEST_NAME }).filter({ hasText: '住中' }).first()
    if (await checkedInRow.count() === 0) { test.skip(); return }

    await checkedInRow.getByRole('button', { name: '詳細' }).click()
    await expect(page.getByRole('heading', { name: '訂房詳細' })).toBeVisible()
    await step(page)

    await page.getByRole('button', { name: 'Check-out' }).click()
    await page.waitForTimeout(1500)

    await page.locator('input[placeholder*="搜尋"]').fill(GUEST_NAME.slice(0, 5))
    await expect(
      page.locator('tr').filter({ hasText: GUEST_NAME }).locator('td:has-text("已退房")')
    ).toBeVisible({ timeout: 5000 })
  })

  // ─── Step 6：房務清潔 ─────────────────────────────────────────
  test('2-6 房務看板出現待清房間並標記完成', async ({ page }) => {
    await navTo(page, '房務看板', '/housekeeping')
    await expect(page.getByRole('heading', { name: '房務看板' })).toBeVisible()
    await step(page)

    const hasRooms = await page.locator('button:has-text("標記清潔")').count()
    if (hasRooms === 0) {
      await expect(page.getByText('所有房間清潔完成')).toBeVisible()
      return
    }

    await page.locator('button:has-text("標記清潔")').first().click()
    await expect(page.getByText('標記清潔完成')).toBeVisible()

    await page.locator('textarea').fill('清潔完成，補充備品')
    await step(page)
    await page.getByRole('button', { name: '確認完成' }).click()
    await expect(page.locator('text=標記清潔完成')).not.toBeVisible()
  })

  // ─── Step 7：用戶管理（TENANT_ADMIN 管理同旅館用戶）────────────
  test('2-7 TENANT_ADMIN 新增並編輯旅館用戶', async ({ page }) => {
    await navTo(page, '用戶管理', '/users')
    await expect(page.getByRole('heading', { name: '用戶管理' })).toBeVisible()
    await step(page)

    const NEW_EMAIL = `staff${SUFFIX}@example.com`

    await page.getByRole('button', { name: '+ 新增用戶' }).click()
    await page.locator('.fixed input').nth(0).fill(`員工 ${SUFFIX}`)
    await page.locator('.fixed input').nth(1).fill(NEW_EMAIL)
    await page.locator('.fixed input[type="password"]').fill('staff1234')
    await page.locator('.fixed select').selectOption('FRONT_DESK')
    await step(page)
    await page.getByRole('button', { name: '儲存' }).click()

    await expect(page.getByRole('heading', { name: '新增用戶' })).not.toBeVisible()
    await expect(page.locator(`td:has-text("${NEW_EMAIL}")`)).toBeVisible()
    await step(page)

    // 編輯：改為 Manager
    await page.locator('tr').filter({ hasText: NEW_EMAIL }).getByRole('button', { name: '編輯' }).click()
    await expect(page.getByRole('heading', { name: '編輯用戶' })).toBeVisible()
    await page.locator('.fixed select').nth(0).selectOption('MANAGER')
    await step(page)
    await page.getByRole('button', { name: '儲存' }).click()

    await expect(page.locator('text=編輯用戶')).not.toBeVisible()
    await expect(page.locator('tr').filter({ hasText: NEW_EMAIL }).locator('text=主管')).toBeVisible()
  })

})
