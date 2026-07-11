import { describe, expect, it } from 'vitest'
import { autoAssignSchedule } from './scheduleAssign'
import type { ScheduleData, ScheduleGroup } from '../types/schedule'

function group(courseId: string, crn: string, dias: string, horario: string): ScheduleGroup {
  return { courseId, crn, grupo: crn, nombre: courseId, profesor: '', horario, dias, salon: '', campus: '' }
}

describe('autoAssignSchedule', () => {
  it('asigna un grupo a cada materia cuando todas caben sin traslape', () => {
    const data: ScheduleData = {
      'MAT-14101': [group('MAT-14101', '1', 'LU MI VI', '09:00-10:30')],
      'COM-11302': [group('COM-11302', '2', 'MA JU', '09:00-10:30')],
    }
    const result = autoAssignSchedule(data)
    expect(result).toEqual({ 'MAT-14101': '1', 'COM-11302': '2' })
  })

  it('deja fuera la materia que no tiene ningún grupo sin traslape', () => {
    const data: ScheduleData = {
      'MAT-14101': [group('MAT-14101', '1', 'LU MI VI', '09:00-10:30')],
      'COM-11302': [group('COM-11302', '2', 'LU', '09:30-10:30')], // se traslapa con MAT-14101 en LU
    }
    const result = autoAssignSchedule(data)
    expect(Object.keys(result)).toHaveLength(1)
    expect(result['MAT-14101']).toBe('1')
  })

  it('elige un grupo alternativo sin traslape si existe', () => {
    const data: ScheduleData = {
      'MAT-14101': [group('MAT-14101', '1', 'LU MI VI', '09:00-10:30')],
      'COM-11302': [
        group('COM-11302', '2', 'LU', '09:30-10:30'), // choca
        group('COM-11302', '3', 'MA JU', '09:00-10:30'), // no choca
      ],
    }
    const result = autoAssignSchedule(data)
    expect(result).toEqual({ 'MAT-14101': '1', 'COM-11302': '3' })
  })

  it('nunca asigna más de un grupo por materia', () => {
    const data: ScheduleData = {
      'MAT-14101': [
        group('MAT-14101', '1', 'LU', '09:00-10:30'),
        group('MAT-14101', '2', 'MA', '09:00-10:30'),
      ],
    }
    const result = autoAssignSchedule(data)
    expect(Object.keys(result)).toHaveLength(1)
  })
})
