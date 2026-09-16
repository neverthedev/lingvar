'use client'

import { Fragment } from 'react'
import { RuleNode, RulePayload } from '@/lib/api'

export type RuleDraft = RulePayload

interface RuleFieldsProps {
  forest: RuleNode[]
  value: RuleDraft
  onChange: (nextValue: RuleDraft) => void
  excludedIds?: Set<number>
  errors?: Partial<Record<'title' | 'description', string>>
}

function ParentOptions({ nodes, depth, excludedIds }: { nodes: RuleNode[], depth: number, excludedIds: Set<number> }) {
  return <>
    {nodes.map((node) => (
      <Fragment key={node.id}>
        {!excludedIds.has(node.id) && (
          <option value={node.id}>{'— '.repeat(depth)}{node.title}</option>
        )}
        <ParentOptions nodes={node.children} depth={depth + 1} excludedIds={excludedIds} />
      </Fragment>
    ))}
  </>
}

export function RuleFields({ forest, value, onChange, excludedIds = new Set(), errors = {} }: RuleFieldsProps) {
  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="rule-title" className="block text-sm font-medium text-gray-800">Название *</label>
        <input
          id="rule-title"
          value={value.title}
          onChange={(event) => onChange({ ...value, title: event.target.value })}
          maxLength={200}
          aria-invalid={Boolean(errors.title)}
          aria-describedby={errors.title ? 'rule-title-error' : undefined}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {errors.title && <p id="rule-title-error" className="mt-1 text-sm text-red-700">{errors.title}</p>}
      </div>
      <div>
        <label htmlFor="rule-description" className="block text-sm font-medium text-gray-800">Описание *</label>
        <textarea
          id="rule-description"
          rows={7}
          value={value.description}
          onChange={(event) => onChange({ ...value, description: event.target.value })}
          aria-invalid={Boolean(errors.description)}
          aria-describedby={errors.description ? 'rule-description-error' : undefined}
          className="mt-1 block w-full resize-y rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {errors.description && <p id="rule-description-error" className="mt-1 text-sm text-red-700">{errors.description}</p>}
      </div>
      <div>
        <label htmlFor="rule-parent" className="block text-sm font-medium text-gray-800">Родительское правило</label>
        <select
          id="rule-parent"
          value={value.parent_rule_id ?? ''}
          onChange={(event) => onChange({ ...value, parent_rule_id: event.target.value ? Number(event.target.value) : null })}
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Верхний уровень</option>
          <ParentOptions nodes={forest} depth={0} excludedIds={excludedIds} />
        </select>
      </div>
    </div>
  )
}

export function validateRuleDraft(value: RuleDraft): Partial<Record<'title' | 'description', string>> {
  const errors: Partial<Record<'title' | 'description', string>> = {}
  if (!value.title.trim()) errors.title = 'Введите название правила.'
  if (value.title.trim().length > 200) errors.title = 'Название должно содержать не более 200 символов.'
  if (!value.description.trim()) errors.description = 'Введите описание правила.'
  return errors
}
