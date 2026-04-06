import {
  ALUNO_EVENTO_TIPOS,
  type AlunoEvento,
  type AlunoEventoTipo,
} from '@/data/aluno-eventos'
import type { DatabaseAlunoEvento } from '@/types/database'

function isTipo(v: string): v is AlunoEventoTipo {
  return (ALUNO_EVENTO_TIPOS as readonly string[]).includes(v)
}

export function mapRowToAlunoEvento(row: DatabaseAlunoEvento): AlunoEvento {
  if (!isTipo(row.tipo)) {
    throw new Error(`tipo de evento inválido: ${row.tipo}`)
  }
  return {
    id: row.id,
    tipo: row.tipo,
    startAt: row.start_at,
    endAt: row.end_at,
    title: row.title,
    seriesLabel: row.series_label ?? undefined,
    description: row.description,
  }
}
