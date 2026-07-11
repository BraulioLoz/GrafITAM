import { describe, expect, it } from 'vitest'
import { validateTopology } from './topoValidate'
import type { PlanData } from '../types/curriculum'
import type { UserStateMap } from '../types/store'

function course(id: string, semestre: number, prerreqs: string[] = []): PlanData[string] {
  return { id, nombre: id, creditos: 8, semestre, prerreqs, danglingPrerreqs: [], coreqGroup: [] }
}

function state(overrides: UserStateMap): UserStateMap {
  return overrides
}

describe('validateTopology', () => {
  it('reporta error cuando el prerreq queda en semestre igual o posterior (caso normal)', () => {
    const planData: PlanData = {
      A: course('A', 1),
      B: course('B', 1, ['A']), // B en el mismo semestre que su prereq A: inválido
    }
    const userState = state({
      A: { aprobada: false, planeada: false, semestrePlaneado: 1 },
      B: { aprobada: false, planeada: false, semestrePlaneado: 1 },
    })

    const errors = validateTopology(planData, userState)
    expect(errors).toEqual([{ courseId: 'B', prereqId: 'A' }])
  })

  it('no reporta error si el prerreq ya está aprobado, sin importar su semestrePlaneado', () => {
    const planData: PlanData = {
      A: course('A', 1),
      B: course('B', 2, ['A']),
    }
    const userState = state({
      A: { aprobada: true, planeada: false, semestrePlaneado: 5 }, // semestre "inconsistente" pero ya cursada
      B: { aprobada: false, planeada: true, semestrePlaneado: 2 },
    })

    const errors = validateTopology(planData, userState)
    expect(errors).toEqual([])
  })

  it('no reporta error si la materia en sí ya está aprobada', () => {
    const planData: PlanData = {
      A: course('A', 3),
      B: course('B', 1, ['A']), // B "antes" que su prereq A, pero B ya está aprobada
    }
    const userState = state({
      A: { aprobada: false, planeada: false, semestrePlaneado: 3 },
      B: { aprobada: true, planeada: false, semestrePlaneado: 1 },
    })

    const errors = validateTopology(planData, userState)
    expect(errors).toEqual([])
  })
})
