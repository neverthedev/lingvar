'use client'

import { useEffect, useRef, useState } from 'react'
import { Button, Input, InteractiveLessonTable, Typography } from '@/components'
import { API_ENDPOINTS, AuthService, ExerciseContent } from '@/lib/api'

type BlankState = { id: string; value: string | null; attempts_used: number; status: 'open' | 'correct' | 'exhausted'; last_check: 'correct' | 'incorrect' | null; revealed_answers?: string[] }

function FormTable({ exercise }: { exercise: Extract<ExerciseContent, {type_code: 'form_table'}> }) {
  const rows = exercise.content.rows.map(row => ({ id: row.id, word: row.prompt, ...row.answers, weight: row.weight }))
  return <InteractiveLessonTable data={rows} cases={exercise.content.columns.map(column => ({ key: column.key, name: column.label }))} wordType={exercise.content.statistics_word_type} title={exercise.title} description={exercise.instruction} />
}

function SingleInput({ exercise }: { exercise: Extract<ExerciseContent, {type_code: 'single_input'}> }) {
  const [items, setItems] = useState(exercise.content.items.map(item => ({ ...item, input: '', attempts: 0, status: 'open' as 'open'|'correct'|'exhausted' })))
  const check = (id: number) => setItems(previous => previous.map(item => {
    if (item.id !== id || item.status !== 'open') return item
    const attempts = item.attempts + 1
    if (item.input.trim().toLowerCase() === item.answer.toLowerCase()) return { ...item, attempts, status: 'correct' }
    return { ...item, attempts, input: attempts >= 3 ? item.input : '', status: attempts >= 3 ? 'exhausted' : 'open' }
  }))
  return <div className="space-y-4">{items.map(item => <div key={item.id} className="rounded border p-4"><p className="mb-2 font-medium">{item.prompt}</p>{item.status === 'open' ? <div className="flex gap-2"><Input value={item.input} onChange={event => setItems(current => current.map(value => value.id === item.id ? {...value, input: event.target.value} : value))} onKeyDown={event => { if (event.key === 'Enter' && item.input.trim()) check(item.id) }} /><Button size="sm" onClick={() => check(item.id)} disabled={!item.input.trim()}>Проверить</Button><span>{item.attempts}/3</span></div> : <p className={item.status === 'correct' ? 'text-green-700' : 'text-red-700'}>{item.status === 'exhausted' && <span className="mr-2 line-through">{item.input}</span>}{item.answer}</p>}</div>)}</div>
}

function SelfCheck({ exercise }: { exercise: Extract<ExerciseContent, {type_code: 'self_check'}> }) {
  const [items, setItems] = useState(exercise.content.items.map(item => ({...item, shown: false, result: null as null|'correct'|'incorrect'})))
  const correct = items.filter(item => item.result === 'correct').length
  const incorrect = items.filter(item => item.result === 'incorrect').length
  return <div className="space-y-4"><div className="rounded bg-gray-100 p-3 text-sm">Верно: {correct} · Неверно: {incorrect} · Осталось: {items.length - correct - incorrect}</div>{items.map(item => <div key={item.id} className={`rounded border p-4 ${item.result === 'correct' ? 'border-green-300 bg-green-50' : item.result === 'incorrect' ? 'border-red-300 bg-red-50' : ''}`}><p className="font-medium">{item.prompt}</p>{!item.shown ? <Button size="sm" className="mt-2" onClick={() => setItems(all => all.map(value => value.id === item.id ? {...value, shown: true} : value))}>Показать ответ</Button> : <><p className="mt-2">{item.answer}</p>{item.result === null ? <div className="mt-2 flex gap-2"><Button size="sm" onClick={() => setItems(all => all.map(value => value.id === item.id ? {...value, result:'correct'} : value))}>Верно</Button><Button size="sm" variant="secondary" onClick={() => setItems(all => all.map(value => value.id === item.id ? {...value, result:'incorrect'} : value))}>Неверно</Button></div> : <p className={item.result === 'correct' ? 'mt-2 text-green-700' : 'mt-2 text-red-700'}>{item.result === 'correct' ? 'Отмечено: верно' : 'Отмечено: неверно'}</p>}</>}</div>)}</div>
}

function FillBlanks({ exercise }: { exercise: Extract<ExerciseContent, {type_code: 'fill_blanks'}> }) {
  const started = useRef(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [states, setStates] = useState<Record<string, BlankState>>({})
  const [values, setValues] = useState<Record<string, string>>({})
  const [pending, setPending] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => { if (started.current) return; started.current = true; void (async () => { try { const response = await fetch(`${API_ENDPOINTS.exercises}${exercise.slug}/sessions`, {method:'POST',headers:AuthService.getAuthHeaders()}); if (!response.ok) throw new Error('Не удалось начать упражнение'); const data = await response.json(); setSessionId(data.session_id); setStates(Object.fromEntries(data.blanks.map((state: BlankState) => [state.id, state]))); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Не удалось начать упражнение') } })() }, [exercise.slug])
  const check = async (id: string) => { if (!sessionId) return; setPending(id); setError(null); try { const response = await fetch(`${API_ENDPOINTS.exerciseSessions}/${sessionId}/blanks/${id}/check`, {method:'POST',headers:AuthService.getAuthHeaders(),body:JSON.stringify({answer: values[id] ?? ''})}); if (response.status === 410) throw new Error('Сессия истекла. Обновите страницу, чтобы начать заново.'); const data = await response.json(); if (!response.ok) throw new Error(typeof data.detail === 'string' ? data.detail : 'Не удалось проверить ответ'); setStates(Object.fromEntries(data.blanks.map((state: BlankState) => [state.id, state]))); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Не удалось проверить ответ') } finally { setPending(null) } }
  return <div className="space-y-6">{error && <p className="text-red-700">{error}</p>}{exercise.content.items.map(item => <div key={item.id} className="leading-10">{item.parts.map((part, index) => part.kind === 'text' ? <span key={index}>{part.text}</span> : (() => { const state = states[part.id]; const closed = state && state.status !== 'open'; const inputValue = closed ? (state?.value ?? '') : (values[part.id] ?? state?.value ?? ''); return <span key={part.id} className="inline-flex items-center gap-1"><Input className="inline-block w-40" value={inputValue} disabled={closed || pending === part.id} onChange={event => setValues(previous => ({...previous,[part.id]:event.target.value}))} placeholder={part.hint || 'Ответ'} /><Button size="sm" onClick={() => check(part.id)} disabled={closed || pending === part.id || !inputValue.trim()}>Проверить</Button>{state && <small className={state.last_check === 'incorrect' ? 'text-red-700' : 'text-green-700'}>{state.attempts_used}/3 {state.status === 'correct' && '✓'} {state.revealed_answers && `Ответ: ${state.revealed_answers.join(', ')}`}</small>}</span> })())}</div>)}</div>
}

const renderers = {
  form_table: FormTable,
  single_input: SingleInput,
  self_check: SelfCheck,
  fill_blanks: FillBlanks,
} as const

export function ExerciseRenderer({ exercise }: { exercise: ExerciseContent }) {
  const Renderer = renderers[exercise.type_code] as (props: {exercise: any}) => JSX.Element
  // Navigation between two slugs can preserve this route component in Next.js.
  // A slug is a new learner run, even when its renderer type is unchanged.
  return <Renderer key={exercise.slug} exercise={exercise} />
}
