'use client'

import { PageLayout } from '@/components'
import { RuleEditor } from '@/components/admin/RuleEditor'

export default function AdminRuleEditorPage({ params }: { params: { rootId: string } }) {
  const rootId = Number(params.rootId)
  return <PageLayout showFooter={false}><div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">{Number.isInteger(rootId) && rootId > 0 ? <RuleEditor rootId={rootId} /> : <p className="rounded-md bg-amber-50 p-5 text-amber-900">Некорректный адрес правила.</p>}</div></PageLayout>
}
