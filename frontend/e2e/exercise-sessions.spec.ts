import { expect, request, test, type Page, type Request } from '@playwright/test'
import { spawn } from 'node:child_process'

const backendUrl = 'http://localhost:8000'
const publicId = '[A-Za-z0-9_-]{22}'

const expectedDotColors = {
  gray: 'rgb(209, 213, 219)',
  red: 'rgb(239, 68, 68)',
  green: 'rgb(34, 197, 94)',
} as const

async function expectAttemptDots(page: Page, blankId: string, states: Array<keyof typeof expectedDotColors>) {
  const container = page.locator(`[data-blank-id="${blankId}"]`)
  const dots = container.locator('[data-attempt-state]')
  await expect(dots).toHaveCount(3)
  await expect(container).toHaveRole('button')
  await expect(container.locator('[aria-hidden="true"]')).toHaveCount(1)
  for (let index = 0; index < states.length; index += 1) {
    const state = states[index]
    await expect(dots.nth(index)).toHaveAttribute('data-attempt-state', state)
    await expect(dots.nth(index)).toHaveCSS('background-color', expectedDotColors[state])
  }
}

async function expectVerticalDots(page: Page, blankId: string) {
  const geometry = await page.locator(`[data-blank-id="${blankId}"] [data-attempt-state]`).evaluateAll(dots => dots.map(dot => {
    const bounds = dot.getBoundingClientRect()
    return { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height }
  }))
  expect(geometry).toHaveLength(3)
  expect(geometry.every(dot => dot.width === 8 && dot.height === 8)).toBe(true)
  expect(geometry[0].x).toBe(geometry[1].x)
  expect(geometry[1].x).toBe(geometry[2].x)
  expect(geometry[0].y).toBeLessThan(geometry[1].y)
  expect(geometry[1].y).toBeLessThan(geometry[2].y)
}

function createAdmin(username: string, email: string, password: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const command = spawn('python3', ['-m', 'create_admin', '--username', username, '--email', email, '--password-stdin'], {
      cwd: '/app/backend', env: { ...process.env, DATABASE_URL: process.env.TEST_DATABASE_URL },
    })
    let stderr = ''
    command.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString() })
    command.on('error', reject)
    command.on('close', code => code === 0 ? resolve() : reject(new Error(stderr)))
    command.stdin.end(`${password}\n`)
  })
}

function seedVocabulary(): Promise<void> {
  return new Promise((resolve, reject) => {
    const command = spawn('python3', ['/app/tests/browser/seed_exercise_vocabulary.py'], {
      env: { ...process.env, DATABASE_URL: process.env.TEST_DATABASE_URL },
    })
    let stderr = ''
    command.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString() })
    command.on('error', reject)
    command.on('close', code => code === 0 ? resolve() : reject(new Error(stderr)))
  })
}

function expireSession(publicId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const command = spawn('python3', ['/app/tests/browser/expire_exercise_session.py', publicId], {
      env: { ...process.env, DATABASE_URL: process.env.TEST_DATABASE_URL },
    })
    let stderr = ''
    command.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString() })
    command.on('error', reject)
    command.on('close', code => code === 0 ? resolve() : reject(new Error(stderr)))
  })
}

async function signIn(page: Page, username: string, password: string) {
  await page.goto('/login')
  await page.locator('#username').fill(username)
  await page.locator('#password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL(/\/$/)
}

async function createFillExercise(suffix = '') {
  const exerciseSlug = suffix ? `browser-rule-page-${suffix}` : 'browser-session-fill-qa'
  const otherExerciseSlug = suffix ? `${exerciseSlug}-other` : 'browser-session-fill-other-qa'
  const adminUsername = suffix ? `browser-rule-page-admin-${suffix}` : 'browser-session-admin-qa'
  const adminPassword = 'safe-browser-session-password-8'
  const ruleTitleSuffix = suffix ? ` ${suffix}` : ''
  const explicitRuleTitle = `Явное правило browser QA${ruleTitleSuffix}`
  const explicitChildTitle = `Подправило browser QA${ruleTitleSuffix}`
  const explicitGrandchildTitle = `Глубокое подправило browser QA${ruleTitleSuffix}`
  const siblingRuleTitle = `Соседнее подправило browser QA${ruleTitleSuffix}`
  await createAdmin(adminUsername, `${adminUsername}@example.com`, adminPassword)
  const api = await request.newContext({ baseURL: backendUrl })
  const login = await api.post('/users/token', { form: { username: adminUsername, password: adminPassword } })
  expect(login.status()).toBe(200)
  const headers = { Authorization: `Bearer ${(await login.json()).access_token}` }
  const rules = await api.get('/admin/rules', { headers })
  expect(rules.status()).toBe(200)
  const ruleId = (await rules.json() as Array<{ id: number }>)[0].id
  const explicitRuleResponse = await api.post('/admin/rules', { headers, data: {
    title: explicitRuleTitle, description: `Описание ${explicitRuleTitle}`, parent_rule_id: ruleId,
  } })
  expect(explicitRuleResponse.status()).toBe(201)
  const explicitRule = await explicitRuleResponse.json() as { id: number }
  const explicitChildResponse = await api.post('/admin/rules', { headers, data: {
    title: explicitChildTitle, description: `Описание ${explicitChildTitle}`, parent_rule_id: explicitRule.id,
  } })
  expect(explicitChildResponse.status()).toBe(201)
  const explicitChild = await explicitChildResponse.json() as { id: number }
  const explicitGrandchildResponse = await api.post('/admin/rules', { headers, data: {
    title: explicitGrandchildTitle, description: `Описание ${explicitGrandchildTitle}`, parent_rule_id: explicitChild.id,
  } })
  expect(explicitGrandchildResponse.status()).toBe(201)
  const siblingRuleResponse = await api.post('/admin/rules', { headers, data: {
    title: siblingRuleTitle, description: `Описание ${siblingRuleTitle}`, parent_rule_id: explicitRule.id,
  } })
  expect(siblingRuleResponse.status()).toBe(201)
  const created = await api.post('/admin/exercises', {
    headers,
    data: {
      slug: exerciseSlug, type_code: 'fill_blanks', schema_version: 1,
      title: 'Browser session fill blanks', description: 'Session browser coverage', instruction: 'Заполните пропуски',
      difficulty: 'beginner', estimated_duration_minutes: 5, display_order: 90, status: 'published', rule_id: ruleId,
      definition: { items: [{ id: 'sentence-1', parts: [
        { kind: 'text', text: 'Mam ' },
        { kind: 'blank', id: 'cat', hint: 'kot', rule_id: explicitRule.id, accepted_answers: ['kota'] },
        { kind: 'text', text: ' oraz ' },
        { kind: 'blank', id: 'dog', hint: 'pies', accepted_answers: ['psa', 'pieska'] },
        { kind: 'text', text: ' i ' },
        { kind: 'blank', id: 'bird', hint: 'ptak', accepted_answers: ['ptaka'] },
        { kind: 'text', text: '.' },
      ] }] },
    },
  })
  expect(created.status()).toBe(201)
  const other = await api.post('/admin/exercises', {
    headers,
    data: {
      slug: otherExerciseSlug, type_code: 'fill_blanks', schema_version: 1,
      title: 'Other browser session exercise', description: 'Used to reject a session from another exercise', instruction: 'Заполните пропуск',
      difficulty: 'beginner', estimated_duration_minutes: 5, display_order: 91, status: 'published', rule_id: ruleId,
      definition: { items: [{ id: 'other-sentence', parts: [{ kind: 'text', text: 'Mam ' }, { kind: 'blank', id: 'other', hint: 'kot', accepted_answers: ['kota'] }] }] },
    },
  })
  expect(other.status()).toBe(201)
  return {
    api,
    exerciseSlug,
    adminUsername,
    adminPassword,
    rootRuleId: ruleId,
    explicitRuleId: explicitRule.id,
    explicitRuleTitle,
    explicitGrandchildTitle,
    explicitChildId: explicitChild.id,
    explicitGrandchildId: (await explicitGrandchildResponse.json() as { id: number }).id,
  }
}

test('exercise URLs restore one server session for every supported type', async ({ browser }) => {
  await seedVocabulary()
  const username = 'browser-session-types-qa'
  const password = 'safe-browser-session-password-8'
  const api = await request.newContext({ baseURL: backendUrl })
  expect((await api.post('/users/register', { data: { username, email: 'browser-session-types-qa@example.com', password } })).status()).toBe(200)

  const context = await browser.newContext()
  const page = await context.newPage()
  await signIn(page, username, password)
  let creates = 0
  page.on('request', request => {
    if (request.method() === 'POST' && /\/api\/exercises\/[^/]+\/sessions$/.test(new URL(request.url()).pathname)) creates += 1
  })

  for (const slug of ['singular-nouns', 'numerators', 'dopelniacz-pojed']) {
    const before = creates
    await page.goto(`/exercises/${slug}`)
    await expect(page).toHaveURL(new RegExp(`/exercises/${slug}\\?session_id=${publicId}$`))
    const address = page.url()
    expect(creates).toBe(before + 1)
    if (slug === 'singular-nouns') {
      const cell = page.locator('tbody tr').filter({ hasText: 'kot-browser-qa' }).locator('td').nth(1)
      await cell.getByRole('button', { name: 'Заполнить' }).click()
      await cell.getByRole('textbox').fill('kota-browser-qa')
      await cell.getByRole('button', { name: 'OK' }).click()
      await expect(cell).toContainText('kota-browser-qa')
    } else if (slug === 'numerators') {
      const input = page.getByRole('textbox').first()
      await input.fill('jeden-browser-qa')
      await page.getByRole('button', { name: 'Проверить' }).click()
      await expect(page.getByText('jeden-browser-qa', { exact: true }).last()).toBeVisible()
    } else {
      await page.getByRole('button', { name: 'Показать ответ' }).click()
      await page.getByRole('button', { name: 'Верно', exact: true }).click()
      await expect(page.getByText('Отмечено: верно', { exact: true })).toBeVisible()
    }
    await page.reload()
    await expect(page).toHaveURL(address)
    expect(creates).toBe(before + 1)
    if (slug === 'singular-nouns') await expect(page.locator('tbody tr').filter({ hasText: 'kot-browser-qa' }).locator('td').nth(1)).toContainText('kota-browser-qa')
    if (slug === 'numerators') await expect(page.getByText('jeden-browser-qa', { exact: true }).last()).toBeVisible()
    if (slug === 'dopelniacz-pojed') await expect(page.getByText('Отмечено: верно', { exact: true })).toBeVisible()
  }
  await context.close()
  await api.dispose()
})

test('fill blanks submits on blur or Enter, restores server state, and restarts safely', async ({ browser }) => {
  const { api } = await createFillExercise()
  const username = 'browser-session-fill-qa'
  const password = 'safe-browser-session-password-8'
  const registration = await api.post('/users/register', { data: { username, email: 'browser-session-fill-qa@example.com', password } })
  expect(registration.status()).toBe(200)
  const learnerLogin = await api.post('/users/token', { form: { username, password } })
  expect(learnerLogin.status()).toBe(200)
  const learnerHeaders = { Authorization: `Bearer ${(await learnerLogin.json()).access_token}` }

  const context = await browser.newContext()
  const page = await context.newPage()
  await signIn(page, username, password)
  await page.goto('/exercises/browser-session-fill-qa')
  await expect(page).toHaveURL(new RegExp(`/exercises/browser-session-fill-qa\\?session_id=${publicId}$`))
  const originalUrl = page.url()
  const originalId = new URL(originalUrl).searchParams.get('session_id')
  expect(originalId).toMatch(new RegExp(`^${publicId}$`))

  const inputs = page.getByRole('textbox', { name: 'Ответ для задания 1' })
  const cat = inputs.first()
  const dog = inputs.nth(1)
  const bird = inputs.nth(2)
  await expect(page.getByRole('button', { name: 'Проверить' })).toHaveCount(0)
  await expect(cat).not.toHaveAttribute('placeholder', 'kot')
  await expect(page.locator('#hint-cat')).toHaveText('(kot)')
  await expect(page.locator('body')).toContainText('(pies)')
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0')
  await expect(page.getByText('0 / 3', { exact: true })).toBeVisible()
  for (const blankId of ['cat', 'dog', 'bird']) {
    await expectAttemptDots(page, blankId, ['gray', 'gray', 'gray'])
    await expectVerticalDots(page, blankId)
  }

  let actionRequests = 0
  page.on('request', request => {
    if (request.method() === 'POST' && request.url().includes(`/sessions/${originalId}/actions`)) actionRequests += 1
  })
  await cat.focus()
  await dog.focus()
  await expect.poll(() => actionRequests).toBe(0)

  const wrongResponse = page.waitForResponse(response => response.url().includes(`/sessions/${originalId}/actions`) && response.request().method() === 'POST')
  await cat.fill('wrong')
  await cat.blur()
  await wrongResponse
  await expect(page.locator('#status-cat')).toHaveText('Пока не совпало. Осталось попыток: 2 из 3')
  await expect(page.locator('#status-cat')).toHaveCSS('position', 'absolute')
  await expect(page.locator('#status-cat')).toHaveCSS('width', '1px')
  await expect(page.locator('#status-cat')).toHaveCSS('height', '1px')
  await expect(cat).toHaveValue('wrong')
  await expectAttemptDots(page, 'cat', ['red', 'gray', 'gray'])
  await expectAttemptDots(page, 'dog', ['gray', 'gray', 'gray'])

  const secondWrongResponse = page.waitForResponse(response => response.url().includes(`/sessions/${originalId}/actions`) && response.request().method() === 'POST')
  await cat.fill('still-wrong')
  await cat.blur()
  await secondWrongResponse
  await expectAttemptDots(page, 'cat', ['red', 'red', 'gray'])
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0')

  const correctResponse = page.waitForResponse(response => response.url().includes(`/sessions/${originalId}/actions`) && response.request().method() === 'POST')
  await cat.fill('KOTA')
  await cat.press('Enter')
  await correctResponse
  await expect.poll(() => actionRequests).toBe(3)
  await expect(cat).toBeEnabled()
  await expect(cat).toHaveAttribute('readonly', '')
  await expect(cat).not.toBeEditable()
  await expect(cat).toHaveCSS('background-color', 'rgb(240, 253, 244)')
  await expect(cat).toHaveCSS('border-color', 'rgb(74, 222, 128)')
  await expectAttemptDots(page, 'cat', ['red', 'red', 'green'])
  await expect(page.locator('#status-cat')).toHaveText('Верно · 3 из 3')
  await expect(page.getByText('✓ Верно', { exact: true })).toHaveCount(0)
  await expect(page.getByText('OK', { exact: true })).toHaveCount(0)
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1')

  await cat.focus()
  const catRuleTooltip = page.getByRole('dialog')
  await expect(catRuleTooltip).toContainText('Явное правило browser QA')
  await expect(catRuleTooltip).toContainText('Подправило browser QA')
  await expect(catRuleTooltip).toContainText('Глубокое подправило browser QA')
  await expect(catRuleTooltip).toContainText('Соседнее подправило browser QA')
  const catRuleText = await catRuleTooltip.innerText()
  expect(catRuleText.indexOf('Явное правило browser QA')).toBeLessThan(catRuleText.indexOf('Подправило browser QA'))
  expect(catRuleText.indexOf('Подправило browser QA')).toBeLessThan(catRuleText.indexOf('Глубокое подправило browser QA'))
  await cat.press('Escape')
  await expect(cat).toBeFocused()
  await expect(page.getByRole('dialog')).toHaveCount(0)

  const catHistory = page.getByRole('button', { name: 'История ответов для пропуска 1' })
  await catHistory.focus()
  await expect(catHistory).toHaveAttribute('aria-expanded', 'true')
  const catHistoryId = await catHistory.getAttribute('aria-controls')
  expect(catHistoryId).toBeTruthy()
  await expect(catHistory).toHaveClass(/focus-visible:ring-2/)
  const catHistoryTooltip = page.getByRole('dialog')
  await expect(catHistoryTooltip).toContainText('История ответов')
  await expect(catHistoryTooltip.locator('ol li')).toHaveText(['wrong', 'still-wrong', 'KOTA'])
  await catHistory.hover()
  await catHistoryTooltip.hover()
  await expect(catHistoryTooltip).toBeVisible()
  // Pointer may leave the wrapper while the trigger still owns focus.
  await page.mouse.move(0, 0)
  await expect(catHistoryTooltip).toBeVisible()
  // The inverse transition also keeps it open: focus moves into the panel while
  // the pointer is outside, then pointer re-enters and leaves the panel again.
  await catHistoryTooltip.focus()
  await expect(catHistoryTooltip).toBeVisible()
  await catHistoryTooltip.hover()
  await expect(catHistoryTooltip).toBeVisible()
  await page.mouse.move(0, 0)
  await expect(catHistoryTooltip).toBeVisible()
  // Only after both pointer and focus leave does the popover close.
  await dog.focus()
  await expect(catHistoryTooltip).toBeHidden()
  await catHistory.focus()
  await expect(catHistoryTooltip).toBeVisible()
  await catHistory.press('Escape')
  await expect(catHistory).toBeFocused()
  await expect(page.getByRole('dialog')).toHaveCount(0)

  const dogResponse = page.waitForResponse(response => response.url().includes(`/sessions/${originalId}/actions`) && response.request().method() === 'POST')
  await dog.fill('PSA')
  await dog.blur()
  await dogResponse
  await expect(dog).toBeEnabled()
  await expect(dog).toHaveAttribute('readonly', '')
  await expect(dog).not.toBeEditable()
  await expect(dog).toHaveCSS('background-color', 'rgb(240, 253, 244)')
  await expect(dog).toHaveCSS('border-color', 'rgb(74, 222, 128)')
  await expectAttemptDots(page, 'dog', ['green', 'gray', 'gray'])
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '2')
  await dog.focus()
  await expect(page.getByRole('dialog')).toContainText('Правила польского языка')
  await expect(page.getByRole('dialog')).toContainText('Явное правило browser QA')
  await dog.press('Escape')
  await expect(dog).toBeFocused()

  await page.route('**/api/exercises/browser-session-fill-qa/sessions/*/actions', route => route.abort('failed'))
  await bird.fill('network-error')
  await bird.blur()
  await expect(page.locator('#status-bird')).toHaveText('Не удалось проверить ответ. Повторите выход из поля или Enter.')
  await expect(bird).toBeEnabled()
  await expectAttemptDots(page, 'bird', ['gray', 'gray', 'gray'])
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '2')
  const birdHistory = page.getByRole('button', { name: 'История ответов для пропуска 3' })
  await birdHistory.focus()
  await expect(page.getByRole('dialog')).toContainText('Пока нет проверенных ответов')
  await birdHistory.press('Escape')
  await page.unroute('**/api/exercises/browser-session-fill-qa/sessions/*/actions')

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = page.waitForResponse(result => result.url().includes(`/sessions/${originalId}/actions`) && result.request().method() === 'POST')
    await bird.fill(`wrong-${attempt}`)
    await bird.blur()
    await response
  }
  await expect(bird).toBeEnabled()
  await expect(bird).toHaveAttribute('readonly', '')
  await expect(bird).not.toBeEditable()
  await expect(bird).toHaveValue('ptaka')
  await expect(bird).toHaveCSS('background-color', 'rgb(254, 242, 242)')
  await expect(bird).toHaveCSS('border-color', 'rgb(248, 113, 113)')
  await expectAttemptDots(page, 'bird', ['red', 'red', 'red'])
  await expect(page.locator('#status-bird')).toHaveText('Попытки закончились. Ответ: ptaka')
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '3')
  await page.reload()
  await expect(page).toHaveURL(originalUrl)
  await expect(inputs.first()).toHaveValue('KOTA')
  await expect(inputs.first()).toBeEnabled()
  await expect(inputs.first()).toHaveAttribute('readonly', '')
  await expect(page.getByRole('textbox', { name: 'Ответ для задания 1' }).nth(2)).toHaveValue('ptaka')
  await expectAttemptDots(page, 'cat', ['red', 'red', 'green'])
  await expectAttemptDots(page, 'bird', ['red', 'red', 'red'])
  await expect(page.locator('#status-cat')).toHaveText('Верно · 3 из 3')
  await expect(page.locator('#status-bird')).toHaveText('Попытки закончились. Ответ: ptaka')
  await page.getByRole('button', { name: 'История ответов для пропуска 1' }).focus()
  await expect(page.getByRole('dialog').locator('ol li')).toHaveText(['wrong', 'still-wrong', 'KOTA'])
  await page.getByRole('button', { name: 'История ответов для пропуска 1' }).press('Escape')

  const restartResponse = page.waitForResponse(response => response.url().includes(`/sessions/${originalId}/restart`) && response.request().method() === 'POST')
  await page.getByRole('button', { name: 'Начать заново' }).click()
  const restartSnapshot = await restartResponse
  const restartBody = await restartSnapshot.json() as { session_id: string }
  await expect.poll(() => new URL(page.url()).searchParams.get('session_id')).toBe(restartBody.session_id)
  const resetId = restartBody.session_id
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0')
  await expect(page.getByText('0 / 3', { exact: true })).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'Ответ для задания 1' }).first()).not.toHaveAttribute('readonly', '')
  await expectAttemptDots(page, 'cat', ['gray', 'gray', 'gray'])
  await page.getByRole('button', { name: 'История ответов для пропуска 1' }).focus()
  await expect(page.getByRole('dialog')).toContainText('Пока нет проверенных ответов')
  await page.getByRole('button', { name: 'История ответов для пропуска 1' }).press('Escape')

  await page.goto(`/exercises/browser-session-fill-qa?session_id=missing-session`)
  await expect(page).toHaveURL(new RegExp(`/exercises/browser-session-fill-qa\\?session_id=${publicId}$`))
  expect(page.url()).not.toBe('/exercises/browser-session-fill-qa?session_id=missing-session')

  const expired = await api.post('/api/exercises/browser-session-fill-qa/sessions', { headers: learnerHeaders })
  expect(expired.status()).toBe(201)
  const expiredId = (await expired.json() as { session_id: string }).session_id
  await expireSession(expiredId)

  const foreignUsername = 'browser-session-foreign-qa'
  const foreignPassword = 'safe-browser-session-password-8'
  expect((await api.post('/users/register', { data: { username: foreignUsername, email: 'browser-session-foreign-qa@example.com', password: foreignPassword } })).status()).toBe(200)
  const foreignLogin = await api.post('/users/token', { form: { username: foreignUsername, password: foreignPassword } })
  const foreignHeaders = { Authorization: `Bearer ${(await foreignLogin.json()).access_token}` }
  const foreign = await api.post('/api/exercises/browser-session-fill-qa/sessions', { headers: foreignHeaders })
  expect(foreign.status()).toBe(201)
  const foreignId = (await foreign.json() as { session_id: string }).session_id

  const otherExercise = await api.post('/api/exercises/browser-session-fill-other-qa/sessions', { headers: learnerHeaders })
  expect(otherExercise.status()).toBe(201)
  const otherExerciseId = (await otherExercise.json() as { session_id: string }).session_id
  for (const unavailableSessionId of [expiredId, foreignId, otherExerciseId]) {
    await page.goto(`/exercises/browser-session-fill-qa?session_id=${unavailableSessionId}`)
    await expect.poll(() => new URL(page.url()).searchParams.get('session_id')).not.toBe(unavailableSessionId)
    await expect(page).toHaveURL(new RegExp(`/exercises/browser-session-fill-qa\\?session_id=${publicId}$`))
  }

  const unavailableId = new URL(page.url()).searchParams.get('session_id')!
  let replacementCreates = 0
  const countReplacementCreate = (request: Request) => {
    if (request.method() === 'POST' && new URL(request.url()).pathname === '/api/exercises/browser-session-fill-qa/sessions') replacementCreates += 1
  }
  page.on('request', countReplacementCreate)
  const unavailableActionReleases: Array<() => void> = []
  await page.route(`**/api/exercises/browser-session-fill-qa/sessions/${unavailableId}/actions`, async route => {
    await new Promise<void>(resolve => unavailableActionReleases.push(resolve))
    await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ detail: 'Сессия не найдена' }) })
  })
  const replacementCreate = page.waitForResponse(response => response.url().endsWith('/api/exercises/browser-session-fill-qa/sessions') && response.request().method() === 'POST')
  const unavailableInputs = page.getByRole('textbox', { name: 'Ответ для задания 1' })
  await unavailableInputs.first().fill('lost-answer')
  await unavailableInputs.first().blur()
  await unavailableInputs.nth(1).fill('lost-answer-too')
  await unavailableInputs.nth(1).blur()
  await expect.poll(() => unavailableActionReleases.length).toBe(2)
  unavailableActionReleases.forEach(release => release())
  await replacementCreate
  await expect.poll(() => new URL(page.url()).searchParams.get('session_id')).not.toBe(unavailableId)
  await page.unroute(`**/api/exercises/browser-session-fill-qa/sessions/${unavailableId}/actions`)
  page.off('request', countReplacementCreate)
  expect(replacementCreates).toBe(1)
  await expect(page.getByRole('textbox', { name: 'Ответ для задания 1' }).first()).toHaveValue('')

  const pendingReleases: Array<() => void> = []
  await page.route('**/api/exercises/browser-session-fill-qa/sessions/*/actions', async route => {
    await new Promise<void>(resolve => pendingReleases.push(resolve))
    await route.abort('failed')
  })
  const replacementInputs = page.getByRole('textbox', { name: 'Ответ для задания 1' })
  await replacementInputs.first().fill('first-pending')
  await replacementInputs.first().blur()
  await replacementInputs.nth(1).fill('second-pending')
  await replacementInputs.nth(1).blur()
  await expect.poll(() => pendingReleases.length).toBe(2)
  await expect(replacementInputs.first()).toBeDisabled()
  await expect(replacementInputs.nth(1)).toBeDisabled()
  await expectAttemptDots(page, 'cat', ['gray', 'gray', 'gray'])
  await expectAttemptDots(page, 'dog', ['gray', 'gray', 'gray'])
  pendingReleases[0]()
  await expect(replacementInputs.first()).toBeEnabled()
  await expect(replacementInputs.nth(1)).toBeDisabled()
  pendingReleases[1]()
  await expect(replacementInputs.nth(1)).toBeEnabled()
  await page.unroute('**/api/exercises/browser-session-fill-qa/sessions/*/actions')

  await context.close()
  await api.dispose()
})

test('catalog groups rules and a grouped blank input keeps partial progress independent', async ({ browser }) => {
  test.setTimeout(60_000)
  const adminUsername = 'browser-group-admin-qa'
  const adminPassword = 'safe-browser-group-password-8'
  await createAdmin(adminUsername, 'browser-group-admin-qa@example.com', adminPassword)
  const api = await request.newContext({ baseURL: backendUrl })
  const login = await api.post('/users/token', { form: { username: adminUsername, password: adminPassword } })
  expect(login.status()).toBe(200)
  const headers = { Authorization: `Bearer ${(await login.json()).access_token}` }
  const root = await api.post('/admin/rules', { headers, data: {
    title: 'Группа пропусков UI', description: 'Правило для browser-проверки', parent_rule_id: null,
  } })
  expect(root.status()).toBe(201)
  const ruleId = (await root.json() as { id: number }).id
  const colorRule = await api.post('/admin/rules', { headers, data: {
    title: 'Правило цвета UI', description: '<p>Оченьдлинныйтекстправилакоторыйдолженпереноситьсявнутриузкогополяипрочитыватьсяцеликом.</p><ul><li>Длинный элемент списка тоже должен переноситься</li><li>ЭлементСпискаОченьДлинныйБезПробеловДляПроверкиПереноса</li></ul><table><tbody><tr><td>ТаблицаОченьДлинноеЗначениеБезПробеловДляГоризонтальнойПрокрутки</td><td>ЕщёОдноОченьДлинноеЗначениеБезПробелов</td></tr></tbody></table>', parent_rule_id: ruleId,
  } })
  expect(colorRule.status()).toBe(201)
  const colorRuleId = (await colorRule.json() as { id: number }).id
  const colorChild = await api.post('/admin/rules', { headers, data: {
    title: 'Подправило цвета UI', description: 'Описание подправила цвета UI', parent_rule_id: colorRuleId,
  } })
  expect(colorChild.status()).toBe(201)
  const personRule = await api.post('/admin/rules', { headers, data: {
    title: 'Правило лица UI', description: '<p>Описание правила лица UI</p>', parent_rule_id: ruleId,
  } })
  expect(personRule.status()).toBe(201)
  const personRuleId = (await personRule.json() as { id: number }).id
  const created = await api.post('/admin/exercises', { headers, data: {
    slug: 'browser-grouped-blanks-qa', type_code: 'fill_blanks', schema_version: 1,
    title: 'Групповые пропуски', description: 'Проверка общего поля', instruction: 'Заполните пропуски',
    difficulty: 'beginner', estimated_duration_minutes: 5, display_order: 1, status: 'published', rule_id: ruleId,
    definition: { items: [{ id: 'sentence', parts: [
      { kind: 'text', text: 'To ' },
      { kind: 'blank', id: 'color', hint: null, rule_id: colorRuleId, accepted_answers: ['zielony'] },
      { kind: 'blank', id: 'person', hint: 'подсказка общего поля', rule_id: personRuleId, accepted_answers: ['kolega Mateusz'] },
      { kind: 'text', text: '.' },
    ] }, { id: 'boundaries', parts: [
      { kind: 'blank', id: 'early-hint', hint: 'ранняя подсказка', rule_id: colorRuleId, accepted_answers: ['trzeci'] },
      { kind: 'blank', id: 'after-early', hint: null, rule_id: personRuleId, accepted_answers: ['czwarty'] },
      { kind: 'blank', id: 'after-early-last', hint: null, rule_id: colorRuleId, accepted_answers: ['piąty'] },
      { kind: 'text', text: '; ' },
      { kind: 'blank', id: 'text-first', hint: null, rule_id: colorRuleId, accepted_answers: ['szósty'] },
      { kind: 'text', text: ', ' },
      { kind: 'blank', id: 'text-last', hint: null, rule_id: personRuleId, accepted_answers: ['siódmy'] },
    ] }] },
  } })
  expect(created.status()).toBe(201)
  const learnerUsername = 'browser-group-learner-qa'
  const learnerPassword = 'safe-browser-group-password-8'
  expect((await api.post('/users/register', { data: {
    username: learnerUsername, email: 'browser-group-learner-qa@example.com', password: learnerPassword,
  } })).status()).toBe(200)
  const learnerLogin = await api.post('/users/token', { form: { username: learnerUsername, password: learnerPassword } })
  expect(learnerLogin.status()).toBe(200)
  const learnerHeaders = { Authorization: `Bearer ${(await learnerLogin.json()).access_token}` }
  const serialized = await api.post('/api/exercises/browser-grouped-blanks-qa/sessions', { headers: learnerHeaders })
  expect(serialized.status()).toBe(201)
  const serializedParts = (await serialized.json() as { content: { items: Array<{ id: string; parts: unknown[] }> } }).content.items
  expect(serializedParts[0].parts).toEqual([
    { kind: 'text', text: 'To ' },
    { kind: 'blank_group', blanks: [{ id: 'color', word_count: 1 }, { id: 'person', word_count: 2 }], hint: 'подсказка общего поля' },
    { kind: 'text', text: '.' },
  ])
  expect(serializedParts[1].parts).toEqual([
    { kind: 'blank', id: 'early-hint', hint: 'ранняя подсказка' },
    { kind: 'blank_group', blanks: [{ id: 'after-early', word_count: 1 }, { id: 'after-early-last', word_count: 1 }] },
    { kind: 'text', text: '; ' },
    { kind: 'blank', id: 'text-first', hint: null },
    { kind: 'text', text: ', ' },
    { kind: 'blank', id: 'text-last', hint: null },
  ])

  const context = await browser.newContext()
  const page = await context.newPage()
  await signIn(page, learnerUsername, learnerPassword)
  await page.goto('/exercises')
  await expect(page.getByRole('heading', { name: 'Группа пропусков UI', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Правила польского языка', exact: true })).toBeVisible()
  await page.getByRole('link', { name: 'Групповые пропуски' }).click()
  const groupedInputName = 'Ответ для задания 1, объединённые пропуски 1, 2'
  const grouped = page.getByRole('textbox', { name: groupedInputName })
  await expect(grouped).toHaveCount(1)
  let groupActions = 0
  page.on('request', request => {
    if (request.method() === 'POST' && request.url().includes('/actions')) groupActions += 1
  })
  const firstResponse = page.waitForResponse(response => response.url().includes('/actions') && response.request().method() === 'POST')
  await grouped.fill('zielony kolega')
  await grouped.blur()
  await firstResponse
  await expectAttemptDots(page, 'color', ['green', 'gray', 'gray'])
  await expectAttemptDots(page, 'person', ['red', 'gray', 'gray'])
  await expect(grouped).toBeEnabled()
  await grouped.focus()
  const firstGroupedHint = page.getByRole('dialog')
  await expect(firstGroupedHint).toContainText('Правило цвета UI')
  await expect(firstGroupedHint).toContainText('Подправило цвета UI')
  await expect(firstGroupedHint).not.toContainText('Правило лица UI')
  await grouped.press('Escape')
  await expect(grouped).toBeFocused()
  const colorHistory = page.getByRole('button', { name: 'История ответов для пропуска 1' })
  await colorHistory.focus()
  await expect(page.getByRole('dialog').locator('ol li')).toHaveText(['zielony'])
  await colorHistory.press('Escape')
  await grouped.focus()
  await grouped.blur()
  await expect.poll(() => groupActions).toBe(1)
  await expectAttemptDots(page, 'color', ['green', 'gray', 'gray'])
  await expectAttemptDots(page, 'person', ['red', 'gray', 'gray'])
  const secondResponse = page.waitForResponse(response => response.url().includes('/actions') && response.request().method() === 'POST')
  await grouped.fill('zielony kolega Mateusz')
  await grouped.press('Enter')
  await secondResponse
  await expect.poll(() => groupActions).toBe(2)
  await expectAttemptDots(page, 'color', ['green', 'gray', 'gray'])
  await expectAttemptDots(page, 'person', ['red', 'green', 'gray'])
  await expect(grouped).toBeEnabled()
  await expect(grouped).toHaveAttribute('readonly', '')
  await expect(page.getByText('(подсказка общего поля)', { exact: true })).toBeVisible()
  await expect(grouped).not.toBeEditable()
  await grouped.focus()
  const bothGroupedHint = page.getByRole('dialog')
  await expect(bothGroupedHint).toContainText('Пропуск 1')
  await expect(bothGroupedHint).toContainText('Пропуск 2')
  await expect(bothGroupedHint).toContainText('Правило цвета UI')
  await expect(bothGroupedHint).toContainText('Правило лица UI')
  const bothHintText = await bothGroupedHint.innerText()
  expect(bothHintText.indexOf('Пропуск 1')).toBeLessThan(bothHintText.indexOf('Пропуск 2'))
  const groupedHintSections = bothGroupedHint.locator('section')
  await expect(groupedHintSections).toHaveCount(2)
  for (let index = 0; index < 2; index += 1) {
    const section = groupedHintSections.nth(index)
    await expect(section.getByRole('link', { name: 'Открыть правило' })).toHaveCount(1)
    await expect(section.getByRole('link', { name: 'Открыть правило' })).toHaveAttribute('href', `/rules/${ruleId}`)
  }
  await page.setViewportSize({ width: 320, height: 800 })
  const narrowViewportWidth = await page.evaluate(() => window.innerWidth)
  const dialogMetrics = await bothGroupedHint.evaluate(element => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
  }))
  expect(dialogMetrics.clientWidth).toBeLessThanOrEqual(narrowViewportWidth - 32)
  expect(dialogMetrics.scrollWidth).toBeLessThanOrEqual(dialogMetrics.clientWidth)
  const descriptionMetrics = await bothGroupedHint.locator('.rule-description').first().evaluate(element => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
  }))
  expect(descriptionMetrics.scrollWidth).toBeLessThanOrEqual(descriptionMetrics.clientWidth)
  const ordinaryContentMetrics = await bothGroupedHint.locator('.rule-description').first().locator('p, li').evaluateAll(elements => elements.map(element => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
  })))
  expect(ordinaryContentMetrics.length).toBeGreaterThan(1)
  expect(ordinaryContentMetrics.every(({ scrollWidth, clientWidth }) => scrollWidth <= clientWidth)).toBe(true)
  const popoverTable = bothGroupedHint.locator('.rule-description table').first()
  const tableMetrics = await popoverTable.evaluate(element => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
  }))
  expect(tableMetrics.scrollWidth).toBeGreaterThan(tableMetrics.clientWidth)
  await grouped.press('Escape')
  await expect(grouped).toBeFocused()
  const personHistory = page.getByRole('button', { name: 'История ответов для пропуска 2' })
  await personHistory.focus()
  await expect(page.getByRole('dialog').locator('ol li')).toHaveText(['kolega', 'kolega Mateusz'])
  await personHistory.press('Escape')

  const exhaust = async (answer: string) => {
    const session = await api.post('/api/exercises/browser-grouped-blanks-qa/sessions', { headers: learnerHeaders })
    expect(session.status()).toBe(201)
    const sessionId = (await session.json() as { session_id: string }).session_id
    await page.goto(`/exercises/browser-grouped-blanks-qa?session_id=${sessionId}`)
    const input = page.getByRole('textbox', { name: groupedInputName })
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = page.waitForResponse(result => result.url().includes(`/sessions/${sessionId}/actions`) && result.request().method() === 'POST')
      await input.fill(`${answer}${' '.repeat(attempt)}`)
      await input.blur()
      await response
    }
    return input
  }
  const oneExhausted = await exhaust('wrong kolega Mateusz')
  await expect(oneExhausted).toBeEnabled()
  await expect(oneExhausted).toHaveAttribute('readonly', '')
  await expect(oneExhausted).toHaveValue('zielony kolega Mateusz')
  await expectAttemptDots(page, 'color', ['red', 'red', 'red'])
  await expectAttemptDots(page, 'person', ['green', 'gray', 'gray'])
  const allExhausted = await exhaust('wrong wrong')
  await expect(allExhausted).toBeEnabled()
  await expect(allExhausted).toHaveAttribute('readonly', '')
  await expect(allExhausted).toHaveValue('zielony kolega Mateusz')
  await expectAttemptDots(page, 'color', ['red', 'red', 'red'])
  await expectAttemptDots(page, 'person', ['red', 'red', 'red'])

  await context.close()
  await api.dispose()
})

test('learner rule popover and page preserve rich descriptions and canonicalize deep links', async ({ browser }) => {
  const {
    api,
    exerciseSlug,
    adminUsername,
    adminPassword,
    rootRuleId,
    explicitRuleId,
    explicitRuleTitle,
    explicitGrandchildTitle,
    explicitGrandchildId,
  } = await createFillExercise('rich')
  const adminLogin = await api.post('/users/token', { form: { username: adminUsername, password: adminPassword } })
  expect(adminLogin.status()).toBe(200)
  const adminToken = (await adminLogin.json() as { access_token: string }).access_token
  const adminHeaders = { Authorization: `Bearer ${adminToken}` }
  const tableCells = Array.from({ length: 8 }, (_, index) => `<td>Cell ${index + 1} with a long value</td>`).join('')
  const realisticRuleHtml = '<p>Większość <strong>rzeczowników</strong> rodzaju <strong>męskiego</strong> otrzymuje w narzędniku liczby pojedynczej końcówkę <strong>-em</strong>.</p><p></p><p><em>Przykłady</em>:</p><p><strong>student → studentem</strong><br><strong>nauczyciel → nauczycielem</strong><br><strong>lekarz → lekarzem</strong><br><strong>brat → bratem</strong><br><strong>syn → synem</strong></p>'
  const richDescription = `${realisticRuleHtml}<p>Правило <strong>жирное</strong>, <em>курсив</em> и <u>подчёркнутое</u>.</p><ul><li>Первый пункт</li><li>Второй пункт</li></ul><p><span data-font-size="14">Маленький</span> и <span data-font-size="20">большой</span> текст.</p><table><tbody><tr>${tableCells}</tr></tbody></table>`
  const updatedRule = await api.put(`/admin/rules/${explicitRuleId}`, {
    headers: adminHeaders,
    data: { title: explicitRuleTitle, description: richDescription, parent_rule_id: rootRuleId },
  })
  expect(updatedRule.status()).toBe(200)
  expect((await updatedRule.json() as { description: string }).description).toBe(richDescription)

  const learnerUsername = 'browser-rule-page-student-rich-qa'
  const learnerPassword = 'safe-browser-rule-page-password-8'
  const registration = await api.post('/users/register', {
    data: { username: learnerUsername, email: `${learnerUsername}@example.com`, password: learnerPassword },
  })
  expect(registration.status()).toBe(200)
  const learnerLogin = await api.post('/users/token', { form: { username: learnerUsername, password: learnerPassword } })
  expect(learnerLogin.status()).toBe(200)
  const learnerToken = (await learnerLogin.json() as { access_token: string }).access_token
  const learnerHeaders = { Authorization: `Bearer ${learnerToken}` }
  const learnerMe = await api.get('/users/me', { headers: learnerHeaders })
  expect(learnerMe.status()).toBe(200)
  expect((await learnerMe.json() as { is_superuser: boolean }).is_superuser).toBe(false)
  const context = await browser.newContext()
  const page = await context.newPage()
  await page.goto('/login')
  await page.evaluate((token) => {
    localStorage.setItem('access_token', token)
    localStorage.setItem('token_type', 'bearer')
  }, learnerToken)
  await page.goto(`/exercises/${exerciseSlug}`)
  await expect(page).toHaveURL(new RegExp(`/exercises/${exerciseSlug}\\?session_id=${publicId}$`))
  const cat = page.getByRole('textbox', { name: 'Ответ для задания 1' }).first()
  const check = page.waitForResponse(response => response.url().includes('/actions') && response.request().method() === 'POST')
  await cat.fill('kota')
  await cat.blur()
  await check
  await expect(cat).toHaveAttribute('readonly', '')

  await cat.focus()
  const popover = page.getByRole('dialog', { name: 'Подсказка правила' })
  await expect(popover).toBeVisible()
  await expect(popover.locator('strong').filter({ hasText: 'жирное' })).toHaveText('жирное')
  await expect(popover.locator('em').filter({ hasText: 'курсив' })).toHaveText('курсив')
  await expect(popover.locator('u').filter({ hasText: 'подчёркнутое' })).toHaveText('подчёркнутое')
  const formattedPopover = popover.locator('.rule-description').first()
  await expect(formattedPopover.locator('ul li')).toHaveText(['Первый пункт', 'Второй пункт'])
  await expect(formattedPopover.locator('span[data-font-size="14"]')).toHaveText('Маленький')
  await expect(formattedPopover.locator('span[data-font-size="20"]')).toHaveText('большой')
  await expect(formattedPopover.locator('table td')).toHaveCount(8)
  await expect(formattedPopover.locator('p').first()).toContainText('Większość rzeczowników rodzaju męskiego')
  await expect(formattedPopover.locator('p').nth(2)).toContainText('Przykłady')
  await expect(formattedPopover.locator('p').nth(3)).toContainText('student → studentem')
  const desktopViewportWidth = await page.evaluate(() => window.innerWidth)
  const desktopPopoverMetrics = await popover.evaluate(element => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
  }))
  expect(desktopPopoverMetrics.clientWidth).toBeLessThanOrEqual(512)
  expect(desktopPopoverMetrics.clientWidth).toBeLessThanOrEqual(desktopViewportWidth - 32)
  const ordinaryDesktopMetrics = await formattedPopover.locator('p, li, span').evaluateAll(elements => elements.map(element => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
  })))
  expect(ordinaryDesktopMetrics.length).toBeGreaterThan(1)
  expect(ordinaryDesktopMetrics.every(({ scrollWidth, clientWidth }) => scrollWidth <= clientWidth)).toBe(true)
  const firstParagraphMetrics = await formattedPopover.locator('p').first().evaluate(element => {
    const styles = getComputedStyle(element)
    return { clientHeight: element.clientHeight, lineHeight: parseFloat(styles.lineHeight) }
  })
  expect(firstParagraphMetrics.clientHeight).toBeGreaterThan(firstParagraphMetrics.lineHeight)
  const ruleLink = popover.getByRole('link', { name: 'Открыть правило' })
  await expect(ruleLink).toHaveAttribute('href', `/rules/${rootRuleId}`)
  await ruleLink.focus()
  await expect(popover).toBeVisible()
  await ruleLink.click()
  await expect(page).toHaveURL(new RegExp(`/rules/${rootRuleId}$`))
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Правила польского языка')
  await expect(page.getByRole('heading', { name: explicitRuleTitle, exact: true })).toBeVisible()
  await expect(page.locator('main main')).toHaveCount(0)
  await expect(page.locator('.rule-description strong').filter({ hasText: 'жирное' })).toHaveText('жирное')
  await expect(page.locator('.rule-description em').filter({ hasText: 'курсив' })).toHaveText('курсив')
  await expect(page.locator('.rule-description u').filter({ hasText: 'подчёркнутое' })).toHaveText('подчёркнутое')
  await expect(page.locator('.rule-description ul li')).toHaveText(['Первый пункт', 'Второй пункт'])

  await page.setViewportSize({ width: 320, height: 800 })
  const ruleTable = page.locator('.rule-description table')
  await expect(ruleTable).toBeVisible()
  const tableOverflow = await ruleTable.evaluate(element => element.scrollWidth > element.clientWidth)
  expect(tableOverflow).toBe(true)

  await page.goto(`/rules/${explicitGrandchildId}`)
  await expect(page).toHaveURL(new RegExp(`/rules/${rootRuleId}$`))
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Правила польского языка')
  await expect(page.getByRole('heading', { name: explicitGrandchildTitle, exact: true })).toBeVisible()

  await page.goto('/rules/999999')
  await expect(page.getByRole('heading', { name: 'Правило не найдено' })).toBeVisible()

  const adminContext = await browser.newContext()
  const adminPage = await adminContext.newPage()
  await adminPage.goto('/login')
  await adminPage.evaluate((token) => {
    localStorage.setItem('access_token', token)
    localStorage.setItem('token_type', 'bearer')
  }, adminToken)
  await adminPage.goto(`/rules/${rootRuleId}`)
  await expect(adminPage).toHaveURL(/\/admin\/exercises$/)
  await adminContext.close()

  const visitorContext = await browser.newContext()
  const visitorPage = await visitorContext.newPage()
  await visitorPage.goto(`/rules/${rootRuleId}`)
  await expect(visitorPage).toHaveURL(/\/login$/)
  await visitorContext.close()
  await context.close()
  await api.dispose()
})
