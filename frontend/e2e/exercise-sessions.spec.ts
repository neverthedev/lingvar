import { expect, request, test, type Page, type Request } from '@playwright/test'
import { spawn } from 'node:child_process'

const backendUrl = 'http://localhost:8000'
const publicId = '[A-Za-z0-9_-]{22}'

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

async function createFillExercise() {
  const adminUsername = 'browser-session-admin-qa'
  const adminPassword = 'safe-browser-session-password-8'
  await createAdmin(adminUsername, 'browser-session-admin-qa@example.com', adminPassword)
  const api = await request.newContext({ baseURL: backendUrl })
  const login = await api.post('/users/token', { form: { username: adminUsername, password: adminPassword } })
  expect(login.status()).toBe(200)
  const headers = { Authorization: `Bearer ${(await login.json()).access_token}` }
  const created = await api.post('/admin/exercises', {
    headers,
    data: {
      slug: 'browser-session-fill-qa', type_code: 'fill_blanks', schema_version: 1,
      title: 'Browser session fill blanks', description: 'Session browser coverage', instruction: 'Заполните пропуски',
      difficulty: 'beginner', estimated_duration_minutes: 5, display_order: 90, status: 'published',
      definition: { items: [{ id: 'sentence-1', parts: [
        { kind: 'text', text: 'Mam ' },
        { kind: 'blank', id: 'cat', hint: 'kot', accepted_answers: ['kota'] },
        { kind: 'text', text: ' oraz ' },
        { kind: 'blank', id: 'dog', hint: 'pies', accepted_answers: ['psa'] },
        { kind: 'text', text: '.' },
      ] }] },
    },
  })
  expect(created.status()).toBe(201)
  const other = await api.post('/admin/exercises', {
    headers,
    data: {
      slug: 'browser-session-fill-other-qa', type_code: 'fill_blanks', schema_version: 1,
      title: 'Other browser session exercise', description: 'Used to reject a session from another exercise', instruction: 'Заполните пропуск',
      difficulty: 'beginner', estimated_duration_minutes: 5, display_order: 91, status: 'published',
      definition: { items: [{ id: 'other-sentence', parts: [{ kind: 'text', text: 'Mam ' }, { kind: 'blank', id: 'other', hint: 'kot', accepted_answers: ['kota'] }] }] },
    },
  })
  expect(other.status()).toBe(201)
  return { api }
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
  await expect(page.getByRole('button', { name: 'Проверить' })).toHaveCount(0)
  await expect(cat).not.toHaveAttribute('placeholder', 'kot')
  await expect(cat.locator('xpath=following-sibling::*[1]')).toHaveText('(kot)')
  await expect(page.locator('body')).toContainText('(pies)')

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
  await expect(page.getByText('Неверно. Осталось попыток: 2', { exact: true })).toBeVisible()
  await expect(cat).toHaveValue('wrong')

  const correctResponse = page.waitForResponse(response => response.url().includes(`/sessions/${originalId}/actions`) && response.request().method() === 'POST')
  await cat.fill('KOTA')
  await cat.press('Enter')
  await correctResponse
  await expect.poll(() => actionRequests).toBe(2)
  await expect(cat).toBeDisabled()
  await expect(page.getByText('✓ Верно', { exact: true })).toBeVisible()
  await page.reload()
  await expect(page).toHaveURL(originalUrl)
  await expect(inputs.first()).toHaveValue('KOTA')
  await expect(inputs.first()).toBeDisabled()

  await page.route('**/api/exercises/browser-session-fill-qa/sessions/*/actions', route => route.abort('failed'))
  await dog.fill('draft-only')
  await dog.blur()
  await expect(page.getByText(/Потеряйте фокус или нажмите Enter, чтобы повторить/)).toBeVisible()
  await page.unroute('**/api/exercises/browser-session-fill-qa/sessions/*/actions')
  await page.reload()
  await expect(page.getByRole('textbox', { name: 'Ответ для задания 1' }).nth(1)).toHaveValue('')

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = page.waitForResponse(result => result.url().includes(`/sessions/${originalId}/actions`) && result.request().method() === 'POST')
    await dog.fill(`wrong-${attempt}`)
    await dog.blur()
    await response
  }
  await expect(page.getByText('Ответ: psa', { exact: true })).toBeVisible()
  await expect(dog).toBeDisabled()

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

  const resetId = new URL(page.url()).searchParams.get('session_id')!
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
  pendingReleases[0]()
  await expect(replacementInputs.first()).toBeEnabled()
  await expect(replacementInputs.nth(1)).toBeDisabled()
  pendingReleases[1]()
  await expect(replacementInputs.nth(1)).toBeEnabled()
  await page.unroute('**/api/exercises/browser-session-fill-qa/sessions/*/actions')

  const restartResponse = page.waitForResponse(response => response.url().includes(`/sessions/${resetId}/restart`) && response.request().method() === 'POST')
  await page.getByRole('button', { name: 'Начать заново' }).click()
  const restartSnapshot = await restartResponse
  const restartBody = await restartSnapshot.json() as { session_id: string }
  await expect.poll(() => new URL(page.url()).searchParams.get('session_id')).toBe(restartBody.session_id)
  const restartedId = new URL(page.url()).searchParams.get('session_id')!
  expect(restartedId).not.toBe(resetId)
  await expect(page.getByRole('textbox', { name: 'Ответ для задания 1' }).first()).toHaveValue('')
  const oldSession = await api.get(`/api/exercises/browser-session-fill-qa/sessions/${resetId}`, { headers: learnerHeaders })
  expect(oldSession.status()).toBe(404)

  await context.close()
  await api.dispose()
})
