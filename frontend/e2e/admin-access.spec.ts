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

function seedExerciseVocabulary(): Promise<void> {
  return new Promise((resolve, reject) => {
    const command = spawn('python3', ['/app/tests/browser/seed_exercise_vocabulary.py'], {
      env: { ...process.env, DATABASE_URL: process.env.TEST_DATABASE_URL },
    })
    let stderr = ''
    command.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString() })
    command.on('error', reject)
    command.on('close', (code) => code === 0 ? resolve() : reject(new Error(stderr)))
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
  await expect(adminPage).toHaveURL(/\/admin\/exercises$/)
  await expect(adminPage.getByText('Упражнения', { exact: true })).toBeVisible()
  const exerciseRows = adminPage.locator('main li')
  await expect(exerciseRows).not.toHaveCount(0)
  await expect(exerciseRows.locator('a')).not.toHaveCount(0)
  await expect(adminPage.getByRole('button', { name: 'Создать' })).toBeVisible()
  await expect(adminPage.locator('a[href^="/lessons"], a[href^="/exercises"]')).toHaveCount(0)

  for (const forbiddenPath of [
    '/exercises',
    '/exercises/dopelniacz-pojed',
    '/lessons',
    '/lessons/singular-nouns',
  ]) {
    await adminPage.goto(forbiddenPath)
    await expect(adminPage).toHaveURL(/\/admin\/exercises$/)
    await expect(adminPage.getByText('Упражнения', { exact: true })).toBeVisible()
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
  await expect(learnerPage).toHaveURL(/\/exercises$/)
  await expect(learnerPage.getByText('Interactive Exercises', { exact: true })).toBeVisible()
  for (const [legacyPath, canonicalPath, title] of [
    ['/lessons/singular-nouns', '/exercises/singular-nouns', 'Singular Nouns'],
    ['/exercises/numerators', '/exercises/numerators', 'Liczebniki (Numerals)'],
    ['/exercises/dopelniacz-pojed', '/exercises/dopelniacz-pojed', 'Dopełniacz (Genitive Case) Liczby Pojedynczej'],
  ]) {
    await learnerPage.goto(legacyPath)
    await expect(learnerPage).toHaveURL(new RegExp(`${canonicalPath}$`))
    await expect(learnerPage.getByText(title, { exact: true }).first()).toBeVisible()
  }
  await learnerContext.close()
})

test('administrator creates, edits, moves and deletes a hierarchical rule tree', async ({ browser }) => {
  const username = 'browser-rules-admin-qa'
  const password = 'safe-admin-password-8'
  await createAdmin(username, 'browser-rules-admin-qa@example.com', password)

  const context = await browser.newContext()
  const page = await context.newPage()
  await signIn(page, username, password)
  await expect(page).toHaveURL(/\/admin\/exercises$/)
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

test('administrator publishes fill blanks and learner receives an independent server session on refresh', async ({ browser }) => {
  const adminUsername = 'browser-exercise-admin-qa'
  const adminPassword = 'safe-admin-password-8'
  await createAdmin(adminUsername, 'browser-exercise-admin-qa@example.com', adminPassword)

  const adminContext = await browser.newContext()
  const adminPage = await adminContext.newPage()
  await signIn(adminPage, adminUsername, adminPassword)
  await adminPage.goto('/admin/exercises/new')
  await adminPage.locator('label').filter({ hasText: 'Slug' }).locator('input').fill('browser-fill-blanks-qa')
  await adminPage.locator('label').filter({ hasText: 'Название' }).locator('input').fill('Browser fill blanks')
  await adminPage.locator('label').filter({ hasText: 'Описание' }).locator('input').fill('Exercise created in browser')
  await adminPage.locator('label').filter({ hasText: 'Инструкция' }).locator('input').fill('Заполните пропуски')
  await adminPage.getByPlaceholder('ID элемента').fill('sentence-1')
  await adminPage.getByPlaceholder('Текст').first().fill('Mam ')
  await adminPage.getByPlaceholder('ID пропуска').first().fill('blank-cat')
  await adminPage.getByPlaceholder('Подсказка').first().fill('kot')
  await adminPage.getByPlaceholder('Ответы через запятую').first().fill('kota')
  await adminPage.getByRole('button', { name: 'Пропуск' }).click()
  await adminPage.getByPlaceholder('ID пропуска').nth(1).fill('blank-dog')
  await adminPage.getByPlaceholder('Ответы через запятую').nth(1).fill('psa')
  await adminPage.getByPlaceholder('Ответы через запятую').nth(1).fill('')
  await adminPage.getByRole('button', { name: 'Сохранить' }).click()
  await expect(adminPage.getByText('Исправьте отмеченные поля и повторите сохранение.', { exact: true })).toBeVisible()
  await expect(adminPage.getByPlaceholder('Ответы через запятую').nth(1)).toHaveValue('')
  await expect(adminPage.getByPlaceholder('Ответы через запятую').nth(1).locator('xpath=ancestor::div[contains(@class, "rounded")][1]')).toContainText('Допустимый ответ не может быть пустым')
  await adminPage.getByPlaceholder('Ответы через запятую').nth(1).fill('psa')
  await adminPage.getByRole('button', { name: 'Сохранить' }).click()
  await expect(adminPage).toHaveURL(/\/admin\/exercises\/\d+$/)

  const api = await request.newContext({ baseURL: backendUrl })
  const learnerUsername = 'browser-fill-student-qa'
  const learnerPassword = 'safe-student-password-8'
  const registration = await api.post('/users/register', { data: {
    username: learnerUsername,
    email: 'browser-fill-student-qa@example.com',
    password: learnerPassword,
  } })
  expect(registration.status()).toBe(200)
  const login = await api.post('/users/token', { form: { username: learnerUsername, password: learnerPassword } })
  const learnerHeaders = { Authorization: `Bearer ${(await login.json()).access_token}` }
  expect((await api.get('/api/exercises/browser-fill-blanks-qa/content', { headers: learnerHeaders })).status()).toBe(404)

  await adminPage.locator('label').filter({ hasText: 'Статус' }).locator('select').selectOption('published')
  await adminPage.getByRole('button', { name: 'Сохранить' }).click()
  await expect(adminPage).toHaveURL(/\/admin\/exercises\/\d+$/)
  expect((await api.get('/api/exercises/browser-fill-blanks-qa/content', { headers: learnerHeaders })).status()).toBe(200)

  const learnerContext = await browser.newContext()
  const learnerPage = await learnerContext.newPage()
  await signIn(learnerPage, learnerUsername, learnerPassword)
  await expect(learnerPage).toHaveURL(/\/$/)
  const firstSessionResponse = learnerPage.waitForResponse(response =>
    response.url().includes('/api/exercises/browser-fill-blanks-qa/sessions') && response.request().method() === 'POST',
  )
  await learnerPage.goto('/exercises/browser-fill-blanks-qa')
  await expect(learnerPage).toHaveURL(/\/exercises\/browser-fill-blanks-qa$/)
  await expect(learnerPage.locator('body')).toContainText('Browser fill blanks')
  const firstSessionId = (await firstSessionResponse).json().then((body: { session_id: string }) => body.session_id)

  const catField = learnerPage.getByPlaceholder('kot')
  await catField.fill('wrong')
  await catField.locator('xpath=../following-sibling::button').click()
  await expect(learnerPage.getByText('1/3', { exact: false })).toBeVisible()
  await expect(catField).toHaveValue('wrong')
  await catField.fill('  KOTA  ')
  await catField.locator('xpath=../following-sibling::button').click()
  await expect(catField).toBeDisabled()

  const dogField = learnerPage.getByPlaceholder('Ответ')
  await dogField.fill('PSA')
  await dogField.locator('xpath=../following-sibling::button').click()
  await expect(dogField).toBeDisabled()

  const secondSessionResponse = learnerPage.waitForResponse(response =>
    response.url().includes('/api/exercises/browser-fill-blanks-qa/sessions') && response.request().method() === 'POST',
  )
  await learnerPage.reload()
  const firstId = await firstSessionId
  const secondId = (await secondSessionResponse).json().then((body: { session_id: string }) => body.session_id)
  expect(await secondId).not.toBe(firstId)
  await expect(learnerPage.getByPlaceholder('kot')).toBeEnabled()
  await expect(learnerPage.getByPlaceholder('kot')).toHaveValue('')

  const adminLogin = await api.post('/users/token', { form: { username: adminUsername, password: adminPassword } })
  const adminHeaders = { Authorization: `Bearer ${(await adminLogin.json()).access_token}` }
  const secondExercise = await api.post('/admin/exercises', {
    headers: adminHeaders,
    data: {
      slug: 'browser-fill-blanks-second-qa', type_code: 'fill_blanks', schema_version: 1,
      title: 'Second browser fill blanks', description: 'Second exercise for client navigation',
      instruction: 'Заполните второй пропуск', difficulty: 'beginner', estimated_duration_minutes: 5,
      display_order: 99, status: 'published', definition: {
        items: [{ id: 'second-sentence', parts: [
          { kind: 'text', text: 'Drugi ' },
          { kind: 'blank', id: 'second-blank', hint: 'drugi', accepted_answers: ['odpowiedź'] },
        ] }],
      },
    },
  })
  expect(secondExercise.status()).toBe(201)
  await learnerPage.getByRole('button', { name: '← К упражнениям' }).click()
  await expect(learnerPage).toHaveURL(/\/exercises$/)
  const thirdSessionResponse = learnerPage.waitForResponse(response =>
    response.url().includes('/api/exercises/browser-fill-blanks-second-qa/sessions') && response.request().method() === 'POST',
  )
  await learnerPage.getByRole('link', { name: /Second browser fill blanks/ }).click()
  await expect(learnerPage).toHaveURL(/\/exercises\/browser-fill-blanks-second-qa$/)
  await thirdSessionResponse
  await expect(learnerPage.getByPlaceholder('drugi')).toBeEnabled()

  await api.dispose()
  await learnerContext.close()
  await adminContext.close()
})

test('legacy form table, single input and self-check renderers keep their client interactions', async ({ browser }) => {
  await seedExerciseVocabulary()
  const username = 'browser-legacy-learner-qa'
  const password = 'safe-legacy-password-8'
  const api = await request.newContext({ baseURL: backendUrl })
  expect((await api.post('/users/register', { data: { username, email: 'browser-legacy-learner-qa@example.com', password } })).status()).toBe(200)

  const context = await browser.newContext()
  const page = await context.newPage()
  await signIn(page, username, password)
  await expect(page).toHaveURL(/\/$/)

  await page.goto('/exercises/singular-nouns')
  await expect(page.getByText('kot-browser-qa', { exact: true })).toBeVisible()
  const formCell = page.locator('tbody tr').filter({ hasText: 'kot-browser-qa' }).locator('td').nth(1)
  await formCell.click()
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const attemptRequest = page.waitForResponse(response => response.url().endsWith('/api/tests/attempt') && response.request().method() === 'POST')
    await page.getByPlaceholder('Enter word...').fill('wrong')
    await page.getByTitle('OK').click()
    await attemptRequest
  }
  await expect(formCell).toContainText('kota-browser-qa')

  await page.goto('/exercises/numerators')
  await expect(page.getByText('one-browser-qa', { exact: true })).toBeVisible()
  const singleInput = page.locator('input').first()
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await singleInput.fill('wrong')
    await page.getByRole('button', { name: 'Проверить' }).click()
  }
  await expect(page.locator('p').filter({ hasText: 'jeden-browser-qa' }).last()).toContainText('jeden-browser-qa')

  await page.goto('/exercises/dopelniacz-pojed')
  await expect(page.getByText('kot-browser-qa', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Показать ответ' }).click()
  await expect(page.getByText('koty-browser-qa', { exact: true })).toHaveCount(0)
  await expect(page.getByText('kota-browser-qa', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Верно', exact: true }).click()
  await expect(page.getByText('Верно: 1 · Неверно: 0 · Осталось: 0', { exact: true })).toBeVisible()

  await api.dispose()
  await context.close()
})
