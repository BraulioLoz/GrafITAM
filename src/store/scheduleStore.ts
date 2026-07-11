import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { ScheduleState, SavedSchedule, SelectedGroups } from '../types/schedule'
import { autoAssignSchedule } from '../algorithms/scheduleAssign'
import { defaultPeriodoSlug, loadHorariosForPeriodo } from '../data/horariosLoader'

const genId = () => Math.random().toString(36).slice(2, 10)

function defaultSchedule(name = 'Opción A'): SavedSchedule {
  return { id: genId(), name, selectedGroups: {} }
}

function ensureSchedules(
  schedulesByPeriodo: Record<string, SavedSchedule[]>,
  activeScheduleIdByPeriodo: Record<string, string>,
  periodo: string,
): { schedules: SavedSchedule[]; activeId: string } {
  let schedules = schedulesByPeriodo[periodo]
  if (!schedules || schedules.length === 0) {
    schedules = [defaultSchedule()]
  }
  let activeId = activeScheduleIdByPeriodo[periodo]
  if (!activeId || !schedules.some((s) => s.id === activeId)) {
    activeId = schedules[0].id
  }
  return { schedules, activeId }
}

export const useScheduleStore = create<ScheduleState>()(
  persist(
    (set, get) => {
      const writeActiveSelectedGroups = (periodo: string, groups: SelectedGroups) => {
        const { schedulesByPeriodo, activeScheduleIdByPeriodo } = get()
        const activeId = activeScheduleIdByPeriodo[periodo]
        const schedules = (schedulesByPeriodo[periodo] ?? []).map((s) =>
          s.id === activeId ? { ...s, selectedGroups: groups } : s,
        )
        set({
          schedulesByPeriodo: { ...schedulesByPeriodo, [periodo]: schedules },
          selectedGroups: groups,
        })
      }

      return {
        selectedPeriodo: null,
        groupsByCourse: {},
        selectedGroups: {},
        schedulesByPeriodo: {},
        activeScheduleIdByPeriodo: {},
        manualCourseIdsByPeriodo: {},

        setPeriodo: (slug) => {
          const { schedulesByPeriodo, activeScheduleIdByPeriodo } = get()
          const { schedules, activeId } = ensureSchedules(schedulesByPeriodo, activeScheduleIdByPeriodo, slug)
          const active = schedules.find((s) => s.id === activeId)!
          set({
            selectedPeriodo: slug,
            groupsByCourse: loadHorariosForPeriodo(slug),
            schedulesByPeriodo: { ...schedulesByPeriodo, [slug]: schedules },
            activeScheduleIdByPeriodo: { ...activeScheduleIdByPeriodo, [slug]: activeId },
            selectedGroups: active.selectedGroups,
          })
        },

        selectGroup: (courseId, crn) => {
          const { selectedPeriodo, selectedGroups } = get()
          if (!selectedPeriodo) return
          writeActiveSelectedGroups(selectedPeriodo, { ...selectedGroups, [courseId]: crn })
        },

        clearGroup: (courseId) => {
          const { selectedPeriodo, selectedGroups } = get()
          if (!selectedPeriodo) return
          const next = { ...selectedGroups }
          delete next[courseId]
          writeActiveSelectedGroups(selectedPeriodo, next)
        },

        autoAssign: (courseIds) => {
          const { selectedPeriodo, groupsByCourse } = get()
          if (!selectedPeriodo) return
          const subset = Object.fromEntries(courseIds.map((id) => [id, groupsByCourse[id] ?? []]))
          writeActiveSelectedGroups(selectedPeriodo, autoAssignSchedule(subset))
        },

        resetSchedule: () => {
          const { selectedPeriodo } = get()
          if (!selectedPeriodo) return
          writeActiveSelectedGroups(selectedPeriodo, {})
        },

        createSchedule: (name) => {
          const { selectedPeriodo, schedulesByPeriodo, activeScheduleIdByPeriodo } = get()
          if (!selectedPeriodo) return
          const schedules = schedulesByPeriodo[selectedPeriodo] ?? []
          const schedule = defaultSchedule(name?.trim() || `Opción ${schedules.length + 1}`)
          const nextSchedules = [...schedules, schedule]
          set({
            schedulesByPeriodo: { ...schedulesByPeriodo, [selectedPeriodo]: nextSchedules },
            activeScheduleIdByPeriodo: { ...activeScheduleIdByPeriodo, [selectedPeriodo]: schedule.id },
            selectedGroups: schedule.selectedGroups,
          })
        },

        renameSchedule: (id, name) => {
          const { selectedPeriodo, schedulesByPeriodo } = get()
          if (!selectedPeriodo || !name.trim()) return
          const schedules = (schedulesByPeriodo[selectedPeriodo] ?? []).map((s) =>
            s.id === id ? { ...s, name: name.trim() } : s,
          )
          set({ schedulesByPeriodo: { ...schedulesByPeriodo, [selectedPeriodo]: schedules } })
        },

        deleteSchedule: (id) => {
          const { selectedPeriodo, schedulesByPeriodo, activeScheduleIdByPeriodo } = get()
          if (!selectedPeriodo) return
          const schedules = schedulesByPeriodo[selectedPeriodo] ?? []
          if (schedules.length <= 1) return
          const nextSchedules = schedules.filter((s) => s.id !== id)
          const wasActive = activeScheduleIdByPeriodo[selectedPeriodo] === id
          const nextActiveId = wasActive ? nextSchedules[0].id : activeScheduleIdByPeriodo[selectedPeriodo]
          set({
            schedulesByPeriodo: { ...schedulesByPeriodo, [selectedPeriodo]: nextSchedules },
            activeScheduleIdByPeriodo: { ...activeScheduleIdByPeriodo, [selectedPeriodo]: nextActiveId },
            ...(wasActive ? { selectedGroups: nextSchedules[0].selectedGroups } : {}),
          })
        },

        duplicateSchedule: (id, newName) => {
          const { selectedPeriodo, schedulesByPeriodo, activeScheduleIdByPeriodo } = get()
          if (!selectedPeriodo) return
          const schedules = schedulesByPeriodo[selectedPeriodo] ?? []
          const source = schedules.find((s) => s.id === id)
          if (!source) return
          const copy: SavedSchedule = {
            id: genId(),
            name: newName?.trim() || `${source.name} (copia)`,
            selectedGroups: { ...source.selectedGroups },
          }
          const nextSchedules = [...schedules, copy]
          set({
            schedulesByPeriodo: { ...schedulesByPeriodo, [selectedPeriodo]: nextSchedules },
            activeScheduleIdByPeriodo: { ...activeScheduleIdByPeriodo, [selectedPeriodo]: copy.id },
            selectedGroups: copy.selectedGroups,
          })
        },

        setActiveSchedule: (id) => {
          const { selectedPeriodo, schedulesByPeriodo, activeScheduleIdByPeriodo } = get()
          if (!selectedPeriodo) return
          const schedule = (schedulesByPeriodo[selectedPeriodo] ?? []).find((s) => s.id === id)
          if (!schedule) return
          set({
            activeScheduleIdByPeriodo: { ...activeScheduleIdByPeriodo, [selectedPeriodo]: id },
            selectedGroups: schedule.selectedGroups,
          })
        },

        addManualCourse: (courseId) => {
          const { selectedPeriodo, manualCourseIdsByPeriodo } = get()
          if (!selectedPeriodo) return
          const current = manualCourseIdsByPeriodo[selectedPeriodo] ?? []
          if (current.includes(courseId)) return
          set({
            manualCourseIdsByPeriodo: {
              ...manualCourseIdsByPeriodo,
              [selectedPeriodo]: [...current, courseId],
            },
          })
        },

        removeManualCourse: (courseId) => {
          const { selectedPeriodo, manualCourseIdsByPeriodo } = get()
          if (!selectedPeriodo) return
          const current = manualCourseIdsByPeriodo[selectedPeriodo] ?? []
          set({
            manualCourseIdsByPeriodo: {
              ...manualCourseIdsByPeriodo,
              [selectedPeriodo]: current.filter((id) => id !== courseId),
            },
          })
          get().clearGroup(courseId)
        },
      }
    },
    {
      name: 'grafitam-schedule',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        selectedPeriodo: state.selectedPeriodo,
        schedulesByPeriodo: state.schedulesByPeriodo,
        activeScheduleIdByPeriodo: state.activeScheduleIdByPeriodo,
        manualCourseIdsByPeriodo: state.manualCourseIdsByPeriodo,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return
        const slug = state.selectedPeriodo ?? defaultPeriodoSlug()
        state.selectedPeriodo = slug
        state.groupsByCourse = slug ? loadHorariosForPeriodo(slug) : {}
        if (slug) {
          const { schedules, activeId } = ensureSchedules(
            state.schedulesByPeriodo,
            state.activeScheduleIdByPeriodo,
            slug,
          )
          state.schedulesByPeriodo = { ...state.schedulesByPeriodo, [slug]: schedules }
          state.activeScheduleIdByPeriodo = { ...state.activeScheduleIdByPeriodo, [slug]: activeId }
          state.selectedGroups = schedules.find((s) => s.id === activeId)?.selectedGroups ?? {}
        } else {
          state.selectedGroups = {}
        }
      },
    },
  ),
)
