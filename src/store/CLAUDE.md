# Store (`src/store/`)

Dos stores Zustand independientes, ambos con `persist` middleware:

- **`curriculumStore.ts`** (`useCurriculumStore`) — plan de estudios, key `grafitam-state`. Documentado abajo.
- **`scheduleStore.ts`** (`useScheduleStore`) — horarios/grupos, key `grafitam-schedule`. Ver sección "Schedule store" al final.

Son dominios distintos y no se leen entre sí; `ScheduleTab.tsx` es el único componente que lee de ambos (usa `planeada` de `curriculumStore` para saber qué materias mostrar).

## Tipos (`src/types/`)

### `curriculum.ts`

```ts
RawCourse   // Estructura del JSON fuente (semestre, nombre, creditos, prerreqs, coreqs, estado)
RawPlan     // Record<string, RawCourse>
Course      // Materia enriquecida por el loader (agrega id, danglingPrerreqs, coreqGroup)
PlanData    // Record<string, Course>
PlanMeta    // { filename, program, letter } — metadato de un plan
ProgramIndex // Record<string, string[]> — programa → lista de letras disponibles
```

### `store.ts`

```ts
CourseUserState  // { aprobada, planeada, semestrePlaneado }
UserStateMap     // Record<string, CourseUserState>
ValidationError  // { courseId, prereqId }
CurriculumState  // Estado completo + acciones del store, incluye showAvailable: boolean
```

## Persistencia

| Campo | Persiste | Motivo |
|-------|----------|--------|
| `activePlan` | Sí | Filename del plan seleccionado |
| `userState` | Sí | Aprobaciones y semestres planeados por materia |
| `planData` | No | Re-derivado de `activePlan` al hidratar |
| `validationErrors` | No | Recalculado en cada mutación |
| `showAvailable` | No | Preferencia de UI en memoria, se resetea a `false` en cada carga |

Al hidratar desde LocalStorage, `onRehydrateStorage` llama `loadPlan(activePlan, userState)`, pasando el `userState` persistido — esto es lo que hace que las aprobaciones/planeaciones sobrevivan al reload. Sin el segundo argumento la persistencia no tendría efecto real.

## Acciones

### `loadPlan(filename, existingUserState?)`

Carga el JSON con `loadPlanData(filename)`. Si se pasa `existingUserState`, lo preserva por materia (con fallback a `course.semestre`); si no, resetea `userState` a `{}`. Calcula `validationErrors`. Actualiza `activePlan`.

### `toggleShowAvailable()`

Invierte `showAvailable` (no persiste — ver tabla arriba). Controla el resaltado de materias cursables en `CourseNode.tsx` (estado "Disponible").

### `toggleApproval(courseId)`

- Si ya aprobada → `unapproveDescendants(courseId, ...)` (desaprueba el nodo y sus dependientes).
- Si no aprobada → `approveWithAncestors(courseId, ...)` (aprueba el nodo y sus prerreqs transitivos).
- Al aprobar, limpia `planeada: false` en todo lo que quedó `aprobada: true` (incluye ancestros auto-aprobados por `approveWithAncestors`) vía `clearPlannedWhereApproved` (`src/algorithms/enforceInvariant.ts`).

### `togglePlanned(courseId)`

- Si ya planeada → quita el flag.
- Si no planeada:
  1. Si estaba aprobada → `unapproveDescendants` para limpiar primero.
  2. `approveWithAncestors` en cada prerreq directo.
  3. Limpia `planeada` de cualquier nodo que pasó a `aprobada` vía `clearPlannedWhereApproved` (mismo helper que `toggleApproval`).
  4. Pone `planeada: true, aprobada: false` en `courseId`.
  5. Pone `planeada: true` en todos los `coreqGroup` partners.
  6. Llama `validateTopology` y actualiza `validationErrors`.

### `setPlannedSemester(courseId, sem)`

Actualiza `semestrePlaneado` en `userState[courseId]` y llama `validateTopology`.

### `resetPlan()`

Limpia `userState`, recarga `planData` del mismo `activePlan`.

## Invariante principal

Una materia **nunca** tiene `aprobada: true` y `planeada: true` al mismo tiempo. Ambas acciones (`toggleApproval`, `togglePlanned`) limpian el flag contrario explícitamente antes de establecer el propio, vía `clearPlannedWhereApproved`.

---

## Schedule store (`scheduleStore.ts`)

Tipos en `src/types/schedule.ts`: `ScheduleGroup` (un grupo/CRN de una materia — ver `src/components/schedule/CLAUDE.md` para el schema completo y de dónde sale el dato ahora, vía `horarios_scraper.py`), `ScheduleData = Record<courseId, ScheduleGroup[]>`, `SelectedGroups = Record<courseId, crn>`, `HorarioPeriodo` (metadato de un periodo scrapeado), `SavedSchedule` (`{ id, name, selectedGroups }` — un horario guardado con nombre, ej. "Opción A").

`groupsByCourse` ya **no** se llena a mano — se deriva de los JSON bundleados en `jsonHorarios/` vía `loadHorariosForPeriodo` (`src/data/horariosLoader.ts`), según el periodo seleccionado.

### Horarios múltiples por periodo

`schedulesByPeriodo: Record<periodoSlug, SavedSchedule[]>` + `activeScheduleIdByPeriodo: Record<periodoSlug, id>` son la fuente de verdad — permiten guardar varias combinaciones con nombre por periodo (útil cuando un grupo se cierra y hay que rearmar sin perder la opción anterior). `selectedGroups` se mantiene como **espejo de conveniencia** del horario activo del periodo actual, para que `ScheduleTab.tsx`/`ScheduleCalendar.tsx` lo sigan leyendo sin cambios — todas las acciones que lo modifican (`selectGroup`, `clearGroup`, `autoAssign`, `resetSchedule`) escriben primero en `schedulesByPeriodo[periodo]` vía el helper interno `writeActiveSelectedGroups` (closure local en el store, no expuesto en `ScheduleState`) y luego actualizan el espejo.

`ensureSchedules(...)` (función pura fuera del store) garantiza que todo periodo tenga **al menos un horario** ("Opción A" por defecto) y un activo válido — se llama en `setPeriodo` y en `onRehydrateStorage`, así que un usuario que nunca toca la multi-selección no nota diferencia con el comportamiento anterior.

### Persistencia (`partialize`)

Persisten `selectedPeriodo`, `schedulesByPeriodo` y `activeScheduleIdByPeriodo` — `groupsByCourse` y `selectedGroups` quedan fuera (derivados: el primero de `selectedPeriodo` vía `loadHorariosForPeriodo`, el segundo del horario activo). Al hidratar, `onRehydrateStorage` recalcula ambos con `ensureSchedules` + `loadHorariosForPeriodo(selectedPeriodo)`; si no hay `selectedPeriodo` persistido (primera visita), usa `defaultPeriodoSlug()`.

### Acciones

- `setPeriodo(slug)` — cambia de periodo: recarga `groupsByCourse` desde `jsonHorarios/{slug}.json` y carga `selectedGroups` del horario activo **de ese periodo** (cada periodo tiene sus propios horarios guardados, no se pisan entre sí).
- `selectGroup(courseId, crn)` / `clearGroup(courseId)` — el usuario elige a mano qué grupo llevar por materia, sobre el horario activo.
- `autoAssign(courseIds)` — corre `autoAssignSchedule` (`src/algorithms/scheduleAssign.ts`) sobre el subconjunto de `groupsByCourse` filtrado a `courseIds` y **reemplaza** el `selectedGroups` del horario activo con el resultado. Ver nota de `scheduleAssign.ts` en `src/algorithms/CLAUDE.md` sobre por qué `courseIds` es obligatorio.
- `resetSchedule()` — limpia el `selectedGroups` del horario activo (no toca `groupsByCourse` ni otros horarios guardados).
- `createSchedule(name?)` — agrega un `SavedSchedule` vacío al periodo actual y lo vuelve activo.
- `renameSchedule(id, name)` / `deleteSchedule(id)` — `deleteSchedule` es no-op si es el último horario del periodo (siempre debe quedar al menos uno).
- `duplicateSchedule(id, newName?)` — clona un horario existente (incluye su `selectedGroups`) como uno nuevo activo; pensado como respaldo antes de intentar inscribirse.
- `setActiveSchedule(id)` — cambia cuál horario del periodo actual se está editando/viendo.

### Materias agregadas por búsqueda (optativas fuera del plan)

`manualCourseIdsByPeriodo: Record<periodoSlug, string[]>` (persiste, sin invariante que reparar en `onRehydrateStorage` a diferencia de `schedulesByPeriodo` — una lista vacía es válida). Guarda claves de materias que el usuario agregó a mano vía `MateriaSearchBar.tsx` (típicamente optativas, que `jsonPEs/` no incluye — ver `src/components/schedule/CLAUDE.md`), separado de `plannedCourseIds` porque esas materias no viven en `useCurriculumStore`.

- `addManualCourse(courseId)` — agrega la clave al periodo actual (no-op si ya está trackeada).
- `removeManualCourse(courseId)` — la quita **y** llama a `clearGroup(courseId)` — si no se limpia la selección, `selectedGroupObjects` la seguiría mostrando en el calendario aunque ya no esté en la lista del sidebar, porque `groupsByCourse` sigue teniendo esa materia (trae todo el catálogo del periodo, no solo lo trackeado).
