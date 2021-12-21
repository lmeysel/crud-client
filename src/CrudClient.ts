import { ClientEvents } from './interfaces/ClientEvents'
import { CancellationToken, CancellationTokenContext } from './CancellationToken'
import { ClientConfiguration } from './interfaces/ClientConfiguration'
import { ListAccessor } from './interfaces/ListAccessor'
import { EventBus } from './EventBus'

export const CrudClientDefaultValues: Partial<ClientConfiguration<Item, ItemId>> = {
	createItem: /* istanbul ignore next */ () => ({}),
	id: (item) => item['id'] as ItemId,
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
	private eventbus = new EventBus<ClientEvents<T>>();
	private config: ClientConfiguration<T, TId>
	private items: ListAccessor<T, TId>

	selectionContext: SelectedItemContext<T, TId> = null
	selectedItem: T = null
	selectedForDeletion: T = null
	deletionContext: ItemContext<T, TId> = null

	constructor(config: ClientConfiguration<T, TId>) {
		this.config = Object.assign({}, CrudClientDefaultValues, config)
		this.items = config.accessor
	}

	/**
	 * Re-configures the crud client.
	 * @param config The new config to apply
	 * @param clear True to forget the current configuration. Otherwise config object will be merged.
	 */
	public configure(config: Partial<ClientConfiguration<T, TId>>, clear?: false): void
	public configure(config: ClientConfiguration<T, TId>, clear: true): void
	public configure(config: ClientConfiguration<T, TId>, clear?: boolean): void {
		if (clear)
			this.config = Object.assign({}, CrudClientDefaultValues, config);
		else
			Object.assign(this.config, config);
		this.items = this.config.accessor;
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

	private async emitWithCancellationToken(hook: keyof ClientEvents<T>, context: CancellationTokenContext, item?: T): Promise<boolean> {
		const ctoken = new CancellationToken(context);
		if (item)
			this.eventbus.emit(hook, item, ctoken);
		else
			this.eventbus.emit(hook, ctoken);
		return !(await ctoken.cancelled);
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
			this.eventbus.emit('afterStore', serverResult);
			Object.assign(originalItem, serverResult)
			this.reInsertItem(originalItem, index)
		}
		return true
	}
	private async storeCreate() {
		const item = this.selectionContext.originalItem,
			copy = this.selectionContext.editableCopy;
		this.selectionContext.isNew = false;

		// optimisitic response
		let index = this.items.indexOf(item);
		if (index === -1) {
			index = this.items.add(item)
		}

		let serverResult: Partial<T>
		try {
			serverResult = await this.config.connector.create(copy)
		} catch (x) {
			this.forwardError(x)
			this.deleteItem(item, index)
			return false
		}
		if (typeof serverResult !== 'object') {
			serverResult = {};
		}
		this.eventbus.emit('afterStore', serverResult as T);
		Object.assign(item, copy, serverResult);
		this.reInsertItem(item, index)
		return true
	}

	async refresh(): Promise<boolean> {
		try {
			if (!await this.emitWithCancellationToken('beforeRefresh', 'refresh'))
				return false;

			const items = await this.config.connector.read()
			this.items.setList(items)

			this.eventbus.emit('afterRefresh', items);
		} catch (x) {
			this.forwardError(x)
			return false
		}
		return true;
	}
	create(): void {
		if (this.selectionContext?.isNew)
			return;

		this.cancel();
		const item = this.config.createItem();
		const copy = Object.assign({}, item);
		this.selectionContext = {
			isNew: true,
			originalItem: item,
			editableCopy: copy,
			id: null,
			index: null,
			processing: false,
		}
		this.selectedItem = copy;
		if (this.config.listCreatedItems) {
			this.items.add(item);
		}
	}
	cancel(): void {
		const { selectionContext } = this;
		if (selectionContext && selectionContext.isNew) {
			let index = this.items.indexOf(selectionContext.originalItem);
			if (index !== -1)
				this.items.removeAt(index);
		}
		this.selectedItem = null
		this.selectionContext = null
		this.deletionContext = null
		this.selectedForDeletion = null
	}
	async select(id: TId): Promise<boolean> {
		this.cancel();
		const index = this.items.indexOf(id, this.config.id)
		if (index === -1) {
			return false
		}
		const item = this.items.at(index), editableCopy = Object.assign({}, item)


		if (!await this.emitWithCancellationToken('beforeSelect', 'select', editableCopy))
			return false;

		this.selectionContext = {
			isNew: false,
			originalItem: item,
			editableCopy,
			id: this.config.id(item),
			index: index,
			processing: false,
		}
		this.selectedItem = this.selectionContext.editableCopy

		this.eventbus.emit('afterSelect', editableCopy);
		return true
	}
	async store(): Promise<boolean> {
		if (!this.selectionContext) {
			throw Error('Cannot store item: No item selected. Make sure select() returned true')
		}
		if (!await this.emitWithCancellationToken('beforeStore', 'store', this.selectionContext.editableCopy))
			return false;

		let res: Promise<boolean>
		this.selectionContext.processing = true
		if (this.selectionContext.isNew) res = this.storeCreate()
		else res = this.storeUpdate()
		res.finally(() => {
			if (this.selectionContext)
				this.selectionContext.processing = false
		})
		return res
	}
	async selectForDelete(itemId: TId): Promise<boolean> {
		const index = this.items.indexOf(itemId, this.config.id)
		if (index === -1) {
			return false
		}
		const originalItem = this.items.at(index);

		if (!await this.emitWithCancellationToken('beforeSelectForDelete', 'selectForDelete', originalItem))
			return false;

		this.deletionContext = {
			index,
			id: itemId,
			originalItem,
			processing: false,
		}
		this.selectedForDeletion = this.items.at(index)
		this.eventbus.emit('afterSelectForDelete', originalItem);

		return true
	}
	async delete(): Promise<boolean> {
		if (!this.deletionContext) {
			throw new Error(
				'Deleting item failed: No item selected. Make sure to selectForDelete() returns true.'
			)
		}
		let { originalItem, index, id } = this.deletionContext
		if (!await this.emitWithCancellationToken('beforeDelete', 'delete', originalItem))
			return false;

		this.deletionContext.processing = true
		this.deleteItem(originalItem, index)
		try {
			await this.config.connector.delete(id)
			this.eventbus.emit('afterDelete', originalItem);
		} catch (x) {
			this.forwardError(x)
			this.items.insertAt(index, originalItem)
			return false
		} finally {
			if (this.deletionContext)
				this.deletionContext.processing = false
		}
		return true
	}
	public on<Q extends keyof ClientEvents<T>>(event: Q, callable: ClientEvents<T>[Q]) {
		this.eventbus.on(event, callable);
	}
	public once<Q extends keyof ClientEvents<T>>(event: Q, callable: ClientEvents<T>[Q]) {
		this.eventbus.once(event, callable);
	}
	public off<Q extends keyof ClientEvents<T>>(event: Q, callable: ClientEvents<T>[Q]) {
		this.eventbus.off(event, callable);
	}
}
