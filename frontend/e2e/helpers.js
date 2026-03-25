/**
 * 共用輔助函式
 */

/** 步驟間暫停（DEMO_STEP_DELAY 毫秒，預設 0）*/
export async function step(page) {
  const ms = parseInt(process.env.DEMO_STEP_DELAY ?? '0', 10)
  if (ms > 0) await page.waitForTimeout(ms)
}

/** 登入並等待儀表板出現 */
export async function login(page, email = 'admin@example.com', password = 'admin1234') {
  await page.goto('/login')
  await page.locator('#email').fill(email)
  await page.locator('#password').fill(password)
  await page.getByRole('button', { name: '登入' }).click()
  await page.waitForURL('/')
  await page.waitForSelector('h1:has-text("今日儀表板")')
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
