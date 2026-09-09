import { expect, test } from '@playwright/test'

test('dashboard and direct tool routes work', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Tools', exact: true })).toBeVisible()
  await page.getByPlaceholder(/ค้นหา/).fill('JSON')
  await expect(page.getByRole('heading', { name: 'JSON Toolkit' })).toBeVisible()
  await page.getByRole('link', { name: 'เปิด JSON Toolkit' }).click()
  await expect(page).toHaveURL(/\/tools\/json-toolkit$/)
  await page.getByPlaceholder('วางข้อมูลที่นี่…').fill('{"ok":true}')
  await expect(page.getByLabel('ผลลัพธ์')).toHaveValue(/"ok": true/)
})
