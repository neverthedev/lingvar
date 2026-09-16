'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { RuleFields, RuleDraft, validateRuleDraft } from './RuleFields'
import { ancestorIds, findRule, RuleTree, subtreeIds } from './RuleTree'
import { ApiService, RuleNode } from '@/lib/api'

type PendingAction =
  | { type: 'select', id: number }
  | { type: 'create', parentId: number }
  | { type: 'leave' }

const emptyDraft = (parentId: number | null): RuleDraft => ({ title: '', description: '', parent_rule_id: parentId })
const draftFor = (node: RuleNode): RuleDraft => ({ title: node.title, description: node.description, parent_rule_id: node.parent_rule_id })

function rootIdFor(forest: RuleNode[], nodeId: number): number | null {
  return forest.find((root) => findRule([root], nodeId))?.id ?? null
}

function allExpandableIds(node: RuleNode): number[] {
  return node.children.flatMap((child) => [node.id, ...allExpandableIds(child)])
}

interface RuleEditorProps { rootId: number }

export function RuleEditor({ rootId }: RuleEditorProps) {
  const router = useRouter()
  const [forest, setForest] = useState<RuleNode[]>([])
  const [selectedId, setSelectedId] = useState(rootId)
  const [editingId, setEditingId] = useState<number | null>(rootId)
  const [draft, setDraft] = useState<RuleDraft>(emptyDraft(null))
  const [savedDraft, setSavedDraft] = useState<RuleDraft>(emptyDraft(null))
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<'title' | 'description', string>>>({})
  const [notice, setNotice] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)

  const root = forest.find((node) => node.id === rootId) ?? null
  const selected = root ? findRule([root], selectedId) : null
  const isDirty = JSON.stringify(draft) !== JSON.stringify(savedDraft)

  const selectInForest = (id: number, nextForest = forest) => {
    const node = findRule(nextForest, id)
    if (!node) return
    setSelectedId(id)
    setEditingId(id)
    const nextDraft = draftFor(node)
    setDraft(nextDraft)
    setSavedDraft(nextDraft)
    setActionError(null)
    setFieldErrors({})
    const path = ancestorIds(nextForest, id) ?? []
    setExpandedIds((current) => new Set([...Array.from(current), ...path]))
  }

  const load = async (initial = false) => {
    setLoading(true)
    setLoadError(null)
    try {
      const nextForest = await ApiService.getAdminRules()
      setForest(nextForest)
      const nextRoot = nextForest.find((node) => node.id === rootId)
      if (initial && nextRoot) {
        setExpandedIds(new Set(allExpandableIds(nextRoot)))
        selectInForest(rootId, nextForest)
      }
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Не удалось загрузить дерево правил.')
    } finally { setLoading(false) }
  }

  useEffect(() => { void load(true) }, [rootId])
  useEffect(() => {
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isDirty) { event.preventDefault(); event.returnValue = '' }
    }
    window.addEventListener('beforeunload', warnBeforeUnload)
    return () => window.removeEventListener('beforeunload', warnBeforeUnload)
  }, [isDirty])

  const applyAction = (action: PendingAction, nextForest = forest) => {
    setPendingAction(null)
    if (action.type === 'select') selectInForest(action.id, nextForest)
    if (action.type === 'create') {
      const nextDraft = emptyDraft(action.parentId)
      setEditingId(null)
      setDraft(nextDraft)
      setSavedDraft(nextDraft)
      setActionError(null)
      setFieldErrors({})
      const path = ancestorIds(nextForest, action.parentId) ?? []
      setExpandedIds((current) => new Set([...Array.from(current), ...path]))
    }
    if (action.type === 'leave') router.push('/admin/rules')
  }

  const requestAction = (action: PendingAction) => {
    if (isDirty) setPendingAction(action)
    else applyAction(action)
  }

  const refreshAfterMutation = async (changedId: number, created: boolean) => {
    const nextForest = await ApiService.getAdminRules()
    const destinationRootId = rootIdFor(nextForest, changedId)
    if (destinationRootId === null) {
      router.replace('/admin/rules')
      return
    }
    if (created || editingId === rootId) {
      if (destinationRootId !== rootId) {
        router.replace(`/admin/rules/${destinationRootId}`)
        return
      }
      setForest(nextForest)
      selectInForest(changedId, nextForest)
      return
    }
    setForest(nextForest)
    if (destinationRootId === rootId) selectInForest(changedId, nextForest)
    else selectInForest(rootId, nextForest)
  }

  const save = async (): Promise<boolean> => {
    const errors = validateRuleDraft(draft)
    setFieldErrors(errors)
    if (Object.keys(errors).length) {
      setActionError(Object.values(errors)[0] ?? 'Проверьте обязательные поля.')
      return false
    }
    setSaving(true)
      setActionError(null)
    setNotice(null)
    try {
      const payload = { ...draft, title: draft.title.trim(), description: draft.description.trim() }
      const changed = editingId === null
        ? await ApiService.createAdminRule(payload)
        : await ApiService.updateAdminRule(editingId, payload)
      setDraft(draftFor(changed))
      setSavedDraft(draftFor(changed))
      await refreshAfterMutation(changed.id, editingId === null)
      setNotice(editingId === null ? 'Подправило создано.' : 'Изменения сохранены.')
      return true
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Не удалось сохранить изменения. Введённые данные сохранены в форме.')
      return false
    } finally { setSaving(false) }
  }

  const saveAndContinue = async () => {
    const action = pendingAction
    if (await save() && action) {
      try {
        const nextForest = await ApiService.getAdminRules()
        setForest(nextForest)
        applyAction(action, nextForest)
      } catch (error) {
        setActionError(error instanceof Error ? error.message : 'Не удалось обновить дерево правил.')
      }
    }
  }

  const deleteSelected = async () => {
    if (editingId === null || !selected) return
    if (!window.confirm(`Удалить правило «${selected.title}»? Прямые подправила будут перенесены к его родителю.`)) return
    setDeleting(true)
    setActionError(null)
    setNotice(null)
    try {
      const previousParentId = selected.parent_rule_id
      await ApiService.deleteAdminRule(editingId)
      if (editingId === rootId) { router.replace('/admin/rules'); return }
      const nextForest = await ApiService.getAdminRules()
      setForest(nextForest)
      selectInForest(previousParentId ?? rootId, nextForest)
      setNotice('Правило удалено. Его прямые подправила перенесены к родителю.')
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Не удалось удалить правило. Дерево не изменено.')
    } finally { setDeleting(false) }
  }

  const excludedIds = useMemo(() => editingId !== null && selected ? subtreeIds(selected) : new Set<number>(), [editingId, selected])

  if (loading) return <div className="flex justify-center py-16"><span className="text-gray-600">Загрузка дерева правил…</span></div>
  if (loadError) return <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-5 text-red-800"><p>{loadError}</p><button type="button" onClick={() => void load()} className="mt-3 underline focus:outline-none focus:ring-2 focus:ring-red-600">Повторить</button></div>
  if (!root) return <div className="rounded-md border border-amber-200 bg-amber-50 p-5 text-amber-900"><p>Это правило больше не существует как правило верхнего уровня.</p><Link href="/admin/rules" className="mt-3 inline-block underline focus:outline-none focus:ring-2 focus:ring-amber-700">Вернуться к списку</Link></div>

  return <>
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><Link href="/admin/rules" onClick={(event) => { if (isDirty) { event.preventDefault(); requestAction({ type: 'leave' }) } }} className="text-sm font-medium text-indigo-700 hover:underline focus:outline-none focus:ring-2 focus:ring-indigo-500">Правила</Link><h1 className="mt-2 text-3xl font-extrabold text-gray-900">{root.title}</h1></div>
      <button type="button" onClick={() => void deleteSelected()} disabled={deleting || editingId !== rootId} className="rounded-md bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50">{deleting ? 'Удаление…' : 'Удалить правило'}</button>
    </div>
    {notice && <p role="status" className="mt-5 rounded-md bg-green-50 p-3 text-green-800">{notice}</p>}
    {actionError && <p role="alert" className="mt-5 rounded-md bg-red-50 p-3 text-red-800">{actionError}</p>}
    <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,0.9fr)]">
      <section aria-label="Дерево правил" className="rounded-lg bg-white p-4 shadow-sm"><div className="mb-3 flex items-center justify-between"><h2 className="font-semibold text-gray-900">Дерево</h2><button type="button" onClick={() => requestAction({ type: 'create', parentId: selectedId })} className="rounded px-2 py-1 text-sm font-medium text-indigo-700 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500">+ Добавить подправило</button></div><RuleTree root={root} selectedId={selectedId} expandedIds={expandedIds} onSelect={(id) => requestAction({ type: 'select', id })} onToggle={(id) => setExpandedIds((current) => { const next = new Set(current); next.has(id) ? next.delete(id) : next.add(id); return next })} onAddChild={(id) => requestAction({ type: 'create', parentId: id })} /></section>
      <section aria-label="Свойства правила" className="rounded-lg bg-white p-5 shadow-sm"><h2 className="text-lg font-semibold text-gray-900">{editingId === null ? 'Новое подправило' : 'Свойства правила'}</h2><form className="mt-5" onSubmit={(event) => { event.preventDefault(); void save() }}><RuleFields forest={forest} value={draft} onChange={(nextDraft) => { setDraft(nextDraft); setFieldErrors({}) }} excludedIds={excludedIds} errors={fieldErrors} /><div className="mt-7 flex flex-wrap gap-3"><button type="submit" disabled={saving} className="rounded-md bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50">{saving ? 'Сохранение…' : 'Сохранить'}</button>{editingId !== null && <button type="button" disabled={deleting} onClick={() => void deleteSelected()} className="rounded-md bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50">Удалить</button>}</div></form></section>
    </div>
    {pendingAction && <div role="dialog" aria-modal="true" aria-labelledby="unsaved-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"><h2 id="unsaved-title" className="text-lg font-semibold text-gray-900">Есть несохранённые изменения</h2><p className="mt-2 text-gray-600">Сохранить их перед переходом?</p><div className="mt-6 flex flex-wrap gap-3"><button type="button" onClick={() => void saveAndContinue()} disabled={saving} className="rounded-md bg-indigo-600 px-4 py-2 font-medium text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">Сохранить</button><button type="button" onClick={() => applyAction(pendingAction)} className="rounded-md bg-gray-200 px-4 py-2 font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500">Не сохранять</button><button type="button" onClick={() => setPendingAction(null)} className="rounded-md px-4 py-2 font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">Остаться</button></div></div></div>}
  </>
}
