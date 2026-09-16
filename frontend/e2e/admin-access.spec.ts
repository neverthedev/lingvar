import { expect, request, test, type Page } from '@playwright/test'
import { spawn } from 'node:child_process'

const backendUrl = 'http://localhost:8000'

function createAdmin(username: string, email: string, password: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const command = spawn(
      'python3',
      ['-m', 'create_admin', '--username', username, '--email', email, '--password-stdin'],
      {
        cwd: '/app/backend',
        env: { ...process.env, DATABASE_URL: process.env.TEST_DATABASE_URL },
      },
    )
    let stderr = ''
    command.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString()
    })
    command.on('error', reject)
    command.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(stderr))
      }
    })
    command.stdin.end(`${password}\n`)
  })
}

async function signIn(page: Page, username: string, password: string) {
  await page.goto('/login')
  await page.locator('#username').fill(username)
  await page.locator('#password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
}

test('administrator sees only metadata and learner retains learning routes', async ({ browser }) => {
  const adminUsername = 'browser-admin-qa'
  const adminPassword = 'safe-admin-password-8'
  await createAdmin(adminUsername, 'browser-admin-qa@example.com', adminPassword)

  const adminContext = await browser.newContext()
  const adminPage = await adminContext.newPage()
  await signIn(adminPage, adminUsername, adminPassword)
  await expect(adminPage).toHaveURL(/\/admin$/)
  await expect(adminPage.getByText('Exercises', { exact: true })).toBeVisible()
  const exerciseRows = adminPage.locator('main li')
  await expect(exerciseRows).not.toHaveCount(0)
  await expect(exerciseRows.locator('a, button')).toHaveCount(0)
  await expect(adminPage.locator('a[href^="/lessons"], a[href^="/exercises"]')).toHaveCount(0)

  for (const forbiddenPath of [
    '/exercises',
    '/exercises/dopelniacz-pojed',
    '/lessons',
    '/lessons/singular-nouns',
  ]) {
    await adminPage.goto(forbiddenPath)
    await expect(adminPage).toHaveURL(/\/admin$/)
    await expect(adminPage.getByText('Exercises', { exact: true })).toBeVisible()
  }
  await adminContext.close()

  const visitorContext = await browser.newContext()
  const visitorPage = await visitorContext.newPage()
  await visitorPage.goto('/admin')
  await expect(visitorPage).toHaveURL(/\/login$/)
  await visitorContext.close()

  const learnerUsername = 'browser-learner-qa'
  const learnerPassword = 'safe-learner-password-8'
  const api = await request.newContext({ baseURL: backendUrl })
  const registration = await api.post('/users/register', {
    data: {
      username: learnerUsername,
      email: 'browser-learner-qa@example.com',
      password: learnerPassword,
    },
  })
  expect(registration.status()).toBe(200)
  expect((await registration.json()).is_superuser).toBe(false)
  await api.dispose()

  const learnerContext = await browser.newContext()
  const learnerPage = await learnerContext.newPage()
  await signIn(learnerPage, learnerUsername, learnerPassword)
  await expect(learnerPage).toHaveURL(/\/$/)
  await learnerPage.goto('/admin')
  await expect(learnerPage.getByRole('heading', { name: 'Access denied' })).toBeVisible()
  await expect(learnerPage.locator('main li')).toHaveCount(0)
  await learnerPage.goto('/exercises')
  await expect(learnerPage).toHaveURL(/\/exercises$/)
  await expect(learnerPage.getByText('Interactive Exercises', { exact: true })).toBeVisible()
  await learnerPage.goto('/lessons')
  await expect(learnerPage).toHaveURL(/\/lessons$/)
  await expect(learnerPage.getByText('Interactive Lessons', { exact: true })).toBeVisible()
  await learnerContext.close()
})
