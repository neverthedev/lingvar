import { ExerciseForm } from '@/components/admin/ExerciseForm'
export default function EditExercisePage({ params }: {params:{id:string}}) { return <ExerciseForm exerciseId={Number(params.id)} /> }
