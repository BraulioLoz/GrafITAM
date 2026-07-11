import { describe, expect, it } from 'vitest'
import { clearPlannedWhereApproved } from './enforceInvariant'
import { approveWithAncestors } from './dfsApprove'
import type { PlanData } from '../types/curriculum'
import type { UserStateMap } from '../types/store'

describe('clearPlannedWhereApproved', () => {
  it('limpia planeada cuando aprobada y planeada coexisten', () => {
    const userState: UserStateMap = {
      A: { aprobada: true, planeada: true, semestrePlaneado: 1 },
    }

    const next = clearPlannedWhereApproved(userState)
    expect(next.A).toEqual({ aprobada: true, planeada: false, semestrePlaneado: 1 })
  })

  it('no toca materias sin conflicto', () => {
    const userState: UserStateMap = {
      A: { aprobada: true, planeada: false, semestrePlaneado: 1 },
      B: { aprobada: false, planeada: true, semestrePlaneado: 2 },
      C: { aprobada: false, planeada: false, semestrePlaneado: 3 },
    }

    const next = clearPlannedWhereApproved(userState)
    expect(next).toEqual(userState)
  })

  it('regresión: limpia planeada en un ancestro auto-aprobado por approveWithAncestors', () => {
    // MAT2 requiere MAT1. El usuario había marcado MAT1 como "planeada" (sin aprobar aún)
    // y luego aprueba MAT2 directamente — approveWithAncestors sube por prerreqs y
    // marca MAT1 como aprobada, pero no toca su flag `planeada`. Reproduce el bug original
    // de toggleApproval en curriculumStore.ts.
    const planData: PlanData = {
      MAT1: { id: 'MAT1', nombre: 'MAT1', creditos: 8, semestre: 1, prerreqs: [], danglingPrerreqs: [], coreqGroup: [] },
      MAT2: { id: 'MAT2', nombre: 'MAT2', creditos: 8, semestre: 2, prerreqs: ['MAT1'], danglingPrerreqs: [], coreqGroup: [] },
    }
    const userState: UserStateMap = {
      MAT1: { aprobada: false, planeada: true, semestrePlaneado: 1 },
      MAT2: { aprobada: false, planeada: false, semestrePlaneado: 2 },
    }

    let next = approveWithAncestors('MAT2', planData, userState)
    expect(next.MAT1.aprobada).toBe(true)
    expect(next.MAT1.planeada).toBe(true) // todavía sin limpiar en este punto

    next = clearPlannedWhereApproved(next)
    expect(next.MAT1).toEqual({ aprobada: true, planeada: false, semestrePlaneado: 1 })
  })
})
