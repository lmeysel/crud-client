import { CancellationToken } from '../CancellationToken';

export type ClientEvents<T> = {
	/**
	 * Allows modifying or inspecting the item before it is sent to the server.
	 */
	beforeStore?: (item: T, cancellationToken: CancellationToken) => void
	/**
		* Allows modifying or inspecing the server response. If server did not respond an item, the item sent before is used as fallback.
		*/
	afterStore?: (item: T) => void
	/**
		* Called before an item is going to be selected for editing.
		*/
	beforeSelect?: (item: T, cancellationToken: CancellationToken) => void
	/**
		* Called after an item has been selected for editing.
		*/
	afterSelect?: (item: T) => void
	/**
		* Called before an item is going to be selected for deletion.
		*/
	beforeSelectForDelete?: (item: T, cancellationToken: CancellationToken) => void
	/**
		* Called after an item has been selected for deletion.
		*/
	afterSelectForDelete?: (item: T) => void
	/**
		* Called before the client refreshes the list of items.
		*/
	beforeRefresh?: (cancellationToken: CancellationToken) => void
	/**
		* Called after the items to refresh are received and applied to the items provider.
		*/
	afterRefresh?: (items: T[]) => void
	/**
		* Called before deletion command is sent to the server
		*/
	beforeDelete?: (item: T, cancellationToken: CancellationToken) => void
	/**
		* Called after deletion command is sent to the server
		*/
	afterDelete?: (item: T) => void
}
