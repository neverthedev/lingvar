'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ApiRequestError, ApiService, ApiValidationIssue, ExerciseRecord, ExerciseType, ExerciseTypeCode } from '@/lib/api'
import { Button, Input, Typography } from '@/components'
import { ExerciseEditor, ExerciseFieldErrors, initialDefinition } from './ExerciseEditor'

type Draft = Omit<ExerciseRecord, 'id'>
const definitionRoots = new Set(['source_code', 'sample_size', 'columns', 'items', 'max_attempts', 'reveal_after_exhaustion'])
const empty = (type: ExerciseTypeCode = 'fill_blanks'): Draft => ({slug:'',type_code:type,schema_version:1,title:'',description:'',instruction:'',difficulty:'beginner',estimated_duration_minutes:null,display_order:0,status:'draft',definition:initialDefinition(type)})

function pathForIssue(issue: ApiValidationIssue): string {
  const loc = (issue.loc ?? []).filter(part => part !== 'body').map(String)
  if (loc.length === 0) return 'definition'
  if (loc[0] !== 'definition' && definitionRoots.has(loc[0])) loc.unshift('definition')
  return loc.join('.')
}

function errorsFor(issues: ApiValidationIssue[]): ExerciseFieldErrors {
  return issues.reduce<ExerciseFieldErrors>((result, issue) => {
    const path = pathForIssue(issue)
    result[path] = [...(result[path] ?? []), issue.msg]
    return result
  }, {})
}

function FieldErrors({ errors }: { errors: string[] }) {
  if (errors.length === 0) return null
  return <ul className="mt-1 list-disc pl-5 text-sm text-red-700">{errors.map((message, index) => <li key={index}>{message}</li>)}</ul>
}

export function ExerciseForm({ exerciseId }: {exerciseId?: number}) {
  const router = useRouter()
  const [draft,setDraft] = useState<Draft>(empty())
  const [types,setTypes] = useState<ExerciseType[]>([])
  const [error,setError] = useState('')
  const [fieldErrors,setFieldErrors] = useState<ExerciseFieldErrors>({})
  const [saving,setSaving] = useState(false)

  useEffect(() => {
    void ApiService.getAdminExerciseTypes().then(setTypes).catch(reason => setError(reason.message))
    if (exerciseId) void ApiService.getAdminExercise(exerciseId).then(record => setDraft(record)).catch(reason => setError(reason.message))
  }, [exerciseId])

  const save = async () => {
    setSaving(true)
    setError('')
    setFieldErrors({})
    try {
      const saved = exerciseId
        ? await ApiService.updateAdminExercise(exerciseId, {title:draft.title,description:draft.description,instruction:draft.instruction,difficulty:draft.difficulty,estimated_duration_minutes:draft.estimated_duration_minutes,display_order:draft.display_order,status:draft.status,definition:draft.definition})
        : await ApiService.createAdminExercise(draft)
      setDraft(saved)
      router.replace(`/admin/exercises/${saved.id}`)
    } catch (reason) {
      if (reason instanceof ApiRequestError && reason.issues.length > 0) {
        setError('Исправьте отмеченные поля и повторите сохранение.')
        setFieldErrors(errorsFor(reason.issues))
      } else {
        setError(reason instanceof Error ? reason.message : 'Не удалось сохранить упражнение')
      }
    } finally {
      setSaving(false)
    }
  }

  const errors = (path: string) => fieldErrors[path] ?? []
  return <div className="mx-auto max-w-4xl space-y-4 p-8">
    <Typography variant="h1">{exerciseId ? 'Редактирование упражнения' : 'Новое упражнение'}</Typography>
    {error && <p className="text-red-700">{error}</p>}
    <label className="block">Slug<Input disabled={Boolean(exerciseId)} value={draft.slug} onChange={event => setDraft({...draft,slug:event.target.value})}/><FieldErrors errors={errors('slug')} /></label>
    <label className="block">Тип<select disabled={Boolean(exerciseId)} className="ml-2 rounded border p-2" value={draft.type_code} onChange={event => { const type=event.target.value as ExerciseTypeCode; setDraft({...draft,type_code:type,schema_version:1,definition:initialDefinition(type)}) }}>{types.map(type => <option key={type.code} value={type.code}>{type.label}</option>)}</select><FieldErrors errors={[...errors('type_code'), ...errors('schema_version')]} /></label>
    <label className="block">Название<Input value={draft.title} onChange={event => setDraft({...draft,title:event.target.value})}/><FieldErrors errors={errors('title')} /></label>
    <label className="block">Описание<Input value={draft.description} onChange={event => setDraft({...draft,description:event.target.value})}/><FieldErrors errors={errors('description')} /></label>
    <label className="block">Инструкция<Input value={draft.instruction} onChange={event => setDraft({...draft,instruction:event.target.value})}/><FieldErrors errors={errors('instruction')} /></label>
    <div className="grid grid-cols-3 gap-3">
      <label>Сложность<select className="block rounded border p-2" value={draft.difficulty} onChange={event => setDraft({...draft,difficulty:event.target.value as Draft['difficulty']})}><option value="beginner">Начальный</option><option value="intermediate">Средний</option><option value="advanced">Продвинутый</option></select><FieldErrors errors={errors('difficulty')} /></label>
      <label>Минуты<Input type="number" value={draft.estimated_duration_minutes ?? ''} onChange={event => setDraft({...draft,estimated_duration_minutes:event.target.value ? Number(event.target.value) : null})}/><FieldErrors errors={errors('estimated_duration_minutes')} /></label>
      <label>Порядок<Input type="number" value={draft.display_order} onChange={event => setDraft({...draft,display_order:Number(event.target.value)})}/><FieldErrors errors={errors('display_order')} /></label>
    </div>
    <label>Статус<select className="ml-2 rounded border p-2" value={draft.status} onChange={event => setDraft({...draft,status:event.target.value as Draft['status']})}><option value="draft">Черновик</option><option value="published">Опубликовано</option></select><FieldErrors errors={errors('status')} /></label>
    <section className="rounded border p-4"><Typography variant="h3" className="mb-3">Содержимое</Typography><FieldErrors errors={errors('definition')} /><ExerciseEditor type={draft.type_code} definition={draft.definition} onChange={definition => setDraft({...draft,definition})} errors={fieldErrors}/></section>
    <Button onClick={save} disabled={saving}>{saving ? 'Сохранение…' : 'Сохранить'}</Button>
  </div>
}
