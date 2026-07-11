import type { ScheduleData, ScheduleGroup, HorarioPeriodo } from '../types/schedule'

type RawScheduleData = Record<string, Array<Omit<ScheduleGroup, 'courseId'>>>

// Vite glob path is relative to project root (starts with /). Incluye index.json,
// que se filtra explícitamente al buscar los datos de un periodo.
const modules = import.meta.glob('/jsonHorarios/*.json', { eager: true, import: 'default' }) as Record<
  string,
  RawScheduleData | HorarioPeriodo[]
>

export const horarioPeriodos: HorarioPeriodo[] =
  (modules['/jsonHorarios/index.json'] as HorarioPeriodo[] | undefined) ?? []

export function defaultPeriodoSlug(): string | null {
  return horarioPeriodos[horarioPeriodos.length - 1]?.slug ?? null
}

export function loadHorariosForPeriodo(slug: string): ScheduleData {
  const raw = modules[`/jsonHorarios/${slug}.json`] as RawScheduleData | undefined
  if (!raw) return {}

  const data: ScheduleData = {}
  for (const [courseId, groups] of Object.entries(raw)) {
    data[courseId] = groups.map((g) => ({ ...g, courseId }))
  }
  return data
}
