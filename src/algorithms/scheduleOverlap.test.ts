import { describe, expect, it } from 'vitest'
import { parseHorario, parseDias, groupsOverlap } from './scheduleOverlap'
import type { ScheduleGroup } from '../types/schedule'

function group(overrides: Partial<ScheduleGroup>): ScheduleGroup {
  return {
    courseId: 'MAT-14101',
    crn: '2341',
    grupo: '001',
    nombre: 'CALCULO DIF. E INT., II',
    profesor: 'Prof.',
    horario: '09:00-10:30',
    dias: 'LU MI VI',
    salon: 'RH302',
    campus: 'RIO HONDO',
    ...overrides,
  }
}

describe('parseHorario', () => {
  it('convierte "09:00-10:30" a minutos desde medianoche', () => {
    expect(parseHorario('09:00-10:30')).toEqual({ inicio: 540, fin: 630 })
  })
})

describe('parseDias', () => {
  it('separa "LU MI VI" en tokens', () => {
    expect(parseDias('LU MI VI')).toEqual(['LU', 'MI', 'VI'])
  })
})

describe('groupsOverlap', () => {
  it('detecta traslape en el mismo día con rango de horas cruzado', () => {
    const a = group({ dias: 'LU MI VI', horario: '09:00-10:30' })
    const b = group({ courseId: 'COM-11302', crn: '9999', dias: 'LU', horario: '10:00-11:00' })
    expect(groupsOverlap(a, b)).toBe(true)
  })

  it('no hay traslape si los días no coinciden', () => {
    const a = group({ dias: 'LU MI VI', horario: '09:00-10:30' })
    const b = group({ courseId: 'COM-11302', crn: '9999', dias: 'MA JU', horario: '09:00-10:30' })
    expect(groupsOverlap(a, b)).toBe(false)
  })

  it('no hay traslape cuando un horario termina justo cuando empieza el otro', () => {
    const a = group({ dias: 'LU', horario: '09:00-10:30' })
    const b = group({ courseId: 'COM-11302', crn: '9999', dias: 'LU', horario: '10:30-12:00' })
    expect(groupsOverlap(a, b)).toBe(false)
  })
})
