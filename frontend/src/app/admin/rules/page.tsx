'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { LoadingSpinner, PageLayout, Typography } from '@/components'
import { ApiService, RuleNode } from '@/lib/api'

function countRules(nodes: RuleNode[]): number {
  return nodes.reduce((total, node) => total + 1 + countRules(node.children), 0)
}

export default function AdminRulesPage() {
  const [rules, setRules] = useState<RuleNode[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const totalRules = isLoading || error ? null : countRules(rules)

  const loadRules = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      setRules(await ApiService.getAdminRules())
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Не удалось загрузить правила.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { void loadRules() }, [loadRules])

  const deleteRule = async (rule: RuleNode) => {
    if (!window.confirm(`Удалить правило «${rule.title}»? Его прямые подправила будут перенесены на текущий уровень.`)) return
    setDeletingId(rule.id)
    setError(null)
    try {
      await ApiService.deleteAdminRule(rule.id)
      await loadRules()
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Не удалось удалить правило.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <PageLayout showFooter={false}>
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3">
              <Typography variant="h1" weight="extrabold">Правила</Typography>
              {totalRules !== null && (
                <p className="text-sm text-gray-500">Всего правил: {totalRules} <span className="whitespace-nowrap">включая подправила</span></p>
              )}
            </div>
            <Typography variant="body" color="secondary" className="mt-2">Управляйте учебными правилами верхнего уровня и их деревом.</Typography>
          </div>
          <Link href="/admin/rules/new" className="rounded-md bg-indigo-600 px-4 py-2 font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">Создать правило</Link>
        </div>

        {error && (
          <div role="alert" className="mt-6 rounded-md border border-red-200 bg-red-50 p-4 text-red-800">
            <p>{error}</p>
            <button type="button" onClick={() => void loadRules()} className="mt-2 underline focus:outline-none focus:ring-2 focus:ring-red-600">Повторить</button>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
        ) : rules.length === 0 ? (
          <div className="mt-8 rounded-lg bg-white p-8 text-center shadow-sm">
            <p className="text-gray-700">Правил пока нет. Создайте первое правило верхнего уровня.</p>
            <Link href="/admin/rules/new" className="mt-5 inline-block rounded-md bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">Создать правило</Link>
          </div>
        ) : (
          <ul className="mt-6 space-y-3">
            {rules.map((rule) => (
              <li key={rule.id} className="rounded-lg bg-white p-3 shadow-sm sm:p-4">
                <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                  <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <h2 className="min-w-0 truncate font-semibold text-gray-900">{rule.title}</h2>
                    <p className="whitespace-nowrap text-sm text-gray-500">Подправил: {rule.children.length}</p>
                  </div>
                  <p className="mt-1 truncate text-sm text-gray-500">{rule.description}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/admin/rules/${rule.id}`} className="rounded-md bg-gray-200 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500">Редактировать</Link>
                    <button type="button" disabled={deletingId === rule.id} onClick={() => void deleteRule(rule)} className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50">
                      {deletingId === rule.id ? 'Удаление…' : 'Удалить'}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageLayout>
  )
}
