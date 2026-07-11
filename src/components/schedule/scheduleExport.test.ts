import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import ExcelJS from 'exceljs'
import { downloadScheduleWorkbook } from './scheduleExport'
import type { SavedSchedule, ScheduleData, ScheduleGroup } from '../../types/schedule'
import { getCourseColor } from './coursePalette'

function makeGroup(overrides: Partial<ScheduleGroup>): ScheduleGroup {
  return {
    courseId: 'MAT-14100',
    crn: '1111',
    grupo: '001',
    nombre: 'CALCULO I',
    profesor: 'Profesor Uno',
    horario: '09:00-10:30',
    dias: 'LU MI',
    salon: 'RH101',
    campus: 'RIO HONDO',
    ...overrides,
  }
}

// downloadScheduleWorkbook dispara un descargable vía APIs de navegador (Blob, URL,
// document.createElement) que no existen en el entorno de test (vitest corre en node) —
// se simulan para capturar el buffer del .xlsx generado y releerlo con ExcelJS.
let capturedParts: BlobPart[] | null = null

beforeEach(() => {
  capturedParts = null
  vi.stubGlobal(
    'Blob',
    class {
      constructor(parts: BlobPart[]) {
        capturedParts = parts
      }
    },
  )
  vi.stubGlobal('URL', { createObjectURL: () => 'blob:fake', revokeObjectURL: () => {} })
  vi.stubGlobal('document', {
    createElement: () => ({ click: () => {}, href: '', download: '' }),
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('downloadScheduleWorkbook', () => {
  it('genera una hoja por horario guardado, con nombre, grid coloreado y tabla de CRNs', async () => {
    const groupsByCourse: ScheduleData = {
      'MAT-14100': [makeGroup({ courseId: 'MAT-14100', crn: '1111', horario: '09:00-10:30', dias: 'LU MI' })],
      'ACT-11300': [
        makeGroup({
          courseId: 'ACT-11300',
          crn: '2222',
          nombre: 'CALCULO ACTUARIAL I',
          profesor: 'Profesor Dos',
          horario: '11:00-12:30',
          dias: 'MA JU',
          salon: 'RH205',
        }),
      ],
    }
    const courseNames = { 'MAT-14100': 'Cálculo Diferencial e Integral I', 'ACT-11300': 'Cálculo Actuarial I' }
    const orderedCourseIds = ['MAT-14100', 'ACT-11300']

    const schedules: SavedSchedule[] = [
      { id: 'a', name: 'Opción A', selectedGroups: { 'MAT-14100': '1111', 'ACT-11300': '2222' } },
      { id: 'b', name: 'Opción B', selectedGroups: { 'MAT-14100': '1111' } },
    ]

    await downloadScheduleWorkbook(schedules, groupsByCourse, courseNames, orderedCourseIds, 'otono_2026')

    expect(capturedParts).not.toBeNull()
    const buffer = capturedParts![0] as ArrayBuffer

    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(buffer)

    expect(workbook.worksheets.map((s) => s.name)).toEqual(['Opción A', 'Opción B'])

    const sheetA = workbook.getWorksheet('Opción A')!
    // Encabezados de día
    expect(sheetA.getCell(1, 2).value).toBe('LUNES')
    expect(sheetA.getCell(1, 3).value).toBe('MARTES')

    // Columna de horas
    expect(sheetA.getCell(2, 1).value).toBe('07:00 - 07:30')

    // Bloque de MAT-14100: 09:00-10:30 -> slots 4..5 (filas 6..7), col B (lunes)
    const matCell = sheetA.getCell(6, 2)
    expect(String(matCell.value)).toContain('MAT-14100')
    expect(String(matCell.value)).toContain('Cálculo Diferencial e Integral I')
    expect(String(matCell.value)).toContain('Profesor Uno')
    const matColor = getCourseColor('MAT-14100', orderedCourseIds)
    expect(matCell.fill).toMatchObject({
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: `FF${matColor.bg.replace('#', '').toUpperCase()}` },
    })

    // La celda combinada debe cubrir 09:00-10:30 (3 franjas de 30 min: filas 6-8)
    const merge = sheetA.model.merges.find((m) => m.startsWith('B6:'))
    expect(merge).toBe('B6:B8')

    // Tabla de CRNs a la derecha
    const tableHeaderCol = 2 + 6 + 1 // días (6) + 1 columna de separación
    expect(sheetA.getCell(1, tableHeaderCol).value).toBe('Materia')
    expect(sheetA.getCell(1, tableHeaderCol + 1).value).toBe('CRNs')
    expect(sheetA.getCell(1, tableHeaderCol + 2).value).toBe('2da Opción')
    expect(sheetA.getCell(2, tableHeaderCol).value).toBe('MAT-14100')
    expect(sheetA.getCell(2, tableHeaderCol + 1).value).toBe('1111')
    expect(sheetA.getCell(2, tableHeaderCol + 2).value).toBeNull() // vacía para llenar a mano

    const sheetB = workbook.getWorksheet('Opción B')!
    expect(sheetB.getCell(6, 2).value).not.toBeNull()
    expect(sheetB.getCell(6, 3)?.value ?? null).toBeNull() // ACT-11300 no está en esta opción
  })

  it('evita nombres de hoja duplicados si dos horarios comparten nombre', async () => {
    const schedules: SavedSchedule[] = [
      { id: 'a', name: 'Opción A', selectedGroups: {} },
      { id: 'b', name: 'Opción A', selectedGroups: {} },
    ]
    await downloadScheduleWorkbook(schedules, {}, {}, [], 'periodo')
    const buffer = capturedParts![0] as ArrayBuffer
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(buffer)
    expect(workbook.worksheets.map((s) => s.name)).toEqual(['Opción A', 'Opción A (2)'])
  })
})
