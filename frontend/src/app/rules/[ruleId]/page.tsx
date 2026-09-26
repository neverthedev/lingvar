'use client'

import { createElement, useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LoadingSpinner, PageLayout } from '@/components'
import { RuleDescription } from '@/components/rules'
import { ApiService, LearnerRuleNode } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'

function RuleBranch({ rule, depth }: { rule: LearnerRuleNode; depth: number }) {
  const heading = (`h${Math.min(depth + 1, 6)}` as keyof JSX.IntrinsicElements)
  const headingId = `rule-${rule.id}`
  return <section aria-labelledby={headingId} className={`mt-8 ${depth > 1 ? 'border-l-2 border-slate-200 pl-4 sm:pl-6' : ''}`}>
    {createElement(heading, { id: headingId, className: depth === 1 ? 'text-2xl font-bold text-slate-950' : 'text-xl font-semibold text-slate-900' }, rule.title)}
    <RuleDescription html={rule.description} className="mt-3" />
    {rule.children.map(child => <RuleBranch key={child.id} rule={child} depth={depth + 1} />)}
  </section>
}

export default function LearnerRulePage({ params }: { params: { ruleId: string } }) {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const [rule, setRule] = useState<LearnerRuleNode | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const ruleId = Number(params.ruleId)

  const load = useCallback(async () => {
    if (!isAuthenticated || !Number.isInteger(ruleId) || ruleId <= 0) {
      setLoading(false)
      setNotFound(true)
      return
    }
    setLoading(true); setError(null); setNotFound(false); setRule(null)
    try {
      const response = await ApiService.getLearnerRule(ruleId)
      if (response.canonical_rule_id !== ruleId) {
        router.replace(`/rules/${response.canonical_rule_id}`)
        return
      }
      setRule(response.rule)
    } catch (reason) {
      const status = typeof reason === 'object' && reason !== null && 'status' in reason ? (reason as { status?: number }).status : undefined
      if (status === 404) setNotFound(true)
      else setError(reason instanceof Error ? reason.message : 'Не удалось загрузить правило.')
    } finally { setLoading(false) }
  }, [isAuthenticated, router, ruleId])

  useEffect(() => { void load() }, [load])

  return <PageLayout>
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      {loading ? <div className="flex min-h-[40vh] items-center justify-center"><LoadingSpinner size="lg" /></div> : notFound ? <section className="rounded-lg border border-slate-200 bg-white p-6"><h1 className="text-2xl font-bold text-slate-950">Правило не найдено</h1><p className="mt-2 text-slate-700">Возможно, оно было удалено или адрес указан неверно.</p></section> : error ? <section role="alert" className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-900"><h1 className="text-2xl font-bold">Не удалось загрузить правило</h1><p className="mt-2">{error}</p><button type="button" onClick={() => void load()} className="mt-4 min-h-10 rounded-md bg-red-700 px-4 font-medium text-white outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2">Повторить</button></section> : rule ? <><h1 className="text-3xl font-extrabold text-slate-950">{rule.title}</h1><RuleDescription html={rule.description} className="mt-4" />{rule.children.map(child => <RuleBranch key={child.id} rule={child} depth={1} />)}</> : null}
    </div>
  </PageLayout>
}
