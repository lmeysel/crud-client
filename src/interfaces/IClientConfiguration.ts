import { IListAccessor } from '..'
import { CancellationToken } from '../CancellationToken'
import { IApiConnector } from './IApiConnector'

export interface IClientConfiguration<T, TId extends string | number> {
  /**
   * The connector to use for the server communication.
   */
  connector: IApiConnector<T>
  /**
   * The list accessor to use.
   */
  accessor: IListAccessor<T, TId>
  /**
   * Provides information on how errors produced by the connector are handled.
   * * `'throw'`: Errors are thrown as exceptions.
   * * `'print'`: Errors are printed to console but not thrown.
   * * `'silent'`: Errors are swallowed silently.
   */
  connectorErrors?: 'throw' | 'print' | 'silent'
  /**
   * Allows extracting the ID of the object. Defaults to `(item) => item['id']`.
   */
  id?: IdCallback<T, TId>
  /**
   * Callback for creating a new item with standard data. Defaults to `() => ({})`.
   */
  createItem?: () => T
  /**
   * Callback for sorting the items list.
   */
  sort?: (a: T, b: T) => number


  /**
   * Allows modifying or inspecting the item before it is sent to the server.
   */
   beforeStore?: (item: T, cancellationToken: CancellationToken) => Promise<void> | void
   /**
    * Allows modifying or inspecing the server response. If server did not respond an item, the item sent before is used as fallback.
    */
   afterStore?: (item: T) => void
   /**
    * Called before an item is going to be selected for editing.
    */
   beforeSelect?: (item: T, cancellationToken: CancellationToken) => Promise<void> | void
   /**
    * Called after an item has been selected for editing.
    */
   afterSelect?: (item: T) => void
   /**
    * Called before an item is going to be selected for deletion.
    */
   beforeSelectForDelete?: (item: T, cancellationToken: CancellationToken) => Promise<void> | void
   /**
    * Called after an item has been selected for deletion.
    */
   afterSelectForDelete?: (item: T) => void
   /**
    * Called before the client refreshes the list of items.
    */
   beforeRefresh?: (cancellationToken: CancellationToken) => Promise<void> | void
   /**
    * Called after the items to refresh are received and applied to the items provider.
    */
   afterRefresh?: (items: T[]) => void
   /**
    * Called before deletion command is sent to the server
    */
   beforeDelete?: (item: T, cancellationToken: CancellationToken) => Promise<void> | void
   /**
    * Called after deletion command is sent to the server
    */
   afterDelete?: (item: T) => void
}
