import { IListManager } from '../interfaces/IListAccessor'

/**
 * Provides a list manager for the crud client based on an array. This manager will mutate the given array object.
 */
export class ArrayAccessor<T, TId extends ItemId> implements IListManager<T, TId> {
  constructor(private items: T[]) {}
  add(item: T) {
    return this.items.push(item) - 1
  }
  at(index: number) {
    return this.items[index]
  }
  indexOf(itemOrId: T | TId, getId?: IdCallback<T, TId>): number {
    if (getId) {
      return this.items.findIndex(item => getId(item) === itemOrId)
    } else {
      return this.items.findIndex(item => item === itemOrId)
    }
  }
  setAt(index: number, item: T) {
    this.items.splice(index, 1, item)
  }
  insertAt(index: number, item: T) {
    this.items.splice(index, 0, item)
  }
  setList(items: T[]) {
    this.items.splice(0, this.items.length, ...items)
  }
  removeAt(index: number) {
    this.items.splice(index, 1)
  }
}
