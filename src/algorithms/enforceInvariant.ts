import type { UserStateMap } from '../types/store'

export function clearPlannedWhereApproved(userState: UserStateMap): UserStateMap {
  const next = { ...userState }
  for (const id of Object.keys(next)) {
    if (next[id]?.aprobada && next[id]?.planeada) {
      next[id] = { ...next[id], planeada: false }
    }
  }
  return next
}
