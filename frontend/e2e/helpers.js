/**
 * 共用輔助函式
 */

/** 步驟間暫停（DEMO_STEP_DELAY 毫秒，預設 0）*/
export async function step(page) {
  const ms = parseInt(process.env.DEMO_STEP_DELAY ?? '0', 10)
  if (ms > 0) await page.waitForTimeout(ms)
}

/** 登入並等待儀表板出現（TENANT/BRAND_ADMIN 自動選第一間旅館） */
export async function login(page, email = 'admin@example.com', password = 'admin1234') {
  await page.goto('/login')
  await page.locator('#email').fill(email)
  await page.locator('#password').fill(password)
  await page.getByRole('button', { name: '登入' }).click()
  await page.waitForURL('/')
  // TENANT_ADMIN / BRAND_ADMIN 需先選旅館，才能操作訂房/房態等頁面
  try {
    const hotelSelect = page.locator('select').nth(1)
    await hotelSelect.waitFor({ state: 'visible', timeout: 3000 })
    // 等旅館選項從 API 載入（state:'attached' — option 在 select 內不是 'visible'）
    await hotelSelect.locator('option').nth(1).waitFor({ state: 'attached', timeout: 5000 })
    await hotelSelect.selectOption({ index: 1 })
    // 等「目前住客」出現 → 確認 switchHotel API 完成、JWT 已更新、單館資料已載入
    await page.waitForSelector('text=目前住客', { timeout: 10000 })
  } catch {
    // 非 hotel-mgmt 角色，無需選旅館
  }
  await page.waitForSelector('h1')
}

/** 以雀客集團管理員登入（儀表板顯示「集團總覽」，並等品牌/旅館清單 API 載入完成） */
export async function loginCheckinn(page) {
  await page.goto('/login')
  await page.locator('#email').fill('admin@checkinn.com.tw')
  await page.locator('#password').fill('Admin1234!')
  await page.getByRole('button', { name: '登入' }).click()
  await page.waitForURL('/')
  await page.waitForSelector('h1:has-text("集團總覽")')
  // 等品牌和旅館清單從 API 載入（option 在 select 內不是 visible，需用 attached）
  await page.locator('select').nth(0).locator('option').nth(1).waitFor({ state: 'attached', timeout: 8000 })
  await page.locator('select').nth(1).locator('option').nth(1).waitFor({ state: 'attached', timeout: 8000 })
}

/** 點側邊欄連結並等待 URL 切換 */
export async function navTo(page, linkName, urlPath) {
  await page.getByRole('link', { name: linkName }).click()
  await page.waitForURL(`**${urlPath}`)
}

/** 取今日日期字串 YYYY-MM-DD */
export function today() {
  return new Date().toISOString().slice(0, 10)
}

/** 取 N 天後日期字串 */
export function daysAfter(n) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}
