'use client'

import { Editor, Mark, mergeAttributes } from '@tiptap/core'
import { Table, TableCell, TableHeader, TableRow } from '@tiptap/extension-table'
import { TextSelection } from '@tiptap/pm/state'
import { EditorContent, useEditor, useEditorState } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { forwardRef, KeyboardEvent, ReactNode, useEffect, useImperativeHandle, useRef, useState } from 'react'

const FontSize = Mark.create({
  name: 'fontSize',
  addAttributes() {
    return { 'data-font-size': { default: null, parseHTML: element => element.getAttribute('data-font-size'), renderHTML: attributes => attributes['data-font-size'] ? { 'data-font-size': attributes['data-font-size'] } : {} } }
  },
  parseHTML() { return [{ tag: 'span[data-font-size="14"]' }, { tag: 'span[data-font-size="20"]' }] },
  renderHTML({ HTMLAttributes }) { return ['span', mergeAttributes(HTMLAttributes), 0] },
})

const editorAllowedTags = new Set(['P', 'BR', 'STRONG', 'EM', 'U', 'UL', 'OL', 'LI', 'TABLE', 'TBODY', 'TR', 'TD', 'SPAN'])
const removeWithContents = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'SVG', 'MATH', 'TEMPLATE'])

/** Browser counterpart of the server allowlist, used before visual parsing/save. */
export function sanitizeRuleHtml(html: string): string {
  const document = new DOMParser().parseFromString(html, 'text/html')
  for (const comment of Array.from(document.body.childNodes)) if (comment.nodeType === Node.COMMENT_NODE) comment.remove()
  for (const element of Array.from(document.body.querySelectorAll('*')).reverse()) {
    if (!editorAllowedTags.has(element.tagName)) {
      if (removeWithContents.has(element.tagName) || element.tagName === 'COLGROUP' || element.tagName === 'COL') element.remove()
      else element.replaceWith(...Array.from(element.childNodes))
      continue
    }
    for (const attribute of Array.from(element.attributes)) {
      const isFontSize = element.tagName === 'SPAN' && attribute.name === 'data-font-size' && (attribute.value === '14' || attribute.value === '20')
      if (!isFontSize) element.removeAttribute(attribute.name)
    }
  }
  return document.body.innerHTML
}

const editorHtmlForSave = (html: string) => sanitizeRuleHtml(html)

type ToolbarState = { paragraph: boolean; bold: boolean; italic: boolean; underline: boolean; bulletList: boolean; orderedList: boolean; size14: boolean; size16: boolean; size20: boolean }

function selectionFullyHasMark(editor: Editor, name: string, attributes?: Record<string, string>): boolean {
  const { from, to, empty } = editor.state.selection
  if (empty) return editor.isActive(name, attributes)
  let containsText = false
  let matches = true
  editor.state.doc.nodesBetween(from, to, (node, position) => {
    if (!node.isText || position + node.nodeSize <= from || position >= to) return
    containsText = true
    const mark = node.marks.find(candidate => candidate.type.name === name)
    if (!mark || Object.entries(attributes ?? {}).some(([key, value]) => mark.attrs[key] !== value)) matches = false
  })
  return containsText && matches
}

function selectionHasNoFontSize(editor: Editor): boolean {
  const { from, to, empty } = editor.state.selection
  if (empty) return !editor.isActive('fontSize')
  let containsText = false
  let hasSize = false
  editor.state.doc.nodesBetween(from, to, (node, position) => {
    if (!node.isText || position + node.nodeSize <= from || position >= to) return
    containsText = true
    if (node.marks.some(mark => mark.type.name === 'fontSize')) hasSize = true
  })
  return containsText && !hasSize
}

function toolbarStateFor(editor: Editor | null): ToolbarState | null {
  if (!editor) return null
  return {
    paragraph: editor.isActive('paragraph'),
    bold: selectionFullyHasMark(editor, 'bold'),
    italic: selectionFullyHasMark(editor, 'italic'),
    underline: selectionFullyHasMark(editor, 'underline'),
    bulletList: editor.isActive('bulletList'),
    orderedList: editor.isActive('orderedList'),
    size14: selectionFullyHasMark(editor, 'fontSize', { 'data-font-size': '14' }),
    size16: selectionHasNoFontSize(editor),
    size20: selectionFullyHasMark(editor, 'fontSize', { 'data-font-size': '20' }),
  }
}

function ToolButton({ label, active = false, pressed = true, onClick, onPointerDown, children }: { label: string; active?: boolean; pressed?: boolean; onClick: () => void; onPointerDown?: () => void; children: ReactNode }) {
  return <button type="button" title={label} aria-label={label} aria-pressed={pressed ? active : undefined} onPointerDown={event => { onPointerDown?.(); event.preventDefault() }} onMouseDown={event => event.preventDefault()} onClick={onClick} className={`flex h-10 min-w-10 items-center justify-center rounded border px-2 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${active ? 'border-indigo-600 bg-indigo-100 text-indigo-900' : 'border-gray-300 bg-white text-gray-800 hover:bg-gray-100'}`}>{children}</button>
}

export interface RichRuleEditorHandle { prepareForSave: () => string }
interface RichRuleEditorProps { value: string; onChange: (html: string) => void; error?: string }
type TextSelectionRange = { from: number; to: number }

export const RichRuleEditor = forwardRef<RichRuleEditorHandle, RichRuleEditorProps>(function RichRuleEditor({ value, onChange, error }, ref) {
  const [mode, setMode] = useState<'visual' | 'html'>('visual')
  const [rawValue, setRawValue] = useState(value)
  const [tablePickerOpen, setTablePickerOpen] = useState(false)
  const editorRef = useRef<Editor | null>(null)
  const inlineSelectionRef = useRef<TextSelectionRange | null>(null)
  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    extensions: [StarterKit.configure({ heading: false, blockquote: false, code: false, codeBlock: false, horizontalRule: false, strike: false, link: false }), FontSize, Table.configure({ resizable: false }), TableRow, TableCell, TableHeader],
    content: value,
    editorProps: {
      attributes: { id: 'rule-description', 'aria-describedby': error ? 'rule-description-error' : '', class: 'min-h-40 px-3 py-3 outline-none' },
      handleKeyDown: (view, event) => {
        const { selection } = view.state
        if (event.key === 'ArrowRight' && !event.ctrlKey && !event.shiftKey && !event.altKey && !event.metaKey && selection instanceof TextSelection && !selection.empty) {
          view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, selection.to)))
          return true
        }
        if (event.key === 'End' && event.ctrlKey && !event.shiftKey && !event.altKey && !event.metaKey) {
          view.dispatch(view.state.tr.setSelection(TextSelection.atEnd(view.state.doc)).scrollIntoView())
          return true
        }
        return false
      },
    },
    onUpdate: ({ editor: nextEditor }) => {
      const nextValue = editorHtmlForSave(nextEditor.getHTML())
      onChange(nextValue)
    },
  })
  editorRef.current = editor
  // useEditorState is typed for an initialized Editor, while useEditor returns
  // null during its first render. Its selector receives that transient state,
  // so toolbarStateFor handles null before any editor API is called.
  const toolbarState = useEditorState({ editor: editor as Editor, selector: ({ editor: nextEditor }) => toolbarStateFor(nextEditor) })

  useEffect(() => () => {
    editorRef.current?.commands.blur()
    window.getSelection()?.removeAllRanges()
  }, [])

  useEffect(() => {
    if (!editor) return
    editor.view.dom.setAttribute('aria-invalid', error ? 'true' : 'false')
    if (error) editor.view.dom.setAttribute('aria-describedby', 'rule-description-error')
    else editor.view.dom.removeAttribute('aria-describedby')
  }, [editor, error])

  const syncRawThroughEditor = (): string => {
    if (!editor) return sanitizeRuleHtml(rawValue)
    editor.commands.setContent(sanitizeRuleHtml(rawValue), { emitUpdate: false })
    const canonical = editorHtmlForSave(editor.getHTML())
    setRawValue(canonical)
    onChange(canonical)
    return canonical
  }

  useImperativeHandle(ref, () => ({ prepareForSave: () => mode === 'html' ? syncRawThroughEditor() : editor ? editor.getHTML() : value }))

  const switchMode = (nextMode: 'visual' | 'html') => {
    if (nextMode === mode) return
    if (nextMode === 'html') {
      const current = editor ? editorHtmlForSave(editor.getHTML()) : value
      setRawValue(current)
      onChange(current)
      setMode('html')
      return
    }
    syncRawThroughEditor()
    setMode('visual')
  }

  const setFontSize = (size: '14' | '16' | '20', selection: TextSelectionRange) => {
    const chain = editor!.chain().setTextSelection(selection)
    if (size === '16') chain.unsetMark('fontSize').run()
    else chain.setMark('fontSize', { 'data-font-size': size }).run()
  }

  // Pointerdown captures the selection before focus can leave the editor.
  // The mark is intentionally applied on click: cancelled pointer gestures
  // must not mutate the document, and keyboard activation has no pointerdown.
  const selectedChain = () => editor!.isFocused ? editor!.chain() : editor!.chain().focus()
  const captureInlineSelection = () => {
    const nextEditor = editor!
    const nativeSelection = nextEditor.view.dom.ownerDocument.getSelection()
    if (nativeSelection?.anchorNode && nativeSelection.focusNode && nextEditor.view.dom.contains(nativeSelection.anchorNode) && nextEditor.view.dom.contains(nativeSelection.focusNode)) {
      const anchor = nextEditor.view.posAtDOM(nativeSelection.anchorNode, nativeSelection.anchorOffset)
      const head = nextEditor.view.posAtDOM(nativeSelection.focusNode, nativeSelection.focusOffset)
      const selection = TextSelection.between(nextEditor.state.doc.resolve(anchor), nextEditor.state.doc.resolve(head))
      inlineSelectionRef.current = { from: selection.from, to: selection.to }
      return
    }
    const { from, to } = nextEditor.state.selection
    inlineSelectionRef.current = { from, to }
  }
  const applyInlineFormat = (command: (selection: TextSelectionRange) => void) => {
    const { from, to } = editor!.state.selection
    const selection = inlineSelectionRef.current ?? { from, to }
    inlineSelectionRef.current = null
    command(selection)
    editor!.view.focus()
    editor!.commands.setTextSelection(selection)
  }

  const onTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    switchMode(mode === 'visual' ? 'html' : 'visual')
  }

  if (!editor) return <div className="mt-1 min-h-40 animate-pulse rounded-md border border-gray-300 bg-gray-50" aria-busy="true" />
  const active = toolbarState ?? toolbarStateFor(editor)!

  return <div className="rule-rich-editor mt-1">
    <div role="tablist" aria-label="Режим редактора описания" className="flex gap-1 border-b border-gray-200">
      <button id="rule-editor-visual-tab" type="button" role="tab" aria-selected={mode === 'visual'} aria-controls="rule-editor-visual-panel" tabIndex={mode === 'visual' ? 0 : -1} onClick={() => switchMode('visual')} onKeyDown={onTabKeyDown} className={`min-h-10 rounded-t px-3 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${mode === 'visual' ? 'bg-indigo-50 text-indigo-900' : 'text-gray-700 hover:bg-gray-50'}`}>Визуально</button>
      <button id="rule-editor-html-tab" type="button" role="tab" aria-selected={mode === 'html'} aria-controls="rule-editor-html-panel" tabIndex={mode === 'html' ? 0 : -1} onClick={() => switchMode('html')} onKeyDown={onTabKeyDown} className={`min-h-10 rounded-t px-3 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${mode === 'html' ? 'bg-indigo-50 text-indigo-900' : 'text-gray-700 hover:bg-gray-50'}`}>HTML</button>
    </div>
    {mode === 'visual' ? <div id="rule-editor-visual-panel" role="tabpanel" aria-labelledby="rule-editor-visual-tab" className={`rounded-b-md border bg-white shadow-sm focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500 ${error ? 'border-red-500' : 'border-gray-300'}`}>
      <div role="toolbar" aria-label="Форматирование описания правила" className="flex flex-wrap gap-1 border-b border-gray-200 p-2">
        <ToolButton label="Обычный абзац" active={active.paragraph} onClick={() => selectedChain().setParagraph().run()}>¶</ToolButton>
        <ToolButton label="Жирный" active={active.bold} onPointerDown={captureInlineSelection} onClick={() => applyInlineFormat(selection => editor.chain().setTextSelection(selection).toggleBold().run())}>B</ToolButton>
        <ToolButton label="Курсив" active={active.italic} onPointerDown={captureInlineSelection} onClick={() => applyInlineFormat(selection => editor.chain().setTextSelection(selection).toggleItalic().run())}><span className="italic">I</span></ToolButton>
        <ToolButton label="Подчёркнутый" active={active.underline} onPointerDown={captureInlineSelection} onClick={() => applyInlineFormat(selection => editor.chain().setTextSelection(selection).toggleUnderline().run())}><span className="underline">U</span></ToolButton>
        <ToolButton label="Маркированный список" active={active.bulletList} onClick={() => selectedChain().toggleBulletList().run()}>• Список</ToolButton>
        <ToolButton label="Нумерованный список" active={active.orderedList} onClick={() => selectedChain().toggleOrderedList().run()}>1. Список</ToolButton>
        <ToolButton label="Размер шрифта 14 px" active={active.size14} onPointerDown={captureInlineSelection} onClick={() => applyInlineFormat(selection => setFontSize('14', selection))}>14</ToolButton>
        <ToolButton label="Размер шрифта 16 px" active={active.size16} onPointerDown={captureInlineSelection} onClick={() => applyInlineFormat(selection => setFontSize('16', selection))}>16</ToolButton>
        <ToolButton label="Размер шрифта 20 px" active={active.size20} onPointerDown={captureInlineSelection} onClick={() => applyInlineFormat(selection => setFontSize('20', selection))}>20</ToolButton>
        <div className="relative">
          <ToolButton label="Вставить таблицу" pressed={false} onClick={() => setTablePickerOpen(open => !open)}>Таблица</ToolButton>
          {tablePickerOpen && <div className="absolute left-0 z-20 mt-1 w-60 rounded-md border border-gray-200 bg-white p-3 shadow-lg" role="dialog" aria-label="Размер таблицы">
            <p className="mb-2 text-sm text-gray-700">Выберите размер таблицы</p>
            <div className="grid grid-cols-5 gap-1">{Array.from({ length: 25 }, (_, index) => {
              const rows = Math.floor(index / 5) + 1, cols = (index % 5) + 1
              return <button key={`${rows}-${cols}`} type="button" className="h-10 rounded border border-gray-300 text-xs hover:border-indigo-600 hover:bg-indigo-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500" aria-label={`Таблица ${rows} на ${cols}`} onClick={() => { selectedChain().insertTable({ rows, cols, withHeaderRow: false }).run(); setTablePickerOpen(false) }}>{rows}×{cols}</button>
            })}</div>
          </div>}
        </div>
      </div>
      <EditorContent editor={editor} />
    </div> : <div id="rule-editor-html-panel" role="tabpanel" aria-labelledby="rule-editor-html-tab">
      <textarea id="rule-description" value={rawValue} onChange={event => { const next = event.target.value; setRawValue(next); onChange(next) }} aria-invalid={Boolean(error)} aria-describedby={error ? 'rule-description-error' : undefined} spellCheck={false} className={`min-h-40 w-full rounded-b-md border bg-white p-3 font-mono text-sm text-gray-900 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 ${error ? 'border-red-500' : 'border-gray-300'}`} />
    </div>}
    {error && <p id="rule-description-error" className="mt-1 text-sm text-red-700">{error}</p>}
  </div>
})
