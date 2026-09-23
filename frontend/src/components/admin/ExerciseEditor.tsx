'use client'

import { Button, Input } from '@/components'
import {
  ExerciseDefinition,
  ExerciseTypeCode,
  FillBlanksDefinition,
  FormTableDefinition,
  SelfCheckDefinition,
  SingleInputDefinition,
} from '@/lib/api'

export type ExerciseFieldErrors = Record<string, string[]>

type EditorProps<T extends ExerciseDefinition = ExerciseDefinition> = {
  definition: T
  onChange: (value: ExerciseDefinition) => void
  errors: ExerciseFieldErrors
  blankRuleOptions?: Array<{ id: number; path: string }>
  ruleSelected?: boolean
}

function FieldErrors({ errors }: { errors: string[] }) {
  if (errors.length === 0) return null
  return <ul className="mt-1 list-disc pl-5 text-sm text-red-700">{errors.map((error, index) => <li key={index}>{error}</li>)}</ul>
}

const sourceColumns: Record<string, Array<{key:string;label:string}>> = {
  nouns_singular_cases: ['dopełniacz','celownik','biernik','narzędnik','miejscownik','wołacz'].map(key => ({key,label:key})),
  pronouns_cases: ['dopełniacz','celownik','biernik','narzędnik','miejscownik','wołacz'].map(key => ({key,label:key})),
  verbs_present_cases: [{key:'ja',label:'Ja'},{key:'ono',label:'On/Ona/Ono'},{key:'ty',label:'Ty'},{key:'my',label:'My'},{key:'wy',label:'Wy'},{key:'one',label:'Oni/One'}],
}

const typeSources = {
  form_table: Object.keys(sourceColumns),
  single_input: ['numerators_translation_to_word', 'nouns_singular_to_plural_nominative'],
  self_check: ['nouns_singular_genitive', 'nouns_plural_genitive'],
} as const

const move = <T,>(values: T[], from: number, to: number): T[] => {
  const result = [...values]
  const [item] = result.splice(from, 1)
  result.splice(to, 0, item)
  return result
}

export const initialDefinitions: Record<ExerciseTypeCode, () => ExerciseDefinition> = {
  form_table: () => ({source_code:'nouns_singular_cases',columns:[sourceColumns.nouns_singular_cases[0]],sample_size:20,max_attempts:3}),
  single_input: () => ({source_code:'numerators_translation_to_word',sample_size:20,max_attempts:3,reveal_after_exhaustion:true}),
  self_check: () => ({source_code:'nouns_singular_genitive',sample_size:50}),
  fill_blanks: () => ({items:[{id:'sentence-1',parts:[{kind:'text',text:''},{kind:'blank',id:'blank-1',hint:null,rule_id:null,accepted_answers:['']}]}]}),
}

export function initialDefinition(type: ExerciseTypeCode): ExerciseDefinition {
  return initialDefinitions[type]()
}

function SourceSettings({ definition, sources, onSourceChange, onSampleSizeChange, errors }: {
  definition: FormTableDefinition | SingleInputDefinition | SelfCheckDefinition
  sources: readonly string[]
  onSourceChange: (source: string) => void
  onSampleSizeChange: (sampleSize: number | null) => void
  errors: ExerciseFieldErrors
}) {
  const fieldErrors = (path: string) => errors[path] ?? []
  return <div className="space-y-3">
    <label className="block">Источник
      <select className="ml-2 rounded border p-2" value={definition.source_code} onChange={event => onSourceChange(event.target.value)}>
        {sources.map(source => <option key={source}>{source}</option>)}
      </select>
      <FieldErrors errors={fieldErrors('definition.source_code')} />
    </label>
    <label className="block">Количество (пусто — все)
      <Input value={definition.sample_size ?? ''} type="number" onChange={event => onSampleSizeChange(event.target.value ? Number(event.target.value) : null)} />
      <FieldErrors errors={fieldErrors('definition.sample_size')} />
    </label>
  </div>
}

function FormTableEditor({ definition, onChange, errors }: EditorProps<FormTableDefinition>) {
  const fieldErrors = (path: string) => errors[path] ?? []
  return <div className="space-y-3">
    <SourceSettings definition={definition} sources={typeSources.form_table} onSourceChange={source => onChange({...definition, source_code: source, columns: sourceColumns[source]})} onSampleSizeChange={sample_size => onChange({...definition, sample_size})} errors={errors} />
    <p className="font-medium">Колонки</p>
    {definition.columns.map((column, index) => <div key={index} className="mb-2"><div className="flex gap-2"><Input value={column.key} placeholder="Ключ" onChange={event => onChange({...definition,columns:definition.columns.map((value,i) => i === index ? {...value,key:event.target.value} : value)})}/><Input value={column.label} placeholder="Подпись" onChange={event => onChange({...definition,columns:definition.columns.map((value,i) => i === index ? {...value,label:event.target.value} : value)})}/><Button size="sm" variant="secondary" onClick={() => onChange({...definition,columns:definition.columns.filter((_,i) => i !== index)})}>Удалить</Button></div><FieldErrors errors={[...fieldErrors(`definition.columns.${index}.key`), ...fieldErrors(`definition.columns.${index}.label`), ...fieldErrors(`definition.columns.${index}`)]} /></div>)}
    <FieldErrors errors={fieldErrors('definition.columns')} />
    <Button size="sm" onClick={() => onChange({...definition,columns:[...definition.columns,{key:'',label:''}]})}>Добавить колонку</Button>
  </div>
}

function SingleInputEditor({ definition, onChange, errors }: EditorProps<SingleInputDefinition>) {
  return <SourceSettings definition={definition} sources={typeSources.single_input} onSourceChange={source_code => onChange({...definition, source_code})} onSampleSizeChange={sample_size => onChange({...definition, sample_size})} errors={errors} />
}

function SelfCheckEditor({ definition, onChange, errors }: EditorProps<SelfCheckDefinition>) {
  return <SourceSettings definition={definition} sources={typeSources.self_check} onSourceChange={source_code => onChange({...definition, source_code})} onSampleSizeChange={sample_size => onChange({...definition, sample_size})} errors={errors} />
}

function FillBlanksEditor({ definition, onChange, errors, blankRuleOptions = [], ruleSelected = false }: EditorProps<FillBlanksDefinition>) {
  const updateItem = (itemIndex:number, update:(item:FillBlanksDefinition['items'][number]) => FillBlanksDefinition['items'][number]) => onChange({...definition,items:definition.items.map((item,index) => index === itemIndex ? update(item) : item)})
  const fieldErrors = (path: string) => errors[path] ?? []
  return <div className="space-y-4"><FieldErrors errors={fieldErrors('definition.items')} />{definition.items.map((item, itemIndex) => <div key={`${item.id}-${itemIndex}`} className="rounded border p-3"><div className="flex gap-2"><Input value={item.id} placeholder="ID элемента" onChange={event => updateItem(itemIndex, value => ({...value,id:event.target.value}))}/><Button size="sm" variant="secondary" disabled={itemIndex===0} onClick={() => onChange({...definition,items:move(definition.items,itemIndex,itemIndex-1)})}>↑</Button><Button size="sm" variant="secondary" disabled={itemIndex===definition.items.length-1} onClick={() => onChange({...definition,items:move(definition.items,itemIndex,itemIndex+1)})}>↓</Button><Button size="sm" variant="secondary" onClick={() => onChange({...definition,items:definition.items.filter((_,index) => index !== itemIndex)})}>Удалить элемент</Button></div><FieldErrors errors={fieldErrors(`definition.items.${itemIndex}.id`)} />{item.parts.map((part, partIndex) => { const path = `definition.items.${itemIndex}.parts.${partIndex}`; const partKey = part.kind === 'blank' ? part.id : partIndex; return <div className="mt-2 rounded bg-gray-50 p-2" key={`${part.kind}-${partKey}-${partIndex}`}><div className="flex gap-2">{part.kind === 'text' ? <Input value={part.text} placeholder="Текст" onChange={event => updateItem(itemIndex, value => ({...value,parts:value.parts.map((current,index) => index === partIndex ? {...current,text:event.target.value} : current)}))}/> : <div className="grid flex-1 gap-2 md:grid-cols-4"><Input value={part.id} placeholder="ID пропуска" onChange={event => updateItem(itemIndex, value => ({...value,parts:value.parts.map((current,index) => index === partIndex ? {...current,id:event.target.value} : current)}))}/><Input value={part.hint ?? ''} placeholder="Подсказка" onChange={event => updateItem(itemIndex, value => ({...value,parts:value.parts.map((current,index) => index === partIndex ? {...current,hint:event.target.value || null} : current)}))}/><Input value={part.accepted_answers.join(', ')} placeholder="Ответы через запятую" onChange={event => updateItem(itemIndex, value => ({...value,parts:value.parts.map((current,index) => index === partIndex ? {...current,accepted_answers:event.target.value.split(',').map(answer => answer.trim())} : current)}))}/><label>Правило пропуска (необязательно)<select className="mt-1 block w-full rounded border p-2" disabled={!ruleSelected} value={part.rule_id ?? ''} onChange={event => updateItem(itemIndex, value => ({...value,parts:value.parts.map((current,index) => index === partIndex ? {...current,rule_id:event.target.value ? Number(event.target.value) : null} : current)}))}><option value="">Не задано</option>{blankRuleOptions.map(rule => <option key={rule.id} value={rule.id}>{rule.path}</option>)}</select></label></div>}<Button size="sm" variant="secondary" disabled={partIndex===0} onClick={() => updateItem(itemIndex,value => ({...value,parts:move(value.parts,partIndex,partIndex-1)}))}>↑</Button><Button size="sm" variant="secondary" disabled={partIndex===item.parts.length-1} onClick={() => updateItem(itemIndex,value => ({...value,parts:move(value.parts,partIndex,partIndex+1)}))}>↓</Button><Button size="sm" variant="secondary" onClick={() => updateItem(itemIndex,value => ({...value,parts:value.parts.filter((_,index) => index !== partIndex)}))}>Удалить</Button></div><FieldErrors errors={Object.entries(errors).filter(([errorPath]) => errorPath.startsWith(path)).flatMap(([, messages]) => messages)} /></div>})}<div className="mt-2 flex gap-2"><Button size="sm" onClick={() => updateItem(itemIndex,value => ({...value,parts:[...value.parts,{kind:'text',text:''}]}))}>Текст</Button><Button size="sm" onClick={() => updateItem(itemIndex,value => ({...value,parts:[...value.parts,{kind:'blank',id:'',hint:null,rule_id:null,accepted_answers:['']}]}))}>Пропуск</Button></div></div>)}<Button size="sm" onClick={() => onChange({...definition,items:[...definition.items,{id:'',parts:[{kind:'text',text:''}]}]})}>Добавить элемент</Button></div>
}

const editorRegistry: Record<ExerciseTypeCode, (props: EditorProps<any>) => JSX.Element> = {
  form_table: FormTableEditor,
  single_input: SingleInputEditor,
  self_check: SelfCheckEditor,
  fill_blanks: FillBlanksEditor,
}

export function ExerciseEditor({ type, definition, onChange, errors = {}, blankRuleOptions, ruleSelected }: {type: ExerciseTypeCode; definition: ExerciseDefinition; onChange: (value: ExerciseDefinition) => void; errors?: ExerciseFieldErrors; blankRuleOptions?: Array<{ id: number; path: string }>; ruleSelected?: boolean}) {
  const Editor = editorRegistry[type]
  return <Editor definition={definition} onChange={onChange} errors={errors} blankRuleOptions={blankRuleOptions} ruleSelected={ruleSelected} />
}
