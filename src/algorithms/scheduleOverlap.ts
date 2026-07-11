import type { ScheduleGroup } from '../types/schedule'

export function parseHorario(horario: string): { inicio: number; fin: number } {
  const match = horario.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/)
  if (!match) return { inicio: 0, fin: 0 }
  const [, h1, m1, h2, m2] = match
  return {
    inicio: Number(h1) * 60 + Number(m1),
    fin: Number(h2) * 60 + Number(m2),
  }
}

export function parseDias(dias: string): string[] {
  return dias.trim().split(/\s+/).filter(Boolean)
}

export function groupsOverlap(a: ScheduleGroup, b: ScheduleGroup): boolean {
  const diasA = parseDias(a.dias)
  const diasB = parseDias(b.dias)
  if (!diasA.some((d) => diasB.includes(d))) return false

  const rangoA = parseHorario(a.horario)
  const rangoB = parseHorario(b.horario)
  return rangoA.inicio < rangoB.fin && rangoB.inicio < rangoA.fin
}
