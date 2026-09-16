'use client'

import { RuleNode } from '@/lib/api'

interface RuleTreeProps {
  root: RuleNode
  selectedId: number
  expandedIds: Set<number>
  onSelect: (id: number) => void
  onToggle: (id: number) => void
  onAddChild: (id: number) => void
}

function TreeNode({ root, node, depth, selectedId, expandedIds, onSelect, onToggle, onAddChild }: RuleTreeProps & { node: RuleNode, depth: number }) {
  const hasChildren = node.children.length > 0
  const expanded = expandedIds.has(node.id)
  return (
    <li>
      <div className="group flex items-center gap-1 rounded-md pr-1 hover:bg-indigo-50" style={{ paddingLeft: `${depth * 1.25}rem` }}>
        {hasChildren ? (
          <button type="button" onClick={() => onToggle(node.id)} aria-label={`${expanded ? 'Свернуть' : 'Развернуть'} ${node.title}`} className="h-9 w-8 rounded text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            {expanded ? '▾' : '▸'}
          </button>
        ) : <span className="inline-block w-8 text-center text-gray-500" aria-hidden="true">•</span>}
        <button
          type="button"
          onClick={() => onSelect(node.id)}
          className={`min-h-9 flex-1 rounded px-2 py-2 text-left text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 ${selectedId === node.id ? 'bg-indigo-600 text-white' : 'text-gray-800'}`}
        >
          {node.title}
        </button>
        <button type="button" onClick={() => onAddChild(node.id)} className="min-h-9 rounded px-2 text-sm text-indigo-700 opacity-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:opacity-0 sm:group-hover:opacity-100">
          + Подправило
        </button>
      </div>
      {hasChildren && expanded && (
        <ul className="space-y-1">
          {node.children.map((child) => <TreeNode key={child.id} node={child} depth={depth + 1} selectedId={selectedId} expandedIds={expandedIds} onSelect={onSelect} onToggle={onToggle} onAddChild={onAddChild} root={root} />)}
        </ul>
      )}
    </li>
  )
}

export function RuleTree(props: RuleTreeProps) {
  return <ul className="space-y-1" aria-label="Дерево правил"><TreeNode {...props} node={props.root} depth={0} /></ul>
}

export function ancestorIds(nodes: RuleNode[], targetId: number, ancestors: number[] = []): number[] | null {
  for (const node of nodes) {
    if (node.id === targetId) return [...ancestors, node.id]
    const found = ancestorIds(node.children, targetId, [...ancestors, node.id])
    if (found) return found
  }
  return null
}

export function findRule(nodes: RuleNode[], id: number): RuleNode | null {
  for (const node of nodes) {
    if (node.id === id) return node
    const found = findRule(node.children, id)
    if (found) return found
  }
  return null
}

export function subtreeIds(node: RuleNode): Set<number> {
  const ids = new Set<number>([node.id])
  node.children.forEach((child) => subtreeIds(child).forEach((id) => ids.add(id)))
  return ids
}
