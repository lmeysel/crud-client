export interface IListAccessor<T, V extends string | number> {
  /**
   * Adds an item to the list.
   * @returns the index of the newly added item
   */
  add(item: T): number
  /**
   * Gets the element at the given index.
   */
  at(index: number)
  /**
   * Gets the index of a certain item (or the item )
   * @param itemOrId The id of the element or the element itself.
   * @param getId A callback function for getting the id of the item. The callback will only be provided, if an item ID is given.
   * @returns The index of the item. -1 if item is not found.
   */
  indexOf(itemOrId: T | V, getId?: IdCallback<T, V>): number
  /**
   * Sets the item at the given index.
   */
  setAt(index: number, item: T)
  /**
   * Inserts the item at the given index.
   */
  insertAt(index: number, item: T)
  /**
   * Make the given items to the new list.
   */
  setList(items: T[])
  /**
   * Removes the item at the given index.
   */
  removeAt(index: number)
}
