'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ApiRequestError, ApiService, ApiValidationIssue, ExerciseRecord, ExerciseType, ExerciseTypeCode, FillBlanksDefinition, RuleNode } from '@/lib/api'
import { Button, Input, Typography } from '@/components'
import { ExerciseEditor, ExerciseFieldErrors, initialDefinition } from './ExerciseEditor'

type Draft = Omit<ExerciseRecord, 'id' | 'rule_id'> & { rule_id: number | null }
const definitionRoots = new Set(['source_code', 'sample_size', 'columns', 'items', 'max_attempts', 'reveal_after_exhaustion'])
const empty = (type: ExerciseTypeCode = 'fill_blanks'): Draft => ({slug:'',type_code:type,schema_version:1,title:'',description:'',instruction:'',difficulty:'beginner',estimated_duration_minutes:null,display_order:0,status:'draft',rule_id:null,definition:initialDefinition(type)})

function flattenRules(rules: RuleNode[], ancestors: string[] = []): Array<{ id: number; path: string }> {
  return rules.flatMap(rule => {
    const path = [...ancestors, rule.title]
    return [{ id: rule.id, path: path.join(' → ') }, ...flattenRules(rule.children, path)]
  })
}

function findRule(rules: RuleNode[], ruleId: number): RuleNode | undefined {
  for (const rule of rules) {
    if (rule.id === ruleId) return rule
    const descendant = findRule(rule.children, ruleId)
    if (descendant) return descendant
  }
  return undefined
}

function subtreeRuleIds(rule: RuleNode): Set<number> {
  const ids = new Set<number>()
  const visit = (node: RuleNode) => {
    ids.add(node.id)
    node.children.forEach(visit)
  }
  visit(rule)
  return ids
}

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
  const [rules,setRules] = useState<RuleNode[]>([])
  const [rulesLoading,setRulesLoading] = useState(true)
  const [rulesError,setRulesError] = useState('')
  const [ruleResetNotice,setRuleResetNotice] = useState('')
  const [error,setError] = useState('')
  const [fieldErrors,setFieldErrors] = useState<ExerciseFieldErrors>({})
  const [saving,setSaving] = useState(false)

  useEffect(() => {
    void ApiService.getAdminExerciseTypes().then(setTypes).catch(reason => setError(reason.message))
    void ApiService.getAdminRules().then(setRules).catch(reason => setRulesError(reason.message)).finally(() => setRulesLoading(false))
    if (exerciseId) void ApiService.getAdminExercise(exerciseId).then(record => setDraft(record)).catch(reason => setError(reason.message))
  }, [exerciseId])

  const save = async () => {
    if (draft.rule_id === null) {
      setError('Выберите правило упражнения.')
      setFieldErrors({ rule_id: ['Выберите правило упражнения.'] })
      return
    }
    const ruleId = draft.rule_id
    setSaving(true)
    setError('')
    setFieldErrors({})
    try {
      const saved = exerciseId
        ? await ApiService.updateAdminExercise(exerciseId, {title:draft.title,description:draft.description,instruction:draft.instruction,difficulty:draft.difficulty,estimated_duration_minutes:draft.estimated_duration_minutes,display_order:draft.display_order,status:draft.status,rule_id:ruleId,definition:draft.definition})
        : await ApiService.createAdminExercise({...draft, rule_id:ruleId})
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
  const allRuleOptions = flattenRules(rules)
  const selectedNode = draft.rule_id === null ? undefined : findRule(rules, draft.rule_id)
  const allowedBlankRuleIds = selectedNode ? subtreeRuleIds(selectedNode) : new Set<number>()
  const allowedBlankRules = allRuleOptions.filter(rule => allowedBlankRuleIds.has(rule.id))
  const changeExerciseRule = (ruleId: number | null) => {
    let definition = draft.definition
    let cleared = false
    const selectedRule = ruleId === null ? undefined : findRule(rules, ruleId)
    const allowedIds = selectedRule ? subtreeRuleIds(selectedRule) : new Set<number>()
    if (draft.type_code === 'fill_blanks') {
      const fill = definition as FillBlanksDefinition
      definition = {
        ...fill,
        items: fill.items.map(item => ({ ...item, parts: item.parts.map(part => {
          if (part.kind === 'blank' && part.rule_id != null && !allowedIds.has(part.rule_id)) {
            cleared = true
            return { ...part, rule_id: null }
          }
          return part
        }) })),
      }
    }
    setRuleResetNotice(cleared ? 'Недопустимые правила пропусков очищены после смены правила упражнения.' : '')
    setDraft({ ...draft, rule_id: ruleId, definition })
  }
  return <div className="mx-auto max-w-4xl space-y-4 p-8">
    <Typography variant="h1">{exerciseId ? 'Редактирование упражнения' : 'Новое упражнение'}</Typography>
    {error && <p className="text-red-700">{error}</p>}
    <label className="block">Slug<Input disabled={Boolean(exerciseId)} value={draft.slug} onChange={event => setDraft({...draft,slug:event.target.value})}/><FieldErrors errors={errors('slug')} /></label>
    <label className="block">Тип<select disabled={Boolean(exerciseId)} className="ml-2 rounded border p-2" value={draft.type_code} onChange={event => { const type=event.target.value as ExerciseTypeCode; setDraft({...draft,type_code:type,schema_version:1,definition:initialDefinition(type)}) }}>{types.map(type => <option key={type.code} value={type.code}>{type.label}</option>)}</select><FieldErrors errors={[...errors('type_code'), ...errors('schema_version')]} /></label>
    <label className="block">Правило упражнения<select className="mt-1 block rounded border p-2" disabled={rulesLoading || Boolean(rulesError) || rules.length === 0} value={draft.rule_id ?? ''} onChange={event => changeExerciseRule(event.target.value ? Number(event.target.value) : null)}><option value="">{rulesLoading ? 'Загрузка правил…' : 'Выберите правило'}</option>{allRuleOptions.map(rule => <option key={rule.id} value={rule.id}>{rule.path}</option>)}</select><FieldErrors errors={errors('rule_id')} />{rulesError && <p className="mt-1 text-sm text-red-700">Не удалось загрузить правила: {rulesError}</p>}{!rulesLoading && !rulesError && rules.length === 0 && <p className="mt-1 text-sm text-gray-700">Сначала <Link className="text-indigo-700 underline" href="/admin/rules">создайте правило</Link>, затем вернитесь к упражнению.</p>}</label>
    {ruleResetNotice && <p className="text-sm text-amber-800" role="status">{ruleResetNotice}</p>}
    <label className="block">Название<Input value={draft.title} onChange={event => setDraft({...draft,title:event.target.value})}/><FieldErrors errors={errors('title')} /></label>
    <label className="block">Описание<Input value={draft.description} onChange={event => setDraft({...draft,description:event.target.value})}/><FieldErrors errors={errors('description')} /></label>
    <label className="block">Инструкция<Input value={draft.instruction} onChange={event => setDraft({...draft,instruction:event.target.value})}/><FieldErrors errors={errors('instruction')} /></label>
    <div className="grid grid-cols-3 gap-3">
      <label>Сложность<select className="block rounded border p-2" value={draft.difficulty} onChange={event => setDraft({...draft,difficulty:event.target.value as Draft['difficulty']})}><option value="beginner">Начальный</option><option value="intermediate">Средний</option><option value="advanced">Продвинутый</option></select><FieldErrors errors={errors('difficulty')} /></label>
      <label>Минуты<Input type="number" value={draft.estimated_duration_minutes ?? ''} onChange={event => setDraft({...draft,estimated_duration_minutes:event.target.value ? Number(event.target.value) : null})}/><FieldErrors errors={errors('estimated_duration_minutes')} /></label>
      <label>Порядок<Input type="number" value={draft.display_order} onChange={event => setDraft({...draft,display_order:Number(event.target.value)})}/><FieldErrors errors={errors('display_order')} /></label>
    </div>
    <label>Статус<select className="ml-2 rounded border p-2" value={draft.status} onChange={event => setDraft({...draft,status:event.target.value as Draft['status']})}><option value="draft">Черновик</option><option value="published">Опубликовано</option></select><FieldErrors errors={errors('status')} /></label>
    <section className="rounded border p-4"><Typography variant="h3" className="mb-3">Содержимое</Typography><FieldErrors errors={errors('definition')} /><ExerciseEditor type={draft.type_code} definition={draft.definition} onChange={definition => setDraft({...draft,definition})} errors={fieldErrors} blankRuleOptions={allowedBlankRules} ruleSelected={Boolean(draft.rule_id)} /></section>
    <Button onClick={save} disabled={saving}>{saving ? 'Сохранение…' : 'Сохранить'}</Button>
  </div>
}
