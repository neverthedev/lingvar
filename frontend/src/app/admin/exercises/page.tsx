'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ApiService, ExerciseMetadata } from '@/lib/api'
import { Button, PageLayout, Typography } from '@/components'
export default function AdminExercises() { const [items,setItems]=useState<ExerciseMetadata[]>([]); const [error,setError]=useState(''); useEffect(() => { void ApiService.getAdminExercises().then(setItems).catch(reason => setError(reason.message)) }, []); return <PageLayout showFooter={false}><div className="mx-auto max-w-4xl p-8"><div className="flex justify-between"><Typography variant="h1">Упражнения</Typography><Link href="/admin/exercises/new"><Button>Создать</Button></Link></div>{error && <p className="mt-4 text-red-700">{error}</p>}<ul className="mt-6 space-y-2">{items.map(item => <li key={item.id} className="rounded border p-3"><Link href={`/admin/exercises/${item.id}`} className="font-medium">{item.title}</Link><span className="ml-3 text-sm text-gray-600">{item.type_code} · {item.status}</span></li>)}</ul></div></PageLayout> }
