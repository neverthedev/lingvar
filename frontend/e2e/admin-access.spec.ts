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

test('administrator creates, edits, moves and deletes a hierarchical rule tree', async ({ browser }) => {
  const username = 'browser-rules-admin-qa'
  const password = 'safe-admin-password-8'
  await createAdmin(username, 'browser-rules-admin-qa@example.com', password)

  const context = await browser.newContext()
  const page = await context.newPage()
  await signIn(page, username, password)
  await expect(page).toHaveURL(/\/admin$/)
  await page.goto('/admin/rules')
  await expect(page.getByRole('main').getByText('Правила', { exact: true })).toBeVisible()
  await expect(page.getByText('Правил пока нет. Создайте первое правило верхнего уровня.')).toBeVisible()
  await expect(page.getByText('Всего правил: 0', { exact: false })).toBeVisible()

  await page.getByRole('link', { name: 'Создать правило' }).first().click()
  await page.locator('#rule-title').fill('Корневое правило')
  await page.locator('#rule-description').fill('Описание корневого правила')
  await page.getByRole('button', { name: 'Создать правило' }).click()
  await expect(page).toHaveURL(/\/admin\/rules\/\d+$/)
  await expect(page.getByRole('heading', { name: 'Корневое правило', exact: true })).toBeVisible()

  await page.getByRole('button', { name: '+ Добавить подправило' }).click()
  await page.locator('#rule-title').fill('Первый уровень')
  await page.locator('#rule-description').fill('Описание первого уровня')
  await page.getByRole('button', { name: 'Сохранить' }).click()
  await expect(page.getByRole('status')).toContainText('Подправило создано.')

  await page.getByRole('button', { name: '+ Добавить подправило' }).click()
  await page.locator('#rule-title').fill('Второй уровень')
  await page.locator('#rule-description').fill('Описание второго уровня')
  await page.getByRole('button', { name: 'Сохранить' }).click()
  await expect(page.getByLabel('Дерево правил').first().getByText('Второй уровень', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: '+ Добавить подправило' }).click()
  await page.locator('#rule-title').fill('Третий уровень')
  await page.locator('#rule-description').fill('Описание третьего уровня')
  await page.getByRole('button', { name: 'Сохранить' }).click()

  const tree = page.getByLabel('Дерево правил').first()
  await expect(tree.getByText('Корневое правило', { exact: true })).toBeVisible()
  await expect(tree.getByText('Первый уровень', { exact: true })).toBeVisible()
  await expect(tree.getByText('Второй уровень', { exact: true })).toBeVisible()
  await expect(tree.getByText('Третий уровень', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Свернуть Первый уровень' }).click()
  await expect(tree.getByText('Второй уровень', { exact: true })).not.toBeVisible()
  await page.getByRole('button', { name: 'Развернуть Первый уровень' }).click()
  await expect(tree.getByText('Второй уровень', { exact: true })).toBeVisible()

  await tree.getByRole('button', { name: 'Второй уровень', exact: true }).click()
  await page.locator('#rule-title').fill('Второй уровень изменён')
  await page.locator('#rule-description').fill('Описание, которое сервер временно не принимает')
  await page.route('**/admin/rules/*', async (route) => {
    if (route.request().method() === 'PUT') {
      await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ detail: 'Тестовая ошибка сервера' }) })
      return
    }
    await route.continue()
  })
  await page.getByRole('button', { name: 'Сохранить' }).click()
  await expect(page.getByText('Тестовая ошибка сервера', { exact: true })).toBeVisible()
  await expect(page.locator('#rule-title')).toHaveValue('Второй уровень изменён')
  await expect(page.locator('#rule-description')).toHaveValue('Описание, которое сервер временно не принимает')
  await page.unroute('**/admin/rules/*')
  await page.getByRole('button', { name: 'Сохранить' }).click()
  await expect(page.getByRole('status')).toContainText('Изменения сохранены.')
  await expect(tree.getByText('Второй уровень изменён', { exact: true })).toBeVisible()

  await tree.getByRole('button', { name: 'Корневое правило', exact: true }).click()
  await page.getByRole('button', { name: '+ Добавить подправило' }).click()
  await page.locator('#rule-title').fill('Соседняя ветвь')
  await page.locator('#rule-description').fill('Описание соседней ветви')
  await page.getByRole('button', { name: 'Сохранить' }).click()
  await expect(tree.getByText('Соседняя ветвь', { exact: true })).toBeVisible()

  await tree.getByRole('button', { name: 'Третий уровень', exact: true }).click()
  await page.locator('#rule-parent').selectOption({ label: '— Соседняя ветвь' })
  await page.getByRole('button', { name: 'Сохранить' }).click()
  await expect(page.getByRole('status')).toContainText('Изменения сохранены.')
  await tree.getByRole('button', { name: 'Соседняя ветвь', exact: true }).click()
  await expect(tree.getByText('Третий уровень', { exact: true })).toBeVisible()

  await tree.getByRole('button', { name: 'Первый уровень', exact: true }).click()
  await page.locator('#rule-description').fill('Несохранённое описание')
  await tree.getByRole('button', { name: 'Соседняя ветвь', exact: true }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByRole('button', { name: 'Остаться' }).click()
  await expect(page.locator('#rule-description')).toHaveValue('Несохранённое описание')
  await tree.getByRole('button', { name: 'Соседняя ветвь', exact: true }).click()
  await page.getByRole('button', { name: 'Не сохранять' }).click()

  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'Удалить', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('Правило удалено.')
  await expect(tree.getByText('Третий уровень', { exact: true })).toBeVisible()

  await page.goto('/admin/rules')
  await expect(page.getByText('Всего правил: 4', { exact: false })).toBeVisible()
  await expect(page.getByText('включая подправила', { exact: true })).toBeVisible()
  const rootCard = page.locator('li').filter({ hasText: 'Корневое правило' })
  await expect(rootCard.getByText('Описание корневого правила', { exact: true })).toBeVisible()
  page.once('dialog', (dialog) => dialog.accept())
  await rootCard.getByRole('button', { name: 'Удалить', exact: true }).click()
  await expect(page.getByText('Всего правил: 3', { exact: false })).toBeVisible()
  await expect(page.getByText('Первый уровень', { exact: true })).toBeVisible()
  await expect(page.getByText('Третий уровень', { exact: true })).toBeVisible()

  await page.route(`${backendUrl}/admin/rules`, (route) => route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ detail: 'Тестовая ошибка загрузки' }) }))
  await page.reload()
  await expect(page.getByText('Тестовая ошибка загрузки', { exact: true })).toBeVisible()
  await expect(page.getByText('Всего правил:', { exact: false })).not.toBeVisible()
  await page.unroute(`${backendUrl}/admin/rules`)
  await context.close()
})
