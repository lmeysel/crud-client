import { IListAccessor } from '..'
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
   * Allows modifying or inspecting the item before it is sent to the server.
   */
  beforeStore?: (item: T) => void
  /**
   * Allows modifying or inspecing the server response. If server did not respond an item, the item sent before is used as fallback.
   */
  afterStore?: (item: T) => void
  /**
   * Callback for creating a new item with standard data. Defaults to `() => ({})`.
   */
  createItem?: () => T
  /**
   * Callback for sorting the items list.
   */
  sort?: (a: T, b: T) => number
}
