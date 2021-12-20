import { ListAccessor } from '../interfaces/ListAccessor'

/**
 * Provides a list manager for the crud client based on an array. This manager will mutate the given array object.
 */
export class ArrayAccessor<T, TId extends ItemId> implements ListAccessor<T, TId> {
	/**
	 * @param items the array of items to be accessed by this accessor.
	 * @param sort An optional sort function to be called whenever items are added to the list.
	 */
	constructor(private items: T[], private sort?: (a: T, b: T) => number) {
		this.sortIfPossible()
	}

	private sortIfPossible() {
		if (this.sort) this.items.sort(this.sort)
	}

	add(item: T): number {
		this.items.push(item)
		if (this.sort) {
			this.sortIfPossible()
			return this.items.indexOf(item)
		}
		return this.items.length - 1
	}
	at(index: number): T {
		return this.items[index]
	}
	indexOf(itemOrId: T | TId, getId?: IdCallback<T, TId>): number {
		if (getId) {
			return this.items.findIndex((item) => getId(item) === itemOrId)
		} else {
			return this.items.indexOf(itemOrId as T)
		}
	}
	setAt(index: number, item: T): void {
		this.items.splice(index, 1, item)
		this.sortIfPossible()
	}
	insertAt(index: number, item: T): void {
		this.items.splice(index, 0, item)
		this.sortIfPossible()
	}
	setList(items: T[]): void {
		this.items.splice(0, this.items.length, ...items)
		this.sortIfPossible()
	}
	removeAt(index: number): void {
		this.items.splice(index, 1)
	}
}
