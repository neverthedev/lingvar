'use client'

import { useRef, useState } from 'react'
import { Button, Input } from '@/components'
import { AnswerState, ExerciseSessionAction, ExerciseSessionSnapshot } from '@/lib/api'

type RendererProps = { exercise: ExerciseSessionSnapshot; onAction: (action: ExerciseSessionAction) => Promise<void> }
type TypeRendererProps<T extends ExerciseSessionSnapshot['type_code']> = {
  exercise: Extract<ExerciseSessionSnapshot, { type_code: T }>
  onAction: RendererProps['onAction']
}

const answerClass = (state: AnswerState) => state.status === 'correct'
  ? 'border-green-400 bg-green-50 text-green-900'
  : state.status === 'exhausted' ? 'border-red-400 bg-red-50 text-red-900' : ''

function FormTable({ exercise, onAction }: TypeRendererProps<'form_table'>) {
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [editing, setEditing] = useState<string | null>(null)
  const [pending, setPending] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const progress = exercise.progress as Extract<typeof exercise.progress, { cells: Record<string, AnswerState> }>
  const submit = async (rowId: number, column: string) => {
    const key = `${rowId}:${column}`, state = progress.cells[key], answer = drafts[key] ?? state.value ?? ''
    if (!answer.trim() || state.status !== 'open') return
    setPending(key); setError(null)
    try { await onAction({ action: 'form_table_check', row_id: rowId, column_key: column, answer, expected_attempts_used: state.attempts_used }); setEditing(null) }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Не удалось проверить ответ') }
    finally { setPending(null) }
  }
  const changeWeight = async (rowId: number, direction: 'up' | 'down') => {
    const key = `weight-${rowId}`
    setPending(key); setError(null)
    try { await onAction({ action: 'form_table_weight', row_id: rowId, direction }) }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Не удалось изменить приоритет') }
    finally { setPending(null) }
  }
  return <div className="space-y-3 overflow-x-auto">
    {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
    <table className="w-full border-collapse text-sm"><thead><tr className="bg-gray-50"><th className="border p-3 text-left">Слово</th>{exercise.content.columns.map(column => <th className="border p-3 text-left" key={column.key}>{column.label}</th>)}</tr></thead><tbody>{exercise.content.rows.map(row => <tr key={row.id}><td className="border p-3 font-medium"><div className="flex items-center gap-2"><span>{row.prompt}</span><span className="inline-flex items-center gap-1"><button type="button" disabled={pending === `weight-${row.id}`} aria-label={`Повысить приоритет ${row.prompt}`} onClick={() => void changeWeight(row.id, 'up')}>▲</button><span>{progress.rows[String(row.id)]?.weight ?? row.weight ?? 0}</span><button type="button" disabled={pending === `weight-${row.id}`} aria-label={`Понизить приоритет ${row.prompt}`} onClick={() => void changeWeight(row.id, 'down')}>▼</button></span></div></td>{exercise.content.columns.map(column => { const key = `${row.id}:${column.key}`, state = progress.cells[key], closed = state.status !== 'open'; return <td className={`border p-2 ${answerClass(state)}`} key={key}>{closed ? <span>{state.status === 'exhausted' && state.revealed_answer ? state.revealed_answer : state.value}</span> : editing === key ? <div className="flex min-w-44 gap-1"><Input value={drafts[key] ?? state.value ?? ''} onChange={event => setDrafts(current => ({ ...current, [key]: event.target.value }))} onKeyDown={event => { if (event.key === 'Enter') void submit(row.id, column.key); if (event.key === 'Escape') setEditing(null) }} autoFocus /><Button size="sm" disabled={pending === key} onClick={() => void submit(row.id, column.key)}>OK</Button></div> : <button type="button" className="w-full text-left text-gray-500" onClick={() => setEditing(key)}>Заполнить</button>}</td>})}</tr>)}</tbody></table>
  </div>
}

function SingleInput({ exercise, onAction }: TypeRendererProps<'single_input'>) {
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [pending, setPending] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const progress = exercise.progress as Extract<typeof exercise.progress, { items: Record<string, AnswerState> }>
  const submit = async (itemId: number) => { const state = progress.items[String(itemId)], answer = drafts[String(itemId)] ?? state.value ?? ''; if (!answer.trim() || state.status !== 'open') return; setPending(String(itemId)); setError(null); try { await onAction({ action: 'single_input_check', item_id: itemId, answer, expected_attempts_used: state.attempts_used }) } catch (reason) { setError(reason instanceof Error ? reason.message : 'Не удалось проверить ответ') } finally { setPending(null) } }
  return <div className="space-y-4">{error && <p className="text-sm text-red-700" role="alert">{error}</p>}{exercise.content.items.map(item => { const state = progress.items[String(item.id)], closed = state.status !== 'open'; return <div key={item.id} className={`rounded border p-4 ${answerClass(state)}`}><p className="mb-2 font-medium">{item.prompt}</p>{closed ? <p>{state.status === 'exhausted' ? state.revealed_answer : state.value}</p> : <div className="flex flex-wrap items-center gap-2"><Input value={drafts[String(item.id)] ?? state.value ?? ''} onChange={event => setDrafts(current => ({ ...current, [String(item.id)]: event.target.value }))} onKeyDown={event => { if (event.key === 'Enter') void submit(item.id) }} /><Button size="sm" disabled={pending === String(item.id)} onClick={() => void submit(item.id)}>Проверить</Button><span className="text-sm text-gray-600">{state.attempts_used}/3</span></div>}</div>})}</div>
}

function SelfCheck({ exercise, onAction }: TypeRendererProps<'self_check'>) {
  const [pending, setPending] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const progress = exercise.progress as Extract<typeof exercise.progress, { items: Record<string, { revealed: boolean; result: 'correct' | 'incorrect' | null; answer?: string }> }>
  const act = async (key: string, action: ExerciseSessionAction) => { setPending(key); setError(null); try { await onAction(action) } catch (reason) { setError(reason instanceof Error ? reason.message : 'Не удалось сохранить результат') } finally { setPending(null) } }
  const values = Object.values(progress.items), correct = values.filter(item => item.result === 'correct').length, incorrect = values.filter(item => item.result === 'incorrect').length
  return <div className="space-y-4">{error && <p className="text-sm text-red-700" role="alert">{error}</p>}<div className="rounded bg-gray-100 p-3 text-sm">Верно: {correct} · Неверно: {incorrect} · Осталось: {values.length - correct - incorrect}</div>{exercise.content.items.map(item => { const state = progress.items[String(item.id)]; return <div key={item.id} className={`rounded border p-4 ${state.result === 'correct' ? 'border-green-300 bg-green-50' : state.result === 'incorrect' ? 'border-red-300 bg-red-50' : ''}`}><p className="font-medium">{item.prompt}</p>{!state.revealed ? <Button size="sm" className="mt-2" disabled={pending === `reveal-${item.id}`} onClick={() => void act(`reveal-${item.id}`, { action: 'self_check_reveal', item_id: item.id })}>Показать ответ</Button> : <><p className="mt-2">{state.answer}</p>{state.result === null ? <div className="mt-2 flex gap-2"><Button size="sm" disabled={pending === `mark-${item.id}`} onClick={() => void act(`mark-${item.id}`, { action: 'self_check_mark', item_id: item.id, result: 'correct' })}>Верно</Button><Button size="sm" variant="secondary" disabled={pending === `mark-${item.id}`} onClick={() => void act(`mark-${item.id}`, { action: 'self_check_mark', item_id: item.id, result: 'incorrect' })}>Неверно</Button></div> : <p className={state.result === 'correct' ? 'mt-2 text-green-700' : 'mt-2 text-red-700'}>{state.result === 'correct' ? 'Отмечено: верно' : 'Отмечено: неверно'}</p>}</>}</div>})}</div>
}

type AttemptDotState = 'gray' | 'red' | 'green'

function attemptDotStates(state: AnswerState): AttemptDotState[] {
  return Array.from({ length: 3 }, (_, index) => {
    if (state.status === 'correct' && index === state.attempts_used - 1) return 'green'
    if (index < state.attempts_used) return 'red'
    return 'gray'
  })
}

function AttemptDots({ blankId, state }: { blankId: string; state: AnswerState }) {
  const colors: Record<AttemptDotState, string> = {
    gray: 'bg-gray-300',
    red: 'bg-red-500',
    green: 'bg-green-500',
  }

  return <span data-blank-id={blankId} className="flex shrink-0 flex-col gap-1" aria-hidden="true">
    {attemptDotStates(state).map((dotState, index) => (
      <span key={index} data-attempt-state={dotState} className={`h-2 w-2 rounded-full ${colors[dotState]}`} />
    ))}
  </span>
}

function FillBlanks({ exercise, onAction }: TypeRendererProps<'fill_blanks'>) {
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [pending, setPending] = useState<Set<string>>(() => new Set())
  const pendingRef = useRef<Set<string>>(new Set())
  const [errors, setErrors] = useState<Record<string, string>>({})
  const progress = exercise.progress as Extract<typeof exercise.progress, { blanks: Record<string, AnswerState> }>
  const submit = async (blankId: string) => {
    const state = progress.blanks[blankId], answer = drafts[blankId] ?? state.value ?? ''
    if (!answer.trim() || state.status !== 'open' || pendingRef.current.has(blankId) || answer === (state.value ?? '')) return
    pendingRef.current.add(blankId)
    setPending(current => new Set(current).add(blankId)); setErrors(current => { const next = { ...current }; delete next[blankId]; return next })
    try { await onAction({ action: 'fill_blank_check', blank_id: blankId, answer, expected_attempts_used: state.attempts_used }) }
    catch (reason) { setErrors(current => ({ ...current, [blankId]: reason instanceof Error ? reason.message : 'Проверка не выполнена.' })) }
    finally { pendingRef.current.delete(blankId); setPending(current => { const next = new Set(current); next.delete(blankId); return next }) }
  }
  const statusText = (state: AnswerState, blankId: string) => {
    if (pending.has(blankId)) return 'Проверяем…'
    if (errors[blankId]) return 'Не удалось проверить ответ. Повторите выход из поля или Enter.'
    if (state.status === 'correct') return `Верно · ${state.attempts_used} из 3`
    if (state.status === 'exhausted') return `Попытки закончились. Ответ: ${state.revealed_answers?.join(', ')}`
    if (state.last_check === 'incorrect') return `Пока не совпало. Осталось попыток: ${3 - state.attempts_used} из 3`
    return ''
  }
  return <div className="space-y-6 max-sm:space-y-5">
    {exercise.content.items.map((item, itemIndex) => (
      <div key={item.id} className="text-[18px] leading-[1.6] text-slate-700 sm:text-[20px] sm:leading-[1.65]">
        {item.parts.map((part, index) => {
          if (part.kind === 'text') return <span key={index}>{part.text}</span>

          const state = progress.blanks[part.id]
          const closed = state.status !== 'open'
          const inputValue = drafts[part.id] ?? state.value ?? ''
          const displayedValue = state.status === 'exhausted'
            ? (state.revealed_answers?.[0] ?? state.value ?? '')
            : (closed ? (state.value ?? '') : inputValue)
          const hintId = `hint-${part.id}`
          const statusId = `status-${part.id}`
          const describedBy = [part.hint ? hintId : null, statusId].filter(Boolean).join(' ')
          const stateClass = state.status === 'correct'
            ? 'border-green-400 bg-green-50 text-green-900 disabled:border-green-400 disabled:bg-green-50 disabled:text-green-900'
            : state.status === 'exhausted'
              ? 'border-red-400 bg-red-50 text-red-900 disabled:border-red-400 disabled:bg-red-50 disabled:text-red-900'
              : 'border-gray-300 bg-white disabled:bg-gray-100'

          return <span className="inline-flex max-w-full items-center gap-2 whitespace-nowrap align-middle" key={part.id}>
            <input
              aria-label={`Ответ для задания ${itemIndex + 1}`}
              aria-describedby={describedBy}
              className={`h-11 w-[clamp(9rem,18vw,17.5rem)] max-w-full rounded-lg border px-3 text-base leading-normal shadow-sm outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed ${stateClass}`}
              value={displayedValue}
              disabled={closed || pending.has(part.id)}
              onChange={event => setDrafts(current => ({ ...current, [part.id]: event.target.value }))}
              onBlur={() => void submit(part.id)}
              onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); event.currentTarget.blur() } }}
              placeholder="Твой ответ..."
            />
            <AttemptDots blankId={part.id} state={state} />
            {part.hint && <span id={hintId} className="text-base italic leading-6 text-slate-500">({part.hint})</span>}
            <span id={statusId} className="sr-only" aria-live="polite">{statusText(state, part.id)}</span>
          </span>
        })}
      </div>
    ))}
  </div>
}

const renderers = { form_table: FormTable, single_input: SingleInput, self_check: SelfCheck, fill_blanks: FillBlanks } as const

export function ExerciseRenderer({ exercise, onAction }: RendererProps) {
  const Renderer = renderers[exercise.type_code] as (props: RendererProps) => JSX.Element
  return <Renderer key={exercise.session_id} exercise={exercise} onAction={onAction} />
}
