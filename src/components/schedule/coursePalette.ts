export interface CourseColor {
  bg: string
  text: string
}

/**
 * 10 colores fijos (máximo de materias reales por semestre en el ITAM), validados
 * con el skill dataviz: `node scripts/validate_palette.js "<10 hex>" --mode light
 * --pairs all` → ALL CHECKS PASS. La separación CVD cae en la banda piso (8-12,
 * no el objetivo 12+) para un par ya presente en la paleta base de 8 — válido
 * porque cada bloque siempre lleva etiqueta directa (clave + nombre), no depende
 * solo del color para identificar la materia.
 */
export const COURSE_PALETTE: CourseColor[] = [
  { bg: '#2a78d6', text: '#FCFAF8' }, // azul
  { bg: '#1baf7a', text: '#0D3B2E' }, // verde-azulado
  { bg: '#eda100', text: '#0D3B2E' }, // amarillo
  { bg: '#008300', text: '#FCFAF8' }, // verde
  { bg: '#4a3aa7', text: '#FCFAF8' }, // violeta
  { bg: '#e34948', text: '#FCFAF8' }, // rojo
  { bg: '#e87ba4', text: '#0D3B2E' }, // magenta
  { bg: '#eb6834', text: '#0D3B2E' }, // naranja
  { bg: '#1dbdc9', text: '#0D3B2E' }, // cian
  { bg: '#9311d4', text: '#FCFAF8' }, // púrpura
]

export function getCourseColor(courseId: string, orderedCourseIds: string[]): CourseColor {
  const index = orderedCourseIds.indexOf(courseId)
  const safeIndex = index === -1 ? 0 : index % COURSE_PALETTE.length
  return COURSE_PALETTE[safeIndex]
}
