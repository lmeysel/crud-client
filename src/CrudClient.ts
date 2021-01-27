import { IClientConfiguration } from './interfaces/IClientConfiguration'
import { IListAccessor } from './interfaces/IListAccessor'

export const CrudClientDefaultValues: Partial<IClientConfiguration<Object, ItemId>> = {
  createItem: /* istanbul ignore next */ () => ({}),
  id: (item) => item['id'],
}

export interface ItemContext<T, TId> {
  originalItem: Readonly<T>
  index: number
  id: TId
  processing: boolean
}
export interface SelectedItemContext<T, TId> extends ItemContext<T, TId> {
  isNew: boolean
  editableCopy: T
}

export class CrudClient<T, TId extends ItemId> {
  private config: IClientConfiguration<T, TId>
  private items: IListAccessor<T, TId>

  selectionContext: SelectedItemContext<T, TId> = null
  selectedItem: T = null
  selectedForDeletion: T = null
  deletionContext: ItemContext<T, TId> = null

  constructor(config: IClientConfiguration<T, TId>) {
    this.config = Object.assign({}, CrudClientDefaultValues, config)
    this.items = config.accessor
  }

  private getItemIndex(item: T, suggestedIndex: number) {
    let ret = suggestedIndex
    if (this.items.at(ret) !== item) {
      ret = this.items.indexOf(item)
      if (ret === -1) {
        throw new Error(
          `Cannot find item (ID: ${this.config.id(item)}): the original item is not in the list.`
        )
      }
    }
    return ret
  }
  private reInsertItem(item: T, suggestedIndex: number) {
    const index = this.getItemIndex(item, suggestedIndex)
    this.items.setAt(index, item)
    return index
  }
  private deleteItem(item: T, suggestedIndex: number) {
    const index = this.getItemIndex(item, suggestedIndex)
    this.items.removeAt(index)
    return index
  }
  private forwardError(x) {
    switch (this.config.connectorErrors) {
      case 'print':
        return console.error(x.toString())
      case 'throw':
        throw x
    }
  }
  private async storeUpdate() {
    const { editableCopy, originalItem } = this.selectionContext
    let { index } = this.selectionContext

    // optimistic response
    const originalCopy = Object.assign({}, originalItem)
    Object.assign(originalItem, editableCopy)
    index = this.reInsertItem(originalItem, index)

    let serverResult: T
    try {
      serverResult = await this.config.connector.update(this.config.id(originalItem), editableCopy)
    } catch (x) {
      this.forwardError(x)
      Object.assign(originalItem, originalCopy)
      index = this.reInsertItem(originalItem, index)
      return false
    }
    if (serverResult) {
      Object.assign(originalItem, serverResult)
      this.reInsertItem(originalItem, index)
    }
    return true
  }
  private async storeCreate() {
    const item = this.selectionContext.editableCopy

    // optimisitic response
    const index = this.items.add(item)

    let serverResult: T
    try {
      serverResult = await this.config.connector.create(item)
    } catch (x) {
      this.forwardError(x)
      this.deleteItem(item, index)
      return false
    }
    if (serverResult) {
      Object.assign(item, serverResult)
      this.reInsertItem(item, index)
    }
    return true
  }

  async refresh() {
    try {
      const items = await this.config.connector.read()
      this.items.setList(items)
    } catch (x) {
      this.forwardError(x)
      return false
    }
    return Promise.resolve(true)
  }
  create() {
    const item = this.config.createItem()
    this.selectionContext = {
      isNew: true,
      originalItem: item,
      editableCopy: item,
      id: null,
      index: null,
      processing: false,
    }
    this.selectedItem = item
  }
  cancel(): void {
    this.selectedItem = null
    this.selectionContext = null
    this.deletionContext = null
    this.selectedForDeletion = null
  }
  select(id: TId) {
    const index = this.items.indexOf(id, this.config.id)
    if (index === -1) {
      return false
    }
    const item = this.items.at(index)
    this.selectionContext = {
      isNew: false,
      originalItem: item,
      editableCopy: Object.assign({}, item),
      id: this.config.id(item),
      index: index,
      processing: false,
    }
    this.selectedItem = this.selectionContext.editableCopy
    return true
  }
  async store(): Promise<boolean> {
    if (!this.selectionContext) {
      throw Error('Cannot store item: No item selected. Make sure select() returned true')
    }
    let res: Promise<boolean>
    this.selectionContext.processing = true
    if (this.selectionContext.isNew) res = this.storeCreate()
    else res = this.storeUpdate()
    res.finally(() => (this.selectionContext.processing = false))
    return res
  }
  selectForDelete(itemId: TId) {
    const index = this.items.indexOf(itemId, this.config.id)
    if (index === -1) {
      return false
    }
    this.deletionContext = {
      index,
      id: itemId,
      originalItem: this.items.at(index),
      processing: false,
    }
    this.selectedForDeletion = this.items.at(index)
    return true
  }
  async delete() {
    if (!this.deletionContext) {
      throw new Error(
        'Deleting item failed: No item selected. Make sure to selectForDelete() returns true.'
      )
    }

    let { originalItem, index, id } = this.deletionContext
    this.deletionContext.processing = true
    this.deleteItem(originalItem, index)
    try {
      await this.config.connector.delete(id)
    } catch (x) {
      this.forwardError(x)
      this.items.insertAt(index, originalItem)
      return false
    } finally {
      this.deletionContext.processing = false
    }
    return true
  }
}
