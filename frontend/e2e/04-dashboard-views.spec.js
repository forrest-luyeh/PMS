/**
 * 測試 4：儀表板三層視角（雀客旅館集團）
 *
 * 以 TENANT_ADMIN (admin@checkinn.com.tw) 身份測試：
 *   4-1 多個品牌、多個旅館 → 集團總覽
 *   4-2 單一品牌、多個旅館 → 品牌總覽
 *   4-3 單一旅館             → 單館今日營運儀表板
 */

import { test, expect } from '@playwright/test'
import { loginCheckinn, step } from './helpers.js'

test.describe('儀表板三層視角（雀客旅館集團）', () => {

  test('4-1 多品牌全集團總覽', async ({ page }) => {
    await loginCheckinn(page)
    await step(page)

    // 標題
    await expect(page.getByRole('heading', { name: '集團總覽' })).toBeVisible()

    // 品牌下拉預設為「全部品牌」
    const brandSelect = page.locator('select').nth(0)
    await expect(brandSelect).toHaveValue('')

    // 旅館下拉預設為空（未選旅館）
    const hotelSelect = page.locator('select').nth(1)
    await expect(hotelSelect).toHaveValue('')

    // 統計卡片：旅館數、今日抵達、今日退房、住房率
    await expect(page.getByText('旅館數').first()).toBeVisible()
    await expect(page.getByText('今日抵達').first()).toBeVisible()
    await expect(page.getByText('今日退房').first()).toBeVisible()
    await expect(page.getByText('住房率').first()).toBeVisible()

    // 三個品牌的摘要卡片（用 data-testid 鎖定卡片 div，避免命中 <option>）
    await expect(page.getByTestId('brand-card').filter({ hasText: '雀客藏居 CHECK inn Select' })).toBeVisible()
    await expect(page.getByTestId('brand-card').filter({ hasText: '雀客旅館 CHECKinn Hotel' })).toBeVisible()
    await expect(page.getByTestId('brand-card').filter({ hasText: '雀客快捷 CHECKinn Express' })).toBeVisible()

    // 房態總覽
    await expect(page.getByText('房態總覽')).toBeVisible()

    // 今日抵達 / 退房列表標題
    await expect(page.getByText(/今日抵達 \(/)).toBeVisible()
    await expect(page.getByText(/今日退房 \(/)).toBeVisible()

    await step(page)
  })

  test('4-2 選定單一品牌 → 品牌總覽（含旅館卡片）', async ({ page }) => {
    await loginCheckinn(page)
    await step(page)

    // 選擇品牌（雀客旅館）
    const brandSelect = page.locator('select').nth(0)
    await brandSelect.selectOption({ label: '雀客旅館 CHECKinn Hotel' })
    await step(page)

    // 標題切換為品牌名稱
    await expect(page.getByRole('heading', { name: /雀客旅館/ })).toBeVisible()

    // 旅館下拉應有該品牌的旅館選項（14 間）：等 API 載入後再讀取
    const hotelSelect = page.locator('select').nth(1)
    await hotelSelect.locator('option').nth(5).waitFor({ state: 'attached', timeout: 8000 })
    const options = await hotelSelect.locator('option').all()
    expect(options.length).toBeGreaterThan(5) // 至少有 6 個選項（含「全部旅館」）

    // 統計卡片：旅館數（品牌內）
    await expect(page.getByText('旅館數').first()).toBeVisible()

    // 旅館卡片列表
    await expect(page.getByTestId('hotel-card').filter({ hasText: '台北松江館' })).toBeVisible()

    // 房態總覽（品牌彙總）
    await expect(page.getByText('房態總覽')).toBeVisible()

    // 彙總列表（無 Check-in 按鈕，但有旅館名欄）
    await expect(page.getByText(/今日抵達 \(/)).toBeVisible()
    await expect(page.getByText(/今日退房 \(/)).toBeVisible()

    await step(page)
  })

  test('4-3 選定單一旅館 → 單館今日營運儀表板', async ({ page }) => {
    await loginCheckinn(page)
    await step(page)

    // 先選品牌
    const brandSelect = page.locator('select').nth(0)
    await brandSelect.selectOption({ label: '雀客旅館 CHECKinn Hotel' })
    await step(page)

    // 再選旅館（台北松江館）
    const hotelSelect = page.locator('select').nth(1)
    await hotelSelect.selectOption({ label: '台北松江館' })
    await step(page)

    // 旅館名稱出現在標題
    await expect(page.getByRole('heading', { name: '台北松江館' })).toBeVisible()

    // 品牌名稱顯示在標題旁
    await expect(page.getByText('雀客旅館 CHECKinn Hotel').first()).toBeVisible()

    // 四個單館統計卡片
    await expect(page.getByText('今日抵達').first()).toBeVisible()
    await expect(page.getByText('今日退房').first()).toBeVisible()
    await expect(page.getByText('目前住客').first()).toBeVisible()
    await expect(page.getByText('住房率').first()).toBeVisible()

    // 房態總覽
    await expect(page.getByText('房態總覽')).toBeVisible()

    // 今日列表（單館）
    await expect(page.getByText(/今日抵達 \(/)).toBeVisible()
    await expect(page.getByText(/今日退房 \(/)).toBeVisible()

    // sidebar 顯示目前旅館的 context bar
    await expect(page.getByText('目前旅館')).toBeVisible()
    await expect(page.getByText('台北松江館').first()).toBeVisible()

    await step(page)
  })

  test('4-4 切換品牌後旅館下拉自動更新', async ({ page }) => {
    await loginCheckinn(page)
    await step(page)

    const brandSelect = page.locator('select').nth(0)
    const hotelSelect = page.locator('select').nth(1)

    // 選「雀客藏居 SELECT」（7 間）：等旅館選項載入後再讀取
    await brandSelect.selectOption({ label: '雀客藏居 CHECK inn Select' })
    await hotelSelect.locator('option').nth(1).waitFor({ state: 'attached', timeout: 8000 })
    await step(page)

    const selectOptions = await hotelSelect.locator('option').count()

    // 切換到「雀客快捷 EXPRESS」（8 間）：等旅館選項更新後再讀取
    await brandSelect.selectOption({ label: '雀客快捷 CHECKinn Express' })
    await hotelSelect.locator('option').nth(1).waitFor({ state: 'attached', timeout: 8000 })
    await step(page)

    const expressOptions = await hotelSelect.locator('option').count()

    // 兩個品牌的旅館數不同，且下拉選項有變
    expect(selectOptions).toBeGreaterThan(1)
    expect(expressOptions).toBeGreaterThan(1)

    // 切換品牌後旅館下拉應重設（回到「全部旅館」）
    await expect(hotelSelect).toHaveValue('')

    // 標題應為品牌名稱
    await expect(page.getByRole('heading', { name: /雀客快捷/ })).toBeVisible()

    await step(page)
  })

  test('4-5 選定旅館後 sidebar 顯示 context bar', async ({ page }) => {
    await loginCheckinn(page)
    await step(page)

    // 初始狀態：未選旅館，不顯示 context bar
    await expect(page.getByText('目前旅館')).not.toBeVisible()

    // 選品牌 + 旅館
    await page.locator('select').nth(0).selectOption({ label: '雀客快捷 CHECKinn Express' })
    await page.locator('select').nth(1).selectOption({ label: '台北車站館' })
    await step(page)

    // 現在 context bar 出現
    await expect(page.getByText('目前旅館')).toBeVisible()
    await expect(page.getByText('台北車站館').first()).toBeVisible()

    // 導至其他頁面，context bar 仍然存在
    await page.getByRole('link', { name: '房態看板' }).click()
    await page.waitForURL('**/rooms')
    await step(page)

    await expect(page.getByText('目前旅館')).toBeVisible()
    await expect(page.getByText('台北車站館').first()).toBeVisible()

    await step(page)
  })

})
