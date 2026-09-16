'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { LoadingSpinner, PageLayout, Typography } from '@/components'
import { RuleFields, RuleDraft, validateRuleDraft } from '@/components/admin/RuleFields'
import { findRule } from '@/components/admin/RuleTree'
import { ApiService, RuleNode } from '@/lib/api'
import { useRouter } from 'next/navigation'

const emptyDraft: RuleDraft = { title: '', description: '', parent_rule_id: null }

export default function NewAdminRulePage() {
  const router = useRouter()
  const [forest, setForest] = useState<RuleNode[]>([])
  const [draft, setDraft] = useState<RuleDraft>(emptyDraft)
  const [errors, setErrors] = useState<Partial<Record<'title' | 'description', string>>>({})
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try { setForest(await ApiService.getAdminRules()) }
    catch (error) { setLoadError(error instanceof Error ? error.message : 'Не удалось загрузить правила.') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { void load() }, [load])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    const nextErrors = validateRuleDraft(draft)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    setSaving(true)
    setSaveError(null)
    try {
      const created = await ApiService.createAdminRule({ ...draft, title: draft.title.trim(), description: draft.description.trim() })
      const refreshed = await ApiService.getAdminRules()
      const parent = created.parent_rule_id === null ? null : findRule(refreshed, created.parent_rule_id)
      const root = parent ? refreshed.find((node) => findRule([node], parent.id)) : refreshed.find((node) => node.id === created.id)
      router.replace(`/admin/rules/${root?.id ?? created.id}`)
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Не удалось сохранить правило.')
    } finally { setSaving(false) }
  }

  return <PageLayout showFooter={false}><div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
    <Link href="/admin/rules" className="text-sm font-medium text-indigo-700 hover:underline focus:outline-none focus:ring-2 focus:ring-indigo-500">← К списку правил</Link>
    <Typography variant="h1" weight="extrabold" className="mt-4">Создать правило</Typography>
    {loading ? <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div> : loadError ? <div role="alert" className="mt-6 rounded-md border border-red-200 bg-red-50 p-4 text-red-800"><p>{loadError}</p><button type="button" onClick={() => void load()} className="mt-2 underline">Повторить</button></div> :
      <form onSubmit={(event) => void submit(event)} className="mt-6 rounded-lg bg-white p-6 shadow-sm">
        {saveError && <p role="alert" className="mb-4 rounded bg-red-50 p-3 text-red-800">{saveError}</p>}
        <RuleFields forest={forest} value={draft} onChange={setDraft} errors={errors} />
        <div className="mt-7 flex flex-wrap gap-3"><button type="submit" disabled={saving} className="rounded-md bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50">{saving ? 'Сохранение…' : 'Создать правило'}</button><Link href="/admin/rules" className="rounded-md bg-gray-200 px-4 py-2 font-medium text-gray-800 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500">Отмена</Link></div>
      </form>}
  </div></PageLayout>
}
