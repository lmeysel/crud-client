export interface IApiConnector<T> {
  /**
   * Sends an item to the server in order to create it.
   * @param item The item to send to the server.
   */
  create(item: T): Promise<T>
  /**
   * Get items from server
   */
  read(): Promise<T[]>
  /**
   * Sends the item to the server in order to update it.
   * @param id The ID of the item to update.
   * @param item The item to update.
   */
  update(id: string | number, item: T): Promise<T>
  /**
   * Deletes the item with the given id from the server
   * @param id The ID of the item to delete on the server.
   */
  delete(id: string | number): Promise<void>
}
