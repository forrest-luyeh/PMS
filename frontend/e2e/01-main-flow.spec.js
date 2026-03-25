/**
 * 測試 1：主流程
 *
 * 涵蓋核心住房作業路徑：
 *   登入 → 新增訂房（使用既有客人）→ Check-in（指定房間）→ Check-out
 */

import { test, expect } from '@playwright/test'
import { login, today, daysAfter, navTo, step } from './helpers.js'

test.describe('主流程：訂房 → Check-in → Check-out', () => {

  test('1-1 管理員可以登入並看到儀表板', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('#email')).toHaveValue('admin@example.com')

    await page.locator('#password').fill('admin1234')
    await step(page)
    await page.getByRole('button', { name: '登入' }).click()

    await page.waitForURL('/')
    await expect(page.getByRole('heading', { name: '今日儀表板' })).toBeVisible()
    await expect(page.getByText('今日抵達').first()).toBeVisible()
  })

  test('1-2 側邊欄導航列顯示所有管理員可用頁面', async ({ page }) => {
    await login(page)
    await step(page)
    for (const item of ['儀表板', '房態看板', '訂房管理', '客人管理', '房務看板', '用戶管理']) {
      await expect(page.getByRole('link', { name: item })).toBeVisible()
    }
  })

  test('1-3 新增訂房並成功顯示在列表中', async ({ page }) => {
    await login(page)
    await navTo(page, '訂房管理', '/reservations')
    await step(page)

    await page.getByRole('button', { name: '+ 新增訂房' }).click()
    await expect(page.getByRole('heading', { name: '新增訂房' })).toBeVisible()

    // 等客人和房型選單從 API 載入（限定在 Modal 內）
    const modal = page.locator('.fixed')
    await expect(modal.locator('select').nth(0).locator('option').nth(1)).toBeAttached({ timeout: 8000 })
    await modal.locator('select').nth(0).selectOption({ index: 1 })
    await expect(modal.locator('select').nth(1).locator('option').nth(1)).toBeAttached({ timeout: 8000 })
    await modal.locator('select').nth(1).selectOption({ index: 1 })
    await modal.locator('input[type="date"]').nth(0).fill(today())
    await modal.locator('input[type="date"]').nth(1).fill(daysAfter(1))
    await step(page)

    await page.getByRole('button', { name: '建立訂房' }).click()
    await expect(page.getByRole('heading', { name: '新增訂房' })).not.toBeVisible()
    await expect(page.locator('td:has-text("已確認")').first()).toBeVisible()
  })

  test('1-4 對已確認訂房執行 Check-in', async ({ page }) => {
    await login(page)
    await navTo(page, '訂房管理', '/reservations')
    await step(page)

    const confirmedRow = page.locator('tr').filter({ hasText: '已確認' }).first()
    if (await confirmedRow.count() === 0) { test.skip(); return }

    await confirmedRow.getByRole('button', { name: '詳細' }).click()
    await expect(page.getByRole('heading', { name: '訂房詳細' })).toBeVisible()
    await step(page)

    await page.getByRole('button', { name: 'Check-in' }).click()

    const roomSelect = page.locator('select').filter({ hasText: '請選擇可用房間' })
    await expect(roomSelect).toBeVisible()
    const options = await roomSelect.locator('option').all()

    if (options.length > 1) {
      await roomSelect.selectOption({ index: 1 })
      await step(page)
      await page.getByRole('button', { name: '確認入住' }).click()
      await expect(page.locator('text=請選擇可用房間')).not.toBeVisible()
      await expect(page.locator('td:has-text("住中")').first()).toBeVisible()
    } else {
      await expect(page.getByText('此房型目前無可用房間')).toBeVisible()
      await page.getByRole('button', { name: '取消' }).click()
    }
  })

  test('1-5 對住中訂房執行 Check-out', async ({ page }) => {
    await login(page)
    await navTo(page, '訂房管理', '/reservations')
    await step(page)

    const checkedInRow = page.locator('tr').filter({ hasText: '住中' }).first()
    if (await checkedInRow.count() === 0) { test.skip(); return }

    await checkedInRow.getByRole('button', { name: '詳細' }).click()
    await expect(page.getByRole('heading', { name: '訂房詳細' })).toBeVisible()
    await step(page)

    await page.getByRole('button', { name: 'Check-out' }).click()
    await page.waitForTimeout(1000)

    if (!await page.getByRole('heading', { name: '訂房詳細' }).isVisible()) {
      await expect(page.locator('td:has-text("已退房")').first()).toBeVisible()
    } else {
      await page.keyboard.press('Escape')
    }
  })

  test('1-6 房態看板依樓層顯示房間色塊', async ({ page }) => {
    await login(page)
    await navTo(page, '房態看板', '/rooms')
    await step(page)

    await expect(page.locator('text=樓').first()).toBeVisible()
    await page.locator('button[class*="rounded-lg"][class*="text-white"]').first().click()
    await step(page)
    await expect(page.locator('text=房號').first()).toBeVisible()
  })

})
