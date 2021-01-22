import { ArrayAccessor } from '../../src'
import { database, IPerson } from '../test-helpers/TestData'

describe('Array accessor', () => {
  let items: IPerson[]
  let randomIndex: number
  let accessor: ArrayAccessor<IPerson, number>
  beforeEach(() => {
    items = database.all().slice()
    accessor = new ArrayAccessor(items)
    randomIndex = Math.round(Math.random() * (items.length - 1))
  })
  afterEach(() => {
    database.generate()
  })
  it('get item at index', () => {
    expect(items[randomIndex]).toBe(accessor.at(randomIndex))
  })
  it('set item at index', () => {
    const item = items[randomIndex],
      replacement = { id: database.lastInsertId() + 1, age: 100, name: 'Peter Shaw' }
    accessor.setAt(randomIndex, replacement)

    expect(items).not.toContain(item)
    expect(items[randomIndex]).not.toBe(item)
    expect(items[randomIndex]).toBe(replacement)
  })
  it('insert item', () => {
    const item = items[randomIndex],
      insertion = { id: database.lastInsertId() + 1, age: 100, name: 'Peter Shaw' }
    accessor.insertAt(randomIndex, insertion)

    expect(items[randomIndex + 1]).toBe(item)
    expect(items[randomIndex]).toBe(insertion)
  })
  it('add item', () => {
    const lengthBeforeInsert = items.length
    const insertion = { id: database.lastInsertId() + 1, age: 100, name: 'Peter Shaw' }

    const index = accessor.add(insertion)

    expect(index).toBe(items.length - 1)
    expect(items[index]).toBe(insertion)
    expect(lengthBeforeInsert + 1).toBe(items.length)
  })
  it('find index', () => {
    const indices = [
      0,
      items.length - 1,
      Math.round((items.length - 1) / 3),
      Math.round(((items.length - 1) / 3) * 2)
    ]

    indices.forEach(index => {
      const item = items[index]
      expect(accessor.indexOf(item.id, itm => itm.id)).toBe(index)
      expect(accessor.indexOf(item)).toBe(index)
    })
  })
  it('delete item at', () => {
    const itm = items[randomIndex]
    accessor.removeAt(randomIndex)
    expect(items).not.toContain(itm)
  })
  it('set all', () => {
    const newItems: IPerson[] = [
      database.randomNonExistingPerson(),
      database.randomNonExistingPerson()
    ]
    accessor.setList(newItems)
    expect(items.length).toBe(newItems.length)
    expect(items).not.toBe(newItems)
  })
})
