import { access } from 'fs'
import { ArrayAccessor } from '../../src'
import { database, IPerson } from '../test-helpers/TestData'

describe('Array accessor for sorted elements', () => {
  const getShuffledList = () => [5, 8, 1, 0, 4, 1, 8, 9, 15, 69, 4]
  const sort = (a: number, b: number) => a - b
  const id = (item) => item
  const isSorted = (items: number[]) =>
    items.slice(1).findIndex((el, i) => el < items[i - 1]) === -1

  it('should sort on initialization', () => {
    const items = getShuffledList()
    new ArrayAccessor<number, number>(items, sort)
    expect(isSorted(items)).toBe(true)
  })
  it('should sort when setting elements', () => {
    const items = []
    const accessor = new ArrayAccessor<number, number>(items, sort)
    accessor.setList(getShuffledList())
    expect(isSorted(items)).toBe(true)
  })
  it('should sort when adding an element', () => {
    const items = getShuffledList()
    const accessor = new ArrayAccessor<number, number>(items, sort)
    expect(isSorted(items)).toBe(true)
    expect(accessor.add(-1)).toBe(0)
    expect(accessor.add(100)).toBe(items.length - 1)
    expect(isSorted(items)).toBe(true)
  })
  it('should sort when inserting an element', () => {
    const items = getShuffledList()
    const accessor = new ArrayAccessor<number, number>(items, sort)
    expect(isSorted(items)).toBe(true)
    accessor.insertAt(2, 100)
    accessor.insertAt(4, -1)
    expect(accessor.indexOf(-1)).toBe(0)
    expect(accessor.indexOf(100)).toBe(items.length - 1)
    expect(isSorted(items)).toBe(true)
  })
})
