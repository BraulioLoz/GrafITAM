import { describe, expect, it } from 'vitest'
import { layoutDayBlocks } from './calendarLayout'

interface Item {
  id: string
  inicio: number
  fin: number
}

const getRange = (item: Item) => ({ inicio: item.inicio, fin: item.fin })

describe('layoutDayBlocks', () => {
  it('regresa arreglo vacío si no hay items', () => {
    expect(layoutDayBlocks<Item>([], getRange)).toEqual([])
  })

  it('un solo bloque ocupa el ancho completo', () => {
    const a: Item = { id: 'a', inicio: 540, fin: 630 }
    const result = layoutDayBlocks([a], getRange)
    expect(result).toEqual([{ item: a, left: 0, width: 1 }])
  })

  it('dos bloques traslapados se reparten el ancho a la mitad', () => {
    const a: Item = { id: 'a', inicio: 540, fin: 630 }
    const b: Item = { id: 'b', inicio: 570, fin: 660 }
    const result = layoutDayBlocks([a, b], getRange)
    const byId = Object.fromEntries(result.map((r) => [r.item.id, r]))
    expect(byId.a).toEqual({ item: a, left: 0, width: 0.5 })
    expect(byId.b).toEqual({ item: b, left: 0.5, width: 0.5 })
  })

  it('tres bloques traslapados mutuamente se reparten el ancho en tercios', () => {
    const a: Item = { id: 'a', inicio: 540, fin: 630 } // 9:00-10:30
    const b: Item = { id: 'b', inicio: 555, fin: 630 } // 9:15-10:30
    const c: Item = { id: 'c', inicio: 570, fin: 600 } // 9:30-10:00
    const result = layoutDayBlocks([a, b, c], getRange)
    const byId = Object.fromEntries(result.map((r) => [r.item.id, r]))
    expect(byId.a.width).toBeCloseTo(1 / 3)
    expect(byId.b.width).toBeCloseTo(1 / 3)
    expect(byId.c.width).toBeCloseTo(1 / 3)
    const lefts = new Set([byId.a.left, byId.b.left, byId.c.left])
    expect(lefts).toEqual(new Set([0, 1 / 3, 2 / 3]))
  })

  it('un bloque que termina justo cuando empieza otro no cuenta como traslape', () => {
    const a: Item = { id: 'a', inicio: 540, fin: 630 }
    const b: Item = { id: 'b', inicio: 630, fin: 690 }
    const result = layoutDayBlocks([a, b], getRange)
    expect(result).toEqual([
      { item: a, left: 0, width: 1 },
      { item: b, left: 0, width: 1 },
    ])
  })

  it('dos clusters independientes en el mismo día usan ancho completo cada uno', () => {
    const a: Item = { id: 'a', inicio: 480, fin: 540 } // 8:00-9:00
    const b: Item = { id: 'b', inicio: 510, fin: 570 } // 8:30-9:30 (traslapa con a)
    const c: Item = { id: 'c', inicio: 720, fin: 780 } // 12:00-13:00 (sin traslape con a/b)
    const result = layoutDayBlocks([a, b, c], getRange)
    const byId = Object.fromEntries(result.map((r) => [r.item.id, r]))
    expect(byId.a.width).toBe(0.5)
    expect(byId.b.width).toBe(0.5)
    expect(byId.c).toEqual({ item: c, left: 0, width: 1 })
  })
})
