import { useMemo, useState } from 'react'
import { useScheduleStore } from '../../store/scheduleStore'

interface Props {
  trackedCourseIds: string[]
}

const MAX_RESULTS = 15

export default function MateriaSearchBar({ trackedCourseIds }: Props) {
  const groupsByCourse = useScheduleStore((s) => s.groupsByCourse)
  const addManualCourse = useScheduleStore((s) => s.addManualCourse)
  const [query, setQuery] = useState('')

  const results = useMemo(() => {
    const q = query.trim().toUpperCase()
    if (!q) return []
    const tracked = new Set(trackedCourseIds)
    return Object.keys(groupsByCourse)
      .filter((id) => !tracked.has(id))
      .filter((id) => {
        const nombre = groupsByCourse[id][0]?.nombre ?? ''
        return id.toUpperCase().includes(q) || nombre.toUpperCase().includes(q)
      })
      .slice(0, MAX_RESULTS)
  }, [query, groupsByCourse, trackedCourseIds])

  return (
    <div className="mb-3">
      <label className="block text-xs font-semibold mb-1 text-itam-dark">
        Buscar materia por clave (ej. EST-24124)
      </label>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Útil para optativas que no salen en el plan"
        className="w-full text-xs border border-itam-muted/50 rounded p-2"
      />
      {results.length > 0 && (
        <ul className="mt-1 border border-itam-muted/50 rounded overflow-hidden">
          {results.map((id) => (
            <li key={id} className="border-b border-itam-muted/30 last:border-b-0">
              <button
                onClick={() => {
                  addManualCourse(id)
                  setQuery('')
                }}
                className="w-full text-left text-xs px-2 py-1.5 hover:bg-itam-muted/10"
              >
                <span className="font-mono opacity-60">{id}</span>{' '}
                {groupsByCourse[id][0]?.nombre}
              </button>
            </li>
          ))}
        </ul>
      )}
      {query.trim() && results.length === 0 && (
        <p className="text-xs opacity-50 text-itam-dark mt-1">Sin resultados para ese periodo.</p>
      )}
    </div>
  )
}
