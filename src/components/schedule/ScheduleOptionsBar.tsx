import { useScheduleStore } from '../../store/scheduleStore'

export default function ScheduleOptionsBar() {
  const selectedPeriodo = useScheduleStore((s) => s.selectedPeriodo)
  const schedulesByPeriodo = useScheduleStore((s) => s.schedulesByPeriodo)
  const activeScheduleIdByPeriodo = useScheduleStore((s) => s.activeScheduleIdByPeriodo)
  const createSchedule = useScheduleStore((s) => s.createSchedule)
  const renameSchedule = useScheduleStore((s) => s.renameSchedule)
  const deleteSchedule = useScheduleStore((s) => s.deleteSchedule)
  const duplicateSchedule = useScheduleStore((s) => s.duplicateSchedule)
  const setActiveSchedule = useScheduleStore((s) => s.setActiveSchedule)

  if (!selectedPeriodo) return null
  const schedules = schedulesByPeriodo[selectedPeriodo] ?? []
  const activeId = activeScheduleIdByPeriodo[selectedPeriodo]

  return (
    <div className="mb-3">
      <label className="block text-xs font-semibold mb-1 text-itam-dark">Horarios guardados</label>
      <div className="flex flex-wrap gap-1.5">
        {schedules.map((schedule) => {
          const isActive = schedule.id === activeId
          return (
            <div
              key={schedule.id}
              className="flex items-center rounded text-xs overflow-hidden"
              style={{
                background: isActive ? '#1E5E4B' : 'transparent',
                border: `1px solid ${isActive ? '#1E5E4B' : '#8CA699'}`,
                color: isActive ? '#FCFAF8' : '#0D3B2E',
              }}
            >
              <button onClick={() => setActiveSchedule(schedule.id)} className="px-2 py-1 font-semibold">
                {schedule.name}
              </button>
              {isActive && (
                <>
                  <button
                    onClick={() => {
                      const name = window.prompt('Nuevo nombre para este horario:', schedule.name)
                      if (name?.trim()) renameSchedule(schedule.id, name)
                    }}
                    className="px-1.5 hover:opacity-70"
                    title="Renombrar"
                  >
                    ✎
                  </button>
                  <button
                    onClick={() => duplicateSchedule(schedule.id)}
                    className="px-1.5 hover:opacity-70"
                    title="Duplicar (útil como respaldo antes de inscribirte)"
                  >
                    ⧉
                  </button>
                  {schedules.length > 1 && (
                    <button
                      onClick={() => {
                        if (window.confirm(`¿Eliminar el horario "${schedule.name}"?`)) {
                          deleteSchedule(schedule.id)
                        }
                      }}
                      className="px-1.5 hover:opacity-70"
                      title="Eliminar"
                    >
                      ×
                    </button>
                  )}
                </>
              )}
            </div>
          )
        })}

        <button
          onClick={() => {
            const name = window.prompt('Nombre para el nuevo horario:', `Opción ${schedules.length + 1}`)
            if (name !== null) createSchedule(name)
          }}
          className="rounded px-2 py-1 text-xs font-semibold border border-dashed border-itam-muted text-itam-dark"
        >
          + Nueva opción
        </button>
      </div>
    </div>
  )
}
