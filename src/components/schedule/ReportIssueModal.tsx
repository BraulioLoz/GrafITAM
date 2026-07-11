import { useState } from 'react'

const GITHUB_REPO = 'ITAM-Datalab/GrafITAM'

type TipoProblema = 'materia_faltante' | 'grupo_incorrecto' | 'plan_faltante' | 'otro'

const TIPO_LABELS: Record<TipoProblema, string> = {
  materia_faltante: 'Materia no aparece en horarios',
  grupo_incorrecto: 'Grupo/CRN incorrecto o faltante',
  plan_faltante: 'Plan de estudios no encontrado',
  otro: 'Otro problema',
}

export default function ReportIssueModal() {
  const [open, setOpen] = useState(false)
  const [tipo, setTipo] = useState<TipoProblema>('materia_faltante')
  const [clave, setClave] = useState('')
  const [nombre, setNombre] = useState('')
  const [grupo, setGrupo] = useState('')
  const [carrera, setCarrera] = useState('')
  const [comentario, setComentario] = useState('')

  const handleSubmit = () => {
    const title = `[Reporte] ${TIPO_LABELS[tipo]}${clave ? ` — ${clave}` : ''}`
    const body = [
      `**Tipo de problema:** ${TIPO_LABELS[tipo]}`,
      `**Clave de materia:** ${clave || '(no especificada)'}`,
      `**Nombre de materia:** ${nombre || '(no especificado)'}`,
      `**Grupo/CRN:** ${grupo || '(no especificado)'}`,
      `**Carrera o plan de estudios:** ${carrera || '(no especificado)'}`,
      '',
      '**Comentario:**',
      comentario || '(sin comentario)',
    ].join('\n')

    const url = `https://github.com/${GITHUB_REPO}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`
    window.open(url, '_blank', 'noopener,noreferrer')
    setOpen(false)
    setClave('')
    setNombre('')
    setGrupo('')
    setCarrera('')
    setComentario('')
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs font-semibold rounded px-3 py-1.5 whitespace-nowrap shadow-sm"
        style={{ background: '#8C5E58', color: '#FCFAF8' }}
      >
        ¿No encuentras tu materia, grupo o plan?
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-base-bone rounded-lg shadow-lg w-full max-w-md p-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-sm font-bold mb-3" style={{ color: '#0D3B2E' }}>
              Reportar problema
            </h2>

            <label className="block text-xs font-semibold mb-1">Tipo de problema</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as TipoProblema)}
              className="w-full text-xs border border-itam-muted/50 rounded p-2 mb-3"
            >
              {Object.entries(TIPO_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            <label className="block text-xs font-semibold mb-1">Clave de materia</label>
            <input
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              placeholder="ej. MAT-14100"
              className="w-full text-xs border border-itam-muted/50 rounded p-2 mb-3"
            />

            <label className="block text-xs font-semibold mb-1">Nombre de materia (opcional)</label>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full text-xs border border-itam-muted/50 rounded p-2 mb-3"
            />

            <label className="block text-xs font-semibold mb-1">Grupo / CRN (opcional)</label>
            <input
              value={grupo}
              onChange={(e) => setGrupo(e.target.value)}
              className="w-full text-xs border border-itam-muted/50 rounded p-2 mb-3"
            />

            <label className="block text-xs font-semibold mb-1">Carrera o plan de estudios (opcional)</label>
            <input
              value={carrera}
              onChange={(e) => setCarrera(e.target.value)}
              placeholder="ej. CDA-A, generación 2025"
              className="w-full text-xs border border-itam-muted/50 rounded p-2 mb-3"
            />

            <label className="block text-xs font-semibold mb-1">Comentario</label>
            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              rows={3}
              placeholder="Describe el problema (si tienes el PDF del plan, menciónalo aquí)"
              className="w-full text-xs border border-itam-muted/50 rounded p-2 mb-3"
            />

            <p className="text-[10px] opacity-60 mb-3">
              Al enviar se abre una pestaña nueva en GitHub con un Issue prellenado — hace falta darle clic a
              "Submit new issue" ahí para que quede registrado.
            </p>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setOpen(false)}
                className="text-xs px-3 py-1.5 rounded border border-itam-muted/50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={!clave.trim()}
                className="text-xs px-3 py-1.5 rounded font-semibold disabled:opacity-40"
                style={{ background: '#1E5E4B', color: '#FCFAF8' }}
              >
                Abrir reporte en GitHub
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
