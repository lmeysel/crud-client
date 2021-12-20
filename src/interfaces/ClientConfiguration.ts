import { ListAccessor } from './ListAccessor'
import { ApiConnector } from './ApiConnector'
export interface ClientConfiguration<T, TId extends string | number> {
	/**
   * The connector to use for the server communication.
   */
	connector: ApiConnector<T>
	/**
   * The list accessor to use.
   */
	accessor: ListAccessor<T, TId>
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
}
