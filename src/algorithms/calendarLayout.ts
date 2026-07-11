export interface DayBlockLayout<T> {
  item: T
  left: number
  width: number
}

/**
 * Empaquetado de bloques en columnas dentro de un mismo día, estilo Google Calendar:
 * bloques que se traslapan entre sí se reparten el ancho en partes iguales.
 *
 * No implementa el refinamiento de "expandir a espacio libre" (ej. un evento largo
 * con uno corto adentro no recupera ancho fuera de la ventana compartida) — cada
 * bloque de un cluster de N columnas se queda en 1/N de ancho durante todo su rango.
 */
export function layoutDayBlocks<T>(
  items: T[],
  getRange: (item: T) => { inicio: number; fin: number },
): DayBlockLayout<T>[] {
  if (items.length === 0) return []

  const sorted = [...items].sort((a, b) => {
    const ra = getRange(a)
    const rb = getRange(b)
    return ra.inicio - rb.inicio || ra.fin - rb.fin
  })

  // Agrupa en clusters de traslape mutuo transitivo.
  const clusters: T[][] = []
  let currentCluster: T[] = []
  let clusterEnd = -Infinity

  for (const item of sorted) {
    const { inicio, fin } = getRange(item)
    if (currentCluster.length > 0 && inicio >= clusterEnd) {
      clusters.push(currentCluster)
      currentCluster = []
      clusterEnd = -Infinity
    }
    currentCluster.push(item)
    clusterEnd = Math.max(clusterEnd, fin)
  }
  if (currentCluster.length > 0) clusters.push(currentCluster)

  // Dentro de cada cluster, asigna columnas por greedy (primera columna libre).
  const result: DayBlockLayout<T>[] = []
  for (const cluster of clusters) {
    const columnEnds: number[] = []
    const colOf = new Map<T, number>()

    for (const item of cluster) {
      const { inicio, fin } = getRange(item)
      let col = columnEnds.findIndex((end) => end <= inicio)
      if (col === -1) {
        col = columnEnds.length
        columnEnds.push(fin)
      } else {
        columnEnds[col] = fin
      }
      colOf.set(item, col)
    }

    const colCount = columnEnds.length
    for (const item of cluster) {
      result.push({ item, left: colOf.get(item)! / colCount, width: 1 / colCount })
    }
  }

  return result
}
