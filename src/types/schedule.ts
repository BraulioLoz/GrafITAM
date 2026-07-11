export interface ScheduleGroup {
  courseId: string
  crn: string
  grupo: string
  nombre: string
  profesor: string
  horario: string
  dias: string
  salon: string
  campus: string
}

export type ScheduleData = Record<string, ScheduleGroup[]>
export type SelectedGroups = Record<string, string>

export interface HorarioPeriodo {
  slug: string
  label: string
  sCode: string
  scrapedAt: string
  materiasConGrupos: number
}

export interface SavedSchedule {
  id: string
  name: string
  selectedGroups: SelectedGroups
}

export interface ScheduleState {
  selectedPeriodo: string | null
  groupsByCourse: ScheduleData
  selectedGroups: SelectedGroups

  schedulesByPeriodo: Record<string, SavedSchedule[]>
  activeScheduleIdByPeriodo: Record<string, string>
  manualCourseIdsByPeriodo: Record<string, string[]>

  setPeriodo: (slug: string) => void
  selectGroup: (courseId: string, crn: string) => void
  clearGroup: (courseId: string) => void
  autoAssign: (courseIds: string[]) => void
  resetSchedule: () => void

  createSchedule: (name?: string) => void
  renameSchedule: (id: string, name: string) => void
  deleteSchedule: (id: string) => void
  duplicateSchedule: (id: string, newName?: string) => void
  setActiveSchedule: (id: string) => void

  addManualCourse: (courseId: string) => void
  removeManualCourse: (courseId: string) => void
}
