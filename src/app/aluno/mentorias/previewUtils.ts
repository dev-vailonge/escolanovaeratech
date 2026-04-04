import type { MentoriaWithSteps } from '@/types/database'

/** Resposta de GET /api/admin/mentorias/[id] → mesmo formato esperado pela timeline do aluno */
export function adminMentoriaDetailToWithSteps(raw: Record<string, unknown>): MentoriaWithSteps {
  const steps = (raw.steps as MentoriaWithSteps['steps']) || []
  const enabledSteps = steps.filter((s) => s.habilitado)
  const doneSteps = enabledSteps.filter((s) => s.status === 'concluido')
  const progressPercent =
    enabledSteps.length === 0 ? 0 : Math.round((doneSteps.length / enabledSteps.length) * 100)

  const { steps: _s, ...rest } = raw
  return {
    ...(rest as Omit<MentoriaWithSteps, 'steps' | 'progressPercent'>),
    steps,
    progressPercent,
  }
}
