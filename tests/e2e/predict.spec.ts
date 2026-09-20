import { expect, test } from '@playwright/test'

test('user can log in with a name and submit a prediction', async ({ page }) => {
  await page.goto('/matches')

  // name dialog → identity
  await page.getByTestId('name-input').fill('E2E Tester')
  await page.getByTestId('name-submit').click()
  await expect(page.getByText('E2E Tester', { exact: true })).toBeVisible()

  // find the dedicated e2e match card and predict
  const card = page.getByTestId('match-card').filter({ hasText: 'E2E United' })
  await expect(card).toBeVisible()
  await card.getByTestId('home-score').fill('2')
  await card.getByTestId('away-score').fill('1')
  const saved = page.waitForResponse(
    (r) => r.url().includes('/api/predictions') && r.request().method() === 'POST' && r.ok(),
  )
  await card.getByTestId('save-prediction').click()
  await saved

  // prediction persists after reload
  await page.reload()
  const cardAfter = page.getByTestId('match-card').filter({ hasText: 'E2E United' })
  await expect(cardAfter.getByTestId('home-score')).toHaveValue('2')
  await expect(cardAfter.getByTestId('away-score')).toHaveValue('1')
})
