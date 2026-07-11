import type { ScheduleData, ScheduleGroup, SelectedGroups } from '../types/schedule'
import { groupsOverlap } from './scheduleOverlap'

export function autoAssignSchedule(groupsByCourse: ScheduleData): SelectedGroups {
  const courseIds = Object.keys(groupsByCourse)
  let best: SelectedGroups = {}
  let bestCount = 0

  function backtrack(index: number, current: SelectedGroups, currentCount: number, selected: ScheduleGroup[]) {
    if (currentCount > bestCount) {
      best = { ...current }
      bestCount = currentCount
    }
    if (index >= courseIds.length) return
    if (currentCount + (courseIds.length - index) <= bestCount) return

    const courseId = courseIds[index]
    const groups = groupsByCourse[courseId] ?? []

    for (const group of groups) {
      if (selected.every((g) => !groupsOverlap(g, group))) {
        current[courseId] = group.crn
        selected.push(group)
        backtrack(index + 1, current, currentCount + 1, selected)
        selected.pop()
        delete current[courseId]
      }
    }

    backtrack(index + 1, current, currentCount, selected)
  }

  backtrack(0, {}, 0, [])
  return best
}
