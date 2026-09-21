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
  await expect(container).toHaveAttribute('aria-hidden', 'true')
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
  await expect(cat).toBeDisabled()
  await expect(cat).toHaveCSS('background-color', 'rgb(240, 253, 244)')
  await expect(cat).toHaveCSS('border-color', 'rgb(74, 222, 128)')
  await expectAttemptDots(page, 'cat', ['red', 'red', 'green'])
  await expect(page.locator('#status-cat')).toHaveText('Верно · 3 из 3')
  await expect(page.getByText('✓ Верно', { exact: true })).toHaveCount(0)
  await expect(page.getByText('OK', { exact: true })).toHaveCount(0)
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1')

  const dogResponse = page.waitForResponse(response => response.url().includes(`/sessions/${originalId}/actions`) && response.request().method() === 'POST')
  await dog.fill('PSA')
  await dog.blur()
  await dogResponse
  await expect(dog).toBeDisabled()
  await expect(dog).toHaveCSS('background-color', 'rgb(240, 253, 244)')
  await expect(dog).toHaveCSS('border-color', 'rgb(74, 222, 128)')
  await expectAttemptDots(page, 'dog', ['green', 'gray', 'gray'])
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '2')

  await page.route('**/api/exercises/browser-session-fill-qa/sessions/*/actions', route => route.abort('failed'))
  await bird.fill('network-error')
  await bird.blur()
  await expect(page.locator('#status-bird')).toHaveText('Не удалось проверить ответ. Повторите выход из поля или Enter.')
  await expect(bird).toBeEnabled()
  await expectAttemptDots(page, 'bird', ['gray', 'gray', 'gray'])
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '2')
  await page.unroute('**/api/exercises/browser-session-fill-qa/sessions/*/actions')

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = page.waitForResponse(result => result.url().includes(`/sessions/${originalId}/actions`) && result.request().method() === 'POST')
    await bird.fill(`wrong-${attempt}`)
    await bird.blur()
    await response
  }
  await expect(bird).toBeDisabled()
  await expect(bird).toHaveValue('ptaka')
  await expect(bird).toHaveCSS('background-color', 'rgb(254, 242, 242)')
  await expect(bird).toHaveCSS('border-color', 'rgb(248, 113, 113)')
  await expectAttemptDots(page, 'bird', ['red', 'red', 'red'])
  await expect(page.locator('#status-bird')).toHaveText('Попытки закончились. Ответ: ptaka')
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '3')
  await page.reload()
  await expect(page).toHaveURL(originalUrl)
  await expect(inputs.first()).toHaveValue('KOTA')
  await expect(inputs.first()).toBeDisabled()
  await expect(page.getByRole('textbox', { name: 'Ответ для задания 1' }).nth(2)).toHaveValue('ptaka')
  await expectAttemptDots(page, 'cat', ['red', 'red', 'green'])
  await expectAttemptDots(page, 'bird', ['red', 'red', 'red'])
  await expect(page.locator('#status-cat')).toHaveText('Верно · 3 из 3')
  await expect(page.locator('#status-bird')).toHaveText('Попытки закончились. Ответ: ptaka')

  const restartResponse = page.waitForResponse(response => response.url().includes(`/sessions/${originalId}/restart`) && response.request().method() === 'POST')
  await page.getByRole('button', { name: 'Начать заново' }).click()
  const restartSnapshot = await restartResponse
  const restartBody = await restartSnapshot.json() as { session_id: string }
  await expect.poll(() => new URL(page.url()).searchParams.get('session_id')).toBe(restartBody.session_id)
  const resetId = restartBody.session_id
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0')
  await expect(page.getByText('0 / 3', { exact: true })).toBeVisible()
  await expectAttemptDots(page, 'cat', ['gray', 'gray', 'gray'])

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
