import { expect, request, test, type Locator, type Page } from '@playwright/test'
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

async function createCatalogExercises(username: string, password: string) {
  const api = await request.newContext({ baseURL: backendUrl })
  const login = await api.post('/users/token', { form: { username, password } })
  expect(login.status()).toBe(200)
  const headers = { Authorization: `Bearer ${(await login.json()).access_token}` }
  const rules = await api.get('/admin/rules', { headers })
  expect(rules.status()).toBe(200)
  const ruleId = (await rules.json() as Array<{ id: number }>)[0].id
  for (const [slug, title] of [
    ['browser-catalog-one-qa', 'Первое упражнение каталога'],
    ['browser-catalog-two-qa', 'Второе упражнение каталога'],
  ]) {
    const created = await api.post('/admin/exercises', {
      headers,
      data: {
        slug, type_code: 'fill_blanks', schema_version: 1, title, description: 'Синтетическое упражнение для проверки каталога', instruction: 'Заполните пропуск',
        difficulty: 'beginner', estimated_duration_minutes: 5, display_order: 90, status: 'published', rule_id: ruleId,
        definition: { items: [{ id: 'sentence-1', parts: [{ kind: 'text', text: 'Mam ' }, { kind: 'blank', id: 'answer', hint: 'kot', accepted_answers: ['kota'] }] }] },
      },
    })
    expect(created.status()).toBe(201)
  }
  await api.dispose()
}

async function signIn(page: Page, username: string, password: string) {
  await page.goto('/login')
  await page.locator('#username').fill(username)
  await page.locator('#password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page).not.toHaveURL(/\/login$/)
}

async function buildRichRuleDescription(page: Page) {
  const editor = page.locator('#rule-description')
  await editor.fill('Первый пункт')
  await editor.press('Enter')
  await editor.type('Второй пункт')
  await editor.press('Control+A')
  await page.getByRole('button', { name: 'Маркированный список' }).click()
  // Select the actual ProseMirror text range with keyboard events. Selecting
  // the structural <li> node does not exercise the editor selection and can
  // make the first item disappear when a mark is toggled.
  await selectEditorText(page, editor, editor.locator('li').first(), 'Первый пункт')
  await page.getByRole('button', { name: 'Жирный' }).click()
  await expect(editor).toBeFocused()
  await page.getByRole('button', { name: 'Курсив' }).click()
  await expect(editor).toBeFocused()
  await page.getByRole('button', { name: 'Подчёркнутый' }).click()
  await expect(editor).toBeFocused()
  await page.getByRole('button', { name: 'Размер шрифта 20 px' }).click()
  await expect(editor).toBeFocused()
  await expect(editor.locator('ul li')).toHaveText(['Первый пункт', 'Второй пункт'])
  await expect(editor.locator('strong')).toHaveText('Первый пункт')
  await expect(editor.locator('em')).toHaveText('Первый пункт')
  await expect(editor.locator('u')).toHaveText('Первый пункт')
  await expect(editor.locator('span[data-font-size="20"]')).toHaveText('Первый пункт')
  // Move to the end of the document through ProseMirror's keyboard path so
  // the still-formatted first item cannot be replaced by a DOM click target.
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('Control+End')
  await page.keyboard.press('Enter')
  await page.keyboard.press('Backspace')
  await page.keyboard.type('Табличное описание')
  await expect(editor.locator('ul li')).toHaveText(['Первый пункт', 'Второй пункт'])
  await page.getByRole('button', { name: 'Вставить таблицу' }).click()
  await page.getByRole('button', { name: 'Таблица 2 на 2' }).click()
  await expect(editor.locator('ul li')).toHaveText(['Первый пункт', 'Второй пункт'])
  const cells = editor.locator('table td')
  await expect(cells).toHaveCount(4)
  const emptyCellStyle = await cells.first().evaluate(element => {
    const style = getComputedStyle(element)
    return { border: style.borderTopWidth, minWidth: style.minWidth, padding: style.paddingTop }
  })
  expect(emptyCellStyle.border).not.toBe('0px')
  expect(emptyCellStyle.minWidth).not.toBe('0px')
  expect(emptyCellStyle.padding).not.toBe('0px')
  const cellValues = ['A1', 'A2', 'B1', 'B2']
  await page.keyboard.type(cellValues[0])
  for (const value of cellValues.slice(1)) {
    await page.keyboard.press('Tab')
    await page.keyboard.type(value)
  }
}

async function selectEditorText(page: Page, editor: Locator, target: Locator, text: string) {
  await target.click()
  await page.keyboard.press('Control+Home')
  await page.keyboard.down('Shift')
  for (let index = 0; index < text.length; index += 1) await page.keyboard.press('ArrowRight')
  await page.keyboard.up('Shift')
  // Chromium can coalesce the final repeated ArrowRight in a ProseMirror
  // selection. Correct only the measured native range, keeping this helper
  // an actual editor selection instead of selecting a DOM node.
  await page.keyboard.down('Shift')
  for (let attempt = 0; attempt < text.length; attempt += 1) {
    const selected = await page.evaluate(() => window.getSelection()?.toString() ?? '')
    if (selected === text) break
    await page.keyboard.press(selected.length < text.length ? 'ArrowRight' : 'ArrowLeft')
  }
  await page.keyboard.up('Shift')
  await expect.poll(() => page.evaluate(() => window.getSelection()?.toString() ?? '')).toBe(text)
}

test('administrator sees only metadata and learner retains learning routes', async ({ browser }) => {
  const adminUsername = 'browser-admin-qa'
  const adminPassword = 'safe-admin-password-8'
  await createAdmin(adminUsername, 'browser-admin-qa@example.com', adminPassword)
  await createCatalogExercises(adminUsername, adminPassword)

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
  await expect(learnerPage.getByRole('main').getByText('Упражнения', { exact: true })).toBeVisible()
  const exerciseCards = learnerPage.locator('main a[href^="/exercises/"]')
  expect(await exerciseCards.count()).toBeGreaterThan(0)
  const exerciseGrid = exerciseCards.first().locator('xpath=..')
  expect(await exerciseGrid.locator(':scope > a').count()).toBe(await exerciseCards.count())
  expect((await exerciseGrid.evaluate(grid => getComputedStyle(grid).gridTemplateColumns.split(' ').length))).toBe(2)
  await expect(exerciseCards.first().locator('a')).toHaveCount(0)
  const firstExerciseHref = await exerciseCards.first().getAttribute('href')
  expect(firstExerciseHref).toMatch(/^\/exercises\/[^/]+$/)
  await exerciseCards.first().click()
  await expect(learnerPage).toHaveURL(new RegExp(`${firstExerciseHref!.replace('/', '\\/')}\\?session_id=`))

  await learnerPage.goto('/exercises')
  const userMenu = learnerPage.getByRole('button', { name: learnerUsername })
  await expect(userMenu).toHaveAttribute('aria-expanded', 'false')
  await expect(learnerPage.getByRole('button', { name: /logout/i })).toHaveCount(0)
  await userMenu.click()
  await expect(userMenu).toHaveAttribute('aria-expanded', 'true')
  await expect(learnerPage.getByRole('menu')).toBeVisible()
  await learnerPage.getByRole('menuitem', { name: 'Выйти' }).click()
  await expect(learnerPage).toHaveURL(/\/login$/)

  await signIn(learnerPage, learnerUsername, learnerPassword)
  await learnerPage.goto('/exercises')
  await userMenu.focus()
  await userMenu.press('Space')
  await expect(userMenu).toHaveAttribute('aria-expanded', 'true')
  await userMenu.press('Escape')
  await expect(userMenu).toHaveAttribute('aria-expanded', 'false')
  await expect(userMenu).toBeFocused()

  await learnerPage.setViewportSize({ width: 375, height: 700 })
  await expect(learnerPage.getByRole('main').getByText('Упражнения', { exact: true })).toBeVisible()
  expect((await exerciseGrid.evaluate(grid => getComputedStyle(grid).gridTemplateColumns.split(' ').length))).toBe(1)
  expect(await learnerPage.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  for (const [legacyPath, canonicalPath, title] of [
    ['/exercises/numerators', '/exercises/numerators', 'Liczebniki (Numerals)'],
    ['/exercises/dopelniacz-pojed', '/exercises/dopelniacz-pojed', 'Dopełniacz (Genitive Case) Liczby Pojedynczej'],
  ]) {
    await learnerPage.goto(legacyPath)
    await expect(learnerPage).toHaveURL(new RegExp(`${canonicalPath}$`))
    await expect(learnerPage.getByText(title, { exact: true }).first()).toBeVisible()
  }
  await learnerContext.close()
})

test('legacy lessons paths stay unavailable for anonymous and learner visitors', async ({ browser }) => {
  const username = 'browser-no-lessons-learner-qa'
  const password = 'safe-no-lessons-password-8'
  const api = await request.newContext({ baseURL: backendUrl })
  expect((await api.post('/users/register', {
    data: { username, email: 'browser-no-lessons-learner-qa@example.com', password },
  })).status()).toBe(200)
  await api.dispose()

  const anonymousContext = await browser.newContext()
  const anonymousPage = await anonymousContext.newPage()
  const learnerContext = await browser.newContext()
  const learnerPage = await learnerContext.newPage()
  await signIn(learnerPage, username, password)

  for (const page of [anonymousPage, learnerPage]) {
    for (const path of ['/lessons', '/lessons/singular-nouns']) {
      await page.goto(path)
      await expect(page).toHaveURL(new RegExp(`${path}$`))
      await expect(page.locator('body')).toContainText(/404|not found/i)
      expect(page.url()).not.toContain('/exercises')
    }
  }

  await anonymousContext.close()
  await learnerContext.close()
})

test('exercise editor requires a rule and limits blank rules to its selected branch', async ({ browser }) => {
  const username = 'browser-exercise-rules-admin-qa'
  const password = 'safe-exercise-rules-password-8'
  await createAdmin(username, 'browser-exercise-rules-admin-qa@example.com', password)
  const api = await request.newContext({ baseURL: backendUrl })
  const login = await api.post('/users/token', { form: { username, password } })
  expect(login.status()).toBe(200)
  const headers = { Authorization: `Bearer ${(await login.json()).access_token}` }
  const createRule = async (title: string, parent_rule_id: number | null = null) => {
    const response = await api.post('/admin/rules', { headers, data: { title, description: `Описание ${title}`, parent_rule_id } })
    expect(response.status()).toBe(201)
    return await response.json() as { id: number }
  }
  const root = await createRule('Правило UI')
  await createRule('Подправило UI', root.id)
  await createRule('Другая ветвь UI')

  const context = await browser.newContext()
  const page = await context.newPage()
  await signIn(page, username, password)
  await page.goto('/admin/exercises/new')
  const exerciseRule = page.locator('label').filter({ hasText: /^Правило упражнения/ }).locator('select')
  await expect(exerciseRule).toHaveValue('')
  let exerciseCreateRequests = 0
  page.on('request', request => {
    if (request.method() === 'POST' && new URL(request.url()).pathname === '/admin/exercises') exerciseCreateRequests += 1
  })
  await page.getByRole('button', { name: 'Сохранить' }).click()
  await expect(page.locator('p').filter({ hasText: 'Выберите правило упражнения.' })).toBeVisible()
  await expect.poll(() => exerciseCreateRequests).toBe(0)

  await expect(exerciseRule.locator('option')).toContainText(['Правило UI', 'Правило UI → Подправило UI', 'Другая ветвь UI'])
  await exerciseRule.selectOption({ label: 'Правило UI' })
  const blankRule = page.locator('label').filter({ hasText: 'Правило пропуска (необязательно)' }).locator('select')
  await expect(blankRule.locator('option')).toContainText(['Не задано', 'Правило UI', 'Правило UI → Подправило UI'])
  await expect(blankRule.locator('option')).toHaveCount(3)
  await blankRule.selectOption({ label: 'Правило UI → Подправило UI' })
  await exerciseRule.selectOption({ label: 'Другая ветвь UI' })
  await expect(blankRule).toHaveValue('')
  await expect(page.getByRole('status')).toContainText('Недопустимые правила пропусков очищены')

  await context.close()
  await api.dispose()
})

test('administrator creates, edits, moves and deletes a hierarchical rule tree', async ({ browser }) => {
  test.setTimeout(60_000)
  const username = 'browser-rules-admin-qa'
  const password = 'safe-admin-password-8'
  await createAdmin(username, 'browser-rules-admin-qa@example.com', password)

  const context = await browser.newContext()
  const page = await context.newPage()
  await signIn(page, username, password)
  await expect(page).toHaveURL(/\/admin\/exercises$/)
  await page.goto('/admin/rules')
  await expect(page.getByRole('main').getByText('Правила', { exact: true })).toBeVisible()
  await expect(page.getByText('Правила польского языка', { exact: true })).toBeVisible()

  await page.getByRole('link', { name: 'Создать правило' }).first().click()
  await expect(page).toHaveURL(/\/admin\/rules\/new$/, { timeout: 30_000 })
  await expect(page.locator('#rule-title')).toBeVisible({ timeout: 30_000 })
  await page.locator('#rule-title').fill('Корневое правило')
  await buildRichRuleDescription(page)
  await page.getByRole('button', { name: 'Создать правило' }).click()
  await expect(page).toHaveURL(/\/admin\/rules\/\d+$/)
  await expect(page.getByRole('heading', { name: 'Корневое правило', exact: true })).toBeVisible()
  await expect(page.locator('#rule-description')).toContainText('Первый пункт')
  await expect(page.locator('#rule-description')).toContainText('Табличное описание')
  await expect(page.locator('#rule-description table td')).toHaveText(['A1', 'A2', 'B1', 'B2'])
  await page.reload()
  await expect(page.locator('#rule-description')).toContainText('Первый пункт')
  await expect(page.locator('#rule-description table td')).toHaveText(['A1', 'A2', 'B1', 'B2'])
  await expect(page.locator('#rule-description ul li')).toHaveCount(2)
  await expect(page.locator('#rule-description strong')).toHaveCount(1)
  await expect(page.locator('#rule-description em')).toHaveCount(1)
  await expect(page.locator('#rule-description u')).toHaveCount(1)
  await expect(page.locator('#rule-description span[data-font-size="20"]')).toHaveCount(1)

  const visualTab = page.getByRole('tab', { name: 'Визуально' })
  const htmlTab = page.getByRole('tab', { name: 'HTML' })
  await htmlTab.click()
  const rawEditor = page.locator('#rule-description')
  await expect(rawEditor).toHaveValue(/<ul>/)
  const rawMixedHtml = '<p><strong>Жирный</strong> обычный <span data-font-size="20" onclick="bad()">Большой</span> <script>alert(1)</script><a href="https://example.com">ссылка</a></p>'
  await rawEditor.fill(rawMixedHtml)
  await expect(rawEditor).toHaveValue(rawMixedHtml)
  await visualTab.click()
  const visualEditor = page.locator('#rule-description')
  for (const text of ['Жирный', 'обычный', 'Большой', 'ссылка']) await expect(visualEditor).toContainText(text)
  await expect(visualEditor).not.toContainText('alert(1)')
  await expect(visualEditor.locator('strong')).toHaveText('Жирный')
  await expect(visualEditor.locator('span[data-font-size="20"]')).toHaveText('Большой')
  await htmlTab.click()
  await expect(page.locator('#rule-description')).not.toHaveValue(/script|onclick|href=/)

  await rawEditor.fill('<script>alert(1)</script><p><br></p>')
  await page.getByRole('button', { name: 'Сохранить' }).click()
  await expect(page.locator('#rule-description-error')).toContainText('Введите описание правила.')
  await expect(rawEditor).toHaveAttribute('aria-invalid', 'true')

  // Saving directly from HTML mode must apply the same silent filtering as
  // switching to visual mode and persist the canonical safe fragment.
  await rawEditor.fill(rawMixedHtml)
  await page.getByRole('button', { name: 'Сохранить' }).click()
  await expect(page.getByRole('status')).toContainText('Изменения сохранены.')
  await page.reload()
  await expect(page.getByRole('tab', { name: 'Визуально' })).toHaveAttribute('aria-selected', 'true')
  for (const text of ['Жирный', 'обычный', 'Большой', 'ссылка']) await expect(page.locator('#rule-description')).toContainText(text)
  await expect(page.locator('#rule-description')).not.toContainText('alert(1)')
  await page.getByRole('tab', { name: 'HTML' }).click()
  await expect(page.locator('#rule-description')).not.toHaveValue(/script|onclick|href=/)
  await page.getByRole('tab', { name: 'Визуально' }).click()

  const editor = page.locator('#rule-description')
  const boldButton = page.getByRole('button', { name: 'Жирный' })
  const size14Button = page.getByRole('button', { name: 'Размер шрифта 14 px' })
  const size16Button = page.getByRole('button', { name: 'Размер шрифта 16 px' })
  const size20Button = page.getByRole('button', { name: 'Размер шрифта 20 px' })
  await selectEditorText(page, editor, editor.locator('strong'), 'Жирный')
  await expect(boldButton).toHaveAttribute('aria-pressed', 'true')
  await editor.locator('p').click()
  await editor.press('End')
  await expect(boldButton).toHaveAttribute('aria-pressed', 'false')
  await selectEditorText(page, editor, editor.locator('p'), 'Жирный обычный Большой ссылка')
  await expect(boldButton).toHaveAttribute('aria-pressed', 'false')
  await expect(size14Button).toHaveAttribute('aria-pressed', 'false')
  await expect(size16Button).toHaveAttribute('aria-pressed', 'false')
  await expect(size20Button).toHaveAttribute('aria-pressed', 'false')

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
      await route.fulfill({
        status: 422,
        contentType: 'application/json',
        body: JSON.stringify({ detail: [{ loc: ['body', 'description'], msg: 'Value error, Описание в редакторе: недопустимый тег', type: 'value_error' }] }),
      })
      return
    }
    await route.continue()
  })
  await page.getByRole('button', { name: 'Сохранить' }).click()
  await expect(page.locator('#rule-description-error')).toContainText('Описание в редакторе: недопустимый тег')
  await expect(page.locator('#rule-description')).toHaveAttribute('aria-invalid', 'true')
  await expect(page.locator('#rule-description')).toHaveAttribute('aria-describedby', 'rule-description-error')
  await expect(page.locator('#rule-description')).toContainText('Описание, которое сервер временно не принимает')
  await page.unroute('**/admin/rules/*')

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
  await expect(page.locator('#rule-description')).toContainText('Описание, которое сервер временно не принимает')
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
  const firstRuleEditor = page.locator('#rule-description')
  await firstRuleEditor.fill('Несохранённое описание для выделения')
  await selectEditorText(page, firstRuleEditor, firstRuleEditor.locator('p'), 'Несохранённое описание для выделения')
  await tree.getByRole('button', { name: 'Соседняя ветвь', exact: true }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByRole('button', { name: 'Остаться' }).click()
  await expect(page.locator('#rule-description')).toContainText('Несохранённое описание для выделения')
  await expect.poll(() => page.evaluate(() => window.getSelection()?.toString() ?? '')).toBe('Несохранённое описание для выделения')
  await tree.getByRole('button', { name: 'Соседняя ветвь', exact: true }).click()
  await page.getByRole('button', { name: 'Не сохранять' }).click()
  await expect.poll(() => page.evaluate(() => window.getSelection()?.toString() ?? '')).toBe('')
  await expect(tree.getByRole('button', { name: 'Соседняя ветвь', exact: true })).toBeFocused()
  await expect(page.locator('#rule-description')).toContainText('Описание соседней ветви')

  // A new child keeps the raw editor session intact while its parent changes.
  // In particular, changing the select must not remount the editor and lose
  // either the raw value or the native textarea selection.
  await page.getByRole('button', { name: '+ Добавить подправило' }).click()
  await page.locator('#rule-title').fill('Подправило с переносом родителя')
  const rawChildDescription = '<p>Raw-описание для переноса</p>'
  await page.getByRole('tab', { name: 'HTML' }).click()
  const rawChildEditor = page.locator('#rule-description')
  await rawChildEditor.fill(rawChildDescription)
  await rawChildEditor.selectText()
  await expect(page.getByRole('tab', { name: 'HTML' })).toHaveAttribute('aria-selected', 'true')
  await expect(rawChildEditor).toHaveValue(rawChildDescription)
  await expect.poll(() => rawChildEditor.evaluate(element => {
    const textarea = element as HTMLTextAreaElement
    return { start: textarea.selectionStart, end: textarea.selectionEnd }
  })).toEqual({ start: 0, end: rawChildDescription.length })

  await page.locator('#rule-parent').selectOption({ label: '— Первый уровень' })
  await expect(page.getByRole('tab', { name: 'HTML' })).toHaveAttribute('aria-selected', 'true')
  await expect(rawChildEditor).toHaveValue(rawChildDescription)
  await expect.poll(() => rawChildEditor.evaluate(element => {
    const textarea = element as HTMLTextAreaElement
    return { start: textarea.selectionStart, end: textarea.selectionEnd }
  })).toEqual({ start: 0, end: rawChildDescription.length })
  await page.getByRole('button', { name: 'Сохранить' }).click()
  await expect(page.getByRole('status')).toContainText('Подправило создано.')

  // Discarding a second draft must not leak its session into a fresh child
  // created under the same parent.
  await tree.getByRole('button', { name: 'Первый уровень', exact: true }).click()
  await page.getByRole('button', { name: '+ Добавить подправило' }).click()
  await page.locator('#rule-title').fill('Черновик для отмены')
  await page.locator('#rule-description').fill('Описание отменённого черновика')
  await tree.getByRole('button', { name: 'Первый уровень', exact: true }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByRole('button', { name: 'Не сохранять' }).click()
  await expect(tree.getByRole('button', { name: 'Первый уровень', exact: true })).toBeFocused()
  await page.getByRole('button', { name: '+ Добавить подправило' }).click()
  await expect(page.locator('#rule-title')).toHaveValue('')
  await expect(page.locator('#rule-description')).toHaveText('')
  await expect(page.getByRole('tab', { name: 'Визуально' })).toHaveAttribute('aria-selected', 'true')
  await page.locator('#rule-description').fill('Черновик для проверки перехода')
  await tree.getByRole('button', { name: 'Соседняя ветвь', exact: true }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByRole('button', { name: 'Не сохранять' }).click()

  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'Удалить', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('Правило удалено.')
  await expect(tree.getByText('Третий уровень', { exact: true })).toBeVisible()

  await page.goto('/admin/rules')
  await expect(page.getByText('Всего правил:', { exact: false })).toBeVisible()
  await expect(page.getByText('включая подправила', { exact: true })).toBeVisible()
  const rootCard = page.locator('li').filter({ hasText: 'Корневое правило' })
  await expect(rootCard).toContainText('Жирный обычный Большой ссылка')
  const preview = rootCard.locator('p').filter({ hasText: 'Жирный обычный Большой ссылка' }).first()
  const previewText = await preview.innerText()
  expect(previewText).toContain('Жирный обычный Большой ссылка')
  expect(previewText).not.toContain('<p>')
  await page.reload()
  const reloadedRootCard = page.locator('li').filter({ hasText: 'Корневое правило' })
  await expect(reloadedRootCard.locator('p').filter({ hasText: 'Жирный обычный Большой ссылка' }).first()).toHaveText(previewText)
  await expect(page.locator('main main')).toHaveCount(0)
  page.once('dialog', (dialog) => dialog.accept())
  await reloadedRootCard.getByRole('button', { name: 'Удалить', exact: true }).click()
  await expect(page.getByText('Всего правил:', { exact: false })).toBeVisible()
  await expect(page.getByText('Первый уровень', { exact: true })).toBeVisible()
  await expect(page.getByText('Третий уровень', { exact: true })).toBeVisible()

  await page.route(`${backendUrl}/admin/rules`, (route) => route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ detail: 'Тестовая ошибка загрузки' }) }))
  await page.reload()
  await expect(page.getByText('Тестовая ошибка загрузки', { exact: true })).toBeVisible()
  await expect(page.getByText('Всего правил:', { exact: false })).not.toBeVisible()
  await page.unroute(`${backendUrl}/admin/rules`)
  await context.close()
})
